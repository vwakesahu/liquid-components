"use client";

import { createContext, forwardRef, useContext } from "react";

import {
  liquidGlassMaterial as glassMaterial,
  useLiquidGlass,
  type LiquidGlassOptions,
} from "../../hooks/use-liquid-glass";
import { cn, composeRefs } from "../../lib/utils";

const LiquidGlassGroupContext = createContext(false);

/**
 * The three glass materials every component draws from, so a menu, a popover,
 * and a drawer read as the same glass. Panel: anything that floats over the
 * page. Chrome: bars that sit over content. Fill: controls inside content.
 */
// Each reads a theme variable first, so a site can retune all its glass in one place:
// set --liquid-panel-tint, --liquid-chrome-tint or --liquid-fill-tint in :root and .dark.
export const liquidPanelMaterial =
  "[--liquid-glass-tint:var(--liquid-panel-tint,rgba(255,255,255,.66))] dark:[--liquid-glass-tint:var(--liquid-panel-tint,rgba(30,29,36,.68))]";
export const liquidChromeMaterial =
  "[--liquid-glass-tint:var(--liquid-chrome-tint,rgba(255,255,255,.5))] dark:[--liquid-glass-tint:var(--liquid-chrome-tint,rgba(40,39,48,.52))]";
export const liquidFillMaterial =
  "[--liquid-glass-tint:var(--liquid-fill-tint,rgba(118,118,128,.14))] dark:[--liquid-glass-tint:var(--liquid-fill-tint,rgba(118,118,128,.26))]";

/**
 * Starts a fresh glass scope. React context crosses portals, so a menu, popover,
 * or tooltip opened from inside a group would otherwise think it was one of the
 * group's shapes and never draw. Every portalled glass panel sits inside one.
 */
export const LiquidGlassScope = ({ children }: { children: React.ReactNode }) => (
  <LiquidGlassGroupContext.Provider value={false}>{children}</LiquidGlassGroupContext.Provider>
);

export type LiquidGlassProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Optical parameters. Inside a `LiquidGlassGroup`, the group's options apply. */
  lens?: LiquidGlassOptions;
};

const StandaloneGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ className, lens, children, ...props }, forwardedRef) => {
    const glass = useLiquidGlass<HTMLDivElement>(lens);
    return (
      <div
        ref={composeRefs(forwardedRef, glass.ref)}
        data-slot="liquid-glass"
        data-liquid-glass-group=""
        data-liquid-glass-shape=""
        className={cn("liquid-glass relative isolate rounded-[24px]", glassMaterial, className)}
        {...props}
      >
        {glass.layers}
        {children}
      </div>
    );
  },
);

StandaloneGlass.displayName = "StandaloneGlass";

/**
 * A surface made of liquid glass. It refracts and frosts whatever is behind it,
 * with a lit rim and soft shadow. Inside a `LiquidGlassGroup` it becomes one
 * shape of the group's fused glass instead of rendering its own.
 */
export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ className, lens, ...props }, forwardedRef) => {
    const grouped = useContext(LiquidGlassGroupContext);
    if (!grouped) return <StandaloneGlass ref={forwardedRef} className={className} lens={lens} {...props} />;
    return (
      <div
        ref={forwardedRef}
        data-slot="liquid-glass"
        data-liquid-glass-shape=""
        className={cn("liquid-glass relative rounded-[24px]", className)}
        {...props}
      />
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

export type LiquidGlassGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Optical parameters for every glass shape in the group. */
  lens?: LiquidGlassOptions;
  /** Distance, in pixels, at which neighboring glass shapes start to fuse. */
  merge?: number;
};

/**
 * Fuses every `LiquidGlass` inside it into one continuous material. Shapes that
 * come closer than `merge` pixels flow together with a liquid bridge, and pull
 * apart as they separate, while they move, resize, or animate.
 */
export const LiquidGlassGroup = forwardRef<HTMLDivElement, LiquidGlassGroupProps>(
  ({ className, lens, merge, children, ...props }, forwardedRef) => {
    const glass = useLiquidGlass<HTMLDivElement>({ ...lens, merge: merge ?? lens?.merge });
    return (
      <LiquidGlassGroupContext.Provider value>
        <div
          ref={composeRefs(forwardedRef, glass.ref)}
          data-slot="liquid-glass-group"
          data-liquid-glass-group=""
          className={cn("liquid-glass-group relative isolate", glassMaterial, className)}
          {...props}
        >
          {glass.layers}
          {children}
        </div>
      </LiquidGlassGroupContext.Provider>
    );
  },
);

LiquidGlassGroup.displayName = "LiquidGlassGroup";
