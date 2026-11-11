"use client";

import { useEffect } from "react";
import { applyTheme, loadTheme } from "./settings";

/** Puts the saved theme back on every page load. */
export function ThemeSync() {
  useEffect(() => applyTheme(loadTheme(), false), []);
  return null;
}
