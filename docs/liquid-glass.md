# Liquid Glass Surfaces and Morphing

[`packages/liquid-ui/src/hooks/use-liquid-glass.tsx`](../packages/liquid-ui/src/hooks/use-liquid-glass.tsx) renders glass that sits on top of arbitrary content and bends what is behind it. It powers `LiquidGlass`, `LiquidGlassGroup`, `LiquidToolbar`, and the Button `glass` variant.

Controls (Switch, Slider, Tabs, Button) use the separate in-place renderer in [liquid-displacement.md](liquid-displacement.md): they bend their own content and are glass only while engaged. Surfaces use this renderer and are glass at rest.

## Pipeline

```text
shapes inside one container ([data-liquid-glass-shape])
  → measured each frame while anything inside is resizing or transitioning
  → one smooth-union signed-distance field over the group's bounds
  → canvas:   tint + rim highlight + shade + drop shadow
  → PNG map:  refraction offsets (R/G) + silhouette (A)
  → backdrop: mask = silhouette
              Chromium        blur() saturate() url(#refraction)
              Safari/Firefox  blur() saturate()
```

- **Morphing.** Shapes are combined with a polynomial smooth minimum. Two shapes closer than `merge` pixels grow a liquid bridge; as they separate it thins and snaps. Because the field is rebuilt from live geometry, any layout change (position, width, gap, a menu growing out of its trigger) morphs automatically.
- **Cost control.** While anything is animating, the field is rebuilt every frame at 1× resolution; once things settle it is rebuilt once at device resolution.
- **Safari.** Every refraction update uses a fresh filter id, as in the control renderer.

## Rules

- Never put `opacity`, `filter`, `mask`, or `clip-path` on a glass element or its ancestors while it is visible. Those create a backdrop root, so the glass would see nothing behind it. Animate size instead, as `LiquidMenu` does.
- Don't give glass a CSS `box-shadow`. The rim would refract its own shadow; the canvas draws the shadow instead.
- Glass layers sit at `z-index: -1` inside an isolated container, so content stays above them without extra wrappers.
- Grow glass with one uniform `scale` (or by animating real width and height). Never scale one axis, or the radius distorts.

## Toolbar merge

`LiquidToolbar merged` closes the gap between groups and overlaps their rounded ends by 12px each, with matching padding so the buttons keep their spacing. Two end caps overlapping that much leave a notch only a few pixels deep, which the smooth union fills, so the merged bar reads as one capsule. Keep the toolbar's `merge` distance at or below the resting gap so separated groups never bridge.
