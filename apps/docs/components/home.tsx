"use client";

import {
  AlarmClock,
  ArrowRight,
  Bell,
  Droplet,
  Ellipsis,
  Loader,
  Menu,
  MessageCircle,
  MessageSquare,
  Mountain,
  MousePointerClick,
  PanelBottom,
  PanelBottomOpen,
  PanelTop,
  PanelsTopLeft,
  Pill,
  Play,
  Plus,
  RectangleHorizontal,
  Search,
  SlidersHorizontal,
  Sun,
  ToggleRight,
  Trees,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { LiquidGlass, LiquidSlider, LiquidSwitch, LiquidTabBar, LiquidTabBarItem } from "@liquid-ui/core";
import { useEffect, useRef, useState } from "react";
import { contents } from "./sidebar-content";

type Icon = typeof Search;

/* Hero --------------------------------------------------------------------- */

/**
 * The film is the components themselves, recorded on real photos with a scripted
 * hand and cut in the video harness. People who prefer less motion get its poster.
 */
function HeroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (!element) return;
      if (query.matches) element.pause();
      else element.play().catch(() => undefined);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return (
    <div className="home-film">
      <video ref={video} className="home-film__video" poster="/hero/poster.jpg" muted loop playsInline preload="auto" aria-label="The tab bar, controls, drawer and Dynamic Island in use, recorded on photos">
        <source src="/hero/hero.webm" type="video/webm" />
        <source src="/hero/hero.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="home-hero not-prose">
      <h1 className="home-hero__title">Liquid Glass for the web</h1>
      <p className="home-hero__lead">
        iOS 26 controls for React, with real refraction and real springs. Radix handles the accessibility, and the shadcn CLI drops the source into your project.
      </p>
      <div className="home-hero__actions">
        <Link href="/docs/installation" className="home-pill home-pill--dark">
          Get started
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="#components" className="home-pill">
          Browse components
        </Link>
      </div>
      <HeroFilm />
      <p className="home-hero__caption">Recorded from the components on this site.</p>
    </section>
  );
}

/* Try it --------------------------------------------------------------------- */

const SCENES = [
  { value: "fjord", label: "Fjord", icon: Mountain, photo: "1015" },
  { value: "valley", label: "Valley", icon: Trees, photo: "1043" },
  { value: "island", label: "Island", icon: Sun, photo: "49" },
];

/** Real glass over a real photo, and every control does something to it. */
export function HomePlayground() {
  const [scene, setScene] = useState("valley");
  const [brightness, setBrightness] = useState([72]);
  const [warm, setWarm] = useState(false);
  const photo = SCENES.find((entry) => entry.value === scene)?.photo ?? "1043";
  const filter = `brightness(${0.45 + (brightness[0]! / 100) * 0.7}) ${warm ? "sepia(.28) saturate(1.15)" : ""}`;

  return (
    <section className="home-try not-prose">
      <h2 className="home-gallery__title">Try it</h2>
      <p className="home-gallery__lead">Drag the slider, flip the switch, slide across the tab bar.</p>
      <div className="home-stage">
        {SCENES.map((entry) => (
          <img
            key={entry.value}
            src={`/photos/wide/${entry.photo}.webp`}
            alt=""
            width={960}
            height={600}
            className="home-stage__photo"
            data-shown={entry.photo === photo || undefined}
            style={{ filter }}
          />
        ))}
        <LiquidGlass className="home-stage__card" lens={{ frost: 6 }}>
          <label className="home-stage__row">
            <span>Brightness</span>
            <LiquidSlider value={brightness} onValueChange={setBrightness} size="small" tint="#fff" aria-label="Brightness" />
          </label>
          <label className="home-stage__row home-stage__row--inline">
            <span>Night Shift</span>
            <LiquidSwitch checked={warm} onCheckedChange={setWarm} size="small" tint="var(--liquid-accent)" aria-label="Night Shift" />
          </label>
        </LiquidGlass>
        <div className="home-stage__dock">
          <LiquidTabBar aria-label="Scene" value={scene} onValueChange={setScene}>
            {SCENES.map((entry) => (
              <LiquidTabBarItem key={entry.value} value={entry.value} icon={<entry.icon aria-hidden="true" />}>
                {entry.label}
              </LiquidTabBarItem>
            ))}
          </LiquidTabBar>
        </div>
      </div>
    </section>
  );
}

/* Gallery ------------------------------------------------------------------ */

// One photo and one symbol per component; photographers are on the credits page.
const CARDS: Record<string, { photo: string; icon: Icon }> = {
  Button: { photo: "1080", icon: RectangleHorizontal },
  Switch: { photo: "1050", icon: ToggleRight },
  Slider: { photo: "1018", icon: SlidersHorizontal },
  Stepper: { photo: "1060", icon: Plus },
  "Wheel picker": { photo: "1067", icon: AlarmClock },
  Tabs: { photo: "13", icon: PanelsTopLeft },
  "Tab bar": { photo: "1043", icon: PanelBottom },
  "Page control": { photo: "49", icon: Ellipsis },
  Progress: { photo: "16", icon: Loader },
  Glass: { photo: "1015", icon: Droplet },
  Toolbar: { photo: "57", icon: PanelTop },
  Menu: { photo: "1047", icon: Menu },
  "Context menu": { photo: "37", icon: MousePointerClick },
  Popover: { photo: "1036", icon: MessageSquare },
  Tooltip: { photo: "29", icon: MessageCircle },
  Toast: { photo: "1053", icon: Bell },
  Drawer: { photo: "11", icon: PanelBottomOpen },
  Alert: { photo: "43", icon: TriangleAlert },
  "Search field": { photo: "1084", icon: Search },
  "Dynamic Island": { photo: "1022", icon: Pill },
  "Video player": { photo: "1069", icon: Play },
};

export function ComponentGallery() {
  const components = contents.find((section) => section.title === "Components")?.list ?? [];
  return (
    <section id="components" className="home-gallery not-prose">
      <h2 className="home-gallery__title">Components</h2>
      <p className="home-gallery__lead">Each one has a page with live examples you can use.</p>
      <ul className="home-gallery__grid">
        {components.map((item) => {
          const card = CARDS[item.title];
          if (!item.href || !card) return null;
          return (
            <li key={item.href}>
              <Link href={item.href} className="home-card">
                <img src={`/photos/${card.photo}.webp`} alt="" width={400} height={400} loading="lazy" />
                <LiquidGlass className="home-card__label" lens={{ frost: 8, refraction: 9, shadow: 0.04 }}>
                  <card.icon aria-hidden="true" />
                  {item.title}
                </LiquidGlass>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
