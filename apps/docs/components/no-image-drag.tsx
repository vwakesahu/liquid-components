"use client";

import { useEffect } from "react";

/**
 * Images on the site can't be dragged out. The CSS rule covers Chrome and Safari; this
 * catches Firefox and any image added later, like a portalled preview, with one listener.
 */
export function NoImageDrag() {
  useEffect(() => {
    const stop = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    };
    document.addEventListener("dragstart", stop);
    return () => document.removeEventListener("dragstart", stop);
  }, []);
  return null;
}
