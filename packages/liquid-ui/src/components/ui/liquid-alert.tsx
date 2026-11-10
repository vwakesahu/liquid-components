"use client";

import { Children, forwardRef, useLayoutEffect, useRef } from "react";
import * as AlertPrimitive from "@radix-ui/react-alert-dialog";

import type { LiquidGlassOptions } from "../../hooks/use-liquid-glass";
import { cn, liquidSpring } from "../../lib/utils";
import { LiquidButton, type LiquidButtonProps } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

/** The iOS alert: a centred glass card that asks one question. Radix owns focus. */
export const LiquidAlert = AlertPrimitive.Root;

export const LiquidAlertTrigger = forwardRef<HTMLButtonElement, LiquidButtonProps>((props, forwardedRef) => (
  <AlertPrimitive.Trigger asChild>
    <LiquidButton ref={forwardedRef} data-slot="liquid-alert-trigger" {...props} />
  </AlertPrimitive.Trigger>
));
LiquidAlertTrigger.displayName = "LiquidAlertTrigger";

type LiquidAlertContentProps = Omit<React.ComponentPropsWithoutRef<typeof AlertPrimitive.Content>, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Content between the text and the actions, such as a `LiquidAlertInput`. */
  body?: React.ReactNode;
  /** Stack the actions vertically. Defaults to stacking three or more. */
  stacked?: boolean;
  lens?: LiquidGlassOptions;
};

/** Pops in on the shared spring; only transform animates so the glass keeps its backdrop. */
function AlertBody({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const content = ref.current?.closest<HTMLElement>('[data-slot="liquid-alert-content"]');
    if (!content || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    content.animate([{ scale: "1.14" }, { scale: "1" }], {
      duration: 560,
      easing: liquidSpring,
    });
    ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
  }, []);
  return <div ref={ref}>{children}</div>;
}

export const LiquidAlertContent = forwardRef<HTMLDivElement, LiquidAlertContentProps>(
  ({ className, title, description, body, stacked, children, lens, ...props }, forwardedRef) => (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40" />
      <AlertPrimitive.Content
        ref={forwardedRef}
        data-slot="liquid-alert-content"
        className="fixed left-1/2 top-1/2 z-50 w-[min(300px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 outline-none"
        {...props}
      >
        <LiquidGlassScope>
          <LiquidGlass
            lens={{ frost: 18, refraction: 12, ...lens }}
            className={cn(
              "overflow-hidden rounded-[26px] text-center text-[#18181b] dark:text-[#f4f4f6]",
              liquidPanelMaterial,
              className,
            )}
          >
            <AlertBody>
              <div className="px-5 pb-4 pt-5">
                <AlertPrimitive.Title className="text-[17px] font-semibold">{title}</AlertPrimitive.Title>
                {description && (
                  <AlertPrimitive.Description className="mt-1 text-[13px] leading-snug opacity-70">{description}</AlertPrimitive.Description>
                )}
                {body && <div className="mt-3.5 text-left">{body}</div>}
              </div>
              <div
                data-slot="liquid-alert-actions"
                data-stacked={(stacked ?? Children.count(children) > 2) || undefined}
                className="grid grid-flow-col auto-cols-fr gap-2 px-3 pb-3 data-[stacked]:grid-flow-row"
              >
                {children}
              </div>
            </AlertBody>
          </LiquidGlass>
        </LiquidGlassScope>
      </AlertPrimitive.Content>
    </AlertPrimitive.Portal>
  ),
);
LiquidAlertContent.displayName = "LiquidAlertContent";

/** A text field sized for an alert, e.g. to name a new folder. */
export const LiquidAlertInput = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(({ className, ...props }, forwardedRef) => (
  <input
    ref={forwardedRef}
    data-slot="liquid-alert-input"
    className={cn(
      "h-10 w-full rounded-[12px] border-0 bg-[rgba(118,118,128,.12)] px-3 text-[15px] text-current outline-none",
      "placeholder:text-current placeholder:opacity-40 focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--liquid-accent,#0a84ff)_50%,transparent)] dark:bg-[rgba(118,118,128,.24)]",
      className,
    )}
    {...props}
  />
));
LiquidAlertInput.displayName = "LiquidAlertInput";

type AlertButtonProps = LiquidButtonProps & { destructive?: boolean };

const alertButton = "h-11 w-full rounded-full text-[15px] font-semibold [--liquid-button-radius:999px]";

export const LiquidAlertAction = forwardRef<HTMLButtonElement, AlertButtonProps>(({ className, destructive, ...props }, forwardedRef) => (
  <AlertPrimitive.Action asChild>
    <LiquidButton
      ref={forwardedRef}
      variant={destructive ? "destructive" : "primary"}
      className={cn(alertButton, destructive && "text-[#e5484d] dark:text-[#ff6369]", className)}
      {...props}
    />
  </AlertPrimitive.Action>
));
LiquidAlertAction.displayName = "LiquidAlertAction";

export const LiquidAlertCancel = forwardRef<HTMLButtonElement, LiquidButtonProps>(({ className, ...props }, forwardedRef) => (
  <AlertPrimitive.Cancel asChild>
    <LiquidButton ref={forwardedRef} variant="secondary" className={cn(alertButton, className)} {...props} />
  </AlertPrimitive.Cancel>
));
LiquidAlertCancel.displayName = "LiquidAlertCancel";
