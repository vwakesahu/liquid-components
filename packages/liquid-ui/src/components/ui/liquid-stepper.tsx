"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidGlass, liquidFillMaterial } from "./liquid-glass";

export type LiquidStepperProps = Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Show the current value between the buttons. */
  showValue?: boolean;
  /** Format the visible value, e.g. `(v) => `${v}%``. */
  format?: (value: number) => React.ReactNode;
  disabled?: boolean;
  lens?: LiquidGlassOptions;
};

const HOLD_DELAY = 400;
const HOLD_RATE = 90;

/**
 * The iOS − / + stepper in liquid glass. The pressed half lights up, the glass
 * swells on the spring, the number rolls like a clock wheel, and holding repeats.
 */
export const LiquidStepper = forwardRef<HTMLDivElement, LiquidStepperProps>(
  (
    {
      className,
      value: valueProp,
      defaultValue = 0,
      onValueChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      showValue = true,
      format,
      disabled,
      lens,
      style,
      "aria-label": ariaLabel = "Value",
      ...props
    },
    forwardedRef,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const value = valueProp ?? uncontrolled;
    const valueRef = useRef(value);
    valueRef.current = value;
    const repeat = useRef<{ delay: number; rate: number } | null>(null);
    const [pressed, setPressed] = useState<-1 | 0 | 1>(0);

    const commit = (next: number) => {
      const clamped = Math.min(max, Math.max(min, Number((Math.round(next / step) * step).toFixed(6))));
      if (clamped === valueRef.current) return false;
      valueRef.current = clamped;
      if (valueProp === undefined) setUncontrolled(clamped);
      onValueChange?.(clamped);
      return true;
    };

    const stop = () => {
      setPressed(0);
      if (!repeat.current) return;
      window.clearTimeout(repeat.current.delay);
      window.clearInterval(repeat.current.rate);
      repeat.current = null;
    };
    useEffect(() => () => {
      if (!repeat.current) return;
      window.clearTimeout(repeat.current.delay);
      window.clearInterval(repeat.current.rate);
    }, []);

    const start = (direction: 1 | -1) => {
      stop();
      setPressed(direction);
      if (!commit(valueRef.current + direction * step)) return;
      const delay = window.setTimeout(() => {
        const rate = window.setInterval(() => {
          if (!commit(valueRef.current + direction * step)) stop();
        }, HOLD_RATE);
        if (repeat.current) repeat.current.rate = rate;
      }, HOLD_DELAY);
      repeat.current = { delay, rate: 0 };
    };

    const half = (direction: 1 | -1) => ({
      type: "button" as const,
      disabled: disabled || (direction < 0 ? value <= min : value >= max),
      "data-pressed": pressed === direction || undefined,
      className: cn(
        "liquid-stepper__half grid h-full w-12 place-items-center rounded-full text-current outline-none",
        "transition-colors duration-150 data-[pressed]:bg-black/[.07] dark:data-[pressed]:bg-white/[.1]",
        "focus-visible:bg-black/[.05] dark:focus-visible:bg-white/[.08] disabled:opacity-30",
      ),
      onPointerDown: (event: React.PointerEvent) => {
        if (event.button === 0) start(direction);
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onKeyDown: (event: React.KeyboardEvent) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          commit(valueRef.current + direction * step);
        }
      },
    });

    return (
      <LiquidGlass
        ref={forwardedRef}
        role="group"
        aria-label={ariaLabel}
        data-slot="liquid-stepper"
        data-disabled={disabled || undefined}
        data-pressed={pressed !== 0 || undefined}
        // Flat like the iOS stepper: no cast shadow, just the glass and its rim.
        lens={{ frost: 6, shadow: 0, ...lens }}
        className={cn(
          "liquid-stepper inline-flex h-10 select-none items-center rounded-full p-0.5 text-[#18181b] dark:text-[#f4f4f6]",
          liquidFillMaterial,
          // The glass swells a little while pressed, by one uniform factor.
          "[transition:scale_.5s_var(--liquid-spring)] data-[pressed]:[scale:1.05] data-[disabled]:opacity-50 motion-reduce:transition-none",
          className,
        )}
        style={{ "--liquid-spring": liquidSpring, ...style } as React.CSSProperties}
        {...props}
      >
        <button aria-label="Decrease" {...half(-1)}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[18px]"><path d="M6 12h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
        {showValue ? (
          <RollingValue value={value} label={format ? format(value) : value} />
        ) : (
          <span aria-hidden="true" className="h-5 w-px bg-current opacity-15" />
        )}
        <button aria-label="Increase" {...half(1)}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[18px]"><path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </LiquidGlass>
    );
  },
);

LiquidStepper.displayName = "LiquidStepper";

/** An odometer: the old value rolls out as the new one rolls in, like a clock wheel. */
function RollingValue({ value, label }: { value: number; label: React.ReactNode }) {
  const [previous, setPrevious] = useState<{ label: React.ReactNode; direction: number; key: number } | null>(null);
  const last = useRef({ value, label, key: 0 });
  const current = useRef<HTMLOutputElement>(null);
  const leaving = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const direction = Math.sign(value - last.current.value);
    if (!direction) {
      last.current = { ...last.current, label };
      return;
    }
    const key = last.current.key + 1;
    setPrevious({ label: last.current.label, direction, key });
    last.current = { value, label, key };
  }, [label, value]);

  useLayoutEffect(() => {
    if (!previous) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return setPrevious(null);
    const distance = previous.direction * 100;
    current.current?.animate([{ transform: `translateY(${distance}%)` }, { transform: "none" }], {
      duration: 420,
      easing: liquidSpring,
    });
    const out = leaving.current?.animate(
      [{ transform: "none", opacity: 1 }, { transform: `translateY(${-distance}%)`, opacity: 0 }],
      { duration: 260, easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "forwards" },
    );
    if (out) out.onfinish = () => setPrevious((now) => (now?.key === previous.key ? null : now));
  }, [previous]);

  return (
    <span className="relative grid h-full min-w-11 place-items-center overflow-hidden px-1 text-[15px] font-semibold tabular-nums [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]">
      <output ref={current} aria-live="polite" className="col-start-1 row-start-1">
        {label}
      </output>
      {previous && (
        <span ref={leaving} aria-hidden="true" className="col-start-1 row-start-1">
          {previous.label}
        </span>
      )}
    </span>
  );
}
