"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  liquidLensPresets,
  useLiquidDisplacement,
  type LiquidLensOptions,
} from "../../hooks/use-liquid-displacement";
import { cn, composeRefs } from "../../lib/utils";

const liquidButtonVariants = cva(
  [
    "liquid-button group/liquid-button relative isolate inline-grid min-w-0 touch-manipulation select-none place-items-center overflow-visible whitespace-nowrap border-0 bg-transparent align-middle",
    "h-[var(--liquid-button-height)] rounded-[var(--liquid-button-radius)] px-[var(--liquid-button-padding)] text-sm font-medium leading-none tracking-[-.01em] text-[#18181b]",
    "cursor-pointer outline-none focus-visible:outline-[4px] focus-visible:outline-[rgba(0,122,255,.28)] focus-visible:outline-offset-[3px]",
    "disabled:pointer-events-none disabled:cursor-default",
    "[--liquid-button-height:40px] [--liquid-button-padding:16px] [--liquid-button-radius:12px] [--liquid-button-expand-x:4px] [--liquid-button-expand-y:4px]",
    "[--liquid-button-rest-surface:#f4f4f5] [--liquid-button-active-surface:rgba(244,244,245,.66)] [--liquid-button-refraction-tint:#d4d4d8] [--liquid-button-idle-border:#e4e4e7]",
    "dark:text-[#fafafa] dark:[--liquid-button-rest-surface:#27272a] dark:[--liquid-button-active-surface:rgba(63,63,70,.68)] dark:[--liquid-button-refraction-tint:#52525b] dark:[--liquid-button-idle-border:rgba(255,255,255,.2)]",
  ],
  {
    variants: {
      variant: {
        default: "",
        primary:
          "text-white [--liquid-button-rest-surface:var(--liquid-button-tint)] [--liquid-button-active-surface:color-mix(in_srgb,var(--liquid-button-tint),transparent_38%)] [--liquid-button-refraction-tint:var(--liquid-button-tint)] [--liquid-button-idle-border:rgba(255,255,255,.24)] dark:text-white dark:[--liquid-button-rest-surface:var(--liquid-button-tint)] dark:[--liquid-button-active-surface:color-mix(in_srgb,var(--liquid-button-tint),transparent_38%)] dark:[--liquid-button-refraction-tint:var(--liquid-button-tint)]",
        secondary:
          "text-[#18181b] [--liquid-button-rest-surface:#f4f4f5] [--liquid-button-active-surface:rgba(244,244,245,.66)] [--liquid-button-refraction-tint:#d4d4d8] [--liquid-button-idle-border:#e4e4e7]",
        destructive:
          "text-[var(--liquid-button-error-tint)] [--liquid-button-rest-surface:#f4f4f5] [--liquid-button-active-surface:rgba(244,244,245,.66)] [--liquid-button-refraction-tint:#d4d4d8] [--liquid-button-idle-border:#e4e4e7] dark:text-[var(--liquid-button-error-tint)] dark:[--liquid-button-rest-surface:#27272a] dark:[--liquid-button-active-surface:rgba(63,63,70,.68)] dark:[--liquid-button-refraction-tint:#52525b] dark:[--liquid-button-idle-border:#3f3f46]",
        outline:
          "text-[#18181b] [--liquid-button-rest-surface:#fff] [--liquid-button-active-surface:rgba(255,255,255,.56)] [--liquid-button-refraction-tint:#d4d4d8] [--liquid-button-idle-border:#e4e4e7] dark:text-[#fafafa] dark:[--liquid-button-rest-surface:#18181b] dark:[--liquid-button-active-surface:rgba(39,39,42,.68)] dark:[--liquid-button-refraction-tint:#52525b] dark:[--liquid-button-idle-border:#3f3f46]",
        ghost:
          "text-[#18181b] [--liquid-button-rest-surface:transparent] [--liquid-button-active-surface:rgba(24,24,27,.08)] [--liquid-button-refraction-tint:rgba(113,113,122,.5)] [--liquid-button-idle-border:transparent] hover:[--liquid-button-rest-surface:rgba(24,24,27,.06)] dark:text-[#fafafa] dark:[--liquid-button-active-surface:rgba(250,250,250,.08)] dark:[--liquid-button-refraction-tint:rgba(161,161,170,.5)] dark:hover:[--liquid-button-rest-surface:rgba(250,250,250,.07)]",
        link:
          "h-9 px-1 font-[450] text-[#52525b] [--liquid-button-expand-x:0px] [--liquid-button-expand-y:0px] dark:text-[#a1a1aa]",
        status:
          "w-[var(--liquid-button-status-width)] px-0 text-white [--liquid-button-radius:999px] [--liquid-button-status-width:142px] [--liquid-button-rest-surface:var(--liquid-button-tint)] [--liquid-button-active-surface:color-mix(in_srgb,var(--liquid-button-tint),transparent_38%)] [--liquid-button-refraction-tint:var(--liquid-button-tint)] [--liquid-button-idle-border:rgba(255,255,255,.24)] [transition:width_.56s_cubic-bezier(.18,1.28,.3,1),min-height_.42s_cubic-bezier(.18,1.28,.3,1),box-shadow_.42s_cubic-bezier(.18,1.28,.3,1),color_.42s_cubic-bezier(.18,1.28,.3,1)] dark:text-white",
      },
      size: {
        small:
          "text-[13px] [--liquid-button-height:36px] [--liquid-button-padding:12px] [--liquid-button-radius:10px] [--liquid-button-expand-x:3px] [--liquid-button-expand-y:3px]",
        regular: "",
        large:
          "text-[15px] [--liquid-button-height:44px] [--liquid-button-padding:20px] [--liquid-button-radius:14px] [--liquid-button-expand-x:5px] [--liquid-button-expand-y:5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "regular",
    },
  },
);

export type LiquidButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof liquidButtonVariants> & {
  status?: LiquidButtonStatus;
  tint?: string;
  errorTint?: string;
  successTint?: string;
  lens?: LiquidLensOptions;
  loadingLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  };

export type LiquidButtonStatus = "idle" | "loading" | "success" | "error";

type ButtonStyle = CSSProperties & {
  "--liquid-button-tint": string;
  "--liquid-button-error-tint": string;
  "--liquid-button-success-tint": string;
  "--liquid-button-radius"?: string;
  "--liquid-button-rest-surface"?: string;
  "--liquid-button-active-surface"?: string;
  "--liquid-button-refraction-tint"?: string;
  "--liquid-light-x": string;
  "--liquid-light-y": string;
};

const minimumPulse = 380;
const activationKeys = ["Enter", " "];

function LoadingGlyph() {
  return (
    <svg
      className="size-[18px] shrink-0 animate-spin text-current"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.2" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ErrorGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SuccessGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6.5 12.5 3.4 3.4 7.6-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      status = "idle",
      size = "regular",
      tint = "#0a84ff",
      errorTint = "#ef4444",
      successTint = "#30d158",
      lens,
      loadingLabel = "Loading…",
      errorLabel = "Try again",
      successLabel = "Done",
      disabled,
      type = "button",
      onBlur,
      onKeyDown,
      onKeyUp,
      onPointerCancel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const rootRef = useRef<HTMLButtonElement>(null);
    const startedAt = useRef(0);
    const releaseTimer = useRef<number | null>(null);
    const [interacting, setInteracting] = useState(false);
    const isStatusButton = variant === "status";
    const currentStatus = isStatusButton ? status : "idle";
    const isLoading = currentStatus === "loading";
    const isDisabled = disabled || isLoading;
    const displacement = useLiquidDisplacement<HTMLSpanElement>({
      ...liquidLensPresets.button,
      ...lens,
    });

    useEffect(() => {
      return () => {
        if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      };
    }, []);

    useEffect(() => {
      if (!isDisabled) return;
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
      setInteracting(false);
    }, [isDisabled]);

    const setLightFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100;
      const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 100;
      event.currentTarget.style.setProperty("--liquid-light-x", `${Math.min(100, Math.max(0, x))}%`);
      event.currentTarget.style.setProperty("--liquid-light-y", `${Math.min(100, Math.max(0, y))}%`);
    };

    const engage = (timeStamp: number) => {
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
      startedAt.current = timeStamp;
      setInteracting(true);
    };

    const release = (timeStamp: number) => {
      const remaining = Math.max(0, minimumPulse - (timeStamp - startedAt.current));
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = window.setTimeout(() => {
        setInteracting(false);
        releaseTimer.current = null;
      }, remaining);
    };

    const cancel = () => {
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
      setInteracting(false);
    };

    const liquidStyle: ButtonStyle = {
      "--liquid-button-tint": tint,
      "--liquid-button-error-tint": errorTint,
      "--liquid-button-success-tint": successTint,
      "--liquid-light-x": "50%",
      "--liquid-light-y": "36%",
      ...(isStatusButton ? { "--liquid-button-radius": "999px" } : {}),
      ...(isStatusButton && currentStatus === "success"
        ? {
            "--liquid-button-rest-surface": successTint,
            "--liquid-button-active-surface": `color-mix(in srgb, ${successTint}, transparent 38%)`,
            "--liquid-button-refraction-tint": successTint,
          }
        : {}),
      ...style,
    };

    return (
      <button
        ref={composeRefs(forwardedRef, rootRef)}
        type={type}
        data-slot="liquid-button"
        data-variant={variant}
        data-status={currentStatus}
        data-interacting={interacting || undefined}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          liquidButtonVariants({ variant, size }),
          isStatusButton && "rounded-full",
          disabled && !isLoading && "opacity-[.42]",
          isStatusButton && size === "small" && "[--liquid-button-status-width:122px]",
          isStatusButton && size === "large" && "[--liquid-button-status-width:166px]",
          isStatusButton && currentStatus === "loading" && "pointer-events-none cursor-wait [--liquid-button-status-width:48px]",
          isStatusButton && currentStatus === "error" && "text-[var(--liquid-button-error-tint)] [--liquid-button-status-width:154px] [--liquid-button-rest-surface:#f4f4f5] [--liquid-button-active-surface:rgba(244,244,245,.66)] [--liquid-button-refraction-tint:#d4d4d8] [--liquid-button-idle-border:#e4e4e7] dark:text-[var(--liquid-button-error-tint)] dark:[--liquid-button-rest-surface:#27272a] dark:[--liquid-button-active-surface:rgba(63,63,70,.68)] dark:[--liquid-button-refraction-tint:#52525b] dark:[--liquid-button-idle-border:#3f3f46]",
          isStatusButton && currentStatus === "success" && "text-white [--liquid-button-status-width:136px] [--liquid-button-rest-surface:var(--liquid-button-success-tint)] [--liquid-button-active-surface:color-mix(in_srgb,var(--liquid-button-success-tint),transparent_38%)] [--liquid-button-refraction-tint:var(--liquid-button-success-tint)]",
          isStatusButton && size === "small" && currentStatus === "loading" && "[--liquid-button-status-width:44px]",
          isStatusButton && size === "small" && currentStatus === "error" && "[--liquid-button-status-width:132px]",
          isStatusButton && size === "small" && currentStatus === "success" && "[--liquid-button-status-width:116px]",
          isStatusButton && size === "large" && currentStatus === "loading" && "[--liquid-button-status-width:52px]",
          isStatusButton && size === "large" && currentStatus === "error" && "[--liquid-button-status-width:178px]",
          isStatusButton && size === "large" && currentStatus === "success" && "[--liquid-button-status-width:158px]",
          className,
        )}
        style={liquidStyle}
        onPointerDown={(event) => {
          if (isDisabled || event.button !== 0) {
            onPointerDown?.(event);
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          setLightFromPointer(event);
          engage(event.timeStamp);
          onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          if (interacting) setLightFromPointer(event);
          onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          if (isDisabled) return;
          setLightFromPointer(event);
          release(event.timeStamp);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          cancel();
          onPointerCancel?.(event);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (activationKeys.includes(event.key) && !event.repeat) engage(event.timeStamp);
          onKeyDown?.(event);
        }}
        onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (activationKeys.includes(event.key)) release(event.timeStamp);
          onKeyUp?.(event);
        }}
        onBlur={(event) => {
          cancel();
          onBlur?.(event);
        }}
        {...props}
      >
        <span
          data-slot="liquid-button-body"
          className={cn(
            "liquid-button__body pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]",
            "shadow-[inset_0_0_0_1px_var(--liquid-button-idle-border),0_1px_2px_rgba(0,0,0,.1)] will-change-[inset,border-radius]",
            "[transition:inset_.42s_cubic-bezier(.18,1.28,.3,1),border-radius_.42s_cubic-bezier(.18,1.28,.3,1),box-shadow_.34s_ease]",
            "group-data-[interacting]/liquid-button:inset-[calc(var(--liquid-button-expand-y)*-1)_calc(var(--liquid-button-expand-x)*-1)] group-data-[interacting]/liquid-button:rounded-[calc(var(--liquid-button-radius)+5px)]",
            "group-data-[interacting]/liquid-button:shadow-[0_7px_16px_rgba(0,0,0,.22),inset_0_0_7px_rgba(255,255,255,.8),0_0_0_.5px_rgba(255,255,255,.7)]",
            "dark:shadow-[inset_0_0_0_1px_var(--liquid-button-idle-border),0_1px_3px_rgba(0,0,0,.34),0_.5px_0_rgba(255,255,255,.1)] dark:group-data-[interacting]/liquid-button:shadow-[0_9px_22px_rgba(0,0,0,.46),inset_0_0_9px_rgba(255,255,255,.2),0_0_0_.5px_rgba(255,255,255,.24)]",
            "motion-reduce:transition-none",
            (variant === "ghost" || variant === "link") && "shadow-none dark:shadow-none",
            variant === "link" && "hidden",
          )}
          aria-hidden="true"
        >
          <span
            data-slot="liquid-button-surface"
            className="liquid-button__surface pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[var(--liquid-button-rest-surface)] [transition:background_.42s_cubic-bezier(.18,1.28,.3,1),box-shadow_.42s_cubic-bezier(.18,1.28,.3,1)] group-data-[interacting]/liquid-button:bg-[var(--liquid-button-active-surface)] motion-reduce:transition-none"
          />
          <span
            ref={displacement.targetRef}
            data-slot="liquid-button-refraction"
            className="liquid-button__refraction pointer-events-none absolute inset-0 z-[1] scale-x-[1.04] scale-y-[1.02] rounded-[inherit] bg-[linear-gradient(105deg,color-mix(in_srgb,var(--liquid-button-refraction-tint),black_10%)_0%,var(--liquid-button-refraction-tint)_30%,color-mix(in_srgb,var(--liquid-button-refraction-tint),white_38%)_49%,var(--liquid-button-refraction-tint)_68%,color-mix(in_srgb,var(--liquid-button-refraction-tint),black_8%)_100%)] bg-[length:124%_100%] bg-center bg-no-repeat opacity-0 [transition:opacity_.38s_cubic-bezier(.18,1.28,.3,1),transform_.42s_cubic-bezier(.18,1.28,.3,1)] group-data-[interacting]/liquid-button:scale-x-[1.1] group-data-[interacting]/liquid-button:scale-y-[1.04] group-data-[interacting]/liquid-button:opacity-100 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:!opacity-0 [@media(prefers-reduced-transparency:reduce)]:!filter-none"
            style={displacement.filterStyle}
          />
          <span
            data-slot="liquid-button-lens"
            className="liquid-button__lens pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-[radial-gradient(ellipse_at_var(--liquid-light-x)_var(--liquid-light-y),rgba(255,255,255,.2),transparent_48%),rgba(255,255,255,.12)] opacity-0 shadow-[inset_2px_0_2px_rgba(85,205,255,.12),inset_-2px_0_2px_rgba(255,100,135,.1)] [backdrop-filter:blur(1px)_saturate(2.1)_brightness(1.16)] transition-opacity duration-200 group-data-[interacting]/liquid-button:opacity-100 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(245,245,247,.92)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none] dark:[@media(prefers-reduced-transparency:reduce)]:bg-[rgba(72,72,78,.94)]"
          />
          <span
            data-slot="liquid-button-rim"
            className="liquid-button__rim pointer-events-none absolute inset-[.5px] z-[3] rounded-[inherit] border-[.5px] border-white/80 opacity-0 shadow-[inset_1px_1px_2px_rgba(255,255,255,.95),inset_-1px_-1px_2px_rgba(0,0,0,.12)] transition-opacity duration-200 group-data-[interacting]/liquid-button:opacity-100 motion-reduce:transition-none"
          />
          <span
            data-slot="liquid-button-light"
            className="liquid-button__light pointer-events-none absolute -inset-1/4 z-[4] rounded-[inherit] bg-[radial-gradient(circle_at_var(--liquid-light-x)_var(--liquid-light-y),white,rgba(255,255,255,.42)_20%,transparent_52%)] opacity-0 transition-opacity duration-200 group-data-[interacting]/liquid-button:opacity-100 motion-reduce:transition-none"
          />
        </span>
        {isStatusButton ? (
          <>
            <span
              data-slot="liquid-button-content"
              className="liquid-button__content liquid-button__status-content pointer-events-none absolute inset-0 z-[5] place-self-center text-center"
              aria-hidden="true"
            >
              <span className="liquid-button__status-item absolute inset-0 inline-flex scale-[.72] items-center justify-center gap-2 opacity-0 blur-[7px] [transition:opacity_.42s_cubic-bezier(.18,1.28,.3,1),filter_.42s_cubic-bezier(.18,1.28,.3,1),transform_.5s_cubic-bezier(.18,1.28,.3,1)] group-data-[status=idle]/liquid-button:scale-100 group-data-[status=idle]/liquid-button:opacity-100 group-data-[status=idle]/liquid-button:blur-none group-data-[status=idle]/liquid-button:delay-100 motion-reduce:transition-none [&>svg]:size-[1.15em]" data-button-status="idle">
                {children}
              </span>
              <span className="liquid-button__status-item absolute inset-0 inline-flex scale-[.72] items-center justify-center text-white opacity-0 blur-[7px] [transition:opacity_.42s_cubic-bezier(.18,1.28,.3,1),filter_.42s_cubic-bezier(.18,1.28,.3,1),transform_.5s_cubic-bezier(.18,1.28,.3,1)] group-data-[status=loading]/liquid-button:scale-100 group-data-[status=loading]/liquid-button:opacity-100 group-data-[status=loading]/liquid-button:blur-none group-data-[status=loading]/liquid-button:delay-100 motion-reduce:transition-none" data-button-status="loading">
                <LoadingGlyph />
              </span>
              <span className="liquid-button__status-item absolute inset-0 inline-flex scale-[.72] items-center justify-center gap-2 opacity-0 blur-[7px] [transition:opacity_.42s_cubic-bezier(.18,1.28,.3,1),filter_.42s_cubic-bezier(.18,1.28,.3,1),transform_.5s_cubic-bezier(.18,1.28,.3,1)] group-data-[status=error]/liquid-button:scale-100 group-data-[status=error]/liquid-button:opacity-100 group-data-[status=error]/liquid-button:blur-none group-data-[status=error]/liquid-button:delay-100 motion-reduce:transition-none [&>svg]:size-[1.15em]" data-button-status="error">
                <ErrorGlyph />
                {errorLabel}
              </span>
              <span className="liquid-button__status-item absolute inset-0 inline-flex scale-[.72] items-center justify-center gap-2 opacity-0 blur-[7px] [transition:opacity_.42s_cubic-bezier(.18,1.28,.3,1),filter_.42s_cubic-bezier(.18,1.28,.3,1),transform_.5s_cubic-bezier(.18,1.28,.3,1)] group-data-[status=success]/liquid-button:scale-100 group-data-[status=success]/liquid-button:opacity-100 group-data-[status=success]/liquid-button:blur-none group-data-[status=success]/liquid-button:delay-100 motion-reduce:transition-none [&>svg]:size-[1.15em]" data-button-status="success">
                <SuccessGlyph />
                {successLabel}
              </span>
            </span>
            <span className="liquid-button__status-announcement sr-only" aria-live="polite">
              {currentStatus === "loading"
                ? loadingLabel
                : currentStatus === "error"
                  ? errorLabel
                  : currentStatus === "success"
                    ? successLabel
                    : children}
            </span>
          </>
        ) : (
          <span
            data-slot="liquid-button-content"
            className={cn(
              "liquid-button__content pointer-events-none relative z-[5] inline-flex min-w-max -translate-y-[.025em] place-self-center items-center justify-center gap-[9px] text-center [&>svg]:size-[1.15em]",
              variant === "link" &&
                "after:absolute after:-bottom-1 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-current after:opacity-0 after:transition-[width,opacity] after:duration-200 group-data-[interacting]/liquid-button:after:w-[45%] group-data-[interacting]/liquid-button:after:opacity-80 motion-reduce:after:transition-none",
            )}
          >
            {children}
          </span>
        )}
        {displacement.filter}
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";
