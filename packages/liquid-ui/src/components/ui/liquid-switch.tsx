"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ElementRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import {
  liquidLensPresets,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { useLiquidMotion } from "../../hooks/use-liquid-motion";
import { cn, composeRefs } from "../../lib/utils";

type LiquidSwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  size?: "small" | "regular" | "large";
  tint?: string;
  lens?: LiquidLensOptions;
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
      lens,
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
    const displacement = useLiquidDisplacement<HTMLSpanElement>({
      ...liquidLensPresets.switch,
      ...lens,
    });
    const metrics = geometry[size];
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
    const drag = useRef<{
      startX: number;
      left: number;
      width: number;
      moved: boolean;
      pointerId: number;
    } | null>(null);
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
    useEffect(() => {
      if (!disabled) return;
      const activeDrag = drag.current;
      const root = motion.ref.current;
      if (activeDrag && root?.hasPointerCapture(activeDrag.pointerId)) {
        root.releasePointerCapture(activeDrag.pointerId);
      }
      drag.current = null;
      suppressClick.current = false;
      motion.pointerCancel();
      motion.ref.current?.style.removeProperty("--thumb-x");
    }, [disabled]);

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
        className={cn(
          "liquid-switch group/liquid-switch relative flex-none cursor-pointer touch-none select-none rounded-full border-0 bg-transparent p-0",
          "outline-none focus-visible:outline-[4px] focus-visible:outline-[rgba(0,122,255,.3)] focus-visible:outline-offset-[3px]",
          "disabled:pointer-events-none disabled:cursor-default disabled:opacity-40",
          "[--thumb-x:0px] data-[state=checked]:[--thumb-x:var(--thumb-travel)]",
          "[width:var(--switch-width)] [height:var(--switch-height)]",
          className,
        )}
        data-interacting={motion.interacting || undefined}
        data-dragging={motion.dragging || undefined}
        style={liquidStyle}
        onPointerDown={(event) => {
          if (disabled) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          drag.current = {
            startX: event.clientX,
            left: bounds.left,
            width: bounds.width,
            moved: false,
            pointerId: event.pointerId,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          motion.pointerDown(event);
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          if (disabled) return;
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
          if (disabled) return;
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
          if (disabled) return;
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
        <span
          data-slot="liquid-switch-track"
          className="liquid-switch__track absolute inset-0 overflow-visible rounded-[inherit] bg-[#e9e9eb] shadow-[inset_0_0_0_.5px_rgba(0,0,0,.06),inset_0_1px_2px_rgba(0,0,0,.04)] transition-colors duration-200 motion-reduce:transition-none"
          aria-hidden="true"
        >
          <span
            data-slot="liquid-switch-tint"
            className="liquid-switch__tint absolute inset-0 scale-[.76] overflow-hidden rounded-[inherit] bg-[var(--switch-tint)] opacity-0 transition-[opacity,transform] duration-[380ms] ease-[cubic-bezier(.2,.85,.28,1.18)] group-data-[state=checked]/liquid-switch:scale-100 group-data-[state=checked]/liquid-switch:opacity-100 motion-reduce:transition-none"
          />
        </span>
        <SwitchPrimitive.Thumb
          data-slot="liquid-switch-thumb"
          className={cn(
            "liquid-switch__thumb absolute overflow-hidden rounded-full bg-white",
            "left-[var(--switch-inset)] top-[var(--switch-inset)] h-[calc(var(--switch-height)-var(--switch-inset)*2)] w-[var(--thumb-width)]",
            "origin-center [transform:translate3d(var(--thumb-x),0,0)] shadow-[0_2px_5px_rgba(0,0,0,.2),0_.5px_1px_rgba(0,0,0,.08)]",
            "will-change-[transform,width,height,margin-left]",
            "[transition:transform_.46s_cubic-bezier(.16,1,.3,1),width_.3s_cubic-bezier(.18,1.28,.3,1),height_.3s_cubic-bezier(.18,1.28,.3,1),top_.3s_cubic-bezier(.16,1,.3,1),margin-left_.3s_cubic-bezier(.16,1,.3,1),background_.22s_ease,box-shadow_.26s_ease]",
            "group-data-[interacting]/liquid-switch:-top-1.5 group-data-[interacting]/liquid-switch:ml-[calc(-4px+var(--liquid-offset))]",
            "group-data-[interacting]/liquid-switch:h-[calc(var(--switch-height)+12px)] group-data-[interacting]/liquid-switch:w-[calc(var(--thumb-width)+8px+var(--liquid-stretch))]",
            "group-data-[interacting]/liquid-switch:bg-white/20 group-data-[interacting]/liquid-switch:[transform:translate3d(var(--thumb-x),0,0)_scaleY(var(--liquid-squash))_skewX(var(--liquid-skew))]",
            "group-data-[interacting]/liquid-switch:shadow-[0_7px_16px_rgba(0,0,0,.22),inset_0_0_7px_rgba(255,255,255,.9),0_0_0_.5px_rgba(255,255,255,.7)]",
            "group-data-[dragging]/liquid-switch:[transition:width_.14s_cubic-bezier(.2,.72,.25,1),height_.14s_cubic-bezier(.2,.72,.25,1),top_.14s_cubic-bezier(.2,.72,.25,1),margin-left_.11s_cubic-bezier(.2,.72,.25,1),background_.14s_ease-out,box-shadow_.14s_ease-out,transform_.09s_cubic-bezier(.2,.72,.25,1)]",
            "motion-reduce:transition-none",
          )}
        >
          <span
            ref={displacement.targetRef}
            data-slot="liquid-switch-refraction"
            className={cn(
              "liquid-switch__refraction absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-150",
              "bg-[linear-gradient(90deg,#d1d1d6_0_32%,#f5f5f7_46%_54%,#d1d1d6_68%_100%)] bg-[length:116%_64%] bg-center bg-no-repeat",
              "group-data-[state=checked]/liquid-switch:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--switch-tint),black_10%)_0_32%,color-mix(in_srgb,var(--switch-tint),white_42%)_46%_54%,color-mix(in_srgb,var(--switch-tint),black_10%)_68%_100%)]",
              "group-data-[interacting]/liquid-switch:opacity-100",
              "motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!opacity-0 [@media(prefers-reduced-transparency:reduce)]:!filter-none",
            )}
            style={displacement.filterStyle}
          />
          <span
            data-slot="liquid-switch-lens"
            className="liquid-switch__lens absolute inset-0 z-[1] rounded-[inherit] bg-white/25 opacity-0 [backdrop-filter:blur(2.5px)_saturate(1.8)_brightness(1.09)] transition-opacity duration-150 group-data-[interacting]/liquid-switch:opacity-100 group-data-[interacting]/liquid-switch:[backdrop-filter:blur(1.5px)_saturate(2)_brightness(1.18)] motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(245,245,247,.92)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]"
          />
          <span
            data-slot="liquid-switch-rim"
            className="liquid-switch__rim absolute inset-[.5px] z-[2] rounded-[inherit] border-[.5px] border-white/80 opacity-0 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,.95),inset_-1px_-1px_1.5px_rgba(0,0,0,.12)] transition-opacity duration-150 group-data-[interacting]/liquid-switch:opacity-100 motion-reduce:transition-none"
          />
          <span
            data-slot="liquid-switch-light"
            className="liquid-switch__light absolute -inset-1/4 z-[3] rounded-[inherit] bg-[radial-gradient(circle_at_var(--liquid-light-x)_38%,rgba(255,255,255,1),rgba(255,255,255,.42)_20%,transparent_52%)] opacity-0 transition-opacity duration-150 group-data-[interacting]/liquid-switch:opacity-100 motion-reduce:transition-none"
          />
          {displacement.filter}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );
  },
);

LiquidSwitch.displayName = "LiquidSwitch";
