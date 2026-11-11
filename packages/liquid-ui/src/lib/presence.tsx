"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ExitState = { closing: boolean; finish: () => void };
const ExitContext = createContext<ExitState | null>(null);

/**
 * Keeps a Radix popup open for its exit animation. The root asks to close, the
 * body plays its exit and calls `finish`, then Radix unmounts it. A safety timer
 * finishes anyway, so a popup can never stay stuck open.
 */
export function useExitPresence(openProp: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange?: (open: boolean) => void) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const requested = openProp ?? uncontrolled;
  const [rendered, setRendered] = useState(requested);
  const closing = rendered && !requested;

  useEffect(() => {
    if (requested) setRendered(true);
  }, [requested]);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setRendered(false), 400);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );
  return { open: rendered, setOpen, state: { closing, finish: () => setRendered(false) } };
}

export const ExitProvider = ExitContext.Provider;

/** Plays `exit` on the element once its popup starts closing, then lets it unmount. */
export function useExitAnimation<T extends HTMLElement>(exit: (element: T) => Animation | undefined) {
  const state = useContext(ExitContext);
  const ref = useRef<T>(null);
  const exitRef = useRef(exit);
  exitRef.current = exit;
  useEffect(() => {
    if (!state?.closing) return;
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return state.finish();
    const animation = exitRef.current(element);
    if (!animation) return state.finish();
    animation.onfinish = state.finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.closing]);
  return ref;
}
