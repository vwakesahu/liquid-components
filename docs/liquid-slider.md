# Liquid Slider: Implementation Guide

This document records how the current Liquid Slider was designed, the problems encountered while tuning it, and the rules future components should reuse.

The installable implementation lives in [`packages/liquid-ui/src/components/ui/liquid-slider.tsx`](../packages/liquid-ui/src/components/ui/liquid-slider.tsx). Its shared visual layers live under the `Slider` section of [`packages/liquid-ui/src/styles/liquid.css`](../packages/liquid-ui/src/styles/liquid.css); both the documentation site and playground consume that same source workspace.

## Objective

The slider should behave like a familiar range input at rest and temporarily become an optical, deformable lens during interaction.

The tracker must:

- Stay directly synchronized with the selected value.
- Expand beyond the resting rail when engaged.
- Remain a fully rounded capsule in every state.
- Stretch and lean according to horizontal velocity.
- Magnify the rail beneath it instead of only blurring it.
- Settle with spring motion without overshooting the selected value.

The optical treatment must never compromise range-input semantics, keyboard behavior, or form behavior.

## Current anatomy

The rendered structure is intentionally layered:

```text
LiquidSlider
└── Radix Slider.Root
    ├── Slider.Track
    │   └── Slider.Range
    └── Slider.Thumb
        ├── occlusion layer
        ├── displaced rail target
        ├── glass lens
        ├── specular rim
        └── interaction light
```

### Radix behavior layer

Radix Slider remains the semantic and interactive source. It provides:

- Pointer and touch value calculation
- Keyboard increments
- Minimum, maximum, and step handling
- Disabled behavior
- Screen-reader semantics
- Controlled and uncontrolled value arrays
- Multiple thumbs, orientation, and RTL behavior

The Liquid component decorates Radix parts and never independently calculates or animates the selected value.

### Visual track and fill

The visual rail has an inline margin equal to half the tracker width. Radix positions thumb centers at the beginning and end of the track, so this makes the visible rail terminate beneath the tracker center at both 0% and 100%. Without that margin, an unfilled sliver remains visible to the right of the tracker at the maximum value.

The fill ends beneath the center of the tracker. It extends an additional `2px` under the lens to ensure antialiasing or fractional coordinates never reveal a gap.

### Tracker

The tracker is a capsule, not a circle. Its idle dimensions vary by component size:

| Size | Tracker width | Slider height | Track height |
| --- | ---: | ---: | ---: |
| Small | 32px | 26px | 6px |
| Regular | 40px | 32px | 8px |
| Large | 48px | 38px | 10px |

During engagement, the tracker adds `10px` to its base width and `8px` to its height. Pointer velocity can contribute up to another `16px` of horizontal stretch.

## Interaction phases

### Rest

The tracker is opaque, stable, and quiet. The refraction layers are invisible.

### Press or click

Pointer down immediately:

- Expands the tracker
- Reveals the glass lens
- Strengthens the rim and shadow
- Activates the displaced rail target
- Places illumination close to the pointer coordinate

A quick click guarantees a minimum `380ms` visible pulse. Without this minimum duration, pointer down and up can occur before the glass expansion becomes perceptible.

### Hold

The enlarged tracker stays visible without continuous decorative movement. It remains a fully rounded rectangle.

### Drag

During drag:

- Tracker position and fill width update without CSS delay.
- Velocity changes tracker width, vertical compression, and skew.
- The refracted rail enlarges slightly more.
- Pointer lighting follows the current horizontal coordinate.
- React does not rerender for every visual property update.

### Release

Drag release starts immediately. There is no artificial pause between movement and contraction.

Spring motion is applied to tracker geometry, not selected-value position. The tracker must not visually overshoot the actual value.

## Velocity model

Raw pointer movement is noisy. The current implementation calculates a target stretch from distance and velocity, then applies a low-pass filter:

```ts
const velocity = Math.abs(deltaX) / elapsed
const targetStretch = Math.min(
  16,
  Math.abs(deltaX) * 0.8 + velocity * 20,
)

shape.current = {
  stretch: shape.current.stretch * 0.62 + targetStretch * 0.38,
  direction: shape.current.direction * 0.58 + Math.sign(deltaX) * 0.42,
}
```

The filter prevents slow movement from twitching and softens rapid direction reversals.

Stretch drives several properties together:

- Horizontal width
- A small directional offset
- Vertical compression
- Horizontal skew

These properties must be derived from the same filtered state so the material behaves like one object.

## Refraction model

CSS backdrop blur alone cannot create optical magnification. It only softens pixels behind an element.

The current slider therefore uses a component-specific displacement target:

1. The occlusion layer diffuses and hides the original thin rail beneath the transparent tracker.
2. A synchronized copy of the filled and unfilled rail is drawn above the occlusion layer.
3. A generated rounded-rectangle displacement map bends that copy through SVG `feDisplacementMap`.
4. Separate red, green, and blue passes add restrained chromatic refraction.
5. Glow, angled specular light, lens, rim, and interaction light complete the surface.

The rendering order matters. Without occlusion, both the original thin rail and enlarged rail remain visible, producing an unwanted double line.

Current layer order:

```text
original rail
  ↓ hidden by
occlusion blur
  ↓ replaced by
displaced rail target
  ↓ covered by
lens → rim → interaction light
```

### Important limitation

This is real displacement of a slider-aware target, not arbitrary backdrop sampling. The implementation redraws and bends the known rail inside the tracker. It does not refract unrelated DOM content behind the component.

Arbitrary backdrop refraction still requires control of the pixels being filtered. QR and media components will use the same generated map with WebGL because their canvas or video pixels cannot be safely reproduced with this DOM-target technique.

## Performance architecture

The first implementation felt laggy because each pointer event triggered several React updates, repeated layout reads, CSS position transitions, and backdrop compositing.

The optimized implementation follows these rules.

### Update high-frequency visuals outside React

Stretch, direction, skew, light position, and compression are stored in refs. They are painted to CSS custom properties with `requestAnimationFrame`.

```text
pointer events
  ↓ update refs
one requestAnimationFrame
  ↓ update CSS variables
browser compositor
```

React state is only used for phase boundaries such as `interacting` and `dragging`.

### Let Radix own value position

Radix updates Range and Thumb geometry from one value source. The Liquid component does not duplicate progress into a second React state or add an independent position animation. This prevents the fill from arriving after the tracker.

### Measure interaction layout once

The shared motion hook reads root bounds on pointer down and reuses them for pointer lighting throughout the drag. Calling `getBoundingClientRect()` on every pointer move can force repeated layout calculation.

### Do not transition value position during drag

Tracker position and fill inherit their geometry directly from Radix and have no component-authored value transition. Any independent easing on either part makes the rail appear detached from the tracker.

Shape deformation can still use a short transition because it is expressive rather than value-bearing.

## Motion rules

Use two distinct motion systems.

### Value motion

- Direct during drag
- Synchronized between tracker and fill
- No overshoot
- No delay

### Material motion

- Short spring during velocity changes
- Softer spring during engagement and release
- May overshoot slightly in width or height
- Must never move the selected value beyond its semantic position

Recommended curves:

```css
--liquid-follow: cubic-bezier(.2, .72, .25, 1);
--liquid-spring: cubic-bezier(.18, 1.28, .3, 1);
--liquid-settle: cubic-bezier(.16, 1, .3, 1);
```

## Do

- Keep Radix Slider as the semantic source.
- Keep tracker position and fill width synchronized.
- Inset the visible track by half a tracker width so both endpoints finish beneath the tracker center.
- Extend the fill slightly beneath the tracker.
- Use `requestAnimationFrame` for pointer-frequency visual updates.
- Read component bounds once at the beginning of interaction.
- Filter raw pointer velocity.
- Apply spring to material geometry rather than selected-value position.
- Hide the original rail before drawing a magnified copy.
- Preserve a capsule silhouette in every phase.
- Test bright, dark, textured, and high-contrast backgrounds.
- Respect reduced-motion and reduced-transparency preferences.

## Don’t

- Don’t update multiple React states on every pointer event.
- Don’t call `getBoundingClientRect()` continuously during drag.
- Don’t add easing delay to tracker position while the pointer is active.
- Don’t animate fill and tracker with different durations.
- Don’t make the visible track span the full root width; Radix’s thumb endpoints are center positions.
- Don’t spring past the semantic range value.
- Don’t show the original and refracted rail simultaneously.
- Don’t overmagnify the inner rail; subtle enlargement reads as glass, while excessive enlargement reads as a separate graphic.
- Don’t use blur as a substitute for refraction.
- Don’t let deformation turn the tracker into a circle or irregular blob.
- Don’t stack multiple independent backdrop filters when one coordinated material layer is sufficient.

## Accessibility requirements

The slider must retain:

- Slider semantics supplied by Radix
- `aria-label` or `aria-labelledby`
- Keyboard arrow, Home, and End behavior
- Visible focus indication
- Disabled state
- Minimum, maximum, and step support
- Reduced-motion support

The Radix foundation preserves these requirements while providing range values, multiple thumbs, vertical orientation, and RTL behavior.

## shadcn/Radix API

The component now follows Radix Slider’s array-value convention:

```tsx
<LiquidSlider
  value={[volume]}
  onValueChange={([next]) => setVolume(next)}
  max={100}
  step={1}
/>
```

The current behavioral foundation supports:

- One or more thumbs
- Range sliders
- Controlled and uncontrolled arrays
- Horizontal and vertical orientation
- RTL
- shadcn aliases, shared tokens, and registry distribution

The optical layers decorate Radix parts without reimplementing Radix value or keyboard behavior. The next visual pass needs per-thumb active material for multiple-thumb and vertical layouts; the current shared interaction state activates all rendered thumbs together.

Install the registry item with Bun’s shadcn runner:

```bash
bunx --bun shadcn@latest add https://your-registry.example/r/liquid-slider.json
```

## Validation checklist

- [ ] The tracker remains attached to the pointer.
- [ ] The filled rail remains attached to the tracker.
- [ ] No thin original rail is visible inside the active lens.
- [ ] Refraction is noticeable but not oversized.
- [ ] Direction changes do not jitter.
- [ ] Quick clicks show a visible glass pulse.
- [ ] Drag release has no paused frame.
- [ ] Keyboard value updates show material feedback.
- [ ] Minimum and maximum positions align with the native input.
- [ ] The component remains usable with reduced motion.
- [ ] The production TypeScript build passes.
