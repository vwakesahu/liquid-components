"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "../lib/site";
import type { Section } from "./sidebar-content";
import { contents } from "./sidebar-content";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "../lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();
  const { setOpenSearch } = useSearchContext();
  const [currentOpen, setCurrentOpen] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  const getDefaultOpen = (sections: Section[]) => {
    const defaultValue = sections.findIndex((item) =>
      item.list.some((listItem) => listItem.href === pathname),
    );
    return defaultValue === -1 ? 0 : defaultValue;
  };

  useEffect(() => {
    setCurrentOpen(getDefaultOpen(contents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll the active item into view after section expands
  useEffect(() => {
    const timer = setTimeout(() => {
      const nav = navRef.current;
      if (!nav) return;
      const activeEl = nav.querySelector<HTMLElement>("[data-active='true']");
      if (!activeEl) return;

      const navRect = nav.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      const isAbove = elRect.top < navRect.top;
      const isBelow = elRect.bottom > navRect.bottom;
      if (isAbove || isBelow) {
        activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 380); // wait for expand animation to finish

    return () => clearTimeout(timer);
  }, [pathname, currentOpen]);

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="fixed left-0 top-(--landing-topbar-height) bottom-0 z-30 hidden w-[22vw] max-w-[300px] flex-col border-r border-foreground/5 bg-background transition-[width] duration-300 ease-out lg:flex"
    >
      <button
        type="button"
        className="group/search flex w-full items-center gap-2 border-b border-foreground/5 px-4 py-[9px] text-sm text-foreground/55 transition-colors hover:bg-foreground/3 hover:text-foreground/80"
        onClick={() => setOpenSearch(true)}
      >
        <svg
          className="size-4 shrink-0 text-foreground opacity-55 transition-opacity group-hover/search:opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="5.5" />
          <path d="m15 15l4 4" />
        </svg>
        <span className="truncate">Search</span>
        <kbd className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40">
          <span className="text-[11px]">&#8984;</span>K
        </kbd>
      </button>

      {/* Scrollable navigation area */}
      <nav
        ref={navRef}
        className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden pb-3"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 2rem), transparent 100%)",
        }}
      >
        <MotionConfig
          transition={{ duration: 0.35, type: "spring", bounce: 0 }}
        >
          <div className="flex flex-col">
            {contents.map((section, index) => (
              <div key={section.title}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 border-b border-foreground/6 px-4 py-2.5 text-left transition-colors",
                    "text-sm font-medium tracking-wider",
                    currentOpen === index
                      ? "bg-foreground/3 text-foreground"
                      : "text-foreground/70 hover:bg-foreground/3 hover:text-foreground",
                  )}
                  onClick={() => {
                    setCurrentOpen((prev) => (prev === index ? -1 : index));
                  }}
                >
                  <section.Icon className="size-4.5" />
                  <span className="grow tracking-normal">{section.title}</span>
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      currentOpen === index ? "rotate-180" : "",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {currentOpen === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative overflow-hidden"
                    >
                      <motion.div className="text-sm">
                        <SidebarSection section={section} pathname={pathname} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </MotionConfig>
      </nav>

      {/* Footer: GitHub + Theme Toggle */}
      <div className="flex items-center gap-1 border-t border-foreground/5 p-2 text-foreground/40">
        <a
          href={siteConfig.repository}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex size-8 items-center justify-center transition-colors hover:bg-foreground/5 hover:text-foreground/70"
          aria-label="GitHub"
        >
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
        <div className="ms-auto [&_button]:text-foreground/40 [&_button:hover]:text-foreground/70">
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function SidebarSection({
  section,
  pathname,
}: {
  section: Section;
  pathname: string;
}) {
  return (
    <div className="pb-1 pt-0">
      {section.list.map((item, i) => {
        if (item.separator || item.group) {
          return (
            <div
              key={`sep-${item.title}-${i}`}
              className="mx-4 my-2 flex flex-row items-center gap-2 lg:mx-7"
            >
              <p className="text-[10px] uppercase tracking-wider text-foreground/45">
                {item.title}
              </p>
              <div className="h-px grow bg-border" />
            </div>
          );
        }
        if (!item.href) return null;
        return (
          <SidebarLink
            key={item.href}
            href={item.href}
            active={pathname === item.href}
            icon={
              <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-[14px]">
                <item.icon className="text-foreground/75" />
              </span>
            }
          >
            {item.title}
          </SidebarLink>
        );
      })}
    </div>
  );
}

// ─── Sidebar Link ─────────────────────────────────────────────────────────────

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-active={active || undefined}
      className={cn(
        "relative flex w-full items-center gap-2.5 px-4 py-1 text-[14px] transition-all duration-150",
        active
          ? "bg-foreground/6 text-foreground"
          : "text-foreground/65 hover:bg-foreground/3 hover:text-foreground/90",
      )}
    >
      {icon && (
        <span
          className={cn(
            "transition-colors duration-150",
            active ? "text-foreground" : "text-foreground/65",
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 grow truncate">{children}</span>
    </Link>
  );
}
