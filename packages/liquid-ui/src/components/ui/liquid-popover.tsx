"use client";

import { forwardRef, useLayoutEffect, useRef, type ElementRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { ExitProvider, useExitAnimation, useExitPresence } from "../../lib/presence";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidButton, type LiquidButtonProps } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

/** A glass popover that springs out of its trigger. Radix owns focus and dismissal. */
export function LiquidPopover({ open, defaultOpen, onOpenChange, ...props }: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) {
  const presence = useExitPresence(open, defaultOpen, onOpenChange);
  return (
    <ExitProvider value={presence.state}>
      <PopoverPrimitive.Root open={presence.open} onOpenChange={presence.setOpen} {...props} />
    </ExitProvider>
  );
}
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
  // Closing: the panel shrinks a little toward its trigger as its content fades.
  const ref = useExitAnimation<HTMLDivElement>((body) => {
    const content = body.closest<HTMLElement>('[data-slot="liquid-popover-content"]');
    content?.animate([{ transform: "none" }, { transform: "scale(.94)" }], { duration: 150, easing: "cubic-bezier(0.32, 0, 0.67, 0)", fill: "forwards" });
    return body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
  });
  useLayoutEffect(() => {
    const body = ref.current;
    const content = body?.closest<HTMLElement>('[data-slot="liquid-popover-content"]');
    if (!body || !content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only transform animates on the glass; opacity would cut it off from its backdrop.
    // A short reach (from 0.9) keeps the spring's overshoot under a percent: no wobble on a panel of text.
    content.animate([{ transform: "scale(.9)" }, { transform: "none" }], { duration: 520, easing: liquidSpring });
    body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 40, easing: "ease-out", fill: "backwards" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
