"use client";

import { forwardRef } from "react";

import { cn, liquidSpring } from "../../lib/utils";

export type LiquidIslandProps = Omit<React.ComponentPropsWithoutRef<"div">, "children"> & {
  /** Expanded shows `children`; collapsed shows `leading` and `trailing`. */
  expanded?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  /** Size of the expanded island, in pixels. */
  expandedSize?: { width: number; height: number };
  /** Size of the compact island. Narrow it to 126 for the idle pill with nothing inside. */
  compactSize?: { width: number; height: number };
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * A Dynamic Island: a black pill that morphs between a compact Live Activity
 * and an expanded one. Size and radius animate together on the iOS spring, so
 * the shape stays a capsule as it grows; content cross-fades inside it.
 */
export const LiquidIsland = forwardRef<HTMLDivElement, LiquidIslandProps>(
  (
    { className, expanded = false, leading, trailing, children, expandedSize = { width: 360, height: 84 }, compactSize = { width: 168, height: 37 }, onExpandedChange, style, ...props },
    forwardedRef,
  ) => (
    <div
      ref={forwardedRef}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      data-slot="liquid-island"
      data-expanded={expanded || undefined}
      className={cn(
        "liquid-island group/island relative mx-auto max-w-full cursor-pointer overflow-hidden bg-black text-white outline-none",
        "[transition:width_.62s_var(--liquid-spring),height_.62s_var(--liquid-spring),border-radius_.62s_var(--liquid-spring)] motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_50%,transparent)] focus-visible:ring-offset-2",
        className,
      )}
      style={{
        "--liquid-spring": liquidSpring,
        width: expanded ? expandedSize.width : compactSize.width,
        height: expanded ? expandedSize.height : compactSize.height,
        borderRadius: expanded ? Math.min(42, expandedSize.height / 2) : compactSize.height / 2,
        ...style,
      } as React.CSSProperties}
      onClick={() => onExpandedChange?.(!expanded)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onExpandedChange?.(!expanded);
        } else if (event.key === "Escape" && expanded) {
          onExpandedChange?.(false);
        }
      }}
      {...props}
    >
      <div
        className="absolute inset-0 flex items-center justify-between px-3 transition-opacity duration-200 group-data-[expanded]/island:pointer-events-none group-data-[expanded]/island:opacity-0"
        aria-hidden={expanded}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-semibold">{leading}</span>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold tabular-nums">{trailing}</span>
      </div>
      <div
        className="absolute inset-0 flex items-center px-5 opacity-0 transition-opacity duration-300 group-data-[expanded]/island:opacity-100 group-data-[expanded]/island:delay-150"
        aria-hidden={!expanded}
      >
        {children}
      </div>
    </div>
  ),
);

LiquidIsland.displayName = "LiquidIsland";
