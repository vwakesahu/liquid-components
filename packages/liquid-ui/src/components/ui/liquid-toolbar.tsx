"use client";

import { forwardRef, useRef, type ElementRef } from "react";
import * as ToolbarPrimitive from "@radix-ui/react-toolbar";

import {
  liquidLensPresets,
  liquidLightTokens,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidGlass, LiquidGlassGroup, liquidChromeMaterial } from "./liquid-glass";

export type LiquidToolbarProps = React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root> & {
  /** Optical parameters shared by every glass group in the toolbar. */
  lens?: LiquidGlassOptions;
  /** Distance, in pixels, at which neighboring groups start to fuse. */
  merge?: number;
  /** Fuse every group into one continuous capsule. Toggling it morphs between the two. */
  merged?: boolean;
};

/**
 * A floating glass toolbar. Each `LiquidToolbarGroup` is its own glass capsule.
 * Set `merged` and the groups slide together until they fuse into one capsule;
 * clear it and they pull apart again. Any layout change in between morphs.
 */
export const LiquidToolbar = forwardRef<ElementRef<typeof ToolbarPrimitive.Root>, LiquidToolbarProps>(
  ({ className, lens, merge = 10, merged = false, children, style, ...props }, forwardedRef) => (
    <ToolbarPrimitive.Root asChild {...props}>
      <LiquidGlassGroup
        ref={forwardedRef}
        lens={{ frost: 4, refraction: 12, ...lens }}
        style={{ "--liquid-spring": liquidSpring, ...style } as React.CSSProperties}
        merge={merge}
        data-slot="liquid-toolbar"
        data-merged={merged || undefined}
        className={cn(
          "liquid-toolbar group/liquid-toolbar inline-flex items-center gap-2.5 text-[#18181b] dark:text-[#f4f4f6]",
          // Light, see-through glass: enough tint to keep icons legible, clear enough to see content bend.
          liquidChromeMaterial,
          "[transition:gap_.75s_var(--liquid-spring)] data-[merged]:gap-0 motion-reduce:transition-none",
          className,
        )}
      >
        {children}
      </LiquidGlassGroup>
    </ToolbarPrimitive.Root>
  ),
);

LiquidToolbar.displayName = "LiquidToolbar";

const BUTTON = '[data-slot="liquid-toolbar-button"]:not(:disabled)';

export type LiquidToolbarGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  /** The droplet's lens while a button is pressed. */
  lens?: LiquidLensOptions;
};

/**
 * One glass capsule of buttons. Pressing a button swells a single glass droplet
 * under it, the way the tab bar's selection does; slide across the group and the
 * droplet glides with you, and letting go presses the button you end on.
 */
export const LiquidToolbarGroup = forwardRef<HTMLDivElement, LiquidToolbarGroupProps>(
  ({ className, children, lens, ...props }, forwardedRef) => {
    const displacement = useLiquidDisplacement<HTMLDivElement>({
      lens: { ...liquidLensPresets.tabs, ...lens },
      lensSelector: '[data-slot="liquid-toolbar-indicator"]',
    });
    const press = useRef<{ pointerId: number; over: HTMLElement | null } | null>(null);
    const swallowNativeClick = useRef(0);

    const place = (button: HTMLElement | null, jump = false) => {
      const track = displacement.ref.current;
      if (!track) return;
      if (press.current) press.current.over = button;
      if (!button) {
        delete track.dataset.interacting;
        return;
      }
      if (jump) {
        track.dataset.indicatorJump = "";
        window.requestAnimationFrame(() => delete track.dataset.indicatorJump);
      }
      track.style.setProperty("--toolbar-indicator-x", `${button.offsetLeft}px`);
      track.style.setProperty("--toolbar-indicator-width", `${button.offsetWidth}px`);
      track.style.setProperty("--toolbar-indicator-height", `${button.offsetHeight}px`);
      track.dataset.interacting = "";
    };
    const buttonAt = (x: number, y: number) => {
      const track = displacement.ref.current;
      const bounds = track?.getBoundingClientRect();
      // Dragging well away from the group lets go of the droplet without pressing anything.
      if (!track || !bounds || y < bounds.top - 24 || y > bounds.bottom + 24 || x < bounds.left - 24 || x > bounds.right + 24) return null;
      const clampedX = Math.min(bounds.right - 1, Math.max(bounds.left + 1, x));
      const hit = document.elementFromPoint(clampedX, bounds.top + bounds.height / 2)?.closest<HTMLElement>(BUTTON);
      return hit && track.contains(hit) ? hit : press.current?.over ?? null;
    };

    return (
      <LiquidGlass
        ref={forwardedRef}
        role="group"
        data-slot="liquid-toolbar-group"
        className={cn(
          "liquid-toolbar__group flex h-12 shrink-0 items-center rounded-full px-1.5",
          "[transition:margin_.75s_var(--liquid-spring),padding_.75s_var(--liquid-spring)] motion-reduce:transition-none",
          // Merged groups overlap by their end caps, with matching padding so the
          // buttons keep their spacing, and the fused glass reads as one capsule.
          "group-data-[merged]/liquid-toolbar:-mx-3 group-data-[merged]/liquid-toolbar:px-[18px]",
          "group-data-[merged]/liquid-toolbar:first-of-type:ml-0 group-data-[merged]/liquid-toolbar:first-of-type:pl-1.5",
          "group-data-[merged]/liquid-toolbar:last-of-type:mr-0 group-data-[merged]/liquid-toolbar:last-of-type:pr-1.5",
          className,
        )}
        {...props}
      >
        <div
          ref={displacement.ref}
          data-slot="liquid-toolbar-track"
          className={cn(
            liquidLightTokens,
            "group/toolbar-track relative isolate flex h-full touch-none items-center gap-0.5",
            "[--toolbar-indicator-x:0px] [--toolbar-indicator-width:36px] [--toolbar-indicator-height:36px] [--toolbar-engaged-scale:1.3]",
            "[--toolbar-indicator-tint:rgba(118,118,128,.16)] dark:[--toolbar-indicator-tint:rgba(255,255,255,.12)]",
          )}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const button = (event.target as Element).closest<HTMLElement>(BUTTON);
            if (!button) return;
            press.current = { pointerId: event.pointerId, over: button };
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The pointer may already be gone.
            }
            place(button, true);
          }}
          onPointerMove={(event) => {
            const current = press.current;
            if (!current || current.pointerId !== event.pointerId) return;
            const button = buttonAt(event.clientX, event.clientY);
            if (button !== current.over) place(button);
          }}
          onPointerUp={(event) => {
            const current = press.current;
            if (!current || current.pointerId !== event.pointerId) return;
            const target = buttonAt(event.clientX, event.clientY);
            press.current = null;
            place(null);
            // The pointer was captured, so the native click won't reach the button: press it here.
            swallowNativeClick.current = event.timeStamp;
            target?.click();
          }}
          onPointerCancel={() => {
            press.current = null;
            place(null);
          }}
          onClickCapture={(event) => {
            // Some browsers still send the native click to the button; only ours counts.
            if (event.isTrusted && swallowNativeClick.current && event.timeStamp - swallowNativeClick.current < 400) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <span
            data-slot="liquid-toolbar-indicator"
            aria-hidden="true"
            className={cn(
              "liquid-toolbar__indicator pointer-events-none absolute left-0 top-1/2 -z-10 h-[var(--toolbar-indicator-height)] w-[var(--toolbar-indicator-width)] rounded-full",
              "bg-[var(--toolbar-indicator-tint)] opacity-0 [scale:.6] [translate:var(--toolbar-indicator-x)_-50%]",
              "[transition:translate_.42s_cubic-bezier(.2,1.1,.3,1),width_.32s_cubic-bezier(.2,1,.3,1),scale_.45s_var(--liquid-spring),opacity_.2s_ease]",
              "group-data-[interacting]/toolbar-track:opacity-100 group-data-[interacting]/toolbar-track:[scale:var(--toolbar-engaged-scale)]",
              "group-data-[indicator-jump]/toolbar-track:[transition:scale_.45s_var(--liquid-spring),opacity_.2s_ease]",
              "motion-reduce:transition-none",
            )}
          />
          {children}
          {displacement.filter}
        </div>
      </LiquidGlass>
    );
  },
);

LiquidToolbarGroup.displayName = "LiquidToolbarGroup";

/** A plain toolbar button. The group's droplet is its press feedback, so it has no surface of its own. */
export const LiquidToolbarButton = forwardRef<
  ElementRef<typeof ToolbarPrimitive.Button>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Button>
>(({ className, type = "button", ...props }, forwardedRef) => (
  <ToolbarPrimitive.Button
    ref={forwardedRef}
    type={type}
    data-slot="liquid-toolbar-button"
    className={cn(
      "liquid-toolbar__button relative inline-flex h-9 min-w-9 cursor-pointer select-none items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-2.5",
      "text-[13px] font-medium text-current outline-none [-webkit-tap-highlight-color:transparent] [&_svg]:size-[18px] [&_svg]:shrink-0",
      "transition-[opacity,color] duration-200 disabled:cursor-default disabled:opacity-35",
      "focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_35%,transparent)]",
      className,
    )}
    {...props}
  />
));

LiquidToolbarButton.displayName = "LiquidToolbarButton";

export const LiquidToolbarSeparator = forwardRef<
  ElementRef<typeof ToolbarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Separator>
>(({ className, ...props }, forwardedRef) => (
  <ToolbarPrimitive.Separator
    ref={forwardedRef}
    data-slot="liquid-toolbar-separator"
    className={cn("mx-1 h-5 w-px shrink-0 bg-current opacity-15", className)}
    {...props}
  />
));

LiquidToolbarSeparator.displayName = "LiquidToolbarSeparator";
