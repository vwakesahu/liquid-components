"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, RotateCw } from "lucide-react";
import { LiquidToolbar, LiquidToolbarButton, LiquidToolbarGroup } from "@liquid-ui/core";

// Real pages, captured from the docs at window width.
const pages = [
  { path: "/docs", src: "/previews/page-overview.webp" },
  { path: "/docs/components/switch", src: "/previews/page-switch.webp" },
  { path: "/docs/components/slider", src: "/previews/page-slider.webp" },
];

// Eased key frames, as in the video harness: cards move in and out, never linearly.
const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
function keys(t: number, frames: Array<[number, number]>) {
  if (t <= frames[0]![0]) return frames[0]![1];
  for (let index = 0; index < frames.length - 1; index += 1) {
    const [t0, v0] = frames[index]!;
    const [t1, v1] = frames[index + 1]!;
    if (t <= t1) return v0 + (v1 - v0) * inOut((t - t0) / Math.max(0.001, t1 - t0));
  }
  return frames[frames.length - 1]![1];
}

// One loop of the demo: read down the page (toolbar merges), hold, scroll back up (it splits).
const LOOP = 8;
const script = (from: number): Array<[number, number]> => [
  [0, from],
  [0.9, 0],
  [1.6, 0],
  [3.1, 0.62],
  [4.6, 0.62],
  [5.5, 0.28],
  [6.7, 0.28],
  [7.6, 0],
  [LOOP, 0],
];

export function BrowserToolbarPreview() {
  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const scrollingTimer = useRef(0);
  const [index, setIndex] = useState(0);
  const [compact, setCompact] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const page = pages[index]!;

  const updateScrollbar = useCallback(() => {
    const element = scroller.current;
    const root = frame.current;
    if (!element || !root) return;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const thumb = Math.max(32, (clientHeight * clientHeight) / Math.max(clientHeight, scrollHeight));
    const travel = clientHeight - thumb - 8;
    const progress = scrollTop / Math.max(1, scrollHeight - clientHeight);
    root.style.setProperty("--thumb-height", `${thumb}px`);
    root.style.setProperty("--thumb-y", `${progress * travel}px`);
    root.dataset.scrolling = "";
    window.clearTimeout(scrollingTimer.current);
    scrollingTimer.current = window.setTimeout(() => delete root.dataset.scrolling, 700);
  }, []);

  // Reading down compacts the toolbar; scrolling back up restores it.
  const onScroll = () => {
    const top = scroller.current?.scrollTop ?? 0;
    const delta = top - lastScroll.current;
    lastScroll.current = top;
    if (top < 24) setCompact(false);
    else if (delta > 2) setCompact(true);
    else if (delta < -2) setCompact(false);
    updateScrollbar();
  };

  // Scripted scrolling until the visitor takes over.
  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = scroller.current;
    if (!element) return;
    let raf = 0;
    let start = performance.now();
    let frames = script(element.scrollTop / Math.max(1, element.scrollHeight - element.clientHeight));
    const tick = (now: number) => {
      let t = (now - start) / 1000;
      if (t >= LOOP) {
        start = now;
        t = 0;
        frames = script(0);
      }
      const range = Math.max(0, element.scrollHeight - element.clientHeight);
      element.scrollTop = keys(t, frames) * range;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [autoplay, index]);

  useEffect(() => updateScrollbar(), [index, updateScrollbar]);

  const toTop = () => {
    scroller.current?.scrollTo({ top: 0 });
    lastScroll.current = 0;
    setCompact(false);
  };

  const go = (offset: number) => {
    setIndex((current) => Math.min(pages.length - 1, Math.max(0, current + offset)));
    toTop();
  };

  const reload = () => {
    setReloading(true);
    toTop();
    window.setTimeout(() => setReloading(false), 600);
  };

  return (
      <div
        ref={frame}
        className="browser-demo"
        onPointerEnter={() => setAutoplay(false)}
        onWheel={() => setAutoplay(false)}
        onTouchStart={() => setAutoplay(false)}
        onPointerLeave={() => setAutoplay(true)}
      >
        <div className="browser-demo__bar">
          <span className="browser-demo__lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="browser-demo__viewport">
          <div ref={scroller} className="browser-demo__page" onScroll={onScroll} data-reloading={reloading || undefined}>
            <img key={page.src} src={page.src} alt={`liquidcomponents.xyz${page.path}`} draggable={false} onLoad={updateScrollbar} />
          </div>
          <span className="browser-demo__edge" aria-hidden="true" />
          <span className="browser-demo__scrollbar" aria-hidden="true" />

          <LiquidToolbar merged={compact} aria-label="Browser controls" className="browser-demo__toolbar" data-compact={compact || undefined}>
            <LiquidToolbarGroup>
              <LiquidToolbarButton aria-label="Back" disabled={index === 0} onClick={() => go(-1)}>
                <ChevronLeft />
              </LiquidToolbarButton>
              <LiquidToolbarButton aria-label="Forward" disabled={index === pages.length - 1} onClick={() => go(1)}>
                <ChevronRight />
              </LiquidToolbarButton>
            </LiquidToolbarGroup>
            <LiquidToolbarGroup>
              <button type="button" className="browser-demo__url" onClick={toTop} aria-label={`liquidcomponents.xyz${page.path}`}>
                <Lock aria-hidden="true" />
                <span>liquidcomponents.xyz{page.path === "/docs" ? "" : page.path.replace("/docs/components", "")}</span>
              </button>
              <LiquidToolbarButton aria-label="Reload" onClick={reload}>
                <RotateCw className={reloading ? "browser-demo__spin" : undefined} />
              </LiquidToolbarButton>
            </LiquidToolbarGroup>
          </LiquidToolbar>
        </div>
      </div>
  );
}
