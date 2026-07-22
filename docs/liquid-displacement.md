# Liquid Displacement Renderer

The shared renderer in [`src/hooks/use-liquid-displacement.tsx`](../src/hooks/use-liquid-displacement.tsx) gives Switch, Slider, and Tabs one optical model. It is inspired by Aave’s published displacement-map architecture, implemented independently for Liquid UI.

## Pipeline

```text
lens element changes size
  → ResizeObserver groups work into one animation frame
  → generate one rounded-rectangle quadrant
  → mirror it into a complete PNG displacement map
  → issue a fresh SVG filter ID
  → refract the component-specific target with feDisplacementMap
  → recombine shifted R/G/B channels
  → add glow and angled specular light
```

The PNG uses:

- Red for horizontal displacement.
- Green for vertical displacement.
- Blue for the lens height field used by specular lighting.
- Neutral red and green outside the rounded lens so pixels there do not move.

Movement does not regenerate the map. Resize observation only reacts when the actual lens geometry changes. Spring movement can therefore translate an existing filtered target cheaply; press expansion and velocity deformation generate updated maps.

Safari may reuse stale SVG filter output when an image changes under the same filter ID. The hook increments the ID whenever it creates a new map, forcing a clean refresh.

## Parameters

Every component exposes a `lens` prop:

```tsx
<LiquidSwitch
  lens={{
    scale: 0.1,
    depth: 50,
    curvature: 40,
    splay: 1,
    chroma: 0.76,
    blur: 0,
    glow: 0.1,
    edgeHighlight: 0.25,
    specularAngle: 45,
  }}
/>
```

| Parameter | Meaning |
| --- | --- |
| `borderRadius` | Radius used to generate the rounded displacement field; defaults to a capsule |
| `scale` | Displacement strength relative to the smaller lens dimension |
| `depth` | Strength of the generated normal field and specular surface |
| `curvature` | Percentage of the lens depth occupied by the bending edge |
| `splay` | Exponent shaping how quickly displacement spreads inward |
| `chroma` | Separation between red, green, and blue displacement passes |
| `blur` | Post-refraction SVG blur |
| `glow` | Strength and radius of the white lens glow |
| `edgeHighlight` | Specular-light intensity |
| `specularAngle` | Azimuth of the distant specular light in degrees |

Width and height come from the live tracker and are not fixed options.

## Component presets

- Switch uses the strongest bend and the full chromatic response.
- Slider uses a gentler scale and less chroma so the value rail stays readable.
- Tabs uses a medium bend on its highlighted selection target.

All presets may be overridden through `lens` without forking the renderer.

## Refraction targets

The SVG filter bends `SourceGraphic`; it does not sample arbitrary pixels behind an element. Each component therefore provides an intentional source:

- Switch filters a synchronized copy of the state track.
- Slider filters its filled/unfilled rail copy.
- Tabs filters a highlighted selection pill while the real labels stay above the lens.

This preserves selectable DOM and avoids pretending that `backdrop-filter` performs displacement.

## Fallbacks and accessibility

- Before the first PNG is ready, the source renders as an ordinary CSS highlight.
- Reduced transparency disables displacement and uses an opaque lens surface.
- Reduced motion keeps semantic state but collapses decorative transitions.
- SVG definitions are zero-sized, non-interactive, and hidden from accessibility APIs.

Canvas and video surfaces need the same generated map fed into a WebGL renderer; the DOM SVG path should not be stretched to cover those media cases.
