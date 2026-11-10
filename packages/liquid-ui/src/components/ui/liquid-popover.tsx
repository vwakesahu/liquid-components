"use client";

import { forwardRef, useLayoutEffect, useRef, type ElementRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidButton, type LiquidButtonProps } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

/** A glass popover that springs out of its trigger. Radix owns focus and dismissal. */
export const LiquidPopover = PopoverPrimitive.Root;
export const LiquidPopoverClose = PopoverPrimitive.Close;
export const LiquidPopoverAnchor = PopoverPrimitive.Anchor;

export const LiquidPopoverTrigger = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, ...props }, forwardedRef) => (
    <PopoverPrimitive.Trigger asChild>
      <LiquidButton ref={forwardedRef} data-slot="liquid-popover-trigger" className={className} {...props} />
    </PopoverPrimitive.Trigger>
  ),
);

LiquidPopoverTrigger.displayName = "LiquidPopoverTrigger";

/** Rendered inside the portal so the entrance runs once the popover exists. */
function LiquidPopoverBody({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const body = ref.current;
    const content = body?.closest<HTMLElement>('[data-slot="liquid-popover-content"]');
    if (!body || !content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only transform animates on the glass; opacity would cut it off from its backdrop.
    content.animate([{ transform: "scale(.6)" }, { transform: "none" }], { duration: 620, easing: liquidSpring });
    body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 60, easing: "ease-out", fill: "backwards" });
  }, []);
  return <div ref={ref} data-slot="liquid-popover-body">{children}</div>;
}

type LiquidPopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  lens?: LiquidGlassOptions;
};

export const LiquidPopoverContent = forwardRef<ElementRef<typeof PopoverPrimitive.Content>, LiquidPopoverContentProps>(
  ({ className, children, lens, align = "center", sideOffset = 10, ...props }, forwardedRef) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={forwardedRef}
        align={align}
        sideOffset={sideOffset}
        data-slot="liquid-popover-content"
        className="liquid-popover z-50 origin-[var(--radix-popover-content-transform-origin)] outline-none"
        {...props}
      >
        <LiquidGlassScope>
          <LiquidGlass
            lens={{ frost: 16, refraction: 11, ...lens }}
            className={cn(
              "w-72 rounded-[22px] p-4 text-[14px] text-[#18181b] dark:text-[#f4f4f6]",
              liquidPanelMaterial,
              className,
            )}
          >
            <LiquidPopoverBody>{children}</LiquidPopoverBody>
          </LiquidGlass>
        </LiquidGlassScope>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  ),
);

LiquidPopoverContent.displayName = "LiquidPopoverContent";
