import { StrictMode, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LiquidSwitch } from "../../../packages/liquid-ui/src";
import "./teaser.css";

declare global {
  interface Window {
    __setTeaserFrame: (frame: number) => Promise<void>;
    __teaserReady: boolean;
  }
}

const FPS = 30;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 4);
const pulse = (time: number, start: number, end: number) => {
  const midpoint = (start + end) / 2;
  if (time <= start || time >= end) return 0;
  return time < midpoint
    ? smooth((time - start) / (midpoint - start))
    : smooth((end - time) / (end - midpoint));
};

function stateAt(time: number) {
  let position = 0;
  let tint = 0;
  let interaction = 0;
  let direction = 1;
  let label = "OFF";

  if (time >= 0.72 && time < 1.5) {
    const progress = smooth((time - 0.72) / 0.78);
    position = progress;
    tint = smooth((progress - 0.08) / 0.72);
    interaction = pulse(time, 0.64, 1.56);
    label = "BETWEEN";
  } else if (time >= 1.5 && time < 2.45) {
    position = 1;
    tint = 1;
    label = "ON";
  } else if (time >= 2.45 && time < 3.23) {
    const progress = smooth((time - 2.45) / 0.78);
    position = 1 - progress;
    tint = 1 - smooth((progress - 0.08) / 0.72);
    interaction = pulse(time, 2.37, 3.29);
    direction = -1;
    label = "BETWEEN";
  } else if (time >= 3.23) {
    label = "OFF";
  }

  const entrance = easeOut((time - 0.08) / 0.48);
  const exit = 1 - smooth((time - 3.82) / 0.34);
  const visible = entrance * exit;
  const activeGlow = tint * visible;
  const travel = 24;
  const stretch = interaction * (9 + 3 * Math.sin(interaction * Math.PI));

  return {
    position,
    tint,
    interaction,
    direction,
    label,
    visible,
    activeGlow,
    stretch,
    travel,
  };
}

function Teaser() {
  const initialFrame = Number(new URLSearchParams(window.location.search).get("frame") ?? 0);
  const [frame, setFrame] = useState(initialFrame);
  const switchRef = useRef<HTMLButtonElement>(null);
  const time = frame / FPS;
  const state = stateAt(time);

  useLayoutEffect(() => {
    const root = switchRef.current;
    if (!root) return;

    const signedStretch = state.stretch * state.direction;
    root.style.setProperty("--thumb-x", `${state.position * state.travel}px`);
    root.style.setProperty("--liquid-stretch", `${state.stretch}px`);
    root.style.setProperty(
      "--liquid-offset",
      `${state.direction * state.stretch * 0.15 - state.stretch / 2}px`,
    );
    root.style.setProperty("--liquid-squash", `${1 - state.stretch / 125}`);
    root.style.setProperty("--liquid-skew", `${Math.min(7, signedStretch * 0.45)}deg`);
    root.style.setProperty("--liquid-light-x", `${mix(26, 76, state.position)}%`);
    root.style.setProperty("--teaser-tint-opacity", String(state.tint));
    root.style.setProperty("--teaser-tint-scale", String(mix(0.76, 1, state.tint)));

    if (state.interaction > 0.02) {
      root.setAttribute("data-interacting", "true");
      root.setAttribute("data-dragging", "true");
    } else {
      root.removeAttribute("data-interacting");
      root.removeAttribute("data-dragging");
    }
  }, [frame, state]);

  useLayoutEffect(() => {
    window.__setTeaserFrame = (nextFrame: number) =>
      new Promise((resolve) => {
        setFrame(nextFrame);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    window.__teaserReady = true;
  }, []);

  const checked = time >= 1.5 && time < 3.23;
  return (
    <main
      className="teaser"
      style={
        {
          "--scene-visible": state.visible,
          "--active-glow": state.activeGlow,
          "--interaction": state.interaction,
          "--position": state.position,
        } as React.CSSProperties
      }
    >
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="vignette" />
      <div className="grain" />

      <section className="switch-stage">
        <div className="halo" />
        <div className="switch-scale">
          <LiquidSwitch
            ref={switchRef}
            className="stage-switch"
            size="large"
            tint="#32d866"
            checked={checked}
            onCheckedChange={() => undefined}
            aria-label={`Switch ${state.label.toLowerCase()} state`}
          />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Teaser />
  </StrictMode>,
);
