"use client";

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementRef,
} from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import {
  liquidLensPresets,
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
  "--slider-range-start": string;
  "--slider-range-end": string;
};

type RefractionStyle = CSSProperties & {
  "--slider-copy-offset": string;
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
      tint = "#0a84ff",
      lens,
      value,
      defaultValue,
      min = 0,
      max = 100,
      disabled,
      orientation = "horizontal",
      onValueChange,
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
    const rootRef = useRef<ElementRef<typeof SliderPrimitive.Root>>(null);
    const trackRef = useRef<ElementRef<typeof SliderPrimitive.Track>>(null);
    const trackLengthRef = useRef(0);
    const motion = useLiquidMotion<HTMLSpanElement>({ maxStretch: 14 });
    const displacement = useLiquidDisplacement<HTMLSpanElement>({
      ...liquidLensPresets.slider,
      ...lens,
    });
    const preset = geometry[size];
    const thumbWidth = Math.max(20, trackerSize?.width ?? preset.thumbWidth);
    const thumbHeight = Math.max(18, trackerSize?.height ?? preset.thumbHeight);
    const trackHeight = Math.min(
      thumbHeight,
      Math.max(2, trackerSize?.trackHeight ?? preset.trackHeight),
    );
    const thumbCount = value?.length ?? defaultValue?.length ?? 1;
    const initialValues = value ?? defaultValue ?? [min];
    const currentValuesRef = useRef(initialValues);
    const toProgress = useCallback(
      (entry: number) => Math.min(1, Math.max(0, (entry - min) / Math.max(1, max - min))),
      [max, min],
    );
    const initialProgress = initialValues.map(toProgress);
    const initialRangeStart = initialProgress.length > 1 ? Math.min(...initialProgress) : 0;
    const initialRangeEnd = initialProgress.length > 1
      ? Math.max(...initialProgress)
      : (initialProgress[0] ?? 0);
    const liquidStyle: SliderStyle = {
      "--slider-thumb-height": `${thumbHeight}px`,
      "--slider-thumb-width": `${thumbWidth}px`,
      "--slider-track-height": `${trackHeight}px`,
      "--slider-tint": tint,
      "--slider-range-start": `${initialRangeStart * 100}%`,
      "--slider-range-end": `${initialRangeEnd * 100}%`,
      ...motion.style,
      ...style,
    };

    const syncRefractionTarget = useCallback((nextValues: number[]) => {
      currentValuesRef.current = nextValues;
      const root = rootRef.current;
      if (!root) return;

      const progress = nextValues.map(toProgress);
      const rangeStart = progress.length > 1 ? Math.min(...progress) : 0;
      const rangeEnd = progress.length > 1 ? Math.max(...progress) : (progress[0] ?? 0);
      root.style.setProperty("--slider-range-start", `${rangeStart * 100}%`);
      root.style.setProperty("--slider-range-end", `${rangeEnd * 100}%`);
      root.style.setProperty("--slider-track-length", `${trackLengthRef.current}px`);
      progress.forEach((entry, index) => {
        root.style.setProperty(`--slider-thumb-offset-${index}`, `${entry * trackLengthRef.current}px`);
      });
    }, [toProgress]);

    useLayoutEffect(() => {
      const track = trackRef.current;
      if (!track) return;

      const updateTrackLength = () => {
        const bounds = track.getBoundingClientRect();
        trackLengthRef.current = orientation === "vertical" ? bounds.height : bounds.width;
        syncRefractionTarget(currentValuesRef.current);
      };

      updateTrackLength();
      const observer = new ResizeObserver(updateTrackLength);
      observer.observe(track);
      return () => observer.disconnect();
    }, [orientation, syncRefractionTarget]);

    useLayoutEffect(() => {
      if (value) syncRefractionTarget(value);
    }, [syncRefractionTarget, value]);

    return (
      <SliderPrimitive.Root
        ref={composeRefs(forwardedRef, motion.ref, rootRef)}
        data-slot="liquid-slider"
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        disabled={disabled}
        orientation={orientation}
        className={cn(
          "liquid-slider group/liquid-slider relative flex w-[min(320px,100%)] cursor-pointer touch-none items-center",
          "h-[calc(var(--slider-thumb-height)+20px)] [contain:layout_style] [--slider-track-color:rgba(120,120,128,.2)]",
          "data-[orientation=vertical]:h-60 data-[orientation=vertical]:w-[calc(var(--slider-thumb-height)+20px)] data-[orientation=vertical]:flex-col",
          "data-[disabled]:cursor-default data-[disabled]:opacity-40",
          className,
        )}
        data-interacting={motion.interacting || undefined}
        data-dragging={motion.dragging || undefined}
        style={liquidStyle}
        onValueChange={(nextValue) => {
          syncRefractionTarget(nextValue);
          onValueChange?.(nextValue);
        }}
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
          ref={trackRef}
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
              "liquid-slider__thumb block h-[var(--slider-thumb-height)] w-[var(--slider-thumb-width)] cursor-grab overflow-hidden rounded-full border-0 bg-white",
              "shadow-[0_2px_5px_rgba(0,0,0,.2),0_.5px_1px_rgba(0,0,0,.08)] outline-none will-change-[transform,width,height]",
              "focus-visible:outline-[4px] focus-visible:outline-[rgba(0,122,255,.28)] focus-visible:outline-offset-[3px]",
              "[transition:transform_.46s_cubic-bezier(.16,1,.3,1),width_.3s_cubic-bezier(.18,1.28,.3,1),height_.3s_cubic-bezier(.18,1.28,.3,1),background_.22s_ease,box-shadow_.26s_ease]",
              "group-data-[interacting]/liquid-slider:h-[calc(var(--slider-thumb-height)+16px)] group-data-[interacting]/liquid-slider:w-[calc(var(--slider-thumb-width)+8px+var(--liquid-stretch))]",
              "group-data-[interacting]/liquid-slider:bg-white/20 group-data-[interacting]/liquid-slider:[transform:translateX(var(--liquid-offset))_scaleY(var(--liquid-squash))_skewX(var(--liquid-skew))]",
              "group-data-[interacting]/liquid-slider:shadow-[0_7px_16px_rgba(0,0,0,.22),inset_0_0_7px_rgba(255,255,255,.9),0_0_0_.5px_rgba(255,255,255,.7)]",
              "group-data-[dragging]/liquid-slider:cursor-grabbing group-data-[dragging]/liquid-slider:[transition:width_.14s_cubic-bezier(.2,.72,.25,1),height_.14s_cubic-bezier(.2,.72,.25,1),background_.14s_ease-out,box-shadow_.14s_ease-out,transform_.09s_cubic-bezier(.2,.72,.25,1)]",
              "motion-reduce:transition-none",
            )}
            key={index}
            aria-label={props["aria-label"] ? `${props["aria-label"]}${thumbCount > 1 ? ` ${index + 1}` : ""}` : undefined}
          >
            <span
              data-slot="liquid-slider-occlusion"
              className="liquid-slider__occlusion absolute inset-0 z-0 rounded-[inherit] bg-[rgba(245,245,247,.84)] opacity-0 shadow-[inset_0_0_12px_rgba(255,255,255,.42)] [backdrop-filter:blur(14px)_saturate(1.15)] transition-opacity duration-150 group-data-[interacting]/liquid-slider:opacity-100 motion-reduce:transition-none"
            />
            <span
              ref={index === 0 ? displacement.targetRef : undefined}
              data-slot="liquid-slider-refraction"
              className={cn(
                "liquid-slider__refraction absolute inset-0 z-[1] origin-center scale-x-[1.04] scale-y-[1.02] overflow-hidden rounded-[inherit] opacity-0 will-change-[transform,opacity]",
                "[transition:opacity_.14s_ease,transform_.3s_cubic-bezier(.16,1,.3,1)]",
                "group-data-[interacting]/liquid-slider:translate-x-[calc(var(--liquid-offset)*-1)] group-data-[interacting]/liquid-slider:scale-x-[1.08] group-data-[interacting]/liquid-slider:scale-y-[1.04] group-data-[interacting]/liquid-slider:opacity-100",
                "group-data-[dragging]/liquid-slider:scale-x-[1.12] group-data-[dragging]/liquid-slider:scale-y-[1.06] group-data-[dragging]/liquid-slider:[transition:opacity_.14s_ease-out,transform_.09s_cubic-bezier(.2,.72,.25,1)]",
                "motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!opacity-0 [@media(prefers-reduced-transparency:reduce)]:!filter-none",
              )}
              style={{
                ...displacement.filterStyle,
                "--slider-copy-offset": `var(--slider-thumb-offset-${index}, 0px)`,
              } as RefractionStyle}
            >
              <span className="liquid-slider__refraction-track absolute left-[calc(50%-var(--slider-copy-offset))] top-1/2 h-[var(--slider-track-height)] w-[var(--slider-track-length,0px)] -translate-y-1/2 overflow-hidden rounded-full bg-[var(--slider-track-color)] group-data-[orientation=vertical]/liquid-slider:left-1/2 group-data-[orientation=vertical]/liquid-slider:top-[calc(50%-var(--slider-copy-offset))] group-data-[orientation=vertical]/liquid-slider:h-[var(--slider-track-length,0px)] group-data-[orientation=vertical]/liquid-slider:w-[var(--slider-track-height)] group-data-[orientation=vertical]/liquid-slider:-translate-x-1/2 group-data-[orientation=vertical]/liquid-slider:translate-y-0">
                <span className="liquid-slider__refraction-fill absolute left-[var(--slider-range-start)] top-0 h-full w-[calc(var(--slider-range-end)-var(--slider-range-start))] rounded-full bg-[var(--slider-tint)] group-data-[orientation=vertical]/liquid-slider:bottom-[var(--slider-range-start)] group-data-[orientation=vertical]/liquid-slider:left-0 group-data-[orientation=vertical]/liquid-slider:top-auto group-data-[orientation=vertical]/liquid-slider:h-[calc(var(--slider-range-end)-var(--slider-range-start))] group-data-[orientation=vertical]/liquid-slider:w-full" />
              </span>
            </span>
            <span
              data-slot="liquid-slider-lens"
              className="liquid-slider__lens absolute inset-0 z-[2] rounded-[inherit] bg-white/25 opacity-0 [backdrop-filter:blur(2.5px)_saturate(1.8)_brightness(1.09)] transition-opacity duration-150 group-data-[interacting]/liquid-slider:opacity-100 group-data-[interacting]/liquid-slider:[backdrop-filter:blur(1.5px)_saturate(2)_brightness(1.18)] motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(245,245,247,.92)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]"
            />
            <span
              data-slot="liquid-slider-rim"
              className="liquid-slider__rim absolute inset-[.5px] z-[3] rounded-[inherit] border-[.5px] border-white/80 opacity-0 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,.95),inset_-1px_-1px_1.5px_rgba(0,0,0,.12)] transition-opacity duration-150 group-data-[interacting]/liquid-slider:opacity-100 motion-reduce:transition-none"
            />
            <span
              data-slot="liquid-slider-light"
              className="liquid-slider__light absolute -inset-1/4 z-[4] rounded-[inherit] bg-[radial-gradient(circle_at_var(--liquid-light-x)_38%,rgba(255,255,255,1),rgba(255,255,255,.42)_20%,transparent_52%)] opacity-0 transition-opacity duration-150 group-data-[interacting]/liquid-slider:opacity-100 motion-reduce:transition-none"
            />
          </SliderPrimitive.Thumb>
        ))}
        {displacement.filter}
      </SliderPrimitive.Root>
    );
  },
);

LiquidSlider.displayName = "LiquidSlider";
