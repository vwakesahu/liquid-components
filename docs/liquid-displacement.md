# Liquid Displacement Renderer

The shared renderer in [`packages/liquid-ui/src/hooks/use-liquid-displacement.tsx`](../packages/liquid-ui/src/hooks/use-liquid-displacement.tsx) gives Button, Switch, Slider, and Tabs one optical model. It follows the architecture Aave describes in [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web), implemented independently for Liquid UI.

## Core idea

Nothing is sampled from behind the glass. Each component filters **its own content in place**, the real track, rail, labels, or surface, and a generated lens map is positioned wherever the lens element currently sits.

```text
surface  (the element whose pixels bend: switch root, slider root, tabs list, button)
└── lens (the element that acts as glass: thumb, indicator, button body)
```

- The lens moving changes only the map's position in the filter.
- The lens changing shape (press expansion, velocity stretch, squash) generates a new map, cached by size.
- Every filter update gets a fresh filter ID, because Safari caches filter output by ID.

Because the real content is refracted, there are no duplicate tracks or copies to keep in sync, text stays selectable, and the lens shows exactly what is under it.

## Usage

```tsx
const displacement = useLiquidDisplacement<HTMLButtonElement>({
  lens: { ...liquidLensPresets.switch, ...lens },
  lensSelector: '[data-slot="liquid-switch-thumb"]',
})

<SwitchPrimitive.Root ref={displacement.ref} data-interacting={interacting || undefined}>
  …
  {displacement.filter}
</SwitchPrimitive.Root>
```

- `ref` goes on the surface.
- `lensSelector` finds the lens element(s) inside the surface; several matches (a range slider's thumbs) become several lenses in one filter.
- Refraction switches on while the surface has `data-interacting` and ramps in and out over roughly 100ms. At rest the filter is removed entirely, so idle components cost nothing.
- The lens element must be visually clear while engaged (transparent background, no box-shadow). The filter draws the glass highlight, shade, and drop shadow itself.

## Pipeline

```text
data-interacting appears on the surface
  → requestAnimationFrame loop starts
  → measure the surface and each lens (getBoundingClientRect + offsetWidth)
  → lens size changed?  → generate / reuse a cached map, decode it before swapping
  → write lens rect, displacement scale, light strength into the filter
  → fresh filter id → surface.style.filter = url(#id)
data-interacting removed
  → strength eases to 0 → filter removed → loop stops
```

Sizes are quantized to 2px so springy squish animations reuse cached maps instead of encoding a PNG every frame.

## The lens map

One PNG per lens size. Only the top-left quadrant runs the rounded-rectangle signed-distance field; the other three quadrants are mirrored with the offset signs flipped. Lighting is recomputed per mirrored pixel because the light comes from one direction.

| Channel | Meaning |
| --- | --- |
| Red / green | Refraction offset along the rim normal. `128` means no movement. |
| Blue | Baked rim lighting. `128` is neutral; higher is highlight, lower is shade. |
| Alpha | The anti-aliased lens silhouette. |

Baking the lighting into the map replaces `feSpecularLighting`, which is expensive and inconsistent across browsers.

## Filter chain

```text
feFlood (neutral 128 gray) ← feImage per lens (positioned at the lens) = map
SourceGraphic → feDisplacementMap ×3 (R, G, B at slightly different scales)
  → flatten each pass on black, isolate its channel, recombine
  → restore the true alpha from the green pass           ← keeps translucent rails and
                                                            list backgrounds at their opacity
map.blue → black shade + white highlight, composited over the refraction
lens silhouette → blurred, offset drop shadow
inside the silhouette:  lit refraction
outside the silhouette: original pixels + the glass's shadow
```

The displacement passes and lighting run only over the lens's bounding box. Outside the lens, the source pixels pass through untouched.

## Parameters

Every component exposes a `lens` prop that merges over its preset:

```tsx
<LiquidSwitch lens={{ scale: 0.32, chroma: 0.2, specularAngle: 60 }} />
```

| Parameter | Meaning |
| --- | --- |
| `scale` | Strongest offset as a fraction of the lens's smaller side. Positive compresses the surroundings into the rim (a glass bead over a track); negative magnifies what's under the lens (a swelling button). |
| `curvature` | Bezel width as a percentage of half the lens's smaller side. `100` bends all the way to the center. |
| `splay` | Exponent for how quickly the bend fades from rim to center. Higher concentrates refraction at the rim. |
| `chroma` | Dispersion between the red, green, and blue passes, 0–1. |
| `depth` | Relief of the shaded side of the rim, 0–100. |
| `edgeHighlight` | Strength of the lit side and the thin specular rim, 0–1. |
| `glow` | Soft inner glow along the bezel, 0–1. |
| `specularAngle` | Direction the light comes from: `0` left, `45` top-left, `90` top. |
| `shadow` | Opacity of the shadow the glass casts while engaged, 0–1. |
| `blur` | Blur applied to the refracted pixels, in CSS pixels. |
| `borderRadius` | Lens corner radius. Defaults to the lens element's computed radius. |

## Component presets

- **Switch** and **Slider** use positive scale: the track and fill are pulled inward and the background curves into the rim.
- **Tabs** uses a gentler positive scale and low chroma so the label edges stay clean.
- **Button** uses negative scale: the resting surface swells to fill the expanded lens, so the button reads as one surface with a single lit edge.
- **Video** uses the same map generator through WebGL (see below).

## Video and canvas

SVG filters cannot reliably bend live `<video>` (Safari composites it outside the filter pipeline). [`use-video-refraction.ts`](../packages/liquid-ui/src/hooks/use-video-refraction.ts) uploads each frame as a WebGL texture and refracts it under every control with that control's own map, packed into one atlas texture. The shader reads the same channels as the DOM filter, so lighting and direction match.

## Fallbacks and accessibility

- `prefers-reduced-transparency`: refraction never turns on, and thumbs, indicators, and button bodies keep opaque surfaces.
- `prefers-reduced-motion`: semantic state is unchanged; refraction switches on and off without easing.
- The SVG definitions are zero-sized, non-interactive, and hidden from accessibility APIs.
- Interaction semantics (Radix roles, keyboard, focus, forms) never depend on the renderer.

## Known limits

- Only the surface's own pixels can bend. Where a lens hangs past its surface, the area shows the page through clear glass rather than refracted page content.
- Firefox and Safari have not yet been verified visually after this rewrite; Chromium has.
- Aave also renders refraction targets at 2× inside a `scale(0.5)` wrapper for sharper Safari output. Liquid UI filters live content in place, so it does not do this yet.
