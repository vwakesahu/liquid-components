"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type LiquidMotionOptions = {
  maxStretch?: number;
  distanceWeight?: number;
  velocityWeight?: number;
  minimumPulse?: number;
};

type LiquidMotionStyle = CSSProperties & {
  "--liquid-stretch": string;
  "--liquid-offset": string;
  "--liquid-squash": string;
  "--liquid-skew": string;
  "--liquid-light-x": string;
};

const motionKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

export function useLiquidMotion<T extends HTMLElement>({
  maxStretch = 16,
  distanceWeight = 0.8,
  velocityWeight = 20,
  minimumPulse = 380,
}: LiquidMotionOptions = {}) {
  const ref = useRef<T>(null);
  const [interacting, setInteracting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const shape = useRef({ stretch: 0, direction: 0 });
  const lightX = useRef(50);
  const previousPointer = useRef<{ x: number; time: number } | null>(null);
  const bounds = useRef({ left: 0, width: 1 });
  const startedAt = useRef(0);
  const moved = useRef(false);
  const paintFrame = useRef<number | null>(null);
  const releaseTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (paintFrame.current !== null) window.cancelAnimationFrame(paintFrame.current);
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
    };
  }, []);

  const paint = () => {
    if (paintFrame.current !== null) return;
    paintFrame.current = window.requestAnimationFrame(() => {
      const element = ref.current;
      const current = shape.current;
      if (element) {
        element.style.setProperty("--liquid-stretch", `${current.stretch}px`);
        element.style.setProperty(
          "--liquid-offset",
          `${current.direction * current.stretch * 0.15 - current.stretch / 2}px`,
        );
        element.style.setProperty("--liquid-squash", `${1 - current.stretch / 125}`);
        element.style.setProperty(
          "--liquid-skew",
          `${current.direction * Math.min(7, current.stretch * 0.45)}deg`,
        );
        element.style.setProperty("--liquid-light-x", `${lightX.current}%`);
      }
      paintFrame.current = null;
    });
  };

  const resetShape = () => {
    shape.current = { stretch: 0, direction: 0 };
    paint();
  };

  const pointerDown = (event: PointerEvent<T>) => {
    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
    const rect = event.currentTarget.getBoundingClientRect();
    bounds.current = { left: rect.left, width: Math.max(1, rect.width) };
    previousPointer.current = { x: event.clientX, time: event.timeStamp };
    startedAt.current = event.timeStamp;
    moved.current = false;
    shape.current = { stretch: 0, direction: 0 };
    lightX.current = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    setDragging(false);
    setInteracting(true);
    paint();
  };

  const pointerMove = (event: PointerEvent<T>) => {
    const previous = previousPointer.current;
    if (!previous) return;
    const delta = event.clientX - previous.x;
    const elapsed = Math.max(8, event.timeStamp - previous.time);
    if (!moved.current && Math.abs(delta) > 0.5) {
      moved.current = true;
      setDragging(true);
    }
    const velocity = Math.abs(delta) / elapsed;
    const targetStretch = Math.min(maxStretch, Math.abs(delta) * distanceWeight + velocity * velocityWeight);
    shape.current = {
      stretch: shape.current.stretch * 0.62 + targetStretch * 0.38,
      direction: shape.current.direction * 0.58 + Math.sign(delta) * 0.42,
    };
    lightX.current = Math.min(
      100,
      Math.max(0, ((event.clientX - bounds.current.left) / bounds.current.width) * 100),
    );
    previousPointer.current = { x: event.clientX, time: event.timeStamp };
    paint();
  };

  const pointerUp = (event: PointerEvent<T>) => {
    if (!previousPointer.current) return;
    const wasDragging = moved.current;
    previousPointer.current = null;
    resetShape();
    setDragging(false);
    if (wasDragging) {
      setInteracting(false);
      return;
    }
    const remaining = Math.max(0, minimumPulse - (event.timeStamp - startedAt.current));
    releaseTimer.current = window.setTimeout(() => {
      setInteracting(false);
      releaseTimer.current = null;
    }, remaining);
  };

  const pointerCancel = () => {
    previousPointer.current = null;
    resetShape();
    setDragging(false);
    setInteracting(false);
  };

  const keyDown = (event: KeyboardEvent<T>) => {
    if (motionKeys.includes(event.key)) setInteracting(true);
  };

  const keyUp = (event: KeyboardEvent<T>) => {
    if (!motionKeys.includes(event.key)) return;
    releaseTimer.current = window.setTimeout(() => setInteracting(false), 220);
  };

  const style: LiquidMotionStyle = {
    "--liquid-stretch": `${shape.current.stretch}px`,
    "--liquid-offset": `${shape.current.direction * shape.current.stretch * 0.15 - shape.current.stretch / 2}px`,
    "--liquid-squash": `${1 - shape.current.stretch / 125}`,
    "--liquid-skew": `${shape.current.direction * Math.min(7, shape.current.stretch * 0.45)}deg`,
    "--liquid-light-x": `${lightX.current}%`,
  };

  return {
    ref,
    interacting,
    dragging,
    style,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    keyDown,
    keyUp,
  };
}
