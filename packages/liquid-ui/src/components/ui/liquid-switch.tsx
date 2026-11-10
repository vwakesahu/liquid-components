"use client";

import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ElementRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import {
  liquidLensPresets,
  liquidLightTokens,
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
    const displacement = useLiquidDisplacement<HTMLButtonElement>({
      lens: { ...liquidLensPresets.switch, ...lens },
      lensSelector: '[data-slot="liquid-switch-thumb"]',
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
        ref={composeRefs(forwardedRef, motion.ref, displacement.ref)}
        data-slot="liquid-switch"
        disabled={disabled}
        checked={isChecked}
        onCheckedChange={updateChecked}
        className={cn(
          liquidLightTokens,
          "liquid-switch group/liquid-switch relative flex-none cursor-pointer touch-none select-none rounded-full border-0 bg-transparent p-0",
          "outline-none focus-visible:outline-[4px] focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_30%,transparent)] focus-visible:outline-offset-[3px]",
          "disabled:pointer-events-none disabled:cursor-default disabled:opacity-40",
          "[--thumb-x:0px] [--switch-engaged-scale:1.4] data-[state=checked]:[--thumb-x:var(--thumb-travel)]",
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
            "liquid-switch__thumb absolute rounded-full bg-white",
            "left-[var(--switch-inset)] top-[var(--switch-inset)] h-[calc(var(--switch-height)-var(--switch-inset)*2)] w-[var(--thumb-width)]",
            // Position lives on `translate` so the engaged `scale` never multiplies the travel.
            "origin-center [translate:var(--thumb-x)_0] shadow-[0_1px_3px_rgba(0,0,0,.16),0_0_0_.5px_rgba(0,0,0,.04)]",
            "will-change-[translate,scale,transform,width]",
            "[transition:translate_.46s_cubic-bezier(.16,1,.3,1),scale_.3s_cubic-bezier(.18,1.28,.3,1),transform_.3s_cubic-bezier(.16,1,.3,1),width_.3s_cubic-bezier(.18,1.28,.3,1),margin-left_.3s_cubic-bezier(.16,1,.3,1),background_.22s_ease,box-shadow_.26s_ease]",
            // Engaging grows the capsule by one uniform factor, so its proportions and
            // radius stay intact. Velocity stretch is the only non-uniform deformation.
            "group-data-[interacting]/liquid-switch:[scale:var(--switch-engaged-scale)] group-data-[interacting]/liquid-switch:ml-[var(--liquid-offset)] group-data-[interacting]/liquid-switch:w-[calc(var(--thumb-width)+var(--liquid-stretch))]",
            // While engaged the thumb turns into clear glass; the refraction filter on
            // the switch bends the real track underneath it and adds the rim light.
            "group-data-[interacting]/liquid-switch:bg-white/[.04] group-data-[interacting]/liquid-switch:[transform:scaleY(var(--liquid-squash))_skewX(var(--liquid-skew))]",
            "group-data-[interacting]/liquid-switch:shadow-none",
            "group-data-[dragging]/liquid-switch:[transition:translate_.09s_cubic-bezier(.2,.72,.25,1),scale_.14s_cubic-bezier(.2,.72,.25,1),transform_.09s_cubic-bezier(.2,.72,.25,1),width_.14s_cubic-bezier(.2,.72,.25,1),margin-left_.11s_cubic-bezier(.2,.72,.25,1),background_.14s_ease-out,box-shadow_.14s_ease-out]",
            "motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!bg-white",
          )}
        />
        {displacement.filter}
      </SwitchPrimitive.Root>
    );
  },
);

LiquidSwitch.displayName = "LiquidSwitch";
