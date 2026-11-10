"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";

import { cn } from "../../lib/utils";

const percent = (value: number, max: number) => Math.min(100, Math.max(0, (value / max) * 100));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type ProgressStyle = React.CSSProperties & { "--progress-tint"?: string };

export type LiquidProgressProps = Omit<React.ComponentPropsWithoutRef<"div">, "children"> & {
  /** From 0 to `max`. `null` shows an indeterminate bar. */
  value?: number | null;
  max?: number;
  size?: "small" | "regular" | "large";
  tint?: string;
};

/** The iOS progress bar: a thin capsule that fills with the tint. */
export const LiquidProgress = forwardRef<HTMLDivElement, LiquidProgressProps>(
  ({ className, value = null, max = 100, size = "regular", tint, style, ...props }, forwardedRef) => {
    const segment = useRef<HTMLSpanElement>(null);
    const indeterminate = value === null;
    useLayoutEffect(() => {
      if (!indeterminate || reduced()) return;
      const animation = segment.current?.animate([{ translate: "-100% 0" }, { translate: "290% 0" }], {
        duration: 1300,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        iterations: Infinity,
      });
      return () => animation?.cancel();
    }, [indeterminate]);
    const amount = indeterminate ? 0 : percent(value, max);
    return (
      <div
        ref={forwardedRef}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        data-slot="liquid-progress"
        data-state={indeterminate ? "indeterminate" : amount >= 100 ? "complete" : "loading"}
        data-size={size}
        className={cn(
          "liquid-progress relative h-1.5 w-full overflow-hidden rounded-full bg-[rgba(118,118,128,.2)] [--progress-tint:var(--liquid-accent,#0a84ff)] dark:bg-[rgba(118,118,128,.36)]",
          size === "small" && "h-1",
          size === "large" && "h-2.5",
          className,
        )}
        style={{ ...(tint ? { "--progress-tint": tint } : {}), ...style } as ProgressStyle}
        {...props}
      >
        <span
          ref={segment}
          data-slot="liquid-progress-fill"
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-[var(--progress-tint)] motion-reduce:transition-none",
            indeterminate ? "w-[35%]" : "[transition:width_.5s_cubic-bezier(0.33,1,0.68,1)]",
          )}
          style={indeterminate ? undefined : { width: `${amount}%` }}
        />
      </div>
    );
  },
);
LiquidProgress.displayName = "LiquidProgress";

export type LiquidProgressRingProps = Omit<React.ComponentPropsWithoutRef<"span">, "children"> & {
  /** From 0 to `max`. `null` spins while waiting to start. */
  value?: number | null;
  max?: number;
  /** Diameter in pixels. */
  size?: number;
  tint?: string;
  /** Drawn in the middle. Defaults to the stop square. */
  children?: React.ReactNode;
};

/** The App Store download ring: fills around a stop square, spins while waiting. */
export const LiquidProgressRing = forwardRef<HTMLSpanElement, LiquidProgressRingProps>(
  ({ className, value = null, max = 100, size = 28, tint, children, style, ...props }, forwardedRef) => {
    const ring = useRef<SVGSVGElement>(null);
    const indeterminate = value === null;
    useLayoutEffect(() => {
      if (!indeterminate || reduced()) return;
      const animation = ring.current?.animate([{ rotate: "0deg" }, { rotate: "360deg" }], { duration: 900, iterations: Infinity });
      return () => animation?.cancel();
    }, [indeterminate]);
    const amount = indeterminate ? 26 : percent(value, max);
    return (
      <span
        ref={forwardedRef}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        data-slot="liquid-progress-ring"
        data-state={indeterminate ? "indeterminate" : amount >= 100 ? "complete" : "loading"}
        className={cn("liquid-progress-ring relative inline-grid shrink-0 place-items-center text-[var(--progress-tint)] [--progress-tint:var(--liquid-accent,#0a84ff)]", className)}
        style={{ width: size, height: size, ...(tint ? { "--progress-tint": tint } : {}), ...style } as ProgressStyle}
        {...props}
      >
        <svg ref={ring} viewBox="0 0 28 28" fill="none" aria-hidden="true" className="absolute inset-0 size-full">
          <circle cx="14" cy="14" r="12.5" stroke="rgba(118,118,128,.28)" strokeWidth="2.4" />
          <circle
            cx="14"
            cy="14"
            r="12.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${amount} 100`}
            transform="rotate(-90 14 14)"
            className="[transition:stroke-dasharray_.5s_cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
          />
        </svg>
        {children ?? <span aria-hidden="true" className="rounded-[2px] bg-current" style={{ width: size * 0.3, height: size * 0.3 }} />}
      </span>
    );
  },
);
LiquidProgressRing.displayName = "LiquidProgressRing";

export type LiquidSpinnerProps = Omit<React.ComponentPropsWithoutRef<"span">, "children"> & {
  /** Diameter in pixels. */
  size?: number;
};

/** The iOS activity indicator: eight spokes whose brightness turns in steps. */
export const LiquidSpinner = forwardRef<HTMLSpanElement, LiquidSpinnerProps>(
  ({ className, size = 20, style, "aria-label": label = "Loading", ...props }, forwardedRef) => (
    <span
      ref={forwardedRef}
      role="status"
      aria-label={label}
      data-slot="liquid-spinner"
      className={cn("liquid-spinner inline-grid shrink-0 place-items-center text-[#8e8e93]", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-full animate-spin [animation-duration:.8s] [animation-timing-function:steps(8)] motion-reduce:animate-none"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={index}
            x1="12"
            y1="2.6"
            x2="12"
            y2="7.2"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            opacity={1 - index * 0.11}
            transform={`rotate(${-index * 45} 12 12)`}
          />
        ))}
      </svg>
    </span>
  ),
);
LiquidSpinner.displayName = "LiquidSpinner";
