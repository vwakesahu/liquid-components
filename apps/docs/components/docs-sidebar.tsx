"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { contents } from "./sidebar-content";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "../lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();
  const { setOpenSearch } = useSearchContext();
  const [currentOpen, setCurrentOpen] = useState(() => getDefaultOpen(pathname));
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => setCurrentOpen(getDefaultOpen(pathname)), [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const active = navRef.current?.querySelector<HTMLElement>("[data-active='true']");
      active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 380);
    return () => window.clearTimeout(timer);
  }, [pathname, currentOpen]);

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="fixed bottom-0 left-0 top-(--landing-topbar-height) z-30 hidden w-[22vw] max-w-[300px] flex-col border-r border-foreground/5 bg-background lg:flex"
    >
      <button type="button" className="group/search flex w-full items-center gap-2 border-b border-foreground/5 px-4 py-[9px] text-sm text-foreground/55 transition-colors hover:bg-foreground/3 hover:text-foreground/80" onClick={() => setOpenSearch(true)}>
        <svg className="size-4 shrink-0 opacity-55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="5.5" />
          <path d="m15 15 4 4" />
        </svg>
        <span>Search</span>
        <kbd className="ml-auto inline-flex items-center gap-0.5 border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40">⌘ K</kbd>
      </button>

      <nav ref={navRef} className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden pb-3">
        <MotionConfig transition={{ duration: 0.35, type: "spring", bounce: 0 }}>
          {contents.map((section, index) => (
            <div key={section.title}>
              <button
                type="button"
                className={cn("flex w-full items-center gap-2 border-b border-foreground/6 px-4 py-2.5 text-left text-sm font-medium transition-colors", currentOpen === index ? "bg-foreground/3 text-foreground" : "text-foreground/70 hover:bg-foreground/3 hover:text-foreground")}
                onClick={() => setCurrentOpen((value) => (value === index ? -1 : index))}
              >
                <section.Icon className="size-4.5" />
                <span className="grow">{section.title}</span>
                <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", currentOpen === index && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {currentOpen === index && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden py-1 text-sm">
                    {section.list.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-active={pathname === item.href || undefined}
                        className={cn("flex w-full items-center gap-2.5 px-4 py-1 text-[14px] transition-colors", pathname === item.href ? "bg-foreground/6 text-foreground" : "text-foreground/65 hover:bg-foreground/3 hover:text-foreground/90")}
                      >
                        <item.icon className="size-[14px] shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </MotionConfig>
      </nav>

      <div className="flex items-center border-t border-foreground/5 p-2">
        <span className="px-2 font-mono text-[10px] uppercase tracking-wider text-foreground/35">Open code</span>
        <div className="ml-auto"><ThemeToggle /></div>
      </div>
    </motion.aside>
  );
}

function getDefaultOpen(pathname: string) {
  const index = contents.findIndex((section) => section.list.some((item) => item.href === pathname));
  return index === -1 ? 0 : index;
}
