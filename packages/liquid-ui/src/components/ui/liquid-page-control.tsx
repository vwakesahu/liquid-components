"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidGlass } from "./liquid-glass";

const DOT = 7;
const GAP = 9;

export type LiquidPageControlProps = Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> & {
  /** Number of pages. */
  count: number;
  /** The current page, from 0. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (page: number) => void;
  lens?: LiquidGlassOptions;
};

/**
 * The iOS 26 page control: dots in a glass capsule. The current page is a pill
 * that glides to its dot and stretches on the way. Tap a dot, tap either side
 * to step, or press and scrub across the capsule.
 */
export const LiquidPageControl = forwardRef<HTMLDivElement, LiquidPageControlProps>(
  (
    { className, count, value: valueProp, defaultValue = 0, onValueChange, lens, onKeyDown, "aria-label": label = "Page", ...props },
    forwardedRef,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const value = Math.min(count - 1, Math.max(0, valueProp ?? uncontrolled));
    const [scrubbing, setScrubbing] = useState(false);
    const track = useRef<HTMLSpanElement>(null);
    const pill = useRef<HTMLSpanElement>(null);
    const previous = useRef(value);
    const press = useRef<{ x: number; moved: boolean } | null>(null);

    const go = (page: number) => {
      const next = Math.min(count - 1, Math.max(0, page));
      if (next === value) return;
      if (valueProp === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };

    // The pill travels like an inchworm: its leading edge reaches the new dot
    // first, then the trailing edge catches up. The stretch is capped, so a long
    // jump reads as one quick reach rather than a smear across the capsule.
    useLayoutEffect(() => {
      const from = previous.current;
      previous.current = value;
      const element = pill.current;
      if (from === value || !element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const a = from * (DOT + GAP);
      const b = value * (DOT + GAP);
      const distance = Math.abs(b - a);
      const reach = Math.min(distance, 26);
      const middle = b > a ? b - reach : b;
      element.animate(
        [
          { translate: `${a}px -50%`, width: `${DOT}px`, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
          { translate: `${middle}px -50%`, width: `${DOT + reach}px`, offset: 0.45, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
          { translate: `${b}px -50%`, width: `${DOT}px` },
        ],
        { duration: 320 + Math.min(160, distance * 2) },
      );
    }, [value]);

    const pageAt = (clientX: number) => {
      const bounds = track.current?.getBoundingClientRect();
      if (!bounds?.width) return value;
      // Measured, not computed: the capsule grows while you scrub.
      return Math.floor(((clientX - bounds.left) / bounds.width) * count);
    };

    return (
      <div
        ref={forwardedRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={value + 1}
        aria-valuetext={`Page ${value + 1} of ${count}`}
        data-slot="liquid-page-control"
        data-scrubbing={scrubbing || undefined}
        className={cn(
          "liquid-page-control group/page-control relative inline-flex cursor-pointer touch-none select-none rounded-full text-[#1c1c1e] outline-none dark:text-white",
          "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_50%,transparent)] focus-visible:ring-offset-2",
          className,
        )}
        style={{ "--liquid-spring": liquidSpring } as React.CSSProperties}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          press.current = { x: event.clientX, moved: false };
          setScrubbing(true);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // The pointer may already be gone.
          }
        }}
        onPointerMove={(event) => {
          const current = press.current;
          if (!current) return;
          if (!current.moved && Math.abs(event.clientX - current.x) < 6) return;
          current.moved = true;
          go(pageAt(event.clientX));
        }}
        onPointerUp={(event) => {
          const current = press.current;
          press.current = null;
          setScrubbing(false);
          if (!current || current.moved) return;
          // A tap on a dot goes there; a tap beside the dots steps one page.
          const bounds = track.current?.getBoundingClientRect();
          if (bounds && event.clientX >= bounds.left - GAP / 2 && event.clientX <= bounds.right + GAP / 2) go(pageAt(event.clientX));
          else go(value + (bounds && event.clientX > bounds.right ? 1 : -1));
        }}
        onPointerCancel={() => {
          press.current = null;
          setScrubbing(false);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
          if (step) go(value + step);
          else if (event.key === "Home") go(0);
          else if (event.key === "End") go(count - 1);
          else return;
          event.preventDefault();
        }}
        {...props}
      >
        <LiquidGlass
          lens={{ frost: 8, refraction: 8, shadow: 0.04, ...lens }}
          className={cn(
            "flex h-[26px] items-center rounded-full px-[11px]",
            "[transition:scale_.45s_var(--liquid-spring)] group-data-[scrubbing]/page-control:[scale:1.18] motion-reduce:transition-none",
            // Set --page-control-tint to darken the capsule over photos.
            "[--liquid-glass-tint:var(--page-control-tint,rgba(255,255,255,.4))] dark:[--liquid-glass-tint:var(--page-control-tint,rgba(255,255,255,.08))]",
          )}
        >
          <span ref={track} className="relative flex items-center" style={{ gap: GAP }}>
            {Array.from({ length: count }, (_, page) => (
              <span key={page} aria-hidden="true" className="rounded-full bg-current opacity-30" style={{ width: DOT, height: DOT }} />
            ))}
            <span
              ref={pill}
              aria-hidden="true"
              data-slot="liquid-page-control-indicator"
              className="absolute left-0 top-1/2 rounded-full bg-current"
              style={{ width: DOT, height: DOT, translate: `${value * (DOT + GAP)}px -50%` }}
            />
          </span>
        </LiquidGlass>
      </div>
    );
  },
);
LiquidPageControl.displayName = "LiquidPageControl";
