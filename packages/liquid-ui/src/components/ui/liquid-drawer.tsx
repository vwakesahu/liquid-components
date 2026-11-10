"use client";

import { createContext, forwardRef, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidButton, type LiquidButtonProps } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

type DrawerState = {
  closing: boolean;
  requestClose: () => void;
  finishClose: () => void;
  /** The control that opened the drawer; the glass flows out of it and back into it. */
  origin: React.MutableRefObject<HTMLElement | null>;
};
const LiquidDrawerContext = createContext<DrawerState | null>(null);

// Vaul's drawer curve: quick to leave, long soft landing.
const ease = {
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
  out: "cubic-bezier(0.33, 1, 0.68, 1)",
};
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hiddenOffset = "translateY(calc(100% + 24px))";

/**
 * A floating glass tray. It flows out of the control that opened it, the way an
 * iOS 26 sheet grows out of its button, fits its content, morphs its height when
 * the view changes, stretches when you pull it up, and pours back into its
 * button when it closes. Radix Dialog owns focus, Escape, and the modal
 * behaviour; the root waits for the closing morph before it unmounts.
 */
export function LiquidDrawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const requested = openProp ?? uncontrolled;
  const [rendered, setRendered] = useState(requested);
  const origin = useRef<HTMLElement | null>(null);
  const lastPress = useRef<{ element: HTMLElement; at: number } | null>(null);

  // Remember the last control pressed, so a drawer opened from any button, not
  // only LiquidDrawerTrigger, knows where to grow from.
  useEffect(() => {
    const onPress = (event: PointerEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>("button, a, [role=button]");
      if (element) lastPress.current = { element, at: event.timeStamp };
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, []);

  useEffect(() => {
    if (!requested) return;
    if (!origin.current) {
      const press = lastPress.current;
      const active = document.activeElement;
      origin.current =
        press && performance.now() - press.at < 1500 ? press.element : active instanceof HTMLElement && active !== document.body ? active : null;
    }
    setRendered(true);
  }, [requested]);
  const setRequested = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );
  const state: DrawerState = {
    closing: rendered && !requested,
    requestClose: () => setRequested(false),
    finishClose: () => {
      origin.current = null;
      setRendered(false);
    },
    origin,
  };
  return (
    <LiquidDrawerContext.Provider value={state}>
      <DialogPrimitive.Root open={rendered} onOpenChange={(next) => setRequested(next)} {...props}>
        {children}
      </DialogPrimitive.Root>
    </LiquidDrawerContext.Provider>
  );
}

export const LiquidDrawerTrigger = forwardRef<HTMLButtonElement, LiquidButtonProps>(({ onClick, ...props }, forwardedRef) => {
  const drawer = useContext(LiquidDrawerContext);
  return (
    <DialogPrimitive.Trigger asChild>
      <LiquidButton
        ref={forwardedRef}
        data-slot="liquid-drawer-trigger"
        onClick={(event) => {
          if (drawer) drawer.origin.current = event.currentTarget;
          onClick?.(event);
        }}
        {...props}
      />
    </DialogPrimitive.Trigger>
  );
});
LiquidDrawerTrigger.displayName = "LiquidDrawerTrigger";

export const LiquidDrawerClose = DialogPrimitive.Close;

export const LiquidDrawerTitle = forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  ({ className, ...props }, forwardedRef) => (
    <DialogPrimitive.Title ref={forwardedRef} className={cn("text-[19px] font-semibold tracking-[-0.01em]", className)} {...props} />
  ),
);
LiquidDrawerTitle.displayName = "LiquidDrawerTitle";

export const LiquidDrawerDescription = forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(
  ({ className, ...props }, forwardedRef) => (
    <DialogPrimitive.Description ref={forwardedRef} className={cn("mt-2 text-[15px] leading-[1.45] opacity-60", className)} {...props} />
  ),
);
LiquidDrawerDescription.displayName = "LiquidDrawerDescription";

type LiquidDrawerContentProps = Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "children"> & {
  children?: React.ReactNode;
  /**
   * Names the content being shown. Changing it cross-fades to the new content
   * while the drawer morphs to the new height.
   */
  view?: React.Key;
  /** Close when the backdrop is clicked. When `false`, the drawer nudges instead. */
  closeOnOutsideClick?: boolean;
  /** Close on a downward drag or flick. When `false`, dragging only rubber-bands. */
  closeOnDrag?: boolean;
  lens?: LiquidGlassOptions;
};

export const LiquidDrawerContent = forwardRef<HTMLDivElement, LiquidDrawerContentProps>(
  (
    { className, children, view, closeOnOutsideClick = true, closeOnDrag = true, lens, onPointerDownOutside, ...props },
    forwardedRef,
  ) => {
    const nudge = useRef<() => void>(() => undefined);
    const overlay = useRef<HTMLDivElement>(null);
    return (
      <DialogPrimitive.Portal>
        <DrawerOverlay ref={overlay} />
        <DialogPrimitive.Content
          ref={forwardedRef}
          data-slot="liquid-drawer-content"
          className="liquid-drawer fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[380px] outline-none"
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            if (closeOnOutsideClick || event.defaultPrevented) return;
            event.preventDefault();
            nudge.current();
          }}
          {...props}
        >
          <DrawerBody view={view} closeOnDrag={closeOnDrag} lens={lens} className={className} nudge={nudge} overlay={overlay}>
            {children}
          </DrawerBody>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
LiquidDrawerContent.displayName = "LiquidDrawerContent";

const DrawerOverlay = forwardRef<HTMLDivElement>((_, forwardedRef) => {
  const drawer = useContext(LiquidDrawerContext);
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!reduced()) ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: ease.drawer });
  }, []);
  return (
    <DialogPrimitive.Overlay
      ref={(node) => {
        ref.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(
        "fixed inset-0 z-50 bg-black/25 transition-opacity duration-300 dark:bg-black/50",
        drawer?.closing && "opacity-0",
      )}
    />
  );
});
DrawerOverlay.displayName = "DrawerOverlay";

type Layer = { key: string; node: React.ReactNode };

// Drags never start on controls, so buttons, fields, and switches behave normally.
const interactive = "button, a, input, textarea, select, label, [role=switch], [role=slider], [role=tab], [contenteditable=true], [data-drawer-no-drag]";
const focusable = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Past the edge the drawer follows the finger less and less, up to `limit` pixels.
const rubber = (distance: number, limit = 28) => Math.sign(distance) * limit * (1 - Math.exp(-Math.abs(distance) / 120));

type DrawerBodyProps = {
  children: React.ReactNode;
  view?: React.Key;
  closeOnDrag: boolean;
  lens?: LiquidGlassOptions;
  className?: string;
  nudge: React.MutableRefObject<() => void>;
  overlay: React.RefObject<HTMLDivElement | null>;
};

/** Rendered inside the portal, so it can measure and animate once it exists. */
function DrawerBody({ children, view, closeOnDrag, lens, className, nudge, overlay }: DrawerBodyProps) {
  const drawer = useContext(LiquidDrawerContext);
  const card = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const drag = useRef<{ y: number; samples: Array<[number, number]> } | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  // Keep the outgoing view on screen while it fades. It keeps its key, so React
  // moves the same element to the exit layer and its state survives the fade.
  const key = String(view ?? "view");
  const latest = useRef<Layer>({ key, node: children });
  const [shownKey, setShownKey] = useState(key);
  const [leaving, setLeaving] = useState<Layer | null>(null);
  if (shownKey !== key) {
    setShownKey(key);
    setLeaving(latest.current.key === key ? null : latest.current);
  }
  useLayoutEffect(() => {
    latest.current = { key, node: children };
  });

  // The drawer's height follows the current view, so a new view morphs it.
  useLayoutEffect(() => {
    const element = current.current;
    if (!element) return;
    const measure = () => {
      const limit = window.innerHeight - 32;
      setHeight(Math.min(element.offsetHeight, limit));
      setOverflowing(element.offsetHeight > limit);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [shownKey]);

  const firstView = useRef(true);
  useLayoutEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    // The control that changed the view has faded out with it; carry focus into the new view.
    const active = document.activeElement;
    if (!active || active === document.body || outgoing.current?.contains(active)) {
      current.current?.querySelector<HTMLElement>(focusable)?.focus({ preventScroll: true });
    }
    if (reduced()) return;
    current.current?.animate([{ opacity: 0, scale: "0.96" }, { opacity: 1, scale: "1" }], {
      duration: 270,
      delay: 40,
      easing: ease.out,
      fill: "backwards",
    });
  }, [shownKey]);

  useLayoutEffect(() => {
    if (!leaving) return;
    const element = outgoing.current;
    if (!element || reduced()) {
      setLeaving(null);
      return;
    }
    const animation = element.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.96" }], {
      duration: 180,
      easing: ease.out,
      fill: "forwards",
    });
    animation.onfinish = () => setLeaving((value) => (value === leaving ? null : value));
    return () => animation.cancel();
  }, [leaving]);

  // Where the drawer grows from and pours back into: its trigger, if it's still on screen.
  const originBox = () => {
    const element = drawer?.origin.current;
    if (!element?.isConnected) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.bottom < 0 || rect.top > window.innerHeight) return null;
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius);
    return { rect, radius: Math.min(rect.height / 2, Number.isFinite(radius) && radius > 0 ? radius : rect.height / 2) };
  };

  // Pulling down moves the drawer; pulling up stretches the glass taller, like liquid.
  // Both are transforms only, so the glass never has to be redrawn mid-gesture.
  const place = (y: number) => {
    position.current = y;
    const element = card.current;
    if (element) {
      const height = Math.max(1, element.offsetHeight);
      element.style.transform = y > 0 ? `translateY(${y}px)` : y < 0 ? `scaleY(${1 - y / height})` : "";
    }
    const backdrop = overlay.current;
    if (backdrop) {
      const travel = Math.max(1, card.current?.offsetHeight ?? 1);
      backdrop.style.transition = drag.current ? "none" : "";
      backdrop.style.opacity = y > 0 ? String(Math.max(0, 1 - y / travel)) : "";
    }
  };
  const settle = () => {
    const element = card.current;
    const from = element?.style.transform ?? "";
    const pulled = position.current;
    place(0);
    if (!element || reduced() || pulled === 0) return;
    element.animate([{ transform: from }, { transform: "none" }], pulled > 0 ? { duration: 480, easing: ease.drawer } : { duration: 560, easing: liquidSpring });
  };

  // Scale and translate that make the glass sit exactly on `rect`, with the corner
  // radius counter-scaled so the clip still reads as `radius` on both axes.
  const fit = (rect: DOMRect, radius: number, to: DOMRect) => {
    const sx = Math.max(0.01, rect.width / to.width);
    const sy = Math.max(0.01, rect.height / to.height);
    const dx = rect.left + rect.width / 2 - (to.left + to.width / 2);
    const dy = rect.top + rect.height / 2 - (to.top + to.height / 2);
    return {
      transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
      borderRadius: `${radius / sx}px / ${radius / sy}px`,
    };
  };

  // Open: grow out of the trigger, or rise from the bottom edge when there's no trigger to grow from.
  // Once per mount: a second run (React's strict mode) would measure the glass mid-morph.
  const grown = useRef(false);
  useLayoutEffect(() => {
    const element = card.current;
    const surface = glass.current;
    if (grown.current || !element || !surface || reduced()) return;
    grown.current = true;
    const from = originBox();
    if (!from) {
      element.animate([{ transform: hiddenOffset }, { transform: "translateY(0)" }], { duration: 500, easing: ease.drawer });
      return;
    }
    const start = fit(from.rect, from.radius, surface.getBoundingClientRect());
    const timing = { duration: 600, easing: liquidSpring };
    element.animate([{ transform: start.transform, transformOrigin: "50% 50%" }, { transform: "none", transformOrigin: "50% 50%" }], timing);
    surface.animate([{ borderRadius: start.borderRadius }, { borderRadius: "36px" }], timing);
    scroller.current?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.22 }, { opacity: 1 }], { duration: 440, easing: "ease-out" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: a flick slides it away; anything else pours it back into its trigger.
  useEffect(() => {
    if (!drawer?.closing) return;
    const element = card.current;
    const surface = glass.current;
    if (!element || !surface || reduced()) return drawer.finishClose();
    const pulled = position.current;
    element.getAnimations().forEach((animation) => animation.cancel());
    const into = pulled > 8 ? null : originBox();
    if (into) {
      element.style.transform = "";
      const end = fit(into.rect, into.radius, surface.getBoundingClientRect());
      const timing = { duration: 380, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" as const };
      surface.animate([{ borderRadius: "36px" }, { borderRadius: end.borderRadius }], timing);
      scroller.current?.animate([{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }], timing);
      element.animate([{ transform: "none", transformOrigin: "50% 50%" }, { transform: end.transform, transformOrigin: "50% 50%" }], timing).onfinish = drawer.finishClose;
      return;
    }
    const animation = element.animate([{ transform: `translateY(${pulled}px)` }, { transform: hiddenOffset }], {
      duration: 320,
      easing: ease.drawer,
      fill: "forwards",
    });
    animation.onfinish = drawer.finishClose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer?.closing]);

  // With outside clicks turned off, a click on the backdrop gets a small bump.
  nudge.current = () => {
    if (reduced()) return;
    card.current?.animate([{ scale: "1" }, { scale: "1.025" }, { scale: "1" }], { duration: 380, easing: ease.out });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (event.button !== 0 || drawer?.closing || target.closest(interactive)) return;
    // Scrolled content scrolls first; the drawer only drags from the top.
    if (scroller.current && scroller.current.scrollTop > 0) return;
    drag.current = { y: event.clientY - position.current, samples: [[event.timeStamp, position.current]] };
    card.current?.getAnimations().forEach((animation) => animation.cancel());
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone; the drag just won't be captured.
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const distance = event.clientY - current.y;
    const y = distance > 0 && closeOnDrag ? distance : rubber(distance, distance < 0 ? 44 : 28);
    place(y);
    current.samples.push([event.timeStamp, y]);
    if (current.samples.length > 6) current.samples.shift();
  };
  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    const first = current.samples[0]!;
    const last = current.samples[current.samples.length - 1]!;
    const velocity = (last[1] - first[1]) / Math.max(16, last[0] - first[0]); // px per ms
    const travel = card.current?.offsetHeight ?? 0;
    if (closeOnDrag && position.current > 8 && (position.current > travel * 0.4 || velocity > 0.5)) {
      drawer?.requestClose();
      return;
    }
    settle();
  };

  return (
    <div
      ref={card}
      data-slot="liquid-drawer-card"
      className="origin-bottom touch-none will-change-transform"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <LiquidGlassScope>
        <LiquidGlass
          ref={glass}
          lens={{ frost: 16, refraction: 14, ...lens }}
          className={cn(
            "relative mx-auto w-full overflow-hidden rounded-[36px] text-[#18181b] dark:text-[#f4f4f6]",
            "[transition:height_.36s_cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            // Clear enough that the page bends through it: glass, not a white card.
            liquidPanelMaterial,
            className,
          )}
          style={height === null ? undefined : { height }}
        >
          {/* Only content taller than the screen scrolls, so a height morph never flashes a scrollbar. */}
          <div
            ref={scroller}
            className={cn(
              "relative h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              overflowing ? "touch-pan-y overflow-y-auto overscroll-contain" : "touch-none overflow-hidden",
            )}
          >
            {leaving && (
              <div
                key={leaving.key}
                ref={outgoing}
                inert
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 origin-top p-6"
              >
                {leaving.node}
              </div>
            )}
            <div key={key} ref={current} className="origin-top p-6">
              {children}
            </div>
          </div>
        </LiquidGlass>
      </LiquidGlassScope>
    </div>
  );
}
