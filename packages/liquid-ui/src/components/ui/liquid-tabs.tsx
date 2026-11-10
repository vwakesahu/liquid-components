"use client";

import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementRef,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import {
  liquidLensPresets,
  liquidLightTokens,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { useLiquidMotion } from "../../hooks/use-liquid-motion";
import { cn, composeRefs } from "../../lib/utils";

type LiquidTabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  size?: "small" | "regular" | "large";
  tint?: string;
  indicatorClassName?: string;
  lens?: LiquidLensOptions;
};

type TabsStyle = CSSProperties & {
  "--tabs-tint"?: string;
};

export const LiquidTabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitive.Root
    ref={forwardedRef}
    data-slot="liquid-tabs"
    className={cn("liquid-tabs w-full", className)}
    {...props}
  />
));

LiquidTabs.displayName = "LiquidTabs";

export const LiquidTabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  LiquidTabsListProps
>(
  (
    {
      className,
      children,
      size = "regular",
      tint,
      indicatorClassName,
      lens,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const motion = useLiquidMotion<HTMLDivElement>({
      maxStretch: 20,
      distanceWeight: 0.9,
      velocityWeight: 24,
    });
    const displacement = useLiquidDisplacement<HTMLDivElement>({
      lens: { ...liquidLensPresets.tabs, ...lens },
      lensSelector: '[data-slot="liquid-tabs-indicator"]',
    });
    const dragSelection = useRef<{ pointerId: number; value: string | null } | null>(null);

    const selectAtPointer = (clientX: number) => {
      const list = motion.ref.current;
      const selection = dragSelection.current;
      if (!list || !selection) return;
      const triggers = Array.from(
        list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
      );
      if (triggers.length === 0) return;

      const listBounds = list.getBoundingClientRect();
      if (clientX < listBounds.left || clientX > listBounds.right) return;

      const target = triggers.reduce((nearest, trigger) => {
        const nearestBounds = nearest.getBoundingClientRect();
        const triggerBounds = trigger.getBoundingClientRect();
        const nearestDistance = Math.abs(clientX - (nearestBounds.left + nearestBounds.width / 2));
        const triggerDistance = Math.abs(clientX - (triggerBounds.left + triggerBounds.width / 2));
        return triggerDistance < nearestDistance ? trigger : nearest;
      });
      const value = target.dataset.liquidValue ?? null;
      if (!value || selection.value === value) return;
      selection.value = value;
      target.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          button: 0,
          clientX,
        }),
      );
    };

    useLayoutEffect(() => {
      const list = motion.ref.current;
      if (!list) return;

      let frame = 0;
      const measure = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          const active = list.querySelector<HTMLElement>(
            '[role="tab"][data-state="active"]',
          );
          if (!active) return;
          const listBounds = list.getBoundingClientRect();
          const activeBounds = active.getBoundingClientRect();
          list.style.setProperty("--tabs-indicator-x", `${activeBounds.left - listBounds.left}px`);
          list.style.setProperty("--tabs-indicator-width", `${activeBounds.width}px`);
          list.style.setProperty("--tabs-indicator-height", `${activeBounds.height}px`);
          list.dataset.indicatorReady = "";
        });
      };

      const resizeObserver = new ResizeObserver(measure);
      const observeLayout = () => {
        resizeObserver.disconnect();
        resizeObserver.observe(list);
        list.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
          resizeObserver.observe(tab);
        });
      };
      const mutationObserver = new MutationObserver(() => {
        observeLayout();
        measure();
      });

      observeLayout();
      mutationObserver.observe(list, {
        attributes: true,
        attributeFilter: ["data-state"],
        childList: true,
        subtree: true,
      });
      measure();

      return () => {
        window.cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, []);

    const liquidStyle: TabsStyle = {
      ...(tint ? { "--tabs-tint": tint } : {}),
      ...motion.style,
      ...style,
    };

    return (
      <TabsPrimitive.List
        ref={composeRefs(forwardedRef, motion.ref, displacement.ref)}
        data-slot="liquid-tabs-list"
        data-size={size}
        className={cn(
          liquidLightTokens,
          "liquid-tabs__list group/liquid-tabs-list relative isolate inline-flex min-w-[min(100%,360px)] touch-manipulation select-none items-center gap-0.5 rounded-full border-[.5px] border-white/50 bg-[rgba(118,118,128,.14)] p-1 text-[#1c1c1e]",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,.08),0_1px_0_rgba(255,255,255,.4)]",
          "[--tabs-indicator-x:4px] [--tabs-engaged-scale:1.22] [--tabs-indicator-width:0px] [--tabs-indicator-height:36px] [--tabs-tint:rgba(255,255,255,.48)] [--tabs-active-tint:rgba(255,255,255,.2)] [--tabs-label:rgba(60,60,67,.72)] [--tabs-label-active:#111113]",
          "dark:border-white/15 dark:bg-[rgba(235,235,245,.1)] dark:text-[#f5f5f7] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.32),0_1px_0_rgba(255,255,255,.08)]",
          "dark:[--tabs-tint:rgba(118,118,128,.58)] dark:[--tabs-active-tint:rgba(118,118,128,.34)] dark:[--tabs-label:rgba(235,235,245,.66)] dark:[--tabs-label-active:#fff]",
          size === "small" && "[--tabs-indicator-height:30px]",
          size === "large" && "[--tabs-indicator-height:42px]",
          className,
        )}
        data-interacting={motion.interacting || undefined}
        data-dragging={motion.dragging || undefined}
        style={liquidStyle}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            onPointerDown?.(event);
            return;
          }
          dragSelection.current = { pointerId: event.pointerId, value: null };
          event.currentTarget.setPointerCapture(event.pointerId);
          selectAtPointer(event.clientX);
          motion.pointerDown(event);
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          motion.pointerMove(event);
          if (dragSelection.current?.pointerId === event.pointerId && event.buttons === 1) {
            selectAtPointer(event.clientX);
          }
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          if (dragSelection.current?.pointerId === event.pointerId) {
            selectAtPointer(event.clientX);
            dragSelection.current = null;
          }
          motion.pointerUp(event);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          dragSelection.current = null;
          motion.pointerCancel();
          onPointerCancel?.(event);
        }}
        onKeyDown={(event) => {
          motion.keyDown(event);
          onKeyDown?.(event);
        }}
        onKeyUp={(event) => {
          motion.keyUp(event);
          onKeyUp?.(event);
        }}
        {...props}
      >
        <span
          data-slot="liquid-tabs-indicator"
          className={cn(
            "liquid-tabs__indicator pointer-events-none absolute left-0 top-1/2 z-0 h-[var(--tabs-indicator-height)] w-[var(--tabs-indicator-width)] origin-center overflow-hidden rounded-full bg-[var(--tabs-tint)] opacity-0 [translate:var(--tabs-indicator-x)_-50%]",
            "shadow-[0_1px_2px_rgba(0,0,0,.1)] will-change-[translate,scale,width,transform]",
            "[transition:width_.62s_cubic-bezier(.17,1.36,.29,1),height_.5s_cubic-bezier(.17,1.36,.29,1),translate_.7s_cubic-bezier(.18,.82,.24,1),scale_.5s_cubic-bezier(.17,1.36,.29,1),transform_.4s_cubic-bezier(.18,.82,.24,1),background_.32s_ease,box-shadow_.4s_ease,opacity_.12s_ease]",
            "group-data-[indicator-ready]/liquid-tabs-list:opacity-100",
            // One uniform growth factor keeps the pill's proportions and radius intact.
            "group-data-[interacting]/liquid-tabs-list:[scale:var(--tabs-engaged-scale)] group-data-[interacting]/liquid-tabs-list:w-[calc(var(--tabs-indicator-width)+var(--liquid-stretch))]",
            // While engaged the pill becomes clear glass; the list's refraction filter
            // bends the real labels and list edge underneath and adds the rim light.
            "group-data-[interacting]/liquid-tabs-list:bg-[var(--tabs-active-tint)] group-data-[interacting]/liquid-tabs-list:[transform:translateX(var(--liquid-offset))_scaleY(var(--liquid-squash))_skewX(var(--liquid-skew))]",
            "group-data-[interacting]/liquid-tabs-list:shadow-none",
            "group-data-[dragging]/liquid-tabs-list:[transition:width_.3s_cubic-bezier(.17,1.36,.29,1),height_.28s_cubic-bezier(.17,1.36,.29,1),translate_.24s_cubic-bezier(.18,.82,.24,1),scale_.28s_cubic-bezier(.17,1.36,.29,1),transform_.24s_cubic-bezier(.18,.82,.24,1),background_.24s_ease-out,box-shadow_.28s_ease-out]",
            "dark:shadow-[0_1px_2px_rgba(0,0,0,.4)] dark:group-data-[interacting]/liquid-tabs-list:shadow-none",
            "motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!bg-[rgba(245,245,247,.92)] dark:[@media(prefers-reduced-transparency:reduce)]:!bg-[rgba(72,72,78,.94)]",
            indicatorClassName,
          )}
          aria-hidden="true"
        />
        {children}
        {displacement.filter}
      </TabsPrimitive.List>
    );
  },
);

LiquidTabsList.displayName = "LiquidTabsList";

export const LiquidTabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitive.Trigger
    ref={forwardedRef}
    data-slot="liquid-tabs-trigger"
    className={cn(
      "liquid-tabs__trigger relative z-[1] inline-flex h-[var(--tabs-indicator-height)] min-w-0 flex-1 cursor-pointer items-center justify-center gap-[7px] whitespace-nowrap rounded-full border-0 bg-transparent px-[18px]",
      "text-[13px] font-[560] tracking-[-.01em] text-[var(--tabs-label)] transition-[color,transform] duration-200",
      "data-[state=active]:text-[var(--tabs-label-active)] focus-visible:outline-[3px] focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_30%,transparent)] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-40",
      "group-data-[size=small]/liquid-tabs-list:px-3.5 group-data-[size=small]/liquid-tabs-list:text-xs group-data-[size=large]/liquid-tabs-list:px-[22px] group-data-[size=large]/liquid-tabs-list:text-sm",
      "motion-reduce:transition-none",
      className,
    )}
    data-liquid-value={props.value}
    {...props}
  />
));

LiquidTabsTrigger.displayName = "LiquidTabsTrigger";

export const LiquidTabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitive.Content
    ref={forwardedRef}
    data-slot="liquid-tabs-content"
    className={cn(
      "liquid-tabs__content mt-[18px] outline-none focus-visible:rounded-xl focus-visible:outline-[3px] focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_28%,transparent)] focus-visible:outline-offset-4",
      className,
    )}
    {...props}
  />
));

LiquidTabsContent.displayName = "LiquidTabsContent";
