"use client";

import {
  LiquidDrawer,
  LiquidDrawerClose,
  LiquidDrawerContent,
  LiquidDrawerDescription,
  LiquidDrawerTitle,
  LiquidGlass,
  LiquidMenu,
  LiquidMenuContent,
  LiquidMenuItem,
  LiquidMenuTrigger,
  LiquidPageControl,
  LiquidProgress,
  LiquidProgressRing,
  LiquidSearchField,
  LiquidSlider,
  LiquidSpinner,
  LiquidStepper,
  LiquidSwitch,
  LiquidTabBar,
  LiquidTabBarItem,
  LiquidTabs,
  LiquidTabsList,
  LiquidTabsTrigger,
  LiquidToolbar,
  LiquidToolbarButton,
  LiquidToolbarGroup,
} from "@liquid-ui/core";
import { Bold, Check, ChevronLeft, ChevronRight, Droplet, Images, Italic, Monitor, Moon, RotateCcw, Share, Shuffle, SquareStack, Sun, Underline, Users, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { ACCENTS, DEFAULT_THEME, GLASSES, accentOf, applyTheme, loadTheme, themeCss, type ThemeSettings } from "./settings";

type Option = { value: string; label: string; swatch?: string; icon?: React.ReactNode };

/** One row of the panel: a label, the current value, and a menu of choices. */
function Setting({ label, value, icon, options, onChange }: { label: string; value: string; icon: React.ReactNode; options: Option[]; onChange: (value: string) => void }) {
  const current = options.find((option) => option.value === value);
  return (
    <LiquidMenu>
      <LiquidMenuTrigger asChild>
        <button type="button" className="theme-studio__row">
          <span>
            <small>{label}</small>
            <strong>{current?.label ?? value}</strong>
          </span>
          {icon}
        </button>
      </LiquidMenuTrigger>
      <LiquidMenuContent side="right" align="start" sideOffset={10} className="min-w-[180px]">
        {options.map((option) => (
          <LiquidMenuItem key={option.value} onSelect={() => onChange(option.value)}>
            {option.swatch ? <i className="theme-studio__swatch" style={{ background: option.swatch }} aria-hidden="true" /> : option.icon}
            {option.label}
            {option.value === value && <Check className="ml-auto !text-current" aria-hidden="true" />}
          </LiquidMenuItem>
        ))}
      </LiquidMenuContent>
    </LiquidMenu>
  );
}

/** The real components, re-themed live by the panel. */
function Preview() {
  const [brightness, setBrightness] = useState([68]);
  const [night, setNight] = useState(true);
  const [page, setPage] = useState(1);
  return (
    <div className="theme-studio__grid">
      <section className="theme-studio__card">
        <h3>Display</h3>
        <label className="theme-studio__line">
          Brightness
          <LiquidSlider value={brightness} onValueChange={setBrightness} aria-label="Brightness" className="theme-studio__slider" />
        </label>
        <label className="theme-studio__line">
          Night Shift
          <LiquidSwitch checked={night} onCheckedChange={setNight} tint="var(--liquid-accent)" aria-label="Night Shift" />
        </label>
      </section>

      <section className="theme-studio__card theme-studio__card--photo" style={{ backgroundImage: "url(/photos/wide/1043.webp)" }}>
        <LiquidTabBar aria-label="Photos" defaultValue="library">
          <LiquidTabBarItem value="library" icon={<Images aria-hidden="true" />}>Library</LiquidTabBarItem>
          <LiquidTabBarItem value="albums" icon={<SquareStack aria-hidden="true" />}>Albums</LiquidTabBarItem>
          <LiquidTabBarItem value="shared" icon={<Users aria-hidden="true" />} badge={2}>Shared</LiquidTabBarItem>
        </LiquidTabBar>
      </section>

      <section className="theme-studio__card">
        <h3>Range</h3>
        <LiquidTabs defaultValue="week" className="w-auto">
          <LiquidTabsList aria-label="Range" className="w-full min-w-0">
            <LiquidTabsTrigger value="day">Day</LiquidTabsTrigger>
            <LiquidTabsTrigger value="week">Week</LiquidTabsTrigger>
            <LiquidTabsTrigger value="month">Month</LiquidTabsTrigger>
          </LiquidTabsList>
        </LiquidTabs>
        <div className="theme-studio__line">
          Guests
          <LiquidStepper defaultValue={2} min={1} max={8} aria-label="Guests" />
        </div>
      </section>

      <section className="theme-studio__card theme-studio__card--photo" style={{ backgroundImage: "url(/photos/wide/1015.webp)" }}>
        <LiquidToolbar aria-label="Formatting">
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Back"><ChevronLeft aria-hidden="true" /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Forward"><ChevronRight aria-hidden="true" /></LiquidToolbarButton>
          </LiquidToolbarGroup>
          <LiquidToolbarGroup>
            <LiquidToolbarButton aria-label="Bold"><Bold aria-hidden="true" /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Italic"><Italic aria-hidden="true" /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Underline"><Underline aria-hidden="true" /></LiquidToolbarButton>
            <LiquidToolbarButton aria-label="Share"><Share aria-hidden="true" /></LiquidToolbarButton>
          </LiquidToolbarGroup>
        </LiquidToolbar>
        <LiquidPageControl count={5} value={page} onValueChange={setPage} aria-label="Page" className="theme-studio__pager" />
      </section>

      <section className="theme-studio__card">
        <h3>Upload</h3>
        <LiquidProgress value={62} aria-label="Upload" />
        <div className="theme-studio__line">
          <span className="theme-studio__muted">3.1 of 5 MB</span>
          <span className="theme-studio__icons">
            <LiquidProgressRing value={62} aria-label="Download" />
            <LiquidSpinner />
          </span>
        </div>
      </section>

      <section className="theme-studio__card theme-studio__card--photo" style={{ backgroundImage: "url(/photos/wide/49.webp)" }}>
        <LiquidGlass className="theme-studio__panel-sample">
          <strong>Panel glass</strong>
          <small>Menus, popovers, alerts and drawers use this.</small>
        </LiquidGlass>
      </section>

      <section className="theme-studio__card">
        <h3>Search</h3>
        <LiquidSearchField placeholder="Search photos" />
      </section>
    </div>
  );
}

/** Pick an accent, a glass and a mode; everything on the site follows, and Get code hands you the CSS. */
export function ThemeStudio() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  const copyCss = () => {
    const settle = (state: "copied" | "failed") => {
      setCopy(state);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopy("idle"), 1800);
    };
    if (!navigator.clipboard) return settle("failed");
    navigator.clipboard.writeText(css).then(() => settle("copied"), () => settle("failed"));
  };

  useEffect(() => setSettings(loadTheme()), []);

  const update = (change: Partial<ThemeSettings>) => {
    const next = { ...settings, ...change };
    setSettings(next);
    applyTheme(next);
  };
  const shuffle = () => {
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;
    update({ accent: pick(ACCENTS).name, glass: pick(GLASSES).name });
  };
  const accent = accentOf(settings);
  const css = themeCss(settings);

  return (
    <div className="theme-studio not-prose">
      <aside className="theme-studio__controls" aria-label="Theme settings">
        <Setting
          label="Accent"
          value={settings.accent}
          icon={<i className="theme-studio__swatch" style={{ background: accent.light }} aria-hidden="true" />}
          options={ACCENTS.map((entry) => ({ value: entry.name, label: entry.name, swatch: entry.light }))}
          onChange={(value) => update({ accent: value })}
        />
        <Setting
          label="Glass"
          value={settings.glass}
          icon={<Droplet className="theme-studio__icon" aria-hidden="true" />}
          options={GLASSES.map((entry) => ({ value: entry.name, label: entry.name, icon: <Droplet aria-hidden="true" /> }))}
          onChange={(value) => update({ glass: value })}
        />
        {/* Three choices, one tap: a segmented control, so nothing is animating when the page changes mode. */}
        <div className="theme-studio__mode">
          <small>Mode</small>
          <LiquidTabs value={theme ?? "light"} onValueChange={setTheme} className="w-auto">
            <LiquidTabsList aria-label="Mode" size="small" className="w-full min-w-0">
              <LiquidTabsTrigger value="light" aria-label="Light">
                <Sun aria-hidden="true" />
              </LiquidTabsTrigger>
              <LiquidTabsTrigger value="dark" aria-label="Dark">
                <Moon aria-hidden="true" />
              </LiquidTabsTrigger>
              <LiquidTabsTrigger value="system" aria-label="System">
                <Monitor aria-hidden="true" />
              </LiquidTabsTrigger>
            </LiquidTabsList>
          </LiquidTabs>
        </div>
        <div className="theme-studio__actions">
          <button type="button" className="theme-studio__action" onClick={shuffle}>
            <Shuffle aria-hidden="true" />
            Shuffle
          </button>
          <button type="button" className="theme-studio__action" onClick={() => update(DEFAULT_THEME)}>
            <RotateCcw aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="theme-studio__action theme-studio__action--primary" onClick={() => setCodeOpen(true)}>
            Get code
          </button>
        </div>
      </aside>

      <Preview />

      <LiquidDrawer open={codeOpen} onOpenChange={setCodeOpen}>
        <LiquidDrawerContent>
          <div className="theme-studio__code-head">
            <div>
              <LiquidDrawerTitle>Theme</LiquidDrawerTitle>
              <LiquidDrawerDescription>Paste this into your global CSS. The components read these variables.</LiquidDrawerDescription>
            </div>
            <LiquidDrawerClose className="theme-studio__close" aria-label="Close">
              <X aria-hidden="true" />
            </LiquidDrawerClose>
          </div>
          <pre className="theme-studio__code">
            <code>{css}</code>
          </pre>
          {/* The button itself confirms: it turns green with a check, then settles back. */}
          <button
            type="button"
            className="theme-studio__action theme-studio__action--primary theme-studio__copy"
            data-state={copy}
            aria-live="polite"
            onClick={copyCss}
          >
            {copy === "copied" ? (
              <>
                <Check key="check" className="theme-studio__check" aria-hidden="true" />
                Copied
              </>
            ) : copy === "failed" ? (
              "Couldn't copy"
            ) : (
              "Copy"
            )}
          </button>
        </LiquidDrawerContent>
      </LiquidDrawer>
    </div>
  );
}
