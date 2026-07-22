import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ElementRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { useLiquidMotion } from "@/hooks/use-liquid-motion";
import { cn, composeRefs } from "@/lib/utils";
import "@/styles/liquid.css";

type LiquidSwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  size?: "small" | "regular" | "large";
  tint?: string;
};

const geometry = {
  small: { width: 50, height: 26, thumbWidth: 32, inset: 2 },
  regular: { width: 64, height: 32, thumbWidth: 40, inset: 2 },
  large: { width: 74, height: 36, thumbWidth: 46, inset: 2 },
};

type SwitchStyle = CSSProperties & {
  "--switch-width": string;
  "--switch-height": string;
  "--switch-inset": string;
  "--switch-tint": string;
  "--thumb-width": string;
  "--thumb-travel": string;
};

export const LiquidSwitch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  LiquidSwitchProps
>(
  (
    {
      className,
      size = "regular",
      tint = "#34c759",
      disabled,
      checked,
      defaultChecked = false,
      onCheckedChange,
      onClick,
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
    const motion = useLiquidMotion<HTMLButtonElement>({ maxStretch: 14 });
    const metrics = geometry[size];
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const drag = useRef<{ startX: number; left: number; width: number; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : uncontrolledChecked;
    const travel = metrics.width - metrics.thumbWidth - metrics.inset * 2;

    const updateChecked = (next: boolean) => {
      if (!isControlled) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    };

    useEffect(() => {
      motion.ref.current?.style.removeProperty("--thumb-x");
    }, [isChecked]);

    const liquidStyle: SwitchStyle = {
      "--switch-width": `${metrics.width}px`,
      "--switch-height": `${metrics.height}px`,
      "--switch-inset": `${metrics.inset}px`,
      "--switch-tint": tint,
      "--thumb-width": `${metrics.thumbWidth}px`,
      "--thumb-travel": `${travel}px`,
      ...motion.style,
      ...style,
    };

    return (
      <SwitchPrimitive.Root
        ref={composeRefs(forwardedRef, motion.ref)}
        data-slot="liquid-switch"
        disabled={disabled}
        checked={isChecked}
        onCheckedChange={updateChecked}
        className={cn("liquid-switch", `liquid-switch--${size}`, className)}
        data-interacting={motion.interacting || undefined}
        data-dragging={motion.dragging || undefined}
        style={liquidStyle}
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          drag.current = {
            startX: event.clientX,
            left: bounds.left,
            width: bounds.width,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          motion.pointerDown(event);
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          motion.pointerMove(event);
          const currentDrag = drag.current;
          if (currentDrag) {
            if (!currentDrag.moved && Math.abs(event.clientX - currentDrag.startX) > 2) {
              currentDrag.moved = true;
            }
            if (currentDrag.moved) {
              const usableWidth = Math.max(1, currentDrag.width - metrics.thumbWidth);
              const progress = Math.min(
                1,
                Math.max(0, (event.clientX - currentDrag.left - metrics.thumbWidth / 2) / usableWidth),
              );
              event.currentTarget.style.setProperty("--thumb-x", `${progress * travel}px`);
            }
          }
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          motion.pointerUp(event);
          const currentDrag = drag.current;
          if (currentDrag?.moved) {
            suppressClick.current = true;
            const next = event.clientX >= currentDrag.left + currentDrag.width / 2;
            event.currentTarget.style.setProperty("--thumb-x", next ? `${travel}px` : "0px");
            updateChecked(next);
          }
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          motion.pointerCancel();
          drag.current = null;
          event.currentTarget.style.removeProperty("--thumb-x");
          onPointerCancel?.(event);
        }}
        onClick={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            event.preventDefault();
          }
          onClick?.(event);
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
        <span data-slot="liquid-switch-track" className="liquid-switch__track" aria-hidden="true">
          <span data-slot="liquid-switch-tint" className="liquid-switch__tint" />
        </span>
        <SwitchPrimitive.Thumb data-slot="liquid-switch-thumb" className="liquid-switch__thumb">
          <span data-slot="liquid-switch-lens" className="liquid-switch__lens" />
          <span data-slot="liquid-switch-rim" className="liquid-switch__rim" />
          <span data-slot="liquid-switch-light" className="liquid-switch__light" />
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );
  },
);

LiquidSwitch.displayName = "LiquidSwitch";
