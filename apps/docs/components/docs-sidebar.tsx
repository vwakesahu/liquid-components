"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { contents } from "./sidebar-content";
import { cn } from "../lib/utils";

/**
 * Every page, always open. Section labels stay quiet; the current page is the
 * one place the brand colour appears. Desktop shows it as the sidebar, phones
 * show the same list in the menu panel.
 */
export function NavList({ className }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  const indicator = useRef<HTMLSpanElement>(null);

  // One pill glides to the current page on the shared spring, the way the tabs droplet moves.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = indicator.current;
    const active = nav?.querySelector<HTMLElement>("[data-active]");
    if (!nav || !pill) return;
    if (!active) {
      pill.style.opacity = "0";
      return;
    }
    const first = pill.style.opacity !== "1";
    pill.style.transition = first ? "none" : "";
    pill.style.translate = `0 ${active.offsetTop}px`;
    pill.style.height = `${active.offsetHeight}px`;
    pill.style.opacity = "1";
    active.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav ref={navRef} aria-label="Documentation" className={cn("relative", className)}>
      <span
        ref={indicator}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 rounded-full bg-[var(--accent-soft)] opacity-0 [transition:translate_.55s_var(--liquid-spring-css),height_.3s_ease] motion-reduce:transition-none"
      />
      {contents.map((section) => (
        <div key={section.title} className="pt-6">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--grey-light)]">{section.title}</p>
          <ul className="flex flex-col gap-px">
            {section.list.map((item) => {
              if (!item.href) return null;
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-active={active || undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center rounded-full px-3 text-[15px] transition-colors lg:h-8 lg:text-[14px]",
                      // The gliding pill is the active fill; rows only fill on hover.
                      active ? "relative font-medium text-[var(--accent-ink)]" : "relative text-[var(--ink)]/70 hover:bg-[var(--fill)] hover:text-[var(--ink)]",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-(--landing-topbar-height) z-30 hidden w-(--landing-left-pane-width) flex-col border-r border-[var(--line)] bg-background lg:flex">
      <NavList className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-8 pt-2" />
    </aside>
  );
}
