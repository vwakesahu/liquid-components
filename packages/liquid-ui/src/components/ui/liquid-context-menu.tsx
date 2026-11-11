"use client";

import { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ElementRef } from "react";
import { createPortal } from "react-dom";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn, composeRefs, liquidSpring } from "../../lib/utils";
import { LiquidMenuContent, LiquidMenuItem, LiquidMenuLabel, LiquidMenuSeparator, LiquidMenuShortcut } from "./liquid-menu";

type ContextMenuState = {
  open: boolean;
  lifted: boolean;
  setOpen: (open: boolean) => void;
  setLifted: (lifted: boolean) => void;
  trigger: React.MutableRefObject<HTMLDivElement | null>;
  returnFocus: React.MutableRefObject<HTMLElement | null>;
};
const ContextMenuContext = createContext<ContextMenuState | null>(null);

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = { in: "cubic-bezier(0.32, 0, 0.67, 0)", out: "cubic-bezier(0.33, 1, 0.68, 1)" };
const HOLD_MS = 480;

// iOS turns a long press into a text selection; while a hold or the menu is live, it can't.
let selectionBlocks = 0;
const stopSelection = (event: Event) => event.preventDefault();
function blockSelection() {
  if (selectionBlocks++ === 0) document.addEventListener("selectstart", stopSelection, true);
  return () => {
    if (--selectionBlocks === 0) document.removeEventListener("selectstart", stopSelection, true);
  };
}

/**
 * The iOS context menu: press and hold (or right-click) to lift a preview of
 * the content above a blurred backdrop, with a glass menu beside it. The menu
 * is anchored to the preview, not the pointer. Radix owns menu semantics,
 * focus, typeahead, and keyboard navigation.
 */
export function LiquidContextMenu({
  children,
  onOpenChange,
  modal = true,
}: {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}) {
  const [open, setOpenState] = useState(false);
  const [lifted, setLifted] = useState(false);
  const trigger = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  return (
    <ContextMenuContext.Provider value={{ open, lifted, setOpen, setLifted, trigger, returnFocus }}>
      {/* Only the trigger's hold, right-click, or menu key opens it; Radix may only close it. */}
      <MenuPrimitive.Root open={open} onOpenChange={(next) => !next && setOpen(false)} modal={modal}>
        {children}
      </MenuPrimitive.Root>
      <LiftedPreview />
    </ContextMenuContext.Provider>
  );
}

export type LiquidContextMenuTriggerProps = React.ComponentPropsWithoutRef<"div"> & { disabled?: boolean };

/** Wraps the content that owns the menu. Its own clicks and keys keep working. */
export const LiquidContextMenuTrigger = forwardRef<HTMLDivElement, LiquidContextMenuTriggerProps>(
  (
    { className, children, disabled, style, onContextMenu, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture, onKeyDown, ...props },
    forwardedRef,
  ) => {
    const menu = useContext(ContextMenuContext);
    const hold = useRef<{ x: number; y: number; timer: number; squeeze?: Animation; unblock: () => void } | null>(null);
    const swallowClick = useRef(false);
    // The release after a hold usually lands on the backdrop, so clear the flag on close.
    useEffect(() => {
      if (!menu?.open) swallowClick.current = false;
    }, [menu?.open]);
    if (!menu) throw new Error("LiquidContextMenuTrigger must be inside LiquidContextMenu");

    const cancelHold = () => {
      const current = hold.current;
      if (!current) return;
      window.clearTimeout(current.timer);
      current.squeeze?.cancel();
      current.unblock();
      hold.current = null;
    };
    const open = () => {
      cancelHold();
      if (menu.open) return;
      menu.returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      menu.setOpen(true);
    };

    return (
      <div
        ref={composeRefs(forwardedRef, menu.trigger)}
        data-slot="liquid-context-menu-trigger"
        data-state={menu.open ? "open" : "closed"}
        aria-haspopup="menu"
        className={cn("liquid-context-menu__trigger relative select-none [-webkit-touch-callout:none] [-webkit-user-select:none]", className)}
        // While the preview is lifted, the original hides so there is only one of it.
        style={{ ...style, ...(menu.lifted ? { visibility: "hidden" } : {}) }}
        onContextMenu={(event) => {
          onContextMenu?.(event);
          if (disabled || event.defaultPrevented) return;
          event.preventDefault();
          open();
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (disabled || event.button !== 0 || event.defaultPrevented) return;
          const element = event.currentTarget;
          hold.current = {
            unblock: blockSelection(),
            x: event.clientX,
            y: event.clientY,
            timer: window.setTimeout(() => {
              swallowClick.current = true;
              open();
            }, HOLD_MS),
            // The content gives a little under the finger before it lifts.
            squeeze: reduced()
              ? undefined
              : element.animate([{ scale: "1" }, { scale: "0.97" }], { duration: HOLD_MS, easing: ease.in, fill: "forwards" }),
          };
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          const current = hold.current;
          if (current && Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) cancelHold();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          cancelHold();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          cancelHold();
        }}
        onClickCapture={(event) => {
          // The press that opened the menu is not also a click on the content.
          if (swallowClick.current) {
            swallowClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }
          onClickCapture?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (disabled || event.defaultPrevented) return;
          if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
            event.preventDefault();
            open();
          }
        }}
        {...props}
      >
        {children}
        {/* The menu anchors to this box, which covers the content exactly. */}
        <MenuPrimitive.Trigger asChild disabled={disabled}>
          <span aria-hidden="true" tabIndex={-1} data-slot="liquid-context-menu-anchor" className="pointer-events-none absolute inset-0" />
        </MenuPrimitive.Trigger>
      </div>
    );
  },
);
LiquidContextMenuTrigger.displayName = "LiquidContextMenuTrigger";

/** A copy of the trigger, lifted above a blurred backdrop while the menu is open. */
function LiftedPreview() {
  const menu = useContext(ContextMenuContext)!;
  const [shown, setShown] = useState(false);
  const layer = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!menu.open) return;
    setShown(true);
    window.getSelection()?.removeAllRanges();
    return blockSelection();
  }, [menu.open]);

  useLayoutEffect(() => {
    const source = menu.trigger.current;
    const host = layer.current;
    if (!shown || !menu.open || !source || !host) return;
    const bounds = source.getBoundingClientRect();
    const clone = source.cloneNode(true) as HTMLElement;
    clone.querySelector('[data-slot="liquid-context-menu-anchor"]')?.remove();
    for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("[id]")]) node.removeAttribute("id");
    clone.removeAttribute("aria-haspopup");
    // Pin the copy to the original's box; percentage limits would resolve against the preview layer.
    Object.assign(clone.style, {
      visibility: "visible",
      margin: "0",
      scale: "",
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      minWidth: "0",
      maxWidth: "none",
      minHeight: "0",
      maxHeight: "none",
    });
    host.replaceChildren(clone);
    const radius = getComputedStyle((source.firstElementChild as HTMLElement | null) ?? source).borderRadius;
    Object.assign(host.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, borderRadius: radius });
    menu.setLifted(true);
    if (reduced()) return;
    host.animate([{ scale: "0.97" }, { scale: "1.04" }], { duration: 560, easing: liquidSpring, fill: "forwards" });
    backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: ease.out, fill: "forwards" });
  }, [shown, menu.open]);

  // Closing: the preview settles back into place, then the original returns.
  useEffect(() => {
    if (menu.open || !shown) return;
    const finish = () => {
      setShown(false);
      menu.setLifted(false);
    };
    const host = layer.current;
    if (!host || reduced()) return finish();
    backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: ease.out, fill: "forwards" });
    const animation = host.animate([{ scale: getComputedStyle(host).scale }, { scale: "1" }], { duration: 260, easing: ease.out, fill: "forwards" });
    animation.onfinish = finish;
    return () => animation.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.open, shown]);

  if (!shown) return null;
  return createPortal(
    <>
      <div
        ref={backdrop}
        data-slot="liquid-context-menu-backdrop"
        aria-hidden="true"
        className="fixed inset-0 z-[49] bg-black/10 backdrop-blur-[10px] dark:bg-black/40"
      />
      <div
        ref={layer}
        data-slot="liquid-context-menu-preview"
        aria-hidden="true"
        className="pointer-events-none fixed z-[49] select-none shadow-[0_18px_48px_rgba(0,0,0,.18)] [-webkit-user-select:none] dark:shadow-[0_18px_48px_rgba(0,0,0,.5)]"
      />
    </>,
    document.body,
  );
}

export const LiquidContextMenuContent = forwardRef<
  ElementRef<typeof LiquidMenuContent>,
  React.ComponentPropsWithoutRef<typeof LiquidMenuContent>
>(({ side = "bottom", align = "start", sideOffset = 14, onCloseAutoFocus, ...props }, forwardedRef) => {
  const menu = useContext(ContextMenuContext);
  return (
    <LiquidMenuContent
      ref={forwardedRef}
      side={side}
      align={align}
      sideOffset={sideOffset}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        if (event.defaultPrevented) return;
        // Return focus to what had it, not to the hidden anchor.
        event.preventDefault();
        menu?.returnFocus.current?.focus({ preventScroll: true });
      }}
      {...props}
    />
  );
});
LiquidContextMenuContent.displayName = "LiquidContextMenuContent";

export const LiquidContextMenuItem = LiquidMenuItem;
export const LiquidContextMenuLabel = LiquidMenuLabel;
export const LiquidContextMenuSeparator = LiquidMenuSeparator;
export const LiquidContextMenuShortcut = LiquidMenuShortcut;
export const LiquidContextMenuGroup = MenuPrimitive.Group;
