"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** Light or dark, one tap, like shadcn's header. */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center rounded-full text-[var(--grey)] transition-colors hover:bg-[var(--fill)] hover:text-[var(--ink)]"
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </button>
  );
}
