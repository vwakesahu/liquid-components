"use client";

import {
  forwardRef,
  type CSSProperties,
  type ElementRef,
} from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import {
  liquidLensPresets,
  liquidLightTokens,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { useLiquidMotion } from "../../hooks/use-liquid-motion";
import { cn, composeRefs } from "../../lib/utils";

export type LiquidSliderTrackerSize = {
  width?: number;
  height?: number;
  trackHeight?: number;
};

export type LiquidSliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  size?: "small" | "regular" | "large";
  trackerSize?: LiquidSliderTrackerSize;
  tint?: string;
  lens?: LiquidLensOptions;
};

const geometry = {
  small: { thumbHeight: 22, thumbWidth: 32, trackHeight: 6 },
  regular: { thumbHeight: 28, thumbWidth: 40, trackHeight: 8 },
  large: { thumbHeight: 32, thumbWidth: 46, trackHeight: 10 },
};

type SliderStyle = CSSProperties & {
  "--slider-thumb-height": string;
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
      trackerSize,
      tint = "var(--liquid-accent, #0a84ff)",
      lens,
      value,
      defaultValue,
      min = 0,
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
    const motion = useLiquidMotion<HTMLSpanElement>({ maxStretch: 14 });
    const displacement = useLiquidDisplacement<HTMLSpanElement>({
      lens: { ...liquidLensPresets.slider, ...lens },
      lensSelector: '[data-slot="liquid-slider-thumb"]',
    });
    const preset = geometry[size];
    const thumbWidth = Math.max(20, trackerSize?.width ?? preset.thumbWidth);
    const thumbHeight = Math.max(18, trackerSize?.height ?? preset.thumbHeight);
    const trackHeight = Math.min(
      thumbHeight,
      Math.max(2, trackerSize?.trackHeight ?? preset.trackHeight),
    );
    const thumbCount = value?.length ?? defaultValue?.length ?? 1;
    const liquidStyle: SliderStyle = {
      "--slider-thumb-height": `${thumbHeight}px`,
      "--slider-thumb-width": `${thumbWidth}px`,
      "--slider-track-height": `${trackHeight}px`,
      "--slider-tint": tint,
      ...motion.style,
      ...style,
    };

    return (
      <SliderPrimitive.Root
        ref={composeRefs(forwardedRef, motion.ref, displacement.ref)}
        data-slot="liquid-slider"
        value={value}
        defaultValue={defaultValue}
        min={min}
        disabled={disabled}
        orientation={orientation}
        className={cn(
          liquidLightTokens,
          "liquid-slider group/liquid-slider relative flex w-[min(320px,100%)] cursor-pointer touch-none items-center",
          "h-[calc(var(--slider-thumb-height)*var(--slider-engaged-scale)+8px)] [--slider-engaged-scale:1.4] [--slider-track-color:rgba(120,120,128,.2)]",
          "data-[orientation=vertical]:h-60 data-[orientation=vertical]:w-[calc(var(--slider-thumb-height)*var(--slider-engaged-scale)+8px)] data-[orientation=vertical]:flex-col",
          "data-[disabled]:cursor-default data-[disabled]:opacity-40",
          className,
        )}
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
        <SliderPrimitive.Track
          data-slot="liquid-slider-track"
          className="liquid-slider__track relative mx-[calc(var(--slider-thumb-width)/2)] h-[var(--slider-track-height)] flex-1 overflow-visible rounded-full bg-[var(--slider-track-color)] shadow-[inset_0_1px_2px_rgba(0,0,0,.1),0_.5px_0_rgba(255,255,255,.55)] group-data-[orientation=vertical]/liquid-slider:mx-0 group-data-[orientation=vertical]/liquid-slider:my-[calc(var(--slider-thumb-width)/2)] group-data-[orientation=vertical]/liquid-slider:h-full group-data-[orientation=vertical]/liquid-slider:w-[var(--slider-track-height)]"
        >
          <SliderPrimitive.Range
            data-slot="liquid-slider-range"
            className="liquid-slider__fill absolute h-full rounded-[inherit] bg-[var(--slider-tint)] shadow-[2px_0_0_var(--slider-tint)] group-data-[orientation=vertical]/liquid-slider:h-auto group-data-[orientation=vertical]/liquid-slider:w-full group-data-[orientation=vertical]/liquid-slider:shadow-[0_-2px_0_var(--slider-tint)]"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="liquid-slider-thumb"
            className={cn(
              "liquid-slider__thumb block h-[var(--slider-thumb-height)] w-[var(--slider-thumb-width)] cursor-grab rounded-full border-0 bg-white",
              "shadow-[0_1px_3px_rgba(0,0,0,.16),0_0_0_.5px_rgba(0,0,0,.04)] outline-none will-change-[scale,transform,width]",
              "focus-visible:outline-[4px] focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_28%,transparent)] focus-visible:outline-offset-[3px]",
              "[transition:scale_.3s_cubic-bezier(.18,1.28,.3,1),transform_.46s_cubic-bezier(.16,1,.3,1),width_.3s_cubic-bezier(.18,1.28,.3,1),background_.22s_ease,box-shadow_.26s_ease]",
              // One uniform growth factor keeps the capsule's proportions and radius intact.
              "group-data-[interacting]/liquid-slider:[scale:var(--slider-engaged-scale)] group-data-[interacting]/liquid-slider:w-[calc(var(--slider-thumb-width)+var(--liquid-stretch))]",
              // Engaged thumbs become clear glass; the slider's refraction filter bends
              // the real rail and fill beneath them and adds the rim light.
              "group-data-[interacting]/liquid-slider:bg-white/[.04] group-data-[interacting]/liquid-slider:[transform:translateX(var(--liquid-offset))_scaleY(var(--liquid-squash))_skewX(var(--liquid-skew))]",
              "group-data-[interacting]/liquid-slider:shadow-none",
              "group-data-[dragging]/liquid-slider:cursor-grabbing group-data-[dragging]/liquid-slider:[transition:scale_.14s_cubic-bezier(.2,.72,.25,1),width_.14s_cubic-bezier(.2,.72,.25,1),background_.14s_ease-out,box-shadow_.14s_ease-out,transform_.09s_cubic-bezier(.2,.72,.25,1)]",
              "motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!bg-white",
            )}
            key={index}
            aria-label={props["aria-label"] ? `${props["aria-label"]}${thumbCount > 1 ? ` ${index + 1}` : ""}` : undefined}
          />
        ))}
        {displacement.filter}
      </SliderPrimitive.Root>
    );
  },
);

LiquidSlider.displayName = "LiquidSlider";
