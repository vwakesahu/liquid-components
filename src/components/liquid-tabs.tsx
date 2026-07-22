import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementRef,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { useLiquidMotion } from "@/hooks/use-liquid-motion";
import { cn, composeRefs } from "@/lib/utils";
import "@/styles/liquid.css";

type LiquidTabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  size?: "small" | "regular" | "large";
  tint?: string;
  indicatorClassName?: string;
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
    className={cn("liquid-tabs", className)}
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
      maxStretch: 14,
      distanceWeight: 0.8,
      velocityWeight: 20,
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
        ref={composeRefs(forwardedRef, motion.ref)}
        data-slot="liquid-tabs-list"
        className={cn("liquid-tabs__list", `liquid-tabs__list--${size}`, className)}
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
          className={cn("liquid-tabs__indicator", indicatorClassName)}
          aria-hidden="true"
        >
          <span data-slot="liquid-tabs-indicator-lens" className="liquid-tabs__indicator-lens" />
          <span data-slot="liquid-tabs-indicator-rim" className="liquid-tabs__indicator-rim" />
          <span data-slot="liquid-tabs-indicator-light" className="liquid-tabs__indicator-light" />
        </span>
        {children}
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
    className={cn("liquid-tabs__trigger", className)}
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
    className={cn("liquid-tabs__content", className)}
    {...props}
  />
));

LiquidTabsContent.displayName = "LiquidTabsContent";
