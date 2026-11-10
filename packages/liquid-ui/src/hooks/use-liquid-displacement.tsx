"use client";

import { useId, useLayoutEffect, useMemo, useRef } from "react";

/**
 * Liquid displacement renderer.
 *
 * The glass never samples pixels from underneath itself. Instead, a component's
 * own content (its track, labels, or surface) is filtered in place, and a
 * generated lens map is positioned over whichever element acts as the lens.
 *
 *   lens element moves      → only the map's position changes
 *   lens element reshapes   → a new map is generated (cached by size)
 *   any filter change       → a fresh filter id (Safari caches by id)
 *
 * The map encodes:
 *   R/G — outward refraction offset along the rim normal (128 = no movement)
 *   B   — baked rim lighting (128 = neutral, brighter = highlight, darker = shade)
 *   A   — the lens silhouette (anti-aliased rounded rectangle)
 */

export type LiquidLensOptions = {
  /** Corner radius used to generate the lens; defaults to the lens element's own radius. */
  borderRadius?: number;
  /**
   * Strongest refraction offset as a fraction of the lens's smaller dimension.
   * Positive values compress the surroundings into the rim (a glass bead over a
   * track); negative values magnify the content under the lens (a swelling button).
   */
  scale?: number;
  /** Opacity of the soft shadow the glass casts while engaged, 0–1. */
  shadow?: number;
  /** Relief of the lighting normal field, 0–100. Controls the shaded side of the rim. */
  depth?: number;
  /** Width of the bending bezel as a percentage of half the lens's smaller dimension. */
  curvature?: number;
  /** Exponent shaping how quickly refraction fades from the rim toward the center. */
  splay?: number;
  /** Chromatic dispersion between the red, green, and blue refraction passes, 0–1. */
  chroma?: number;
  /** Blur applied to the refracted pixels, in CSS pixels. */
  blur?: number;
  /** Strength of the soft inner glow along the bezel, 0–1. */
  glow?: number;
  /** Strength of the specular rim highlight, 0–1. */
  edgeHighlight?: number;
  /** Direction the light comes from, in degrees: 0 = left, 45 = top-left, 90 = top. */
  specularAngle?: number;
  /** How tightly the highlight hugs the rim; higher is thinner. Dark themes use a tight rim. */
  rimSpread?: number;
};

export const liquidLensPresets = {
  button: {
    scale: -0.2,
    shadow: 0.08,
    depth: 10,
    curvature: 50,
    splay: 1.6,
    chroma: 0.2,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.55,
    specularAngle: 45,
  },
  switch: {
    scale: 0.28,
    shadow: 0.1,
    depth: 16,
    curvature: 100,
    splay: 1.5,
    chroma: 0.3,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.6,
    specularAngle: 45,
  },
  slider: {
    scale: 0.26,
    shadow: 0.1,
    depth: 14,
    curvature: 100,
    splay: 1.5,
    chroma: 0.2,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.6,
    specularAngle: 45,
  },
  tabs: {
    scale: 0.2,
    shadow: 0.06,
    depth: 10,
    curvature: 80,
    splay: 1.7,
    chroma: 0.1,
    blur: 0,
    glow: 0.08,
    edgeHighlight: 0.5,
    specularAngle: 45,
  },
  video: {
    scale: 0.22,
    shadow: 0,
    depth: 14,
    curvature: 70,
    splay: 1.6,
    chroma: 0.4,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.5,
    specularAngle: 45,
  },
} satisfies Record<string, LiquidLensOptions>;

export type ResolvedLiquidLensOptions = Required<Omit<LiquidLensOptions, "borderRadius">> & {
  borderRadius?: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function resolveLiquidLensOptions(options: LiquidLensOptions = {}): ResolvedLiquidLensOptions {
  return {
    borderRadius: options.borderRadius,
    scale: clamp(options.scale ?? 0.3, -1, 1),
    shadow: clamp(options.shadow ?? 0.1, 0, 1),
    depth: clamp(options.depth ?? 30, 0, 100),
    curvature: clamp(options.curvature ?? 100, 1, 100),
    splay: clamp(options.splay ?? 1.5, 0.1, 8),
    chroma: clamp(options.chroma ?? 0.3, 0, 1),
    blur: Math.max(0, options.blur ?? 0),
    glow: clamp(options.glow ?? 0.1, 0, 1),
    edgeHighlight: clamp(options.edgeHighlight ?? 0.5, 0, 1),
    specularAngle: options.specularAngle ?? 45,
    rimSpread: clamp(options.rimSpread ?? 2, 0.5, 12),
  };
}

const lensOptionsKey = (options: ResolvedLiquidLensOptions) =>
  [
    options.borderRadius ?? "auto",
    options.scale,
    options.shadow,
    options.depth,
    options.curvature,
    options.splay,
    options.chroma,
    options.blur,
    options.glow,
    options.edgeHighlight,
    options.specularAngle,
    options.rimSpread,
  ].join(",");

/**
 * Generates one lens map as raw RGBA pixels. Only the top-left quadrant runs the
 * signed-distance field; the other three quadrants are mirrored from it.
 */
export function renderLiquidLensMap(
  cssWidth: number,
  cssHeight: number,
  lensOptions: LiquidLensOptions,
  pixelRatio = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1),
) {
  const options = resolveLiquidLensOptions(lensOptions);
  const width = Math.max(2, Math.round(cssWidth * pixelRatio));
  const height = Math.max(2, Math.round(cssHeight * pixelRatio));
  const data = new Uint8ClampedArray(width * height * 4);

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(
    Math.min(halfWidth, halfHeight),
    (options.borderRadius ?? Math.min(cssWidth, cssHeight) / 2) * pixelRatio,
  );
  const innerX = halfWidth - radius;
  const innerY = halfHeight - radius;
  const bezel = Math.max(1, Math.min(halfWidth, halfHeight) * (options.curvature / 100));
  const rimWidth = 1.1 * pixelRatio;
  const relief = options.depth / 100;
  const angle = (options.specularAngle * Math.PI) / 180;
  // Vector pointing toward the light in screen space (y grows downward).
  const lightX = -Math.cos(angle);
  const lightY = -Math.sin(angle);

  const lighting = (normalX: number, normalY: number, t: number, depthInside: number) => {
    const facing = normalX * lightX + normalY * lightY;
    // Highlight spreads across the bezel; shade stays on the outermost edge.
    const slope = Math.pow(1 - t, facing > 0 ? options.rimSpread : 4);
    const directional = facing * slope * (facing > 0 ? options.edgeHighlight : relief);
    const rim = Math.exp(-depthInside / rimWidth) * options.edgeHighlight * (0.35 + 0.65 * Math.max(0, facing));
    const glow = options.glow * Math.pow(1 - t, 3);
    return clamp(directional + rim + glow, -1, 1);
  };

  const write = (
    pixelX: number,
    pixelY: number,
    offsetX: number,
    offsetY: number,
    light: number,
    alpha: number,
  ) => {
    const index = (pixelY * width + pixelX) * 4;
    data[index] = 128 + offsetX * 127;
    data[index + 1] = 128 + offsetY * 127;
    data[index + 2] = 128 + light * 127;
    data[index + 3] = alpha;
  };

  const quadrantWidth = Math.ceil(halfWidth);
  const quadrantHeight = Math.ceil(halfHeight);
  for (let y = 0; y < quadrantHeight; y += 1) {
    for (let x = 0; x < quadrantWidth; x += 1) {
      // Pixel center relative to the lens center; always in the top-left quadrant.
      const centeredX = x + 0.5 - halfWidth;
      const centeredY = y + 0.5 - halfHeight;
      const qx = -centeredX - innerX;
      const qy = -centeredY - innerY;
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
      const distance = outside + Math.min(Math.max(qx, qy), 0) - radius;
      const mirrorX = width - 1 - x;
      const mirrorY = height - 1 - y;

      if (distance > 0.5) {
        write(x, y, 0, 0, 0, 0);
        write(mirrorX, y, 0, 0, 0, 0);
        write(x, mirrorY, 0, 0, 0, 0);
        write(mirrorX, mirrorY, 0, 0, 0, 0);
        continue;
      }

      // Outward normal of the silhouette for the top-left quadrant.
      let normalX: number;
      let normalY: number;
      if (qx > 0 && qy > 0) {
        normalX = -qx / outside;
        normalY = -qy / outside;
      } else if (qx > qy) {
        normalX = -1;
        normalY = 0;
      } else {
        normalX = 0;
        normalY = -1;
      }

      const depthInside = Math.max(0, -distance);
      const t = Math.min(1, depthInside / bezel);
      const bend = Math.pow(1 - t, options.splay);
      const alpha = Math.round(clamp(0.5 - distance, 0, 1) * 255);
      // The bezel samples outward, compressing the surroundings into the rim the
      // way a glass bead bends what sits around it.
      const offsetX = normalX * bend;
      const offsetY = normalY * bend;

      write(x, y, offsetX, offsetY, lighting(normalX, normalY, t, depthInside), alpha);
      write(mirrorX, y, -offsetX, offsetY, lighting(-normalX, normalY, t, depthInside), alpha);
      write(x, mirrorY, offsetX, -offsetY, lighting(normalX, -normalY, t, depthInside), alpha);
      write(mirrorX, mirrorY, -offsetX, -offsetY, lighting(-normalX, -normalY, t, depthInside), alpha);
    }
  }

  return new ImageData(data, width, height);
}

let encoderCanvas: HTMLCanvasElement | null = null;
const mapUrlCache = new Map<string, string>();
const MAP_CACHE_LIMIT = 96;

/** Generates a lens map and encodes it as a PNG data URL for SVG feImage. */
export function generateLiquidLensMap(
  cssWidth: number,
  cssHeight: number,
  lensOptions: LiquidLensOptions,
  pixelRatio = Math.min(2, window.devicePixelRatio || 1),
) {
  const options = resolveLiquidLensOptions(lensOptions);
  const key = `${Math.round(cssWidth * pixelRatio)}x${Math.round(cssHeight * pixelRatio)}@${pixelRatio}|${lensOptionsKey(options)}`;
  const cached = mapUrlCache.get(key);
  if (cached) {
    mapUrlCache.delete(key);
    mapUrlCache.set(key, cached);
    return cached;
  }
  const image = renderLiquidLensMap(cssWidth, cssHeight, options, pixelRatio);
  encoderCanvas ??= document.createElement("canvas");
  encoderCanvas.width = image.width;
  encoderCanvas.height = image.height;
  const context = encoderCanvas.getContext("2d");
  if (!context) return "";
  context.putImageData(image, 0, 0);
  const url = encoderCanvas.toDataURL("image/png");
  mapUrlCache.set(key, url);
  if (mapUrlCache.size > MAP_CACHE_LIMIT) {
    const oldest = mapUrlCache.keys().next().value;
    if (oldest !== undefined) mapUrlCache.delete(oldest);
  }
  return url;
}

/**
 * Safari (and every iOS browser, which all use WebKit) caches SVG filter output
 * by id, so it needs a fresh id per update. Elsewhere a stable id lets the
 * browser update the filter in place instead of rebuilding it every frame.
 */
export const needsFreshFilterIds = () =>
  typeof navigator !== "undefined" &&
  /AppleWebKit/.test(navigator.userAgent) &&
  !(navigator as Navigator & { userAgentData?: unknown }).userAgentData;

const SVG_NS = "http://www.w3.org/2000/svg";

export function svgNode<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  return node;
}

type LensSlot = {
  image: SVGFEImageElement;
  key: string;
  appliedKey: string;
  ready: boolean;
};

type Rect = { x: number; y: number; width: number; height: number };

type EngineConfig = {
  id: string;
  options: ResolvedLiquidLensOptions;
  lensSelector: string;
  activeAttribute: string;
};

/**
 * Rim-light strength for the current theme, from `--liquid-glass-highlight`
 * (1 on light pages, low on dark ones). Glow fades with its square and the
 * highlight tightens to a thin line, so dark glass never looks milky.
 */
export function readLiquidHighlight(element: Element) {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue("--liquid-glass-highlight"));
  return Number.isFinite(value) ? clamp(value, 0, 1) : 1;
}

export const themeLighting = <T extends { edgeHighlight: number; glow: number }>(options: T, strength: number) => ({
  ...options,
  edgeHighlight: options.edgeHighlight * strength,
  glow: options.glow * strength * strength,
  rimSpread: 2 + (1 - strength) * 5,
});

/** Cast shadows only read on light pages; on dark ones they just darken the glass. */
export const themeShadow = (shadow: number, strength: number) => shadow * strength;

/** Tailwind tokens: full rim light on light pages, a quiet thin rim on dark ones. */
export const liquidLightTokens =
  "[--liquid-glass-highlight:1] [--liquid-lens-tint:transparent] dark:[--liquid-glass-highlight:.18] dark:[--liquid-lens-tint:rgba(255,255,255,.1)]";

/** Sizes are quantized so that springy squish animations reuse cached maps. */
const quantize = (value: number) => Math.max(2, Math.round(value / 2) * 2);

const parseScaleProperty = (value: string): [number, number] => {
  if (!value || value === "none") return [1, 1];
  const [x, y] = value.split(/\s+/).map((part) =>
    part.endsWith("%") ? Number.parseFloat(part) / 100 : Number.parseFloat(part),
  );
  const scaleX = Number.isFinite(x) ? x! : 1;
  return [scaleX, Number.isFinite(y) ? y! : scaleX];
};

const parseTransformScale = (value: string): [number, number] => {
  if (!value || value === "none") return [1, 1];
  const numbers = value.slice(value.indexOf("(") + 1, -1).split(",").map(Number.parseFloat);
  const [scaleX, scaleY] = value.startsWith("matrix3d")
    ? [numbers[0], numbers[5]]
    : [numbers[0], numbers[3]];
  return [Math.abs(scaleX ?? 1) || 1, Math.abs(scaleY ?? 1) || 1];
};

/**
 * Measures a lens in the surface's coordinate space. Width and height come from
 * the layout box multiplied by the element's own `scale` and transform scale, so
 * skew never inflates the lens and uniform growth keeps its proportions.
 */
export function measureLens(element: HTMLElement, surfaceBounds: DOMRect, localScale: number) {
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const [propertyX, propertyY] = parseScaleProperty(style.scale);
  const [matrixX, matrixY] = parseTransformScale(style.transform);
  const scaleX = propertyX * matrixX;
  const scaleY = propertyY * matrixY;
  const width = (element.offsetWidth || bounds.width * localScale) * scaleX;
  const height = (element.offsetHeight || bounds.height * localScale) * scaleY;
  const centerX = (bounds.left + bounds.width / 2 - surfaceBounds.left) * localScale;
  const centerY = (bounds.top + bounds.height / 2 - surfaceBounds.top) * localScale;
  const cssRadius = Number.parseFloat(style.borderTopLeftRadius);
  const radius = Number.isFinite(cssRadius) ? cssRadius * Math.min(scaleX, scaleY) : Infinity;
  return { x: centerX - width / 2, y: centerY - height / 2, width, height, radius };
}

function attachLiquidRefraction(surface: HTMLElement, svg: SVGSVGElement, config: EngineConfig) {
  const { options } = config;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");
  const chromaSpread = options.chroma * 0.25;
  const freshIds = needsFreshFilterIds();

  let filter: SVGFilterElement | null = null;
  let slots: LensSlot[] = [];
  let regionNodes: SVGElement[] = [];
  let shadowNodes: SVGElement[] = [];
  let displacements: Array<{ node: SVGFEDisplacementMapElement; factor: number }> = [];
  let highlight: SVGFEColorMatrixElement | null = null;
  let shade: SVGFEColorMatrixElement | null = null;
  let shadowBlur: SVGFEGaussianBlurElement | null = null;
  let shadowOffset: SVGFEOffsetElement | null = null;
  let shadowMatrix: SVGFEColorMatrixElement | null = null;
  let lensTint: SVGFEFloodElement | null = null;
  let revision = 0;
  let signature = "";
  let strength = 0;
  let target = 0;
  let frame = 0;
  let lastTime = 0;
  let destroyed = false;

  const build = (lensCount: number) => {
    const defs = svgNode("defs");
    filter = svgNode("filter", {
      filterUnits: "userSpaceOnUse",
      primitiveUnits: "userSpaceOnUse",
      "color-interpolation-filters": "sRGB",
    });
    defs.append(filter);
    svg.replaceChildren(defs);
    slots = [];
    regionNodes = [];
    shadowNodes = [];
    displacements = [];

    const add = <K extends keyof SVGElementTagNameMap>(
      tag: K,
      attributes: Record<string, string | number>,
      region: boolean | "shadow" = false,
    ) => {
      const node = svgNode(tag, attributes);
      filter!.append(node);
      if (region === "shadow") shadowNodes.push(node);
      else if (region) regionNodes.push(node);
      return node;
    };

    add("feFlood", { "flood-color": "rgb(128,128,128)", "flood-opacity": 1, result: "neutral" });
    for (let index = 0; index < lensCount; index += 1) {
      const image = add("feImage", { preserveAspectRatio: "none", result: `lens-${index}` });
      slots.push({ image, key: "", appliedKey: "", ready: false });
    }
    let shapeResult = "lens-0";
    for (let index = 1; index < lensCount; index += 1) {
      add("feComposite", {
        in: `lens-${index}`,
        in2: shapeResult,
        operator: "over",
        result: `shape-${index}`,
      });
      shapeResult = `shape-${index}`;
    }
    add("feComposite", { in: shapeResult, in2: "neutral", operator: "over", result: "map" });

    // The glass casts its own shadow from the lens silhouette. Keeping the shadow
    // in the filter (rather than a CSS box-shadow on the lens) means the bezel
    // never refracts a dark ring of its own shadow.
    shadowBlur = add("feGaussianBlur", { in: shapeResult, result: "shadow-blur" }, "shadow");
    shadowOffset = add("feOffset", { in: "shadow-blur", dx: 0, result: "shadow-offset" }, "shadow");
    shadowMatrix = add("feColorMatrix", { in: "shadow-offset", type: "matrix", result: "shadow" }, "shadow");

    let source = "SourceGraphic";
    if (options.blur > 0) {
      add("feGaussianBlur", { in: "SourceGraphic", stdDeviation: options.blur, result: "source" }, true);
      source = "source";
    }

    const displace = (result: string, factor: number) => {
      const node = add(
        "feDisplacementMap",
        { in: source, in2: "map", xChannelSelector: "R", yChannelSelector: "G", result },
        true,
      );
      displacements.push({ node, factor });
    };

    let refracted = "displaced-g";
    displace("displaced-g", 1);
    if (chromaSpread > 0) {
      displace("displaced-r", 1 + chromaSpread);
      displace("displaced-b", 1 - chromaSpread);
      // Flatten each pass onto black so its premultiplied color can be isolated
      // per channel, then restore the true alpha from the green pass. This keeps
      // translucent content (tracks, list backgrounds) at its original opacity.
      add("feFlood", { "flood-color": "black", "flood-opacity": 1, result: "black" }, true);
      const channels = [
        ["r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1"],
        ["g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1"],
        ["b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1"],
      ] as const;
      for (const [channel, values] of channels) {
        add("feComposite", { in: `displaced-${channel}`, in2: "black", operator: "over", result: `flat-${channel}` }, true);
        add("feColorMatrix", { in: `flat-${channel}`, type: "matrix", values, result: `channel-${channel}` }, true);
      }
      add("feComposite", { in: "channel-r", in2: "channel-g", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0, result: "channel-rg" }, true);
      add("feComposite", { in: "channel-rg", in2: "channel-b", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0, result: "channel-rgb" }, true);
      add("feColorMatrix", {
        in: "displaced-g",
        type: "matrix",
        values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1 1",
        result: "alpha-gap",
      }, true);
      add("feComposite", { in: "channel-rgb", in2: "alpha-gap", operator: "arithmetic", k1: 0, k2: 1, k3: -1, k4: 0, result: "dispersed" }, true);
      refracted = "dispersed";
    }

    shade = add("feColorMatrix", { in: "map", type: "matrix", result: "shade" }, true);
    highlight = add("feColorMatrix", { in: "map", type: "matrix", result: "highlight" }, true);
    add("feComposite", { in: "shade", in2: refracted, operator: "over", result: "shaded" }, true);
    add("feComposite", { in: "highlight", in2: "shaded", operator: "over", result: "lit" }, true);
    // An even tint over the whole lens, applied after refraction so the rim and
    // centre match (dark themes lift the glass slightly; light themes leave it clear).
    lensTint = add("feFlood", { "flood-color": "transparent", result: "lens-tint" }, true);
    add("feComposite", { in: "lens-tint", in2: "lit", operator: "over", result: "tinted" }, true);
    add("feComposite", { in: "tinted", in2: shapeResult, operator: "in", result: "inside" });
    add("feComposite", { in: "shadow", in2: "SourceGraphic", operator: "over", result: "shadowed" });
    add("feComposite", { in: "shadowed", in2: shapeResult, operator: "out", result: "outside" });
    add("feComposite", { in: "inside", in2: "outside", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0 });
    signature = "";
  };

  const clearFilter = () => {
    surface.style.removeProperty("filter");
    surface.style.removeProperty("will-change");
    signature = "";
    revision = 0;
  };

  const loadMap = (slot: LensSlot, key: string, width: number, height: number, radius: number, strength: number) => {
    slot.key = key;
    const url = generateLiquidLensMap(width, height, { ...themeLighting(options, strength), borderRadius: radius });
    if (!url) return;
    // Decode before swapping so a reshaping lens never flashes an empty map.
    const image = new Image();
    image.src = url;
    image
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (destroyed || slot.key !== key) return;
        slot.image.setAttribute("href", url);
        slot.appliedKey = key;
        slot.ready = true;
        signature = "";
      });
  };

  const update = () => {
    const lenses = Array.from(surface.querySelectorAll<HTMLElement>(config.lensSelector));
    const surfaceBounds = surface.getBoundingClientRect();
    if (surfaceBounds.width <= 0 || surfaceBounds.height <= 0) return;
    // Convert screen pixels to the surface's own CSS pixels (ancestors may scale it).
    const localScale = surface.offsetWidth / surfaceBounds.width || 1;

    const rects: Array<Rect & { radius: number }> = [];
    for (const element of lenses) {
      const rect = measureLens(element, surfaceBounds, localScale);
      if (rect.width >= 2 && rect.height >= 2) rects.push(rect);
    }

    if (rects.length === 0) {
      clearFilter();
      return;
    }
    if (!filter || slots.length !== rects.length) build(rects.length);

    rects.forEach((rect, index) => {
      const slot = slots[index]!;
      const width = quantize(rect.width);
      const height = quantize(rect.height);
      const radius = Math.round(Math.min(width / 2, height / 2, options.borderRadius ?? rect.radius));
      const strength = readLiquidHighlight(surface);
      const key = `${width}x${height}r${radius}s${strength.toFixed(2)}`;
      if (slot.key !== key) loadMap(slot, key, width, height, radius, strength);
    });
    if (!slots.every((slot) => slot.ready)) return;

    const union = rects.reduce(
      (area, rect) => ({
        left: Math.min(area.left, rect.x),
        top: Math.min(area.top, rect.y),
        right: Math.max(area.right, rect.x + rect.width),
        bottom: Math.max(area.bottom, rect.y + rect.height),
      }),
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
    );
    const region = {
      x: Math.floor(union.left) - 1,
      y: Math.floor(union.top) - 1,
      width: Math.ceil(union.right - union.left) + 2,
      height: Math.ceil(union.bottom - union.top) + 2,
    };
    const smallestSide = Math.max(...rects.map((rect) => Math.min(rect.width, rect.height)));
    const shadowSoftness = clamp(smallestSide * 0.12, 2, 7);
    const shadowDrop = clamp(smallestSide * 0.06, 1, 3);
    const shadowSpread = Math.ceil(shadowSoftness * 3 + shadowDrop);
    const shadowRegion = {
      x: region.x - shadowSpread,
      y: region.y - shadowSpread,
      width: region.width + shadowSpread * 2,
      height: region.height + shadowSpread * 2,
    };
    const filterRegion = {
      x: Math.min(-4, shadowRegion.x),
      y: Math.min(-4, shadowRegion.y),
      right: Math.max(surface.offsetWidth + 4, shadowRegion.x + shadowRegion.width),
      bottom: Math.max(surface.offsetHeight + 4, shadowRegion.y + shadowRegion.height),
    };
    const maxOffset = smallestSide * options.scale;
    const scale = 2 * maxOffset * strength;
    const light = strength.toFixed(3);
    const tint = getComputedStyle(surface).getPropertyValue("--liquid-lens-tint").trim() || "transparent";

    const next = [
      rects.map((rect) => `${rect.x.toFixed(2)},${rect.y.toFixed(2)},${rect.width.toFixed(2)},${rect.height.toFixed(2)}`).join(";"),
      scale.toFixed(2),
      light,
      tint,
      slots.map((slot) => slot.appliedKey).join(";"),
    ].join("|");
    if (next === signature) return;
    signature = next;

    rects.forEach((rect, index) => {
      const image = slots[index]!.image;
      image.setAttribute("x", rect.x.toFixed(2));
      image.setAttribute("y", rect.y.toFixed(2));
      image.setAttribute("width", rect.width.toFixed(2));
      image.setAttribute("height", rect.height.toFixed(2));
    });
    for (const node of regionNodes) {
      node.setAttribute("x", String(region.x));
      node.setAttribute("y", String(region.y));
      node.setAttribute("width", String(region.width));
      node.setAttribute("height", String(region.height));
    }
    for (const node of shadowNodes) {
      node.setAttribute("x", String(shadowRegion.x));
      node.setAttribute("y", String(shadowRegion.y));
      node.setAttribute("width", String(shadowRegion.width));
      node.setAttribute("height", String(shadowRegion.height));
    }
    shadowBlur!.setAttribute("stdDeviation", shadowSoftness.toFixed(2));
    shadowOffset!.setAttribute("dy", shadowDrop.toFixed(2));
    shadowMatrix!.setAttribute(
      "values",
      `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${(themeShadow(options.shadow, readLiquidHighlight(surface)) * strength).toFixed(3)} 0`,
    );
    for (const { node, factor } of displacements) {
      node.setAttribute("scale", (scale * factor).toFixed(2));
    }
    lensTint!.setAttribute("flood-color", tint);
    lensTint!.setAttribute("flood-opacity", light);
    const s = Number(light);
    highlight!.setAttribute(
      "values",
      `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 ${2 * s} 0 ${-s}`,
    );
    shade!.setAttribute("values", `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 ${-2 * s} 0 ${s}`);
    filter!.setAttribute("x", String(filterRegion.x));
    filter!.setAttribute("y", String(filterRegion.y));
    filter!.setAttribute("width", String(filterRegion.right - filterRegion.x));
    filter!.setAttribute("height", String(filterRegion.bottom - filterRegion.y));

    // Safari caches filter output by id, so there every change gets a fresh one.
    if (freshIds || revision === 0) revision += 1;
    const id = `${config.id}-${revision}`;
    if (filter!.getAttribute("id") !== id) filter!.setAttribute("id", id);
    const reference = `url("#${id}")`;
    if (surface.style.filter !== reference) {
      surface.style.setProperty("will-change", "filter");
      surface.style.setProperty("filter", reference);
    }
  };

  const tick = (time: number) => {
    frame = 0;
    if (destroyed) return;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    if (reducedMotion.matches) {
      strength = target;
    } else {
      const response = target > strength ? 70 : 130;
      strength += (target - strength) * (1 - Math.exp(-elapsed / response));
    }
    if (target === 0 && strength < 0.01) {
      strength = 0;
      lastTime = 0;
      clearFilter();
      return;
    }
    update();
    frame = window.requestAnimationFrame(tick);
  };

  const sync = () => {
    const active = surface.hasAttribute(config.activeAttribute) && !reducedTransparency.matches;
    target = active ? 1 : 0;
    if (!frame && (active || strength > 0)) {
      lastTime = 0;
      frame = window.requestAnimationFrame(tick);
    }
  };

  const observer = new MutationObserver(sync);
  observer.observe(surface, { attributes: true, attributeFilter: [config.activeAttribute] });
  sync();

  return () => {
    destroyed = true;
    observer.disconnect();
    if (frame) window.cancelAnimationFrame(frame);
    clearFilter();
    svg.replaceChildren();
  };
}

type UseLiquidDisplacementOptions = {
  /** Optical parameters for the lens. */
  lens?: LiquidLensOptions;
  /** Selector, relative to the surface, for the element(s) that act as the lens. */
  lensSelector: string;
  /** Attribute on the surface that switches refraction on. */
  activeAttribute?: string;
  /** Turns the renderer off entirely, for variants that use backdrop glass instead. */
  enabled?: boolean;
};

/**
 * Refracts a surface's own pixels wherever its lens element sits.
 *
 * Attach `ref` to the element whose content should bend, render `filter`
 * anywhere inside it, and toggle `data-interacting` on the surface. Refraction
 * ramps in while the attribute is present and the filter is removed at rest.
 */
export function useLiquidDisplacement<T extends HTMLElement>({
  lens,
  lensSelector,
  activeAttribute = "data-interacting",
  enabled = true,
}: UseLiquidDisplacementOptions) {
  const ref = useRef<T>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const id = `liquid-displacement-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const options = resolveLiquidLensOptions(lens);
  const optionsKey = lensOptionsKey(options);
  const stableOptions = useMemo(() => options, [optionsKey]);

  useLayoutEffect(() => {
    const surface = ref.current;
    const svg = svgRef.current;
    if (!surface || !svg || !enabled) return;
    return attachLiquidRefraction(surface, svg, {
      id,
      options: stableOptions,
      lensSelector,
      activeAttribute,
    });
  }, [activeAttribute, enabled, id, lensSelector, stableOptions]);

  const filter = (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    />
  );

  return { ref, filter };
}
