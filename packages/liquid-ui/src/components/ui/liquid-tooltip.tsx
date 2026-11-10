"use client";

import { forwardRef, useLayoutEffect, useRef, type ElementRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

/**
 * A small glass capsule that names a control. Wrap the app (or a toolbar) in
 * one provider, so moving between triggers skips the delay the way macOS does.
 */
export const LiquidTooltipProvider = ({ delayDuration = 500, skipDelayDuration = 300, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />
);

export const LiquidTooltip = TooltipPrimitive.Root;
export const LiquidTooltipTrigger = TooltipPrimitive.Trigger;

/** Rendered inside the portal, so the entrance runs once the tooltip exists. */
function TooltipBody({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const content = ref.current?.closest<HTMLElement>('[data-slot="liquid-tooltip-content"]');
    if (!content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Transform only: opacity on the glass would cut it off from its backdrop.
    content.animate([{ transform: "scale(.7)" }, { transform: "none" }], { duration: 460, easing: liquidSpring });
    ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
  }, []);
  return (
    <span ref={ref} className="flex items-center gap-2">
      {children}
    </span>
  );
}

type LiquidTooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  lens?: LiquidGlassOptions;
};

export const LiquidTooltipContent = forwardRef<ElementRef<typeof TooltipPrimitive.Content>, LiquidTooltipContentProps>(
  ({ className, children, lens, sideOffset = 8, ...props }, forwardedRef) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={forwardedRef}
        sideOffset={sideOffset}
        data-slot="liquid-tooltip-content"
        className="liquid-tooltip z-50 origin-[var(--radix-tooltip-content-transform-origin)] select-none"
        {...props}
      >
        <LiquidGlassScope>
          <LiquidGlass
            lens={{ frost: 10, refraction: 8, shadow: 0.05, ...lens }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-medium leading-4 text-[#18181b] dark:text-[#f4f4f6]",
              liquidPanelMaterial,
              className,
            )}
          >
            <TooltipBody>{children}</TooltipBody>
          </LiquidGlass>
        </LiquidGlassScope>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  ),
);
LiquidTooltipContent.displayName = "LiquidTooltipContent";

/** A keyboard shortcut inside a tooltip, e.g. `⌘B`. */
export const LiquidTooltipShortcut = ({ className, ...props }: React.ComponentPropsWithoutRef<"kbd">) => (
  <kbd
    data-slot="liquid-tooltip-shortcut"
    className={cn("font-sans text-[11px] font-normal tracking-wide opacity-50", className)}
    {...props}
  />
);
