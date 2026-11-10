"use client";

import { createContext, forwardRef, useContext, useState } from "react";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import type { LiquidLensOptions } from "../../hooks/use-liquid-displacement";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidGlass, LiquidGlassGroup, liquidChromeMaterial } from "./liquid-glass";
import { LiquidTabs, LiquidTabsList, LiquidTabsTrigger } from "./liquid-tabs";

type TabBarState = { minimized: boolean; value: string | undefined };
const TabBarContext = createContext<TabBarState>({ minimized: false, value: undefined });

export type LiquidTabBarProps = Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "dir"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Collapse to the current tab alone, as iOS does while you scroll down. */
  minimized?: boolean;
  /** A separate glass control beside the bar, such as `LiquidTabBarButton` for search. */
  accessory?: React.ReactNode;
  /** The bar's glass. */
  glass?: LiquidGlassOptions;
  /** The selection droplet's lens while it is pressed or dragged. */
  lens?: LiquidLensOptions;
};

/**
 * The iOS 26 tab bar: a floating glass capsule whose selection is a droplet you
 * can drag between tabs. It minimizes to the current tab, and an accessory such
 * as search floats beside it as its own glass. Radix Tabs owns the semantics and
 * arrow-key navigation.
 */
export const LiquidTabBar = forwardRef<HTMLDivElement, LiquidTabBarProps>(
  (
    { className, value: valueProp, defaultValue, onValueChange, minimized = false, accessory, glass, lens, children, style, "aria-label": label = "Tabs", ...props },
    forwardedRef,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const value = valueProp ?? uncontrolled;
    return (
      <TabBarContext.Provider value={{ minimized, value }}>
        <LiquidTabs
          value={value}
          onValueChange={(next) => {
            if (valueProp === undefined) setUncontrolled(next);
            onValueChange?.(next);
          }}
          className="w-auto"
        >
          <LiquidGlassGroup
            ref={forwardedRef}
            merge={10}
            // A little more frost than plain glass keeps labels legible over busy pages.
            lens={{ frost: 6, ...glass }}
            data-slot="liquid-tab-bar"
            data-minimized={minimized || undefined}
            className={cn(
              "liquid-tab-bar group/tab-bar inline-flex items-center gap-3 text-[#1c1c1e] dark:text-white",
              liquidChromeMaterial,
              "[--tab-bar-tint:var(--liquid-accent,#0a84ff)]",
              className,
            )}
            style={{ "--liquid-spring": liquidSpring, ...style } as React.CSSProperties}
            {...props}
          >
            <LiquidGlass className="rounded-full p-1">
              <LiquidTabsList
                aria-label={label}
                lens={lens}
                indicatorClassName="group-data-[minimized]/tab-bar:opacity-0!"
                className={cn(
                  "min-w-0 gap-0 border-0 bg-transparent p-0 shadow-none dark:border-0 dark:bg-transparent dark:shadow-none",
                  "[--tabs-indicator-height:54px] [--tabs-engaged-scale:1.16] [--tabs-tint:rgba(118,118,128,.16)] [--tabs-active-tint:rgba(255,255,255,.14)]",
                  "[--tabs-label:currentColor] [--tabs-label-active:var(--tab-bar-tint)]",
                  "dark:[--tabs-tint:rgba(255,255,255,.12)] dark:[--tabs-active-tint:rgba(255,255,255,.08)] dark:[--tabs-label:currentColor] dark:[--tabs-label-active:var(--tab-bar-tint)]",
                  "group-data-[minimized]/tab-bar:[--tabs-indicator-height:44px]",
                )}
              >
                {children}
              </LiquidTabsList>
            </LiquidGlass>
            {accessory}
          </LiquidGlassGroup>
        </LiquidTabs>
      </TabBarContext.Provider>
    );
  },
);
LiquidTabBar.displayName = "LiquidTabBar";

export type LiquidTabBarItemProps = Omit<React.ComponentPropsWithoutRef<typeof LiquidTabsTrigger>, "value"> & {
  value: string;
  icon: React.ReactNode;
  /** A count or short label in a red badge on the icon. */
  badge?: React.ReactNode;
};

export const LiquidTabBarItem = forwardRef<HTMLButtonElement, LiquidTabBarItemProps>(
  ({ className, value, icon, badge, children, ...props }, forwardedRef) => {
    const bar = useContext(TabBarContext);
    const tucked = bar.minimized && bar.value !== value;
    return (
      <LiquidTabsTrigger
        ref={forwardedRef}
        value={value}
        inert={tucked || undefined}
        data-slot="liquid-tab-bar-item"
        className={cn(
          "max-w-[120px] flex-col gap-[3px] px-[18px] text-[10px] font-semibold tracking-normal",
          "transition-[max-width,padding,height,opacity,color] duration-500 ease-[var(--liquid-spring)] [&_svg]:size-6",
          "group-data-[minimized]/tab-bar:px-2.5",
          tucked && "max-w-0 px-0 opacity-0 group-data-[minimized]/tab-bar:px-0",
          className,
        )}
        {...props}
      >
        <span className="relative grid place-items-center">
          {icon}
          {badge !== undefined && badge !== null && badge !== false && (
            <span className="absolute -right-2.5 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold leading-none text-white">
              {badge}
            </span>
          )}
        </span>
        <span className="max-h-4 overflow-hidden leading-4 [transition:max-height_.4s_var(--liquid-spring),opacity_.2s_ease] group-data-[minimized]/tab-bar:max-h-0 group-data-[minimized]/tab-bar:opacity-0">
          {children}
        </span>
      </LiquidTabsTrigger>
    );
  },
);
LiquidTabBarItem.displayName = "LiquidTabBarItem";

export type LiquidTabBarButtonProps = React.ComponentPropsWithoutRef<"button">;

/** A round glass button that floats beside the bar, like the iOS 26 search tab. */
export const LiquidTabBarButton = forwardRef<HTMLButtonElement, LiquidTabBarButtonProps>(
  ({ className, children, ...props }, forwardedRef) => (
    <LiquidGlass className="grid size-[62px] shrink-0 place-items-center rounded-full [transition:width_.5s_var(--liquid-spring),height_.5s_var(--liquid-spring)] group-data-[minimized]/tab-bar:size-[52px] motion-reduce:transition-none">
      <button
        ref={forwardedRef}
        type="button"
        data-slot="liquid-tab-bar-button"
        className={cn(
          "grid size-full cursor-pointer place-items-center rounded-full border-0 bg-transparent text-current outline-none [&_svg]:size-6",
          "transition-transform duration-200 active:scale-90 focus-visible:outline-[3px] focus-visible:outline-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_30%,transparent)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </LiquidGlass>
  ),
);
LiquidTabBarButton.displayName = "LiquidTabBarButton";
