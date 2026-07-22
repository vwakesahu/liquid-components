import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type LiquidLensOptions = {
  borderRadius?: number;
  scale?: number;
  depth?: number;
  curvature?: number;
  splay?: number;
  chroma?: number;
  blur?: number;
  glow?: number;
  edgeHighlight?: number;
  specularAngle?: number;
};

export const liquidLensPresets = {
  switch: {
    scale: 0.1,
    depth: 50,
    curvature: 40,
    splay: 1,
    chroma: 0.76,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.25,
    specularAngle: 45,
  },
  slider: {
    scale: 0.045,
    depth: 26,
    curvature: 34,
    splay: 1,
    chroma: 0.24,
    blur: 0,
    glow: 0.08,
    edgeHighlight: 0.2,
    specularAngle: 45,
  },
  tabs: {
    scale: 0.08,
    depth: 42,
    curvature: 40,
    splay: 1,
    chroma: 0.5,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.25,
    specularAngle: 45,
  },
  video: {
    scale: 0.075,
    depth: 38,
    curvature: 40,
    splay: 1,
    chroma: 0.45,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.25,
    specularAngle: 45,
  },
} satisfies Record<string, LiquidLensOptions>;

type FilterState = {
  dataUrl: string;
  height: number;
  revision: number;
  width: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function roundedRectangleDistance(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const innerX = width / 2 - radius;
  const innerY = height / 2 - radius;
  const qx = Math.abs(x) - innerX;
  const qy = Math.abs(y) - innerY;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

export function generateLiquidLensMap(
  cssWidth: number,
  cssHeight: number,
  options: LiquidLensOptions,
) {
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(2, Math.round(cssWidth * pixelRatio));
  const height = Math.max(2, Math.round(cssHeight * pixelRatio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: false });
  if (!context) return "";

  const image = context.createImageData(width, height);
  const radius = Math.min(
    Math.min(width, height) / 2,
    (options.borderRadius ?? Math.min(cssWidth, cssHeight) / 2) * pixelRatio,
  );
  const curvature = Math.max(1, Math.min(width, height) * ((options.curvature ?? 40) / 100));
  const depth = clamp((options.depth ?? 50) / 100, 0, 1);
  const splay = Math.max(0.1, options.splay ?? 1);
  const halfWidth = Math.ceil(width / 2);
  const halfHeight = Math.ceil(height / 2);

  for (let y = 0; y < halfHeight; y += 1) {
    for (let x = 0; x < halfWidth; x += 1) {
      const centeredX = x + 0.5 - width / 2;
      const centeredY = y + 0.5 - height / 2;
      const distance = roundedRectangleDistance(centeredX, centeredY, width, height, radius);
      let red = 128;
      let green = 128;
      let blue = 0;

      if (distance <= 0) {
        const edge = clamp(1 - -distance / curvature, 0, 1);
        const bend = Math.pow(Math.sin(edge * Math.PI * 0.5), splay);
        const gradientX =
          roundedRectangleDistance(centeredX + 0.5, centeredY, width, height, radius) -
          roundedRectangleDistance(centeredX - 0.5, centeredY, width, height, radius);
        const gradientY =
          roundedRectangleDistance(centeredX, centeredY + 0.5, width, height, radius) -
          roundedRectangleDistance(centeredX, centeredY - 0.5, width, height, radius);
        const gradientLength = Math.hypot(gradientX, gradientY) || 1;
        const magnitude = 127 * depth * bend;
        red = clamp(Math.round(128 + (gradientX / gradientLength) * magnitude), 0, 255);
        green = clamp(Math.round(128 + (gradientY / gradientLength) * magnitude), 0, 255);
        blue = clamp(Math.round((1 - bend) * 255), 0, 255);
      }

      const mirrors = [
        [x, y, 1, 1],
        [width - 1 - x, y, -1, 1],
        [x, height - 1 - y, 1, -1],
        [width - 1 - x, height - 1 - y, -1, -1],
      ];

      for (const [targetX, targetY, directionX, directionY] of mirrors) {
        const index = (targetY * width + targetX) * 4;
        image.data[index] = directionX === 1 ? red : 256 - red;
        image.data[index + 1] = directionY === 1 ? green : 256 - green;
        image.data[index + 2] = blue;
        image.data[index + 3] = 255;
      }
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function useLiquidDisplacement<T extends HTMLElement>(options: LiquidLensOptions = {}) {
  const targetRef = useRef<T>(null);
  const reactId = useId().replaceAll(":", "");
  const revision = useRef(0);
  const lastSize = useRef({ width: 0, height: 0 });
  const frame = useRef<number | null>(null);
  const [filterState, setFilterState] = useState<FilterState | null>(null);

  const stableOptions = useMemo(
    () => ({
      borderRadius: options.borderRadius,
      scale: options.scale ?? 0.1,
      depth: options.depth ?? 50,
      curvature: options.curvature ?? 40,
      splay: options.splay ?? 1,
      chroma: options.chroma ?? 0.76,
      blur: options.blur ?? 0,
      glow: options.glow ?? 0.1,
      edgeHighlight: options.edgeHighlight ?? 0.25,
      specularAngle: options.specularAngle ?? 45,
    }),
    [
      options.blur,
      options.borderRadius,
      options.chroma,
      options.curvature,
      options.depth,
      options.edgeHighlight,
      options.glow,
      options.scale,
      options.specularAngle,
      options.splay,
    ],
  );

  useLayoutEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    lastSize.current = { width: 0, height: 0 };

    const renderMap = (width: number, height: number) => {
      const roundedWidth = Math.max(2, Math.round(width));
      const roundedHeight = Math.max(2, Math.round(height));
      if (
        roundedWidth === lastSize.current.width &&
        roundedHeight === lastSize.current.height
      ) return;
      lastSize.current = { width: roundedWidth, height: roundedHeight };
      const dataUrl = generateLiquidLensMap(roundedWidth, roundedHeight, stableOptions);
      revision.current += 1;
      setFilterState({
        dataUrl,
        height: roundedHeight,
        revision: revision.current,
        width: roundedWidth,
      });
    };

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      frame.current = window.requestAnimationFrame(() => {
        renderMap(entry.contentRect.width, entry.contentRect.height);
        frame.current = null;
      });
    });
    observer.observe(target);
    const bounds = target.getBoundingClientRect();
    renderMap(bounds.width, bounds.height);

    return () => {
      observer.disconnect();
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [stableOptions]);

  const filterId = filterState
    ? `liquid-displacement-${reactId}-${filterState.revision}`
    : undefined;
  const scale = filterState
    ? Math.min(filterState.width, filterState.height) * stableOptions.scale * 2
    : 0;
  const chromaOffset = stableOptions.chroma * 1.5;
  const filterStyle: CSSProperties | undefined = filterId
    ? { filter: `url(#${filterId})` }
    : undefined;

  const filter = filterState && filterId ? (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          x={filterState.width * -0.25}
          y={filterState.height * -0.35}
          width={filterState.width * 1.5}
          height={filterState.height * 1.7}
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={filterState.dataUrl}
            x="0"
            y="0"
            width={filterState.width}
            height={filterState.height}
            preserveAspectRatio="none"
            result="lens-map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lens-map"
            scale={scale + chromaOffset}
            xChannelSelector="R"
            yChannelSelector="G"
            result="red-shift"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lens-map"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="green-shift"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lens-map"
            scale={Math.max(0, scale - chromaOffset)}
            xChannelSelector="R"
            yChannelSelector="G"
            result="blue-shift"
          />
          <feColorMatrix
            in="red-shift"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="red-channel"
          />
          <feColorMatrix
            in="green-shift"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="green-channel"
          />
          <feColorMatrix
            in="blue-shift"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="blue-channel"
          />
          <feBlend in="red-channel" in2="green-channel" mode="screen" result="red-green" />
          <feBlend in="red-green" in2="blue-channel" mode="screen" result="refracted" />
          <feGaussianBlur in="refracted" stdDeviation={stableOptions.blur} result="softened" />
          <feColorMatrix
            in="lens-map"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"
            result="lens-surface"
          />
          <feGaussianBlur
            in="lens-surface"
            stdDeviation={stableOptions.glow * 5}
            result="glow-alpha"
          />
          <feFlood floodColor="white" floodOpacity={stableOptions.glow} result="glow-color" />
          <feComposite in="glow-color" in2="glow-alpha" operator="in" result="glow-layer" />
          <feBlend in="softened" in2="glow-layer" mode="screen" result="glowing" />
          <feSpecularLighting
            in="lens-surface"
            surfaceScale={stableOptions.depth / 12}
            specularConstant={stableOptions.edgeHighlight}
            specularExponent="22"
            lightingColor="white"
            result="specular"
          >
            <feDistantLight azimuth={stableOptions.specularAngle} elevation="55" />
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular-clipped" />
          <feBlend in="glowing" in2="specular-clipped" mode="screen" />
        </filter>
      </defs>
    </svg>
  ) : null;

  return { targetRef, filterId, filterStyle, filter };
}
