# Liquid Slider: Implementation Guide

This document records how the current Liquid Slider was designed, the problems encountered while tuning it, and the rules future components should reuse.

The installable implementation and its Tailwind visual layers live in [`packages/liquid-ui/src/components/ui/liquid-slider.tsx`](../packages/liquid-ui/src/components/ui/liquid-slider.tsx); both the documentation site and playground consume that same source workspace.

## Objective

The slider should behave like a familiar range input at rest and temporarily become an optical, deformable lens during interaction.

The tracker must:

- Stay directly synchronized with the selected value.
- Expand beyond the resting rail when engaged.
- Remain a fully rounded capsule in every state.
- Stretch and lean according to horizontal velocity.
- Refract the real Radix rail and fill underneath it so the selected value stays visible through the tracker.
- Settle with spring motion without overshooting the selected value.

The optical treatment must never compromise range-input semantics, keyboard behavior, or form behavior.

## Current anatomy

The rendered structure is intentionally layered:

```text
LiquidSlider
└── Radix Slider.Root
    ├── Slider.Track
    │   └── Slider.Range
    ├── Slider.Thumb       (the lens: opaque at rest, clear glass while engaged)
    └── refraction filter  (applied to Slider.Root only while engaged)
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

Its white resting surface, clear engaged glass, engagement expansion, and release timing intentionally match `LiquidSwitch`. Only the displacement preset stays gentler so the value-bearing progress remains readable.

| Size | Tracker width | Slider height | Track height |
| --- | ---: | ---: | ---: |
| Small | 32px | 26px | 6px |
| Regular | 40px | 32px | 8px |
| Large | 46px | 36px | 10px |

Consumers can select a preset with `size` or override the pixel geometry with `trackerSize={{ width, height, trackHeight }}`. Values are clamped to usable minimums, and the rail can never be taller than the resting tracker. Motion and refraction calculations derive from the resolved geometry rather than assuming a preset.

During engagement, the tracker uses the same geometry as the Switch tracker: it adds `8px` to its base width and grows `16px` from its idle height. Pointer velocity can contribute up to another `14px` of horizontal stretch.

## Interaction phases

### Rest

The tracker is opaque, stable, and quiet. The refraction layers are invisible.

### Press or click

Pointer down immediately:

- Expands the tracker
- Turns the tracker into clear glass
- Ramps in refraction of the real rail and fill, the rim light, and the glass shadow

A quick click guarantees a minimum `380ms` visible pulse. Without this minimum duration, pointer down and up can occur before the glass expansion becomes perceptible.

### Hold

The enlarged tracker stays visible without continuous decorative movement. It remains a fully rounded rectangle.

### Drag

During drag:

- Tracker position and fill width update without CSS delay.
- Velocity changes tracker width, vertical compression, and skew.
- The refracted glass surface stretches slightly more.
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

CSS backdrop blur alone cannot create optical refraction. It only softens pixels behind an element.

The slider follows the shared [displacement renderer](liquid-displacement.md):

1. `Slider.Root` is the refraction surface and every `Slider.Thumb` is a lens.
2. While the slider has `data-interacting`, a generated lens map is positioned at each thumb's measured bounds and the root is filtered in place.
3. The real Radix rail and Range under the thumb are bent toward the rim, so the fill boundary stays on the semantic value with nothing to keep in sync.
4. The rim highlight, shade, and glass shadow come from the filter, so the thumb has a transparent background and no box-shadow while engaged.
5. On release the refraction eases out and the filter is removed.

Range sliders get one lens per thumb inside the same filter.

### Important limitation

Only the slider's own pixels bend. Where the engaged thumb hangs past the rail, the area shows the page through clear glass rather than refracted page content. Media and canvas surfaces use the same lens maps through WebGL instead.

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

The shared motion hook reads root bounds on pointer down and reuses them for the rest of the drag. Calling `getBoundingClientRect()` on every pointer move can force repeated layout calculation.

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
- Keep the engaged thumb transparent so the refracted rail shows through it.
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
- Don’t give the copied progress target independent React state, easing, or timing.
- Don’t add soft color stops around its fill boundary; they read as a second fake line.
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
