"use client";

import { LiquidTooltip, LiquidTooltipContent, LiquidTooltipProvider, LiquidTooltipShortcut, LiquidTooltipTrigger } from "@liquid-ui/core";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ArrowRight, MenuIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "../lib/site";
import { GitHubIcon } from "./github-icon";
import { toggleDocsMenu, useDocsMenu } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

/**
 * One quiet row: the mark on the left, search and the one call to action on the
 * right. On phones the menu button opens every page in a panel.
 */
export function Topbar() {
  const { setOpenSearch } = useSearchContext();
  const menuOpen = useDocsMenu();

  return (
    <header className="topbar fixed inset-x-0 top-0 z-40 flex h-(--landing-topbar-height) items-center justify-between gap-3 border-b border-[var(--line)] bg-background/85 px-4 backdrop-blur-xl lg:px-5">
      <Link href="/docs" className="flex items-center gap-2.5" aria-label={`${siteConfig.name} home`}>
        <span className="liquid-logo-mark" aria-hidden="true" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">{siteConfig.name}</span>
      </Link>

      <LiquidTooltipProvider>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpenSearch(true)}
          className="topbar__search hidden h-9 w-[240px] items-center gap-2 rounded-full border border-[var(--line)] px-3.5 text-[13px] text-[var(--grey)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] md:flex"
        >
          <SearchIcon className="size-3.5" aria-hidden="true" />
          <span>Search components</span>
          <kbd className="ml-auto font-sans text-[11px] text-[var(--grey-light)]">⌘K</kbd>
        </button>
        <button
          type="button"
          aria-label="Search"
          onClick={() => setOpenSearch(true)}
          className="inline-flex size-9 items-center justify-center rounded-full text-[var(--grey)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--ink)] md:hidden"
        >
          <SearchIcon className="size-4" aria-hidden="true" />
        </button>
        <LiquidTooltip>
          <LiquidTooltipTrigger asChild>
            <a
              href={siteConfig.repository}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="hidden size-9 items-center sm:inline-flex justify-center rounded-full text-[var(--grey)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--ink)]"
            >
              <GitHubIcon className="size-4" />
            </a>
          </LiquidTooltipTrigger>
          <LiquidTooltipContent side="bottom">Source on GitHub</LiquidTooltipContent>
        </LiquidTooltip>
        <LiquidTooltip>
          <LiquidTooltipTrigger asChild>
            <div className="[&_button]:size-9 [&_button]:rounded-full [&_button:hover]:bg-[var(--fill)]">
              <ThemeToggle />
            </div>
          </LiquidTooltipTrigger>
          <LiquidTooltipContent side="bottom">Light or dark</LiquidTooltipContent>
        </LiquidTooltip>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Menu"}
          aria-expanded={menuOpen}
          aria-controls="docs-menu"
          onClick={toggleDocsMenu}
          className="inline-flex size-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[var(--fill)] lg:hidden"
        >
          {menuOpen ? <XIcon className="size-[18px]" aria-hidden="true" /> : <MenuIcon className="size-[18px]" aria-hidden="true" />}
        </button>
        <Link
          href="/docs/installation"
          className="ml-1 hidden h-9 items-center gap-1.5 rounded-full bg-[var(--cta-bg)] px-4 text-[13px] font-semibold text-[var(--cta-ink)] transition-opacity hover:opacity-85 sm:inline-flex"
        >
          Get started
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      </LiquidTooltipProvider>
    </header>
  );
}
