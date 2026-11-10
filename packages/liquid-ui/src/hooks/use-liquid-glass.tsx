"use client";

import { useLayoutEffect, useMemo, useRef, useId } from "react";

import { measureLens, needsFreshFilterIds, readLiquidHighlight, svgNode, themeLighting, themeShadow } from "./use-liquid-displacement";

/**
 * Liquid glass surfaces.
 *
 * Unlike the in-place displacement used by controls, a glass surface sits on top
 * of arbitrary content and bends whatever is behind it. Every shape inside one
 * container is fused with a smooth-union signed-distance field, so nearby glass
 * flows together and separates like liquid as shapes move or resize.
 *
 *   shapes move/resize   → one merged distance field
 *   distance field       → canvas: tint, rim highlight, shade, drop shadow
 *                        → PNG map: refraction offsets + silhouette mask
 *   Chromium             → backdrop-filter: blur() saturate() url(#refraction)
 *   Safari / Firefox     → backdrop-filter: blur() saturate()  (frosted fallback)
 */

export type LiquidGlassOptions = {
  /** Strongest refraction offset at the rim, in CSS pixels. Negative values magnify. */
  refraction?: number;
  /** Width of the bending edge, in CSS pixels. */
  bezel?: number;
  /** Exponent shaping how quickly refraction fades from the rim inward. */
  splay?: number;
  /** Chromatic dispersion between the red, green, and blue refraction passes, 0–1. */
  chroma?: number;
  /** Backdrop blur inside the glass, in CSS pixels. */
  frost?: number;
  /** Backdrop saturation inside the glass. */
  saturation?: number;
  /** Relief of the shaded side of the rim, 0–100. */
  depth?: number;
  /** Strength of the lit side and the thin specular rim, 0–1. */
  edgeHighlight?: number;
  /** Soft inner glow along the bezel, 0–1. */
  glow?: number;
  /** Direction the light comes from, in degrees: 0 = left, 45 = top-left, 90 = top. */
  specularAngle?: number;
  /** Opacity of the soft shadow the glass casts, 0–1. */
  shadow?: number;
  /** Distance, in CSS pixels, at which neighboring shapes start to fuse. */
  merge?: number;
};

type ResolvedGlassOptions = Required<LiquidGlassOptions>;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function resolveLiquidGlassOptions(options: LiquidGlassOptions = {}): ResolvedGlassOptions {
  return {
    refraction: clamp(options.refraction ?? 13, -40, 40),
    bezel: clamp(options.bezel ?? 18, 1, 120),
    splay: clamp(options.splay ?? 1.6, 0.1, 8),
    chroma: clamp(options.chroma ?? 0.4, 0, 1),
    frost: clamp(options.frost ?? 2.5, 0, 40),
    saturation: clamp(options.saturation ?? 1.8, 0, 4),
    depth: clamp(options.depth ?? 6, 0, 100),
    edgeHighlight: clamp(options.edgeHighlight ?? 0.85, 0, 1),
    glow: clamp(options.glow ?? 0.14, 0, 1),
    specularAngle: options.specularAngle ?? 45,
    shadow: clamp(options.shadow ?? 0.06, 0, 1),
    merge: clamp(options.merge ?? 14, 0, 120),
  };
}

const glassOptionsKey = (options: ResolvedGlassOptions) =>
  Object.values(options).join(",");

/** Tailwind tokens for the glass tint, with an opaque fallback for reduced transparency. */
export const liquidGlassMaterial =
  "[--liquid-glass-tint:rgba(255,255,255,.3)] [--liquid-glass-edge:rgba(20,16,48,.09)] [--liquid-glass-highlight:1] [--liquid-glass-solid:rgb(250,250,252)] dark:[--liquid-glass-tint:rgba(255,255,255,.06)] dark:[--liquid-glass-edge:rgba(255,255,255,.08)] dark:[--liquid-glass-highlight:.18] dark:[--liquid-glass-solid:rgb(36,35,42)]";

/** Chromium is the only engine that renders SVG filters inside backdrop-filter. */
function supportsBackdropRefraction() {
  if (typeof navigator === "undefined") return false;
  const brands = (navigator as Navigator & {
    userAgentData?: { brands?: Array<{ brand: string }> };
  }).userAgentData?.brands;
  return Boolean(brands?.some((entry) => /Chromium/i.test(entry.brand)));
}

const colorCache = new Map<string, [number, number, number, number]>();
let colorContext: CanvasRenderingContext2D | null = null;

function parseColor(value: string): [number, number, number, number] {
  const cached = colorCache.get(value);
  if (cached) return cached;
  colorContext ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!colorContext) return [255, 255, 255, 0.14];
  colorContext.canvas.width = 1;
  colorContext.canvas.height = 1;
  colorContext.clearRect(0, 0, 1, 1);
  colorContext.fillStyle = "rgba(0,0,0,0)";
  colorContext.fillStyle = value;
  colorContext.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorContext.getImageData(0, 0, 1, 1).data;
  const color: [number, number, number, number] = [r!, g!, b!, a! / 255];
  colorCache.set(value, color);
  return color;
}

type Shape = { x: number; y: number; width: number; height: number; radius: number };

function roundedRectDistance(px: number, py: number, shape: Shape) {
  const halfWidth = shape.width / 2;
  const halfHeight = shape.height / 2;
  const radius = Math.min(shape.radius, halfWidth, halfHeight);
  const qx = Math.abs(px - (shape.x + halfWidth)) - (halfWidth - radius);
  const qy = Math.abs(py - (shape.y + halfHeight)) - (halfHeight - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

/** Polynomial smooth minimum: shapes closer than `k` fuse with a liquid bridge. */
function smoothMin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
}

type Field = {
  distance: Float32Array;
  width: number;
  height: number;
  resolution: number;
  originX: number;
  originY: number;
};

function sampleField(shapes: Shape[], box: Shape, resolution: number, merge: number): Field {
  const width = Math.max(2, Math.ceil(box.width * resolution));
  const height = Math.max(2, Math.ceil(box.height * resolution));
  const distance = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const py = box.y + (y + 0.5) / resolution;
    for (let x = 0; x < width; x += 1) {
      const px = box.x + (x + 0.5) / resolution;
      let value = roundedRectDistance(px, py, shapes[0]!);
      for (let index = 1; index < shapes.length; index += 1) {
        value = smoothMin(value, roundedRectDistance(px, py, shapes[index]!), merge);
      }
      distance[y * width + x] = value;
    }
  }
  return { distance, width, height, resolution, originX: box.x, originY: box.y };
}

/** Paints tint, lighting, and shadow, and writes the refraction map, from one field. */
function shadeField(
  field: Field,
  options: ResolvedGlassOptions & { rimSpread?: number },
  tint: [number, number, number, number],
  edge: [number, number, number, number],
  withMap: boolean,
) {
  const { distance, width, height, resolution } = field;
  const light = new Uint8ClampedArray(width * height * 4);
  const map = withMap ? new Uint8ClampedArray(width * height * 4) : null;
  const angle = (options.specularAngle * Math.PI) / 180;
  const lightX = -Math.cos(angle);
  const lightY = -Math.sin(angle);
  const relief = options.depth / 100;
  const shadowBlur = 9;
  const shadowDrop = Math.round(3 * resolution);
  const [edgeR, edgeG, edgeB, edgeA] = edge;
  const step = 2 / resolution;
  const [tintR, tintG, tintB, tintA] = tint;

  const at = (x: number, y: number) =>
    distance[clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1)]!;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const d = distance[index]!;
      const coverage = clamp(0.5 - d * resolution, 0, 1);
      const offset = index * 4;

      if (coverage <= 0) {
        // Outside the glass: only the soft drop shadow.
        const lifted = at(x, y - shadowDrop);
        const shadow = lifted > 0 ? options.shadow * Math.pow(1 - clamp(lifted / shadowBlur, 0, 1), 2) : options.shadow;
        light[offset + 3] = shadow * 255;
        if (map) {
          map[offset] = 128;
          map[offset + 1] = 128;
          map[offset + 2] = 128;
        }
        continue;
      }

      let normalX = (at(x + 1, y) - at(x - 1, y)) / step;
      let normalY = (at(x, y + 1) - at(x, y - 1)) / step;
      const length = Math.hypot(normalX, normalY) || 1;
      normalX /= length;
      normalY /= length;
      const inside = Math.max(0, -d);
      const t = clamp(inside / options.bezel, 0, 1);
      const bend = Math.pow(1 - t, options.splay);

      const facing = normalX * lightX + normalY * lightY;
      // Highlight spreads across the bezel; shade stays on the outermost edge.
      const slope = Math.pow(1 - t, facing > 0 ? (options.rimSpread ?? 2) : 4);
      const directional = facing * slope * (facing > 0 ? options.edgeHighlight : relief);
      const rim = Math.exp(-inside / (options.rimSpread && options.rimSpread > 2.5 ? 0.9 : 1.5)) * options.edgeHighlight * (0.4 + 0.6 * Math.max(0, facing));
      const glow = options.glow * Math.pow(1 - t, 3);
      const lighting = clamp(directional + rim + glow, -1, 1);

      // tint → shade (black) → highlight (white), composited with `over`.
      const shade = Math.max(0, -lighting);
      const highlight = Math.max(0, lighting);
      let alpha = shade + tintA * (1 - shade);
      let red = alpha > 0 ? (tintR * tintA * (1 - shade)) / alpha : 0;
      let green = alpha > 0 ? (tintG * tintA * (1 - shade)) / alpha : 0;
      let blue = alpha > 0 ? (tintB * tintA * (1 - shade)) / alpha : 0;
      const lit = highlight + alpha * (1 - highlight);
      if (lit > 0) {
        red = (255 * highlight + red * alpha * (1 - highlight)) / lit;
        green = (255 * highlight + green * alpha * (1 - highlight)) / lit;
        blue = (255 * highlight + blue * alpha * (1 - highlight)) / lit;
      }
      // A hairline edge along the silhouette keeps glass crisp on light pages.
      const line = edgeA * clamp(1 - Math.abs(d + 0.5) / 0.9, 0, 1);
      if (line > 0) {
        const lined = line + lit * (1 - line);
        red = (edgeR * line + red * lit * (1 - line)) / lined;
        green = (edgeG * line + green * lit * (1 - line)) / lined;
        blue = (edgeB * line + blue * lit * (1 - line)) / lined;
        alpha = lined;
      } else {
        alpha = lit;
      }
      alpha = alpha * coverage + options.shadow * (1 - coverage) * (1 - alpha * coverage);
      light[offset] = red;
      light[offset + 1] = green;
      light[offset + 2] = blue;
      light[offset + 3] = alpha * 255;

      if (map) {
        map[offset] = 128 + normalX * bend * 127;
        map[offset + 1] = 128 + normalY * bend * 127;
        map[offset + 2] = 128;
        map[offset + 3] = coverage * 255;
      }
    }
  }

  return {
    light: new ImageData(light, width, height),
    map: map ? new ImageData(map, width, height) : null,
  };
}

let encoder: HTMLCanvasElement | null = null;

/** PNG-encodes a map without blocking: toBlob runs the encoder off the main thread. */
function encode(image: ImageData): Promise<string> {
  encoder ??= document.createElement("canvas");
  encoder.width = image.width;
  encoder.height = image.height;
  const context = encoder.getContext("2d");
  if (!context) return Promise.resolve("");
  context.putImageData(image, 0, 0);
  return new Promise((resolve) => encoder!.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ""), "image/png"));
}

// Map pixels per paint. The displacement only bends the rim, so a large panel
// loses nothing at a lower resolution, and a phone keeps its frame budget.
const PIXELS_SETTLED = 420_000;
const PIXELS_MOVING = 90_000;
const withinBudget = (box: { width: number; height: number }, wanted: number, pixels: number) =>
  Math.max(0.25, Math.min(wanted, Math.sqrt(pixels / Math.max(1, box.width * box.height))));

const SHAPE_SELECTOR = "[data-liquid-glass-shape]";
const GROUP_SELECTOR = "[data-liquid-glass-group]";

type GlassLayers = {
  backdrop: HTMLSpanElement;
  canvas: HTMLCanvasElement;
  svg: SVGSVGElement;
};

function attachLiquidGlass(container: HTMLElement, layers: GlassLayers, id: string, options: ResolvedGlassOptions) {
  const refract = supportsBackdropRefraction();
  const freshIds = needsFreshFilterIds();
  const reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)");
  container.dataset.liquidGlassMode = refract ? "refract" : "frost";
  const context = layers.canvas.getContext("2d");
  const chromaSpread = options.chroma * 0.25;
  const pad = Math.ceil(Math.abs(options.refraction) + options.merge / 2 + 18);

  let filter: SVGFilterElement | null = null;
  let image: SVGFEImageElement | null = null;
  const displacements: Array<{ node: SVGFEDisplacementMapElement; factor: number }> = [];

  if (refract) {
    const defs = svgNode("defs");
    filter = svgNode("filter", {
      x: 0,
      y: 0,
      filterUnits: "userSpaceOnUse",
      primitiveUnits: "userSpaceOnUse",
      "color-interpolation-filters": "sRGB",
    });
    defs.append(filter);
    layers.svg.replaceChildren(defs);
    const add = <K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>) => {
      const node = svgNode(tag, attributes);
      filter!.append(node);
      return node;
    };
    add("feFlood", { "flood-color": "rgb(128,128,128)", "flood-opacity": 1, result: "neutral" });
    image = add("feImage", { x: 0, y: 0, preserveAspectRatio: "none", result: "lens" });
    add("feComposite", { in: "lens", in2: "neutral", operator: "over", result: "map" });
    const displace = (result: string, factor: number) => {
      const node = add("feDisplacementMap", {
        in: "SourceGraphic",
        in2: "map",
        xChannelSelector: "R",
        yChannelSelector: "G",
        result,
      });
      displacements.push({ node, factor });
    };
    displace("displaced-g", 1);
    if (chromaSpread > 0) {
      displace("displaced-r", 1 + chromaSpread);
      displace("displaced-b", 1 - chromaSpread);
      add("feColorMatrix", { in: "displaced-r", type: "matrix", values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "channel-r" });
      add("feColorMatrix", { in: "displaced-g", type: "matrix", values: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "channel-g" });
      add("feColorMatrix", { in: "displaced-b", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "channel-b" });
      // The backdrop is opaque, so the passes can simply be summed.
      add("feComposite", { in: "channel-r", in2: "channel-g", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0, result: "channel-rg" });
      add("feComposite", { in: "channel-rg", in2: "channel-b", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0 });
    }
  }

  let frame = 0;
  let settleTimer = 0;
  let animatingUntil = 0;
  let signature = "";
  let revision = 0;
  let destroyed = false;
  let pendingUrl = "";
  let shownUrl = "";
  let paintToken = 0;

  const collect = () => {
    const shapes: HTMLElement[] = container.matches(SHAPE_SELECTOR) ? [container] : [];
    for (const element of container.querySelectorAll<HTMLElement>(SHAPE_SELECTOR)) {
      if (element.closest(GROUP_SELECTOR) === container || element === container) {
        if (!shapes.includes(element)) shapes.push(element);
      }
    }
    return shapes;
  };

  const hide = () => {
    layers.backdrop.style.display = "none";
    layers.canvas.style.display = "none";
  };

  const paint = (highResolution: boolean) => {
    if (destroyed || !context) return;
    const containerBounds = container.getBoundingClientRect();
    if (containerBounds.width <= 0 || containerBounds.height <= 0) return hide();
    const localScale = container.offsetWidth / containerBounds.width || 1;
    const shapes: Shape[] = [];
    for (const element of collect()) {
      const style = getComputedStyle(element);
      if (style.visibility === "hidden") continue;
      // The container's own transform also scales the overlays drawn inside it,
      // so its shape is measured in untransformed local pixels.
      const rect =
        element === container
          ? {
              x: 0,
              y: 0,
              width: container.offsetWidth,
              height: container.offsetHeight,
              radius: Number.parseFloat(style.borderTopLeftRadius),
            }
          : measureLens(element, containerBounds, localScale);
      if (rect.width < 1 || rect.height < 1) continue;
      shapes.push({ ...rect, radius: Number.isFinite(rect.radius) ? rect.radius : Math.min(rect.width, rect.height) / 2 });
    }
    if (shapes.length === 0) return hide();

    const left = Math.min(...shapes.map((shape) => shape.x)) - pad;
    const top = Math.min(...shapes.map((shape) => shape.y)) - pad;
    const right = Math.max(...shapes.map((shape) => shape.x + shape.width)) + pad;
    const bottom = Math.max(...shapes.map((shape) => shape.y + shape.height)) + pad;
    const box = { x: Math.floor(left), y: Math.floor(top), width: Math.ceil(right - left), height: Math.ceil(bottom - top), radius: 0 };
    const resolution = highResolution
      ? withinBudget(box, Math.min(2, window.devicePixelRatio || 1), PIXELS_SETTLED)
      : withinBudget(box, 1, PIXELS_MOVING);
    const tintValue = getComputedStyle(container).getPropertyValue("--liquid-glass-tint").trim() || "rgba(255,255,255,0.14)";
    const nextSignature = [
      shapes.map((shape) => `${shape.x.toFixed(1)},${shape.y.toFixed(1)},${shape.width.toFixed(1)},${shape.height.toFixed(1)},${shape.radius.toFixed(1)}`).join(";"),
      resolution,
      tintValue,
      getComputedStyle(container).getPropertyValue("--liquid-glass-edge"),
      getComputedStyle(container).getPropertyValue("--liquid-glass-highlight"),
      reducedTransparency.matches,
    ].join("|");
    if (nextSignature === signature) return;
    signature = nextSignature;

    const solid = reducedTransparency.matches;
    const tint = solid ? parseColor(getComputedStyle(container).getPropertyValue("--liquid-glass-solid").trim() || "rgb(245,245,247)") : parseColor(tintValue);
    const field = sampleField(shapes, box, resolution, options.merge);
    const edgeValue = getComputedStyle(container).getPropertyValue("--liquid-glass-edge").trim() || "rgba(0,0,0,0.08)";
    // Rim light follows the theme: bright on light pages, a thin quiet line on dark ones.
    const strength = readLiquidHighlight(container);
    const lit = { ...themeLighting(options, strength), shadow: themeShadow(options.shadow, strength) };
    const { light, map } = shadeField(field, lit, tint, parseColor(edgeValue), !solid);

    layers.canvas.width = field.width;
    layers.canvas.height = field.height;
    Object.assign(layers.canvas.style, {
      display: "block",
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
    context.putImageData(light, 0, 0);

    if (!map) {
      layers.backdrop.style.display = "none";
      return;
    }
    const token = (paintToken += 1);
    encode(map)
      .then(async (url) => {
        if (!url) return;
        if (destroyed || token !== paintToken) return URL.revokeObjectURL(url);
        pendingUrl = url;
        const decoder = new Image();
        decoder.src = url;
        await decoder.decode().catch(() => undefined);
        if (destroyed || pendingUrl !== url) return URL.revokeObjectURL(url);
        const style = layers.backdrop.style;
        Object.assign(style, {
          display: "block",
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        });
        style.setProperty("mask-image", `url("${url}")`);
        style.setProperty("-webkit-mask-image", `url("${url}")`);
        let backdrop = `blur(${options.frost}px) saturate(${options.saturation})`;
        if (filter && image) {
          image.setAttribute("href", url);
          image.setAttribute("width", String(box.width));
          image.setAttribute("height", String(box.height));
          filter.setAttribute("width", String(box.width));
          filter.setAttribute("height", String(box.height));
          for (const { node, factor } of displacements) {
            node.setAttribute("scale", (2 * options.refraction * factor).toFixed(2));
          }
          // Safari caches filter output by id; there, a fresh id keeps every frame current.
          if (freshIds || revision === 0) revision += 1;
          const filterId = `${id}-${revision}`;
          if (filter.getAttribute("id") !== filterId) filter.setAttribute("id", filterId);
          backdrop = `${backdrop} url(#${filterId})`;
        }
        if (style.getPropertyValue("backdrop-filter") !== backdrop) {
          style.setProperty("backdrop-filter", backdrop);
          style.setProperty("-webkit-backdrop-filter", backdrop);
        }
        // The previous map is no longer referenced by the mask or the filter.
        if (shownUrl) URL.revokeObjectURL(shownUrl);
        shownUrl = url;
      });
  };

  // Morphing: while anything inside is transitioning, repaint every frame at a
  // cheaper resolution, then repaint once at full resolution after it settles.
  const tick = (time: number) => {
    frame = 0;
    if (destroyed) return;
    paint(false);
    if (time < animatingUntil) {
      frame = window.requestAnimationFrame(tick);
    } else {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => paint(true), 90);
    }
  };
  const animate = (duration = 120) => {
    animatingUntil = Math.max(animatingUntil, performance.now() + duration);
    if (!frame) frame = window.requestAnimationFrame(tick);
  };
  const longAnimation = () => animate(900);

  const resizeObserver = new ResizeObserver(() => animate());
  const observeShapes = () => {
    resizeObserver.disconnect();
    resizeObserver.observe(container);
    for (const shape of collect()) resizeObserver.observe(shape);
  };
  const mutationObserver = new MutationObserver(() => {
    observeShapes();
    animate();
  });
  const themeObserver = new MutationObserver(() => animate());

  observeShapes();
  mutationObserver.observe(container, { childList: true, subtree: true });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
  // A link's hover colour or a switch inside the glass doesn't change its shape;
  // only transitions on the shapes themselves do. Content that resizes the glass
  // is caught by the ResizeObserver.
  const onShapeMotion = (event: Event) => {
    const target = event.target as Element | null;
    if (target && (target === container || target.matches(SHAPE_SELECTOR))) longAnimation();
  };
  container.addEventListener("transitionrun", onShapeMotion);
  container.addEventListener("transitionend", onShapeMotion);
  container.addEventListener("animationstart", onShapeMotion);
  window.addEventListener("resize", longAnimation);
  reducedTransparency.addEventListener("change", longAnimation);
  // Mount with a cheap paint so a sheet or menu can start its entrance at once,
  // then sharpen after the entrance has had time to finish.
  paint(false);
  settleTimer = window.setTimeout(() => paint(true), 650);

  return () => {
    destroyed = true;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(settleTimer);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    themeObserver.disconnect();
    container.removeEventListener("transitionrun", onShapeMotion);
    container.removeEventListener("transitionend", onShapeMotion);
    container.removeEventListener("animationstart", onShapeMotion);
    if (shownUrl) URL.revokeObjectURL(shownUrl);
    window.removeEventListener("resize", longAnimation);
    reducedTransparency.removeEventListener("change", longAnimation);
    layers.svg.replaceChildren();
    delete container.dataset.liquidGlassMode;
  };
}

/**
 * Renders liquid glass for every `[data-liquid-glass-shape]` inside the element
 * the returned `ref` is attached to (including the element itself). Render
 * `layers` as the first children of that element.
 */
export function useLiquidGlass<T extends HTMLElement>(lens?: LiquidGlassOptions, enabled = true) {
  const ref = useRef<T>(null);
  const backdropRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const id = `liquid-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const options = resolveLiquidGlassOptions(lens);
  const key = glassOptionsKey(options);
  const stableOptions = useMemo(() => options, [key]);

  useLayoutEffect(() => {
    const container = ref.current;
    const backdrop = backdropRef.current;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!container || !backdrop || !canvas || !svg || !enabled) return;
    return attachLiquidGlass(container, { backdrop, canvas, svg }, id, stableOptions);
  }, [enabled, id, stableOptions]);

  const layers = !enabled ? null : (
    <>
      <span
        ref={backdropRef}
        aria-hidden="true"
        data-slot="liquid-glass-backdrop"
        style={{
          position: "absolute",
          zIndex: -1,
          display: "none",
          pointerEvents: "none",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-slot="liquid-glass-light"
        style={{ position: "absolute", zIndex: -1, display: "none", pointerEvents: "none" }}
      />
      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
      />
    </>
  );

  return { ref, layers };
}
