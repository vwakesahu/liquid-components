"use client";

import { forwardRef, useRef, useState } from "react";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, composeRefs, liquidSpring } from "../../lib/utils";
import { LiquidGlass, LiquidGlassGroup, liquidFillMaterial } from "./liquid-glass";

export type LiquidSearchFieldProps = Omit<React.ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called when the round × button dismisses the search. */
  onCancel?: () => void;
  lens?: LiquidGlassOptions;
};

/**
 * The iOS 26 search field. While focused, a round glass close button flows out
 * of the field through a liquid bridge; dismissing it clears and blurs.
 */
export const LiquidSearchField = forwardRef<HTMLInputElement, LiquidSearchFieldProps>(
  ({ className, value: valueProp, defaultValue = "", onValueChange, onCancel, lens, placeholder = "Search", onFocus, onBlur, onKeyDown, ...props }, forwardedRef) => {
    const input = useRef<HTMLInputElement>(null);
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const value = valueProp ?? uncontrolled;
    const [active, setActive] = useState(false);
    const set = (next: string) => {
      if (valueProp === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };
    const cancel = () => {
      set("");
      setActive(false);
      input.current?.blur();
      onCancel?.();
    };

    return (
      <LiquidGlassGroup
        role="search"
        merge={14}
        lens={{ frost: 10, refraction: 10, ...lens }}
        data-slot="liquid-search-field"
        data-active={active || undefined}
        className={cn(
          "liquid-search group/search flex h-11 w-full min-w-0 items-center text-[#18181b] dark:text-[#f4f4f6]",
          liquidFillMaterial,
          className,
        )}
        style={{ "--liquid-spring": liquidSpring } as React.CSSProperties}
      >
        <LiquidGlass className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-3.5" onClick={() => input.current?.focus()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[18px] shrink-0 opacity-55">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            ref={composeRefs(forwardedRef, input)}
            type="search"
            value={value}
            placeholder={placeholder}
            aria-label={props["aria-label"] ?? placeholder}
            className="w-0 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-current placeholder:opacity-45 [&::-webkit-search-cancel-button]:hidden"
            onChange={(event) => set(event.target.value)}
            onFocus={(event) => {
              setActive(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              if (!value) setActive(false);
              onBlur?.(event);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancel();
              onKeyDown?.(event);
            }}
            {...props}
          />
          {value && (
            <button
              type="button"
              aria-label="Clear"
              className="grid size-5 shrink-0 place-items-center rounded-full text-white dark:text-black [&>svg]:size-3"
              style={{ backgroundColor: "color-mix(in srgb, currentColor 32%, transparent)" }}
              onClick={() => {
                set("");
                input.current?.focus();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            </button>
          )}
        </LiquidGlass>
        {/* The close button grows out of the field and fuses with it on the way. */}
        <LiquidGlass
          className={cn(
            "grid h-11 shrink-0 place-items-center overflow-hidden rounded-full",
            "w-0 -ml-2 [transition:width_.6s_var(--liquid-spring),margin_.6s_var(--liquid-spring)] motion-reduce:transition-none",
            "group-data-[active]/search:ml-2 group-data-[active]/search:w-11",
          )}
        >
          <button
            type="button"
            aria-label="Cancel search"
            tabIndex={active ? 0 : -1}
            className="grid size-11 place-items-center rounded-full opacity-0 transition-opacity duration-200 group-data-[active]/search:opacity-100"
            onMouseDown={(event) => event.preventDefault()}
            onClick={cancel}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[18px]"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </LiquidGlass>
      </LiquidGlassGroup>
    );
  },
);

LiquidSearchField.displayName = "LiquidSearchField";
