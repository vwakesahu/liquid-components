import {
  forwardRef,
  useLayoutEffect,
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
};

type TabsStyle = CSSProperties & {
  "--tabs-tint": string;
};

export const LiquidTabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitive.Root
    ref={forwardedRef}
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
      tint = "rgba(255, 255, 255, .72)",
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
    const motion = useLiquidMotion<HTMLDivElement>({ maxStretch: 12 });

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
      "--tabs-tint": tint,
      ...motion.style,
      ...style,
    };

    return (
      <TabsPrimitive.List
        ref={composeRefs(forwardedRef, motion.ref)}
        className={cn("liquid-tabs__list", `liquid-tabs__list--${size}`, className)}
        data-interacting={motion.interacting || undefined}
        data-dragging={motion.dragging || undefined}
        style={liquidStyle}
        onPointerDown={(event) => {
          motion.pointerDown(event);
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          motion.pointerMove(event);
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          motion.pointerUp(event);
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
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
        <span className="liquid-tabs__indicator" aria-hidden="true">
          <span className="liquid-tabs__indicator-lens" />
          <span className="liquid-tabs__indicator-rim" />
          <span className="liquid-tabs__indicator-light" />
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
    className={cn("liquid-tabs__trigger", className)}
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
    className={cn("liquid-tabs__content", className)}
    {...props}
  />
));

LiquidTabsContent.displayName = "LiquidTabsContent";
