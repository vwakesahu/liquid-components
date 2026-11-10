"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn, liquidSpring } from "../../lib/utils";
import { LiquidButton } from "./liquid-button";
import { LiquidGlass, LiquidGlassScope, liquidPanelMaterial } from "./liquid-glass";

export type LiquidToastOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: { label: React.ReactNode; onClick: () => void };
  /** Milliseconds before it leaves on its own. Default 4000; `Infinity` keeps it. */
  duration?: number;
};

type ToastRecord = LiquidToastOptions & { id: number; leaving: boolean };

const GAP = 10;
const PEEK = 12;
const VISIBLE = 3;
const DEFAULT_DURATION = 4000;

// A tiny external store, so `toast()` works from anywhere without a provider.
let records: ToastRecord[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => records;
const empty: ToastRecord[] = [];

const badge = (color: string, mark: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill={color} />
    {mark}
  </svg>
);
const icons = {
  success: badge("#30a46c", <path d="m7.5 12.3 3 3 6-6.3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />),
  error: badge("#e5484d", <path d="m8.5 8.5 7 7m0-7-7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />),
  info: badge("#3e63dd", <path d="M12 11v5.5M12 7.6v.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />),
  loading: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.4" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
};

type ToastInput = LiquidToastOptions | string;
const normalize = (input: ToastInput): LiquidToastOptions => (typeof input === "string" ? { title: input } : input);

/** Show a liquid glass notification. Returns its id. */
export function toast(input: ToastInput) {
  nextId += 1;
  records = [{ ...normalize(input), id: nextId, leaving: false }, ...records];
  emit();
  return nextId;
}

const typed = (kind: "success" | "error" | "info") => (input: ToastInput) =>
  toast({ icon: icons[kind], ...normalize(input) });

toast.success = typed("success");
toast.error = typed("error");
toast.info = typed("info");

/** Change a toast in place, e.g. a loading toast that resolves. */
toast.update = (id: number, input: Partial<LiquidToastOptions>) => {
  records = records.map((record) => (record.id === id ? { ...record, ...input } : record));
  emit();
};

/** Start a toast's exit (or every toast's, with no id); removed once it has left. */
toast.dismiss = (id?: number) => {
  records = records.map((record) => (id === undefined || record.id === id ? { ...record, leaving: true } : record));
  emit();
};

/** One toast that follows a promise: loading, then success or error. */
toast.promise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: React.ReactNode;
    success: React.ReactNode | ((value: T) => React.ReactNode);
    error: React.ReactNode | ((error: unknown) => React.ReactNode);
  },
) => {
  const id = toast({ title: messages.loading, icon: icons.loading, duration: Infinity });
  promise.then(
    (value) =>
      toast.update(id, {
        title: typeof messages.success === "function" ? messages.success(value) : messages.success,
        icon: icons.success,
        duration: DEFAULT_DURATION,
      }),
    (error) =>
      toast.update(id, {
        title: typeof messages.error === "function" ? messages.error(error) : messages.error,
        icon: icons.error,
        duration: DEFAULT_DURATION,
      }),
  );
  return id;
};

// Toasters mounted at once; only the first one draws, so a second never doubles every toast.
let hosts: object[] = [];
const hostListeners = new Set<() => void>();
const subscribeHosts = (listener: () => void) => {
  hostListeners.add(listener);
  return () => hostListeners.delete(listener);
};
const setHosts = (next: object[]) => {
  hosts = next;
  hostListeners.forEach((listener) => listener());
};

const remove = (id: number) => {
  records = records.filter((record) => record.id !== id);
  emit();
};

/**
 * Renders toasts at the top centre and behaves like Sonner: collapsed into a
 * stack, spread open on hover, swipe up to dismiss, timers paused while you read.
 * It portals into `document.body`, so no sticky header, overflow, or stacking
 * context on the page can cover or clip it.
 */
export function LiquidToaster({ className }: { className?: string }) {
  const toasts = useSyncExternalStore(subscribe, snapshot, () => empty);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [token] = useState(() => ({}));
  const primary = useSyncExternalStore(subscribeHosts, () => hosts[0] === token, () => false);

  useEffect(() => {
    setHost(document.body);
    setHosts([...hosts, token]);
    return () => setHosts(hosts.filter((entry) => entry !== token));
  }, [token]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const measure = useCallback((id: number, height: number) => {
    setHeights((current) => (current[id] === height ? current : { ...current, [id]: height }));
  }, []);

  const live = toasts.filter((record) => !record.leaving);
  useEffect(() => {
    if (live.length === 0) setExpanded(false);
  }, [live.length]);

  const heightOf = (record: ToastRecord) => heights[record.id] ?? 56;
  const shown = live.slice(0, VISIBLE);
  const stackHeight = expanded
    ? shown.reduce((sum, record) => sum + heightOf(record) + GAP, -GAP)
    : shown[0]
      ? heightOf(shown[0]) + (shown.length - 1) * PEEK
      : 0;

  if (!host || !primary) return null;
  return createPortal(
    <section
      aria-label="Notifications"
      data-slot="liquid-toaster"
      className={cn("pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4", className)}
    >
      <ol
        data-expanded={expanded || undefined}
        className="pointer-events-auto relative m-0 w-full max-w-[360px] list-none p-0 [transition:height_.5s_var(--liquid-spring)] motion-reduce:transition-none"
        style={{ "--liquid-spring": liquidSpring, height: Math.max(0, stackHeight) } as React.CSSProperties}
        onPointerEnter={() => setExpanded(true)}
        onPointerLeave={() => setExpanded(false)}
      >
        {toasts.map((record) => {
          const index = live.indexOf(record);
          const offset = live.slice(0, Math.max(0, index)).reduce((sum, entry) => sum + heightOf(entry) + GAP, 0);
          return (
            <LiquidToastItem
              key={record.id}
              record={record}
              index={index}
              offset={offset}
              expanded={expanded}
              paused={expanded || hidden}
              onMeasure={measure}
            />
          );
        })}
      </ol>
    </section>,
    host,
  );
}

type ItemProps = {
  record: ToastRecord;
  index: number;
  offset: number;
  expanded: boolean;
  paused: boolean;
  onMeasure: (id: number, height: number) => void;
};

function LiquidToastItem({ record, index, offset, expanded, paused, onMeasure }: ItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const swipe = useRef<{ y: number; time: number } | null>(null);
  const dragRef = useRef(0);
  const [drag, setDrag] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const remaining = useRef(record.duration ?? DEFAULT_DURATION);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const report = () => onMeasure(record.id, element.offsetHeight);
    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();
    return () => observer.disconnect();
  }, [onMeasure, record.id]);

  // Arrive: drop in from above the screen with the shared spring.
  useLayoutEffect(() => {
    if (reduced()) return;
    ref.current?.animate([{ translate: "0 -130%" }, { translate: "0 0" }], { duration: 680, easing: liquidSpring });
  }, []);

  // A new duration (a promise that resolved) restarts the clock.
  useEffect(() => {
    remaining.current = record.duration ?? DEFAULT_DURATION;
  }, [record.duration]);

  // Count down only while nobody is reading or swiping, keeping the time left.
  useEffect(() => {
    if (record.leaving || paused || swiping || !Number.isFinite(remaining.current)) return;
    const started = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(record.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, record.duration, record.id, record.leaving, swiping]);

  useEffect(() => {
    if (!record.leaving) return;
    const element = ref.current;
    if (!element || reduced()) return remove(record.id);
    element.animate([{ translate: `0 ${dragRef.current}px` }, { translate: "0 -140%" }], {
      duration: 240,
      easing: "cubic-bezier(0.32, 0, 0.67, 0)",
      fill: "forwards",
    }).onfinish = () => remove(record.id);
  }, [record.id, record.leaving]);

  const setOffset = (value: number) => {
    dragRef.current = value;
    setDrag(value);
  };

  // Swipe up to dismiss; downward drags rubber-band back.
  const onPointerDown = (event: React.PointerEvent<HTMLLIElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    swipe.current = { y: event.clientY, time: event.timeStamp };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone; the swipe just won't be captured.
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    const start = swipe.current;
    if (!start) return;
    const dy = event.clientY - start.y;
    if (!swiping && Math.abs(dy) < 4) return;
    setSwiping(true);
    setOffset(dy < 0 ? dy : dy * 0.2);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLLIElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dy = event.clientY - start.y;
    const velocity = dy / Math.max(1, event.timeStamp - start.time);
    setSwiping(false);
    if (dy < -36 || velocity < -0.45) toast.dismiss(record.id);
    else setOffset(0);
  };

  const depth = Math.max(0, Math.min(index, VISIBLE - 1));
  const transform = expanded
    ? `translateY(${offset}px)`
    : `translateY(${depth * PEEK}px) scale(${1 - depth * 0.05})`;

  return (
    <li
      ref={ref}
      role="status"
      aria-live="polite"
      data-slot="liquid-toast"
      data-swiping={swiping || undefined}
      className={cn(
        "pointer-events-auto absolute inset-x-0 top-0 m-0 list-none p-0 origin-top touch-none select-none",
        "[transition:transform_.55s_var(--liquid-spring),translate_.45s_var(--liquid-spring)] data-[swiping]:[transition:transform_.55s_var(--liquid-spring)]",
        "motion-reduce:transition-none",
        (index >= VISIBLE || index < 0) && !record.leaving && "invisible",
      )}
      style={{
        "--liquid-spring": liquidSpring,
        transform,
        translate: `0 ${drag}px`,
        zIndex: 10 - Math.max(0, Math.min(index, 9)),
      } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <LiquidGlassScope>
        <LiquidGlass
          lens={{ frost: 14, refraction: 11 }}
          className={cn(
            "flex min-h-14 items-center gap-3 rounded-[22px] py-2.5 pl-4 pr-2.5 text-[14px] text-[#18181b] dark:text-[#f4f4f6]",
            liquidPanelMaterial,
          )}
        >
          {record.icon && <span className="grid size-5 shrink-0 place-items-center [&>svg]:size-5">{record.icon}</span>}
          <span className="grid min-w-0 flex-1 leading-snug">
            <strong className="truncate font-semibold">{record.title}</strong>
            {record.description && <span className="truncate text-[13px] opacity-60">{record.description}</span>}
          </span>
          {record.action && (
            <LiquidButton
              size="small"
              variant="ghost"
              className="shrink-0 [--liquid-button-radius:999px]"
              onClick={() => {
                record.action?.onClick();
                toast.dismiss(record.id);
              }}
            >
              {record.action.label}
            </LiquidButton>
          )}
        </LiquidGlass>
      </LiquidGlassScope>
    </li>
  );
}
