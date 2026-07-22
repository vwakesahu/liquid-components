"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { MenuIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { contents } from "./sidebar-content";
import { cn } from "../lib/utils";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { setOpenSearch } = useSearchContext();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-(--landing-topbar-height) items-center justify-between border-b border-foreground/5 bg-background px-4">
        <Link href="/docs" className="flex items-center gap-2">
          <span className="liquid-logo-mark" aria-hidden="true" />
          <span className="text-[15px] font-bold tracking-tight text-foreground">Liquid UI</span>
          <span className="mt-px font-mono text-[10px] uppercase tracking-wider text-foreground/45">docs</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/docs/components/switch" className="hidden px-2 py-1 text-[13px] text-foreground/55 transition-colors hover:text-foreground sm:block">
            Components
          </Link>
          <button type="button" aria-label="Search" onClick={() => setOpenSearch(true)} className="inline-flex size-8 items-center justify-center text-foreground/55 transition-colors hover:text-foreground lg:hidden">
            <SearchIcon className="size-4" />
          </button>
          <button type="button" aria-label="Menu" onClick={() => setOpen((value) => !value)} className="inline-flex size-8 items-center justify-center text-foreground/55 transition-colors hover:text-foreground lg:hidden">
            {open ? <XIcon className="size-4.5" /> : <MenuIcon className="size-4.5" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-(--landing-topbar-height) z-40 overflow-y-auto bg-background lg:hidden">
          {contents.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 border-b border-foreground/6 bg-foreground/3 px-4 py-2.5 text-sm font-medium text-foreground">
                <section.Icon className="size-4.5" />
                {section.title}
              </div>
              <div className="py-1">
                {section.list.map((item) => (
                  <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-4 py-2 text-[14px] transition-colors", pathname === item.href ? "bg-foreground/6 text-foreground" : "text-foreground/65 hover:text-foreground")}>
                    <item.icon className="size-[14px] text-foreground/75" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
