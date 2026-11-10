"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "../lib/utils";
import { NavList } from "./docs-sidebar";

// One open flag shared by the top bar's menu button and the panel.
let menuOpen = false;
const listeners = new Set<() => void>();
const setMenu = (open: boolean) => {
  menuOpen = open;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const toggleDocsMenu = () => setMenu(!menuOpen);
export const useDocsMenu = () => useSyncExternalStore(subscribe, () => menuOpen, () => false);

/**
 * Phones get the same list as the desktop sidebar, in a full-height panel under
 * the top bar. It closes on navigation and on Escape, and the page underneath
 * doesn't scroll while it's open.
 */
export function MobileNav() {
  const pathname = usePathname();
  const open = useDocsMenu();

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      id="docs-menu"
      aria-hidden={!open}
      inert={!open || undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 top-(--landing-topbar-height) z-40 overflow-y-auto overscroll-contain bg-background transition-[opacity,translate] duration-200 ease-out lg:hidden",
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <NavList className="mx-auto max-w-xl px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
