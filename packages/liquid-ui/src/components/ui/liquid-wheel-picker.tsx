"use client";

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  liquidLensPresets,
  liquidLightTokens,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { cn, composeRefs } from "../../lib/utils";

const ROW = 34;
const HEIGHT = 204;
// Degrees between neighbouring rows on the drum, and the drum's radius so that
// rows next to the band sit one ROW apart, as on an iPhone.
const STEP = 18;
const RADIUS = ROW / ((STEP * Math.PI) / 180);
// The harness's default spring (k 170, d 26): settles without bouncing past a row.
const STIFFNESS = 170;
const DAMPING = 26;

export type LiquidWheelOption = { value: string; label: React.ReactNode };

export type LiquidWheelPickerProps = React.ComponentPropsWithoutRef<"div"> & {
  lens?: LiquidLensOptions;
};

/**
 * The iOS wheel picker (the Clock app's alarm time): columns of rows on a drum
 * with one selection band across them. While a wheel turns, the band becomes a
 * liquid glass lens that magnifies the row passing through it.
 */
export const LiquidWheelPicker = forwardRef<HTMLDivElement, LiquidWheelPickerProps>(
  ({ className, children, lens, style, ...props }, forwardedRef) => {
    const displacement = useLiquidDisplacement<HTMLDivElement>({
      lens: { ...liquidLensPresets.tabs, scale: -0.1, curvature: 55, chroma: 0, ...lens },
      lensSelector: '[data-slot="liquid-wheel-band"]',
    });
    return (
      <div
        ref={composeRefs(forwardedRef, displacement.ref)}
        role="group"
        data-slot="liquid-wheel-picker"
        className={cn(
          liquidLightTokens,
          "liquid-wheel-picker relative isolate flex select-none items-stretch justify-center gap-1 px-2 text-[21px] tabular-nums text-[#18181b] dark:text-[#f4f4f6]",
          className,
        )}
        style={{ height: HEIGHT, ...style }}
        {...props}
      >
        <span
          data-slot="liquid-wheel-band"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-1/2 -z-10 -translate-y-1/2 rounded-[10px] bg-[rgba(120,120,128,.12)] dark:bg-[rgba(120,120,128,.24)]"
          style={{ height: ROW }}
        />
        {children}
        {displacement.filter}
      </div>
    );
  },
);

LiquidWheelPicker.displayName = "LiquidWheelPicker";

export type LiquidWheelProps = Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue"> & {
  options: Array<string | number | LiquidWheelOption>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** A fixed label beside the selected row, like "hours" or "min" on the iOS timer. */
  unit?: React.ReactNode;
  "aria-label": string;
};

const toOption = (option: string | number | LiquidWheelOption): LiquidWheelOption =>
  typeof option === "object" ? option : { value: String(option), label: option };

/**
 * One column of a wheel picker. It is a physical wheel: drag with momentum,
 * rubber-band at the ends, spring onto the nearest row. A mouse wheel notch or
 * an arrow key moves exactly one row; a trackpad moves it continuously.
 */
export const LiquidWheel = forwardRef<HTMLDivElement, LiquidWheelProps>(
  ({ className, options: rawOptions, value: valueProp, defaultValue, onValueChange, unit, ...props }, forwardedRef) => {
    const options = rawOptions.map(toOption);
    const count = options.length;
    const root = useRef<HTMLDivElement>(null);
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? options[0]?.value);
    const value = valueProp ?? uncontrolled;
    const index = Math.max(0, options.findIndex((option) => option.value === value));

    const motion = useRef({ position: index, velocity: 0, target: index, dragging: false });
    const frame = useRef(0);
    const lastTime = useRef(0);
    const drag = useRef<{ y: number; position: number; samples: Array<[number, number]> } | null>(null);
    const wheelIdle = useRef(0);
    const commitRef = useRef<(next: number) => void>(() => {});

    commitRef.current = (next: number) => {
      const option = options[next];
      if (!option || option.value === value) return;
      if (valueProp === undefined) setUncontrolled(option.value);
      onValueChange?.(option.value);
    };

    // Place every row on the drum for the current position.
    const paint = useCallback(() => {
      const element = root.current;
      if (!element) return;
      const { position } = motion.current;
      element.querySelectorAll<HTMLElement>("[data-wheel-row]").forEach((row, rowIndex) => {
        const angle = (rowIndex - position) * STEP;
        if (Math.abs(angle) > 84) {
          row.style.visibility = "hidden";
          return;
        }
        const radians = (angle * Math.PI) / 180;
        row.style.visibility = "visible";
        row.style.transform = `translateY(${(RADIUS * Math.sin(radians)).toFixed(2)}px) rotateX(${(-angle).toFixed(2)}deg)`;
        row.style.opacity = Math.max(0, Math.cos(radians) * 1.15 - 0.15).toFixed(3);
      });
      element.closest<HTMLElement>('[data-slot="liquid-wheel-picker"]')?.toggleAttribute(
        "data-interacting",
        motion.current.dragging || Math.abs(motion.current.position - motion.current.target) > 0.02,
      );
    }, []);

    const run = useCallback(() => {
      if (frame.current) return;
      lastTime.current = 0;
      const tick = (time: number) => {
        const state = motion.current;
        const dt = Math.min(0.032, lastTime.current ? (time - lastTime.current) / 1000 : 1 / 60);
        lastTime.current = time;
        if (!state.dragging) {
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reduced) {
            state.position = state.target;
            state.velocity = 0;
          } else {
            const force = -STIFFNESS * (state.position - state.target) - DAMPING * state.velocity;
            state.velocity += force * dt;
            state.position += state.velocity * dt;
          }
        }
        paint();
        const settled = !state.dragging && Math.abs(state.position - state.target) < 0.002 && Math.abs(state.velocity) < 0.01;
        if (settled) {
          state.position = state.target;
          state.velocity = 0;
          paint();
          frame.current = 0;
          commitRef.current(state.target);
          return;
        }
        frame.current = window.requestAnimationFrame(tick);
      };
      frame.current = window.requestAnimationFrame(tick);
    }, [paint]);

    const aim = useCallback(
      (next: number) => {
        motion.current.target = Math.max(0, Math.min(count - 1, Math.round(next)));
        run();
      },
      [count, run],
    );

    // Follow outside value changes (controlled use) and paint the first frame.
    useLayoutEffect(() => {
      if (!motion.current.dragging && motion.current.target !== index) aim(index);
      paint();
    }, [aim, index, paint]);

    useEffect(() => () => window.cancelAnimationFrame(frame.current), []);

    // Rubber band: past the first or last row the wheel resists and springs back.
    const band = (position: number) => {
      if (position < 0) return position * 0.35;
      if (position > count - 1) return count - 1 + (position - (count - 1)) * 0.35;
      return position;
    };

    // Wheel events need a non-passive listener so the page doesn't scroll too.
    useEffect(() => {
      const element = root.current;
      if (!element) return;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const state = motion.current;
        const notch = event.deltaMode !== 0 || (Math.abs(event.deltaY) >= 50 && Number.isInteger(event.deltaY));
        if (notch) {
          aim(state.target + Math.sign(event.deltaY));
          return;
        }
        state.dragging = true;
        state.position = band(state.position + event.deltaY / ROW);
        state.velocity = 0;
        run();
        window.clearTimeout(wheelIdle.current);
        wheelIdle.current = window.setTimeout(() => {
          state.dragging = false;
          aim(state.position);
        }, 90);
      };
      element.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        element.removeEventListener("wheel", onWheel);
        window.clearTimeout(wheelIdle.current);
      };
    });

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const state = motion.current;
      state.dragging = true;
      state.velocity = 0;
      drag.current = { y: event.clientY, position: state.position, samples: [[event.timeStamp, state.position]] };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Without capture the drag still works while the pointer stays over the wheel.
      }
      run();
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const current = drag.current;
      if (!current) return;
      const state = motion.current;
      state.position = band(current.position - (event.clientY - current.y) / ROW);
      current.samples.push([event.timeStamp, state.position]);
      if (current.samples.length > 6) current.samples.shift();
    };
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
      const current = drag.current;
      drag.current = null;
      if (!current) return;
      const state = motion.current;
      state.dragging = false;
      const moved = Math.abs(event.clientY - current.y);
      if (moved < 4) {
        // A tap on a row selects it.
        const bounds = event.currentTarget.getBoundingClientRect();
        const offset = Math.asin(Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / RADIUS)));
        aim(state.position + ((offset * 180) / Math.PI) / STEP);
        return;
      }
      // Momentum: project the flick forward, then spring onto that row.
      const [first, last] = [current.samples[0]!, current.samples[current.samples.length - 1]!];
      const velocity = (last[1] - first[1]) / Math.max(0.016, (last[0] - first[0]) / 1000);
      state.velocity = velocity;
      aim(state.position + velocity * 0.22);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
      const target = motion.current.target;
      if (event.key in steps) aim(target + steps[event.key]!);
      else if (event.key === "Home") aim(0);
      else if (event.key === "End") aim(count - 1);
      else return;
      event.preventDefault();
    };

    return (
      <div
        ref={composeRefs(forwardedRef, root)}
        role="spinbutton"
        tabIndex={0}
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuetext={String(options[index]?.value ?? "")}
        data-slot="liquid-wheel"
        className={cn(
          "liquid-wheel relative h-full min-w-16 flex-1 cursor-grab touch-none overflow-hidden rounded-[10px] text-center outline-none",
          "[perspective:640px] active:cursor-grabbing focus-visible:bg-black/[.03] dark:focus-visible:bg-white/[.04]",
          className,
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        {...props}
      >
        {options.map((option) => (
          <div
            key={option.value}
            data-wheel-row
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-1/2 grid items-center [backface-visibility:hidden] will-change-transform",
              unit ? "justify-items-end pr-[calc(50%+4px)]" : "place-items-center",
            )}
            style={{ height: ROW, marginTop: -ROW / 2, visibility: "hidden" }}
          >
            {option.label}
          </div>
        ))}
        {unit && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-y-1/2 pl-1 text-[15px] font-semibold"
          >
            {unit}
          </span>
        )}
      </div>
    );
  },
);

LiquidWheel.displayName = "LiquidWheel";
