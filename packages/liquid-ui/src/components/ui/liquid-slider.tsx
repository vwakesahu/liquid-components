"use client";

import { forwardRef, type CSSProperties, type ElementRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import {
  liquidLensPresets,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { useLiquidMotion } from "../../hooks/use-liquid-motion";
import { cn, composeRefs } from "../../lib/utils";
import "../../styles/liquid.css";

type LiquidSliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  size?: "small" | "regular" | "large";
  tint?: string;
  lens?: LiquidLensOptions;
};

const geometry = {
  small: { height: 26, thumbWidth: 32, trackHeight: 6 },
  regular: { height: 32, thumbWidth: 40, trackHeight: 8 },
  large: { height: 38, thumbWidth: 48, trackHeight: 10 },
};

type SliderStyle = CSSProperties & {
  "--slider-height": string;
  "--slider-thumb-width": string;
  "--slider-track-height": string;
  "--slider-tint": string;
};

export const LiquidSlider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  LiquidSliderProps
>(
  (
    {
      className,
      size = "regular",
      tint = "#0a84ff",
      lens,
      value,
      defaultValue,
      disabled,
      orientation = "horizontal",
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
    const motion = useLiquidMotion<HTMLSpanElement>();
    const displacement = useLiquidDisplacement<HTMLSpanElement>({
      ...liquidLensPresets.slider,
      ...lens,
    });
    const metrics = geometry[size];
    const thumbCount = value?.length ?? defaultValue?.length ?? 1;
    const liquidStyle: SliderStyle = {
      "--slider-height": `${metrics.height}px`,
      "--slider-thumb-width": `${metrics.thumbWidth}px`,
      "--slider-track-height": `${metrics.trackHeight}px`,
      "--slider-tint": tint,
      ...motion.style,
      ...style,
    };

    return (
      <SliderPrimitive.Root
        ref={composeRefs(forwardedRef, motion.ref)}
        data-slot="liquid-slider"
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        orientation={orientation}
        className={cn("liquid-slider", `liquid-slider--${size}`, className)}
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
        <SliderPrimitive.Track data-slot="liquid-slider-track" className="liquid-slider__track">
          <SliderPrimitive.Range data-slot="liquid-slider-range" className="liquid-slider__fill" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="liquid-slider-thumb"
            className="liquid-slider__thumb"
            key={index}
            aria-label={props["aria-label"] ? `${props["aria-label"]}${thumbCount > 1 ? ` ${index + 1}` : ""}` : undefined}
          >
            <span data-slot="liquid-slider-occlusion" className="liquid-slider__occlusion" />
            <span
              ref={index === 0 ? displacement.targetRef : undefined}
              data-slot="liquid-slider-refraction"
              className="liquid-slider__refraction"
              style={displacement.filterStyle}
            />
            <span data-slot="liquid-slider-lens" className="liquid-slider__lens" />
            <span data-slot="liquid-slider-rim" className="liquid-slider__rim" />
            <span data-slot="liquid-slider-light" className="liquid-slider__light" />
          </SliderPrimitive.Thumb>
        ))}
        {displacement.filter}
      </SliderPrimitive.Root>
    );
  },
);

LiquidSlider.displayName = "LiquidSlider";
