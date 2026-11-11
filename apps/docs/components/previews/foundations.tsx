"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  LiquidGlass,
  LiquidGlassGroup,
  LiquidSlider,
  LiquidSwitch,
  LiquidTabs,
  LiquidTabsList,
  LiquidTabsTrigger,
  liquidChromeMaterial,
  liquidFillMaterial,
  liquidPanelMaterial,
  liquidSpring,
} from "@liquid-ui/core";

/** Three controls, one lens model: press any of them and the lens turns clear over its own surface. */
export function MaterialLensPreview() {
  const [on, setOn] = useState(true);
  return (
    <div className="material-demo__lens">
      <LiquidSwitch checked={on} onCheckedChange={setOn} tint="var(--liquid-accent)" aria-label="Example switch" />
      <LiquidSlider defaultValue={[58]} aria-label="Example slider" className="material-demo__slider" />
      <LiquidTabs defaultValue="day" className="w-auto">
        <LiquidTabsList aria-label="Example tabs" size="small">
          <LiquidTabsTrigger value="day">Day</LiquidTabsTrigger>
          <LiquidTabsTrigger value="week">Week</LiquidTabsTrigger>
          <LiquidTabsTrigger value="month">Month</LiquidTabsTrigger>
        </LiquidTabsList>
      </LiquidTabs>
    </div>
  );
}

// The spring every component shares, read straight from its CSS easing.
const SAMPLES = liquidSpring.replace(/^linear\(|\)$/g, "").split(",").map(Number);
const W = 520;
const H = 220;
const PAD = { left: 36, right: 16, top: 18, bottom: 30 };
const DURATION = 600;
const x = (i: number) => PAD.left + (i / (SAMPLES.length - 1)) * (W - PAD.left - PAD.right);
const y = (v: number) => PAD.top + (1.15 - v) / 1.15 * (H - PAD.top - PAD.bottom);
const peak = SAMPLES.reduce((best, v, i) => (v > SAMPLES[best]! ? i : best), 0);

export function MaterialSpringPreview() {
  const [run, setRun] = useState(0);
  const pill = useRef<HTMLDivElement>(null);
  const path = SAMPLES.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  // The pill travels on the same spring the curve plots, so the overshoot is visible twice.
  useEffect(() => {
    const element = pill.current;
    const track = element?.parentElement;
    if (!element || !track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const distance = track.clientWidth - element.offsetWidth;
    const animation = element.animate([{ translate: "0 0" }, { translate: `${distance}px 0` }], { duration: DURATION, easing: liquidSpring, fill: "forwards" });
    return () => animation.cancel();
  }, [run]);

  return (
    <div className="material-demo__spring">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The shared spring over ${DURATION} ms. It overshoots its target by ${Math.round((SAMPLES[peak]! - 1) * 100)} percent, then settles.`}>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className={v === 1 ? "material-demo__target" : "material-demo__grid"} />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="material-demo__axis">
              {v}
            </text>
          </g>
        ))}
        {[0, 300, 600].map((ms) => (
          <text key={ms} x={PAD.left + (ms / DURATION) * (W - PAD.left - PAD.right)} y={H - 8} textAnchor="middle" className="material-demo__axis">
            {ms} ms
          </text>
        ))}
        <path d={path} className="material-demo__curve" />
        <circle cx={x(peak)} cy={y(SAMPLES[peak]!)} r="4" className="material-demo__peak" />
        <text x={x(peak) + 8} y={y(SAMPLES[peak]!) - 8} className="material-demo__note">
          {Math.round((SAMPLES[peak]! - 1) * 100)}% past the target
        </text>
        <circle key={run} r="6" className="material-demo__dot">
          <animateMotion dur={`${DURATION}ms`} fill="freeze" path={path} calcMode="linear" />
        </circle>
      </svg>
      <div className="material-demo__track">
        <LiquidGlass ref={pill} className="material-demo__pill">
          Spring
        </LiquidGlass>
      </div>
      <button type="button" className="material-demo__replay" onClick={() => setRun((n) => n + 1)}>
        <RotateCcw aria-hidden="true" />
        Replay
      </button>
    </div>
  );
}

/** Two shapes in one group fuse when they come closer than `merge`, and pull apart again. */
const MERGE = 18;
export function MaterialMergePreview() {
  // Centre-to-centre distance. The shapes are 72px wide, so at 40 they overlap by 32px
  // and read as one rounded rectangle; drag right and it splits into two circles.
  const [spread, setSpread] = useState([40]);
  const value = spread[0]!;
  const gap = Math.round(value - 72);
  return (
    <div className="material-demo__merge">
      <LiquidGlassGroup merge={MERGE} className="material-demo__pair">
        <LiquidGlass className="material-demo__blob" style={{ translate: `${-value / 2}px 0` }} />
        <LiquidGlass className="material-demo__blob" style={{ translate: `${value / 2}px 0` }} />
      </LiquidGlassGroup>
      <label className="material-demo__control">
        <span aria-live="polite">
          Gap {gap} px, {gap < MERGE ? "fused" : "apart"}
        </span>
        <LiquidSlider value={spread} onValueChange={setSpread} min={40} max={140} tint="#fff" aria-label="Distance between the shapes" />
      </label>
    </div>
  );
}

const TIERS = [
  { name: "Panel", use: "Menus, popovers, drawers", material: liquidPanelMaterial },
  { name: "Chrome", use: "Toolbars and tab bars", material: liquidChromeMaterial },
  { name: "Fill", use: "Fields and steppers", material: liquidFillMaterial },
];

/** The three materials every component draws from. */
export function MaterialTiersPreview() {
  return (
    <div className="material-demo__tiers">
      {TIERS.map((tier) => (
        <LiquidGlass key={tier.name} className={`material-demo__tier ${tier.material}`}>
          <strong>{tier.name}</strong>
          <small>{tier.use}</small>
        </LiquidGlass>
      ))}
    </div>
  );
}
