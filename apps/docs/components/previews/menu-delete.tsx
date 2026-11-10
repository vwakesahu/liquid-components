"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Copy, Ellipsis, FileText, Pencil, Share, Trash2 } from "lucide-react";
import {
  LiquidButton,
  LiquidMenu,
  LiquidMenuContent,
  LiquidMenuItem,
  LiquidMenuSeparator,
  LiquidMenuShortcut,
  LiquidMenuTrigger,
} from "@liquid-ui/core";

type File = { id: string; name: string; size: string; tone: string };
type Throw = { id: number; tone: string; from: { x: number; y: number }; to: { x: number; y: number } };

const FILES: File[] = [
  // Each file type keeps its usual colour, so the list reads at a glance.
  { id: "review", name: "Design review.pdf", size: "2.4 MB", tone: "#e5484d" },
  { id: "roadmap", name: "Roadmap Q3.key", size: "8.1 MB", tone: "#3e63dd" },
  { id: "invoice", name: "Invoice 0425.xlsx", size: "182 KB", tone: "#30a46c" },
  { id: "notes", name: "Meeting notes.txt", size: "4 KB", tone: "#f59e0b" },
  { id: "brand", name: "Brand guidelines.fig", size: "12.6 MB", tone: "#8e4ec6" },
];

// Eases from the video harness: rising things ease out, falling things ease in.
const easeOut = "cubic-bezier(0.33, 1, 0.68, 1)";
const easeIn = "cubic-bezier(0.32, 0, 0.67, 0)";
const easeInOut = "cubic-bezier(0.65, 0, 0.35, 1)";

/** A file list whose menu really deletes: each file is thrown into the trash. */
export function MenuDeletePreview() {
  const root = useRef<HTMLDivElement>(null);
  const bin = useRef<HTMLSpanElement>(null);
  const lid = useRef<SVGGElement>(null);
  const [files, setFiles] = useState(FILES);
  const [trash, setTrash] = useState<Array<{ file: File; index: number }>>([]);
  const [throws, setThrows] = useState<Throw[]>([]);
  const [message, setMessage] = useState("");
  const throwId = useRef(0);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const remove = (file: File) => {
    const container = root.current;
    const target = bin.current;
    const row = container?.querySelector<HTMLElement>(`[data-file="${file.id}"]`);
    const index = files.findIndex((entry) => entry.id === file.id);
    const commit = () => {
      setFiles((current) => current.filter((entry) => entry.id !== file.id));
      setTrash((current) => [...current, { file, index }]);
      setMessage(`${file.name} moved to Trash`);
    };
    if (!container || !target || !row || reduced()) return commit();

    // Throw a copy of the file icon from its row into the trash can.
    const box = container.getBoundingClientRect();
    const icon = row.querySelector<HTMLElement>("[data-file-icon]")!.getBoundingClientRect();
    const can = target.getBoundingClientRect();
    throwId.current += 1;
    setThrows((current) => [
      ...current,
      {
        id: throwId.current,
        tone: file.tone,
        from: { x: icon.left - box.left, y: icon.top - box.top },
        to: { x: can.left - box.left + can.width / 2 - icon.width / 2, y: can.top - box.top + 2 },
      },
    ]);

    lid.current?.animate(
      [
        { transform: "none" },
        { transform: "rotate(-38deg)", offset: 0.16, easing: easeOut },
        { transform: "rotate(-38deg)", offset: 0.74, easing: easeIn },
        { transform: "none", offset: 0.86 },
        { transform: "none" },
      ],
      { duration: 1150 },
    );
    target.animate(
      [
        { transform: "none", offset: 0.84 },
        { transform: "scale(1.08, 0.9)", offset: 0.9, easing: easeOut },
        { transform: "none", offset: 1 },
      ],
      { duration: 1150 },
    );
    // The row folds away while the file is in the air.
    row.animate(
      [
        { height: `${row.offsetHeight}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 320, delay: 160, easing: easeInOut, fill: "forwards" },
    ).onfinish = commit;
  };

  const undo = () => {
    const last = trash[trash.length - 1];
    if (!last) return;
    setTrash((current) => current.slice(0, -1));
    setFiles((current) => {
      const next = [...current];
      next.splice(Math.min(last.index, next.length), 0, last.file);
      return next;
    });
    setMessage(`${last.file.name} restored`);
  };

  const restoreAll = () => {
    setTrash([]);
    setFiles(FILES);
    setMessage("All files restored");
  };

  return (
    <div ref={root} className="files-demo">
      <div className="files-demo__head">
        <span>Files</span>
        <span ref={bin} className="files-demo__bin" data-full={trash.length > 0 || undefined} aria-label={`Trash, ${trash.length} items`} role="img">
          <svg viewBox="0 0 64 64" fill="none" overflow="visible">
            <g ref={lid} className="files-demo__lid">
              <rect x="13" y="15" width="38" height="5" rx="2.5" fill="currentColor" />
              <rect x="26" y="10" width="12" height="6" rx="2" stroke="currentColor" strokeWidth="2.4" />
            </g>
            <path d="M17.5 24h29l-2.6 28.4a4 4 0 0 1-4 3.6H24.1a4 4 0 0 1-4-3.6L17.5 24Z" fill="currentColor" />
            <path d="M27 31.5v16M32 31.5v16M37 31.5v16" stroke="var(--stage-bg)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          {trash.length > 0 && <b>{trash.length}</b>}
        </span>
      </div>

      {files.length > 0 ? (
        <ul className="files-demo__list">
          {files.map((file) => (
            <li key={file.id} data-file={file.id} style={{ "--file-tone": file.tone } as React.CSSProperties}>
              <span className="files-demo__icon" data-file-icon aria-hidden="true">
                <FileText />
              </span>
              <span className="files-demo__meta">
                <strong>{file.name}</strong>
                <small>{file.size}</small>
              </span>
              <LiquidMenu>
                <LiquidMenuTrigger variant="ghost" size="small" aria-label={`Options for ${file.name}`} className="files-demo__trigger">
                  <Ellipsis aria-hidden="true" />
                </LiquidMenuTrigger>
                <LiquidMenuContent align="end">
                  <LiquidMenuItem><Pencil />Rename<LiquidMenuShortcut>⌘R</LiquidMenuShortcut></LiquidMenuItem>
                  <LiquidMenuItem><Copy />Duplicate<LiquidMenuShortcut>⌘D</LiquidMenuShortcut></LiquidMenuItem>
                  <LiquidMenuItem><Share />Share…</LiquidMenuItem>
                  <LiquidMenuSeparator />
                  <LiquidMenuItem destructive onSelect={() => remove(file)}>
                    <Trash2 />Delete
                  </LiquidMenuItem>
                </LiquidMenuContent>
              </LiquidMenu>
            </li>
          ))}
        </ul>
      ) : (
        <div className="files-demo__empty">
          <span>No files</span>
          <LiquidButton size="small" variant="outline" onClick={restoreAll}>Restore all</LiquidButton>
        </div>
      )}

      {trash.length > 0 && files.length > 0 && (
        <div className="files-demo__toast">
          <span>Moved to Trash</span>
          <LiquidButton size="small" variant="ghost" onClick={undo}>Undo</LiquidButton>
        </div>
      )}

      {throws.map((entry) => (
        <ThrownFile key={entry.id} entry={entry} onDone={() => setThrows((current) => current.filter((item) => item.id !== entry.id))} />
      ))}

      <span className="sr-only" aria-live="polite">{message}</span>
    </div>
  );
}

// mulberry32, as in the video harness: seeded variation, never Math.random.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAGES = 4;

/** The document's pages fan out of the row and drop into the can one after another. */
function ThrownFile({ entry, onDone }: { entry: Throw; onDone: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useLayoutEffect(() => {
    const pages = Array.from(ref.current?.children ?? []) as HTMLElement[];
    if (pages.length === 0) return;
    const random = rng(entry.id * 977);
    const dx = entry.to.x - entry.from.x;
    const dy = entry.to.y - entry.from.y;
    const animations = pages.map((page, index) => {
      const lift = 30 + random() * 22;
      const drift = (random() - 0.5) * 28;
      const spin = (random() - 0.5) * 40;
      const apexY = Math.min(0, dy) - lift;
      // Up and over the list (ease out), then down into the can (ease in).
      return page.animate(
        [
          { transform: `translate(${index * 3}px, ${-index * 2}px) rotate(${index * 4 - 6}deg) scale(1)`, opacity: 1, easing: easeOut },
          { transform: `translate(${dx * 0.5 + drift}px, ${apexY}px) rotate(${spin}deg) scale(0.8)`, offset: 0.48, easing: easeIn },
          { transform: `translate(${dx}px, ${dy}px) rotate(${spin * 0.4}deg) scale(0.5)`, opacity: 1, offset: 0.88 },
          { transform: `translate(${dx}px, ${dy + 10}px) rotate(${spin * 0.4}deg) scale(0.42)`, opacity: 0 },
        ],
        { duration: 660, delay: 110 + index * 60, fill: "both" },
      );
    });
    animations[animations.length - 1]!.onfinish = () => done.current();
    return () => animations.forEach((animation) => animation.cancel());
  }, [entry]);

  return (
    <span
      ref={ref}
      className="files-demo__pages"
      style={{ left: entry.from.x + 7, top: entry.from.y + 4, "--file-tone": entry.tone } as React.CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: PAGES }, (_, index) => (
        <i key={index} className="files-demo__page" />
      ))}
    </span>
  );
}
