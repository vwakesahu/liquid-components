// Theme settings shared by the theme page and every other page. The CSS built
// here is both what the site applies and what "Get code" hands you.

export type Accent = { name: string; light: string; dark: string };
export type Glass = { name: string; panel: [number, number]; chrome: [number, number]; fill: [number, number] };
export type ThemeSettings = { accent: string; glass: string };

export const ACCENTS: Accent[] = [
  { name: "Blue", light: "#0a8ad0", dark: "#69d7ff" },
  { name: "Indigo", light: "#4f5bd5", dark: "#8b95ff" },
  { name: "Violet", light: "#6e56cf", dark: "#a98bff" },
  { name: "Pink", light: "#c2255c", dark: "#ff6b9d" },
  { name: "Red", light: "#d93036", dark: "#ff6369" },
  { name: "Orange", light: "#c2560c", dark: "#ff9f0a" },
  { name: "Amber", light: "#a16207", dark: "#ffd60a" },
  { name: "Green", light: "#1f8a4c", dark: "#34c759" },
  { name: "Teal", light: "#0f7c80", dark: "#40c8e0" },
  { name: "Graphite", light: "#3f3f46", dark: "#d4d4d8" },
];

// Tint opacities per material, [light, dark].
export const GLASSES: Glass[] = [
  { name: "Clear", panel: [0.5, 0.5], chrome: [0.32, 0.34], fill: [0.1, 0.2] },
  { name: "Regular", panel: [0.66, 0.68], chrome: [0.5, 0.52], fill: [0.14, 0.26] },
  { name: "Frosted", panel: [0.82, 0.84], chrome: [0.68, 0.7], fill: [0.2, 0.34] },
];

export const DEFAULT_THEME: ThemeSettings = { accent: "Blue", glass: "Regular" };
const KEY = "liquid-theme";
const STYLE_ID = "liquid-theme";

export const accentOf = (settings: ThemeSettings) => ACCENTS.find((entry) => entry.name === settings.accent) ?? ACCENTS[0]!;
export const glassOf = (settings: ThemeSettings) => GLASSES.find((entry) => entry.name === settings.glass) ?? GLASSES[1]!;
export const isDefault = (settings: ThemeSettings) => settings.accent === DEFAULT_THEME.accent && settings.glass === DEFAULT_THEME.glass;

/** The variables Liquid UI components read, for :root and .dark. */
export function themeCss(settings: ThemeSettings) {
  const accent = accentOf(settings);
  const glass = glassOf(settings);
  return `:root {
  --liquid-accent: ${accent.light};
  --liquid-panel-tint: rgba(255, 255, 255, ${glass.panel[0]});
  --liquid-chrome-tint: rgba(255, 255, 255, ${glass.chrome[0]});
  --liquid-fill-tint: rgba(118, 118, 128, ${glass.fill[0]});
}

.dark {
  --liquid-accent: ${accent.dark};
  --liquid-panel-tint: rgba(30, 29, 36, ${glass.panel[1]});
  --liquid-chrome-tint: rgba(40, 39, 48, ${glass.chrome[1]});
  --liquid-fill-tint: rgba(118, 118, 128, ${glass.fill[1]});
}
`;
}

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
};

/** The docs site's own colours, so the call to action, links and the active page follow the accent too. */
export function siteCss(settings: ThemeSettings) {
  const accent = accentOf(settings);
  return `:root {
  --accent-ink: ${accent.light};
  --accent-soft: rgb(${rgb(accent.light)} / 0.14);
  --cta-bg: ${accent.light};
  --cta-ink: #ffffff;
}

.dark {
  --accent-ink: ${accent.dark};
  --accent-soft: rgb(${rgb(accent.dark)} / 0.16);
  --cta-bg: ${accent.dark};
  --cta-ink: #0b0b0c;
}
`;
}

export function loadTheme(): ThemeSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ThemeSettings> | null;
    if (saved && typeof saved.accent === "string" && typeof saved.glass === "string") return { accent: saved.accent, glass: saved.glass };
  } catch {
    // Blocked or broken storage falls back to the default theme.
  }
  return DEFAULT_THEME;
}

/** Applies the theme to the page and remembers it. The default theme removes the override. */
export function applyTheme(settings: ThemeSettings, remember = true) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (isDefault(settings)) {
    style?.remove();
  } else {
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    // The whole site follows: the components' variables plus the site's own accent colours.
    style.textContent = themeCss(settings) + "\n" + siteCss(settings);
  }
  if (!remember) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Applied, just not remembered.
  }
  window.dispatchEvent(new Event("liquid-theme"));
}
