import { forwardRef, type CSSProperties, type ElementRef } from "react";
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
    const liquidStyle: SwitchStyle = {
      "--switch-width": `${metrics.width}px`,
      "--switch-height": `${metrics.height}px`,
      "--switch-inset": `${metrics.inset}px`,
      "--switch-tint": tint,
      "--thumb-width": `${metrics.thumbWidth}px`,
      "--thumb-travel": `${metrics.width - metrics.thumbWidth - metrics.inset * 2}px`,
      ...motion.style,
      ...style,
    };

    return (
      <SwitchPrimitive.Root
        ref={composeRefs(forwardedRef, motion.ref)}
        disabled={disabled}
        className={cn("liquid-switch", `liquid-switch--${size}`, className)}
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
        <span className="liquid-switch__track" aria-hidden="true">
          <span className="liquid-switch__tint" />
        </span>
        <SwitchPrimitive.Thumb className="liquid-switch__thumb">
          <span className="liquid-switch__lens" />
          <span className="liquid-switch__rim" />
          <span className="liquid-switch__light" />
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );
  },
);

LiquidSwitch.displayName = "LiquidSwitch";
