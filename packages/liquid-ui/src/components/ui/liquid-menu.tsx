"use client";

import { forwardRef, useLayoutEffect, type ElementRef } from "react";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";

import {
  liquidLensPresets,
  liquidLightTokens,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { ExitProvider, useExitAnimation, useExitPresence } from "../../lib/presence";
import { cn, composeRefs, liquidSpring } from "../../lib/utils";
import { LiquidButton, type LiquidButtonProps } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

/**
 * A solid dropdown menu whose highlight is a single glass lens. The lens glides
 * between items, the way the Tabs indicator glides between tabs, and bends the
 * item labels underneath it while it moves. Radix owns menu semantics, focus,
 * typeahead, and keyboard navigation.
 */
export function LiquidMenu({ open, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Root>) {
  const presence = useExitPresence(open, defaultOpen, onOpenChange);
  return (
    <ExitProvider value={presence.state}>
      <MenuPrimitive.Root open={presence.open} onOpenChange={presence.setOpen} {...props} />
    </ExitProvider>
  );
}
export const LiquidMenuGroup = MenuPrimitive.Group;

/** A Liquid Button that opens the menu. Pass `asChild` to open it from your own element instead. */
export const LiquidMenuTrigger = forwardRef<HTMLButtonElement, LiquidButtonProps & { asChild?: boolean }>(
  ({ className, asChild, children, ...props }, forwardedRef) =>
    asChild ? (
      <MenuPrimitive.Trigger ref={forwardedRef} asChild data-slot="liquid-menu-trigger" className={className}>
        {children}
      </MenuPrimitive.Trigger>
    ) : (
      <MenuPrimitive.Trigger asChild>
        <LiquidButton
          ref={forwardedRef}
          data-slot="liquid-menu-trigger"
          className={cn("liquid-menu__trigger", className)}
          {...props}
        >
          {children}
        </LiquidButton>
      </MenuPrimitive.Trigger>
    ),
);

LiquidMenuTrigger.displayName = "LiquidMenuTrigger";

type LiquidMenuContentProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content> & {
  lens?: LiquidLensOptions;
};

/**
 * The item list and its glass indicator. It renders inside the portal, so its
 * effects run after the menu is actually in the document.
 */
function LiquidMenuList({ children, lens }: { children: React.ReactNode; lens?: LiquidLensOptions }) {
  const exitRef = useExitAnimation<HTMLDivElement>((list) => {
    const content = list.closest<HTMLElement>('[data-slot="liquid-menu-content"]');
    content?.animate([{ transform: "none" }, { transform: "scale(.94)" }], { duration: 150, easing: "cubic-bezier(0.32, 0, 0.67, 0)", fill: "forwards" });
    return list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
  });
  const displacement = useLiquidDisplacement<HTMLDivElement>({
    lens: { ...liquidLensPresets.tabs, scale: -0.24, chroma: 0.2, ...lens },
    lensSelector: '[data-slot="liquid-menu-indicator"]',
  });

  // Measure the highlighted item and glide the shared indicator to it. The
  // lens refraction runs only while the indicator is travelling.
  useLayoutEffect(() => {
    const list = displacement.ref.current;
    if (!list) return;
    let settleTimer = 0;
    let frame = 0;
    const place = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const item = list.querySelector<HTMLElement>('[data-slot="liquid-menu-item"][data-highlighted]');
        if (!item) {
          delete list.dataset.indicatorVisible;
          return;
        }
        const y = `${item.offsetTop}px`;
        const moved = list.style.getPropertyValue("--menu-indicator-y") !== y;
        list.style.setProperty("--menu-indicator-y", y);
        list.style.setProperty("--menu-indicator-height", `${item.offsetHeight}px`);
        if (!list.dataset.indicatorVisible) {
          // Appear in place instead of sliding in from the top.
          list.dataset.indicatorJump = "";
          list.dataset.indicatorVisible = "";
          window.requestAnimationFrame(() => delete list.dataset.indicatorJump);
          return;
        }
        if (!moved) return;
        list.dataset.interacting = "";
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => delete list.dataset.interacting, 320);
      });
    };
    const observer = new MutationObserver(place);
    observer.observe(list, { attributes: true, attributeFilter: ["data-highlighted"], subtree: true });
    place();

    // The glass springs out of its trigger, like an iOS menu. Only transform
    // animates on the glass (opacity would cut it off from its backdrop).
    const content = list.closest<HTMLElement>('[data-slot="liquid-menu-content"]');
    if (content && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      content.animate([{ transform: "scale(.9)" }, { transform: "none" }], { duration: 520, easing: liquidSpring });
      list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 40, easing: "ease-out", fill: "backwards" });
    }

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
    };
  }, [displacement.ref]);

  return (
    <div
      ref={composeRefs(displacement.ref, exitRef)}
      data-slot="liquid-menu-list"
      className={cn("liquid-menu__list group/liquid-menu relative isolate [--menu-indicator-height:36px] [--menu-indicator-y:0px]", liquidLightTokens)}
    >
      <span
        data-slot="liquid-menu-indicator"
        aria-hidden="true"
        className={cn(
          "liquid-menu__indicator pointer-events-none absolute inset-x-0 top-0 -z-10 h-[var(--menu-indicator-height)] rounded-[10px] bg-black/[.05] opacity-0",
          "[translate:0_var(--menu-indicator-y)] [transition:translate_.42s_cubic-bezier(.2,1.1,.3,1),height_.3s_cubic-bezier(.2,1,.3,1),opacity_.15s_ease,scale_.3s_cubic-bezier(.2,1.2,.3,1)]",
          "group-data-[indicator-visible]/liquid-menu:opacity-100 group-data-[indicator-jump]/liquid-menu:transition-none",
          "group-data-[interacting]/liquid-menu:[scale:1.04] dark:bg-white/[.08] motion-reduce:transition-none",
        )}
      />
      {children}
      {displacement.filter}
    </div>
  );
}

export const LiquidMenuContent = forwardRef<ElementRef<typeof MenuPrimitive.Content>, LiquidMenuContentProps>(
  ({ className, children, lens, align = "start", sideOffset = 8, ...props }, forwardedRef) => (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        ref={forwardedRef}
        align={align}
        sideOffset={sideOffset}
        data-slot="liquid-menu-content"
        className={cn(
          "liquid-menu z-50 min-w-[220px] origin-[var(--radix-dropdown-menu-content-transform-origin)] select-none text-[13px] text-[#18181b] outline-none [-webkit-touch-callout:none] [-webkit-user-select:none] dark:text-[#f4f4f6]",
          className,
        )}
        {...props}
      >
        <LiquidGlassScope>
          <LiquidGlass
            lens={{ frost: 16, refraction: 11 }}
            className={cn("rounded-[18px] p-1.5", liquidPanelMaterial)}
          >
            <LiquidMenuList lens={lens}>{children}</LiquidMenuList>
          </LiquidGlass>
        </LiquidGlassScope>
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  ),
);

LiquidMenuContent.displayName = "LiquidMenuContent";

export const LiquidMenuItem = forwardRef<
  ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, forwardedRef) => (
  <MenuPrimitive.Item
    ref={forwardedRef}
    data-slot="liquid-menu-item"
    className={cn(
      "liquid-menu__item relative flex h-9 cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 outline-none",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-[#71717a] dark:[&>svg]:text-[#a1a1aa]",
      destructive && "text-[#e5484d] [&>svg]:!text-[#e5484d] dark:text-[#ff6369] dark:[&>svg]:!text-[#ff6369]",
      className,
    )}
    {...props}
  />
));

LiquidMenuItem.displayName = "LiquidMenuItem";

export const LiquidMenuLabel = forwardRef<
  ElementRef<typeof MenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label>
>(({ className, ...props }, forwardedRef) => (
  <MenuPrimitive.Label
    ref={forwardedRef}
    data-slot="liquid-menu-label"
    className={cn("px-2.5 pb-1 pt-1.5 text-[11px] font-medium text-[#a1a1aa]", className)}
    {...props}
  />
));

LiquidMenuLabel.displayName = "LiquidMenuLabel";

export const LiquidMenuSeparator = forwardRef<
  ElementRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, forwardedRef) => (
  <MenuPrimitive.Separator
    ref={forwardedRef}
    data-slot="liquid-menu-separator"
    className={cn("-mx-1.5 my-1.5 h-px bg-black/[.06] dark:bg-white/10", className)}
    {...props}
  />
));

LiquidMenuSeparator.displayName = "LiquidMenuSeparator";

export const LiquidMenuShortcut = ({ className, ...props }: React.ComponentPropsWithoutRef<"span">) => (
  <span
    data-slot="liquid-menu-shortcut"
    className={cn("ml-auto pl-6 text-[12px] tracking-wide text-[#a1a1aa]", className)}
    {...props}
  />
);
