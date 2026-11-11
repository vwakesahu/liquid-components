"use client";

import { useEffect, useRef } from "react";

/** The 404 film: a real glass lens looking for the page. One clip per theme, paused for reduced motion. */
export function NotFoundFilm() {
  const light = useRef<HTMLVideoElement>(null);
  const dark = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      for (const element of [light.current, dark.current]) {
        if (!element) continue;
        if (query.matches) element.pause();
        else element.play().catch(() => undefined);
      }
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return (
    <div className="not-found__film" aria-hidden="true">
      {(["light", "dark"] as const).map((mode) => (
        <video
          key={mode}
          ref={mode === "light" ? light : dark}
          className={`not-found__video not-found__video--${mode}`}
          poster={`/404/404-${mode}.jpg`}
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={`/404/404-${mode}.webm`} type="video/webm" />
          <source src={`/404/404-${mode}.mp4`} type="video/mp4" />
        </video>
      ))}
    </div>
  );
}
