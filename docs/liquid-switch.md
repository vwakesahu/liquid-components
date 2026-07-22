# Liquid Switch: Implementation Guide

This guide records the behavior and constraints of the current `LiquidSwitch`. The installable implementation is [`src/components/glass-switch.tsx`](../src/components/glass-switch.tsx), the shared pointer physics are in [`src/hooks/use-liquid-motion.ts`](../src/hooks/use-liquid-motion.ts), and the material is in [`src/styles/liquid.css`](../src/styles/liquid.css).

## Objective

The switch stays recognizable and quiet at rest. Pressing it temporarily turns its capsule tracker into a larger responsive lens; dragging moves that lens continuously before the binary value settles.

The component must:

- Preserve Radix Switch semantics and keyboard behavior.
- Support controlled and uncontrolled state.
- Toggle on an ordinary click.
- Follow click-and-drag input continuously.
- Keep a fully rounded rectangular tracker in every state.
- Show a perceptible glass pulse for quick clicks.
- Settle immediately after a real drag.

## Anatomy

```text
LiquidSwitch
└── Radix Switch.Root
    ├── state track
    │   └── tint surface
    └── Radix Switch.Thumb
        ├── displaced state-track copy
        ├── adaptive lens
        ├── specular rim
        └── interaction light
```

Radix owns the `switch` role, `aria-checked`, keyboard activation, disabled state, form bridge, and ordinary click toggle. Liquid UI owns the additional continuous drag gesture and optical response.

## Geometry

| Size | Root | Idle tracker | Inset |
| --- | --- | --- | ---: |
| Small | `50 × 26px` | `32 × 22px` | `2px` |
| Regular | `64 × 32px` | `40 × 28px` | `2px` |
| Large | `74 × 36px` | `46 × 32px` | `2px` |

Tracker travel is calculated from actual geometry:

```ts
const travel = rootWidth - trackerWidth - inset * 2
```

Do not hard-code checked positions separately in CSS. A single `--thumb-travel` value keeps sizes and drag settlement aligned.

## Click and drag arbitration

Radix provides click toggling, but a switch that feels like the Apple control also needs the tracker to follow a held pointer. The implementation separates those gestures with a small movement threshold:

1. Pointer down records the switch bounds and starting coordinate.
2. Movement beyond `2px` becomes a drag.
3. During drag, an inline `--thumb-x` follows clamped pointer progress.
4. Pointer up selects off or on using the root midpoint.
5. The click synthesized after that drag is prevented once so Radix does not toggle the settled value again.
6. When checked state changes, the temporary inline position is removed and CSS resumes owning the endpoint.

This one-shot click suppression is important. Permanently preventing clicks would remove normal switch behavior; omitting it would double-toggle after a drag.

## Motion model

The shared `useLiquidMotion` hook separates value movement from material deformation.

- `--thumb-x` represents binary or live drag position.
- `--liquid-stretch` expands with filtered pointer velocity.
- `--liquid-offset` keeps expansion centered while leaning in the travel direction.
- `--liquid-squash` lightly compresses height at speed.
- `--liquid-skew` communicates directional momentum.
- `--liquid-light-x` follows the engagement coordinate.

The tracker’s state-track copy is filtered through the shared generated displacement map. `scale`, `depth`, `curvature`, `splay`, `chroma`, `blur`, `glow`, edge highlight, and specular angle are configurable through the `lens` prop; see the [Liquid Displacement Renderer](liquid-displacement.md).

A quick click keeps the lens visible for at least `380ms`. A drag does not wait for that timer; it begins settling immediately on release.

The tracker remains a capsule throughout:

```css
border-radius: 999px;
```

Increasing width must never allow the tracker to become circular or expose a differently shaped inner lens.

## Performance rules

- Store pointer-frequency geometry in refs.
- Paint CSS variables once per animation frame.
- Read switch bounds once on pointer down.
- Use React state only for phase boundaries and semantic checked state.
- Keep the drag-position response shorter than the shape-settle response.
- Remove temporary drag styles after the semantic state catches up.

## Do

- Compose with Radix rather than reimplementing switch semantics.
- Preserve ordinary click, Space, and Enter behavior.
- Use pointer capture only for the switch’s explicit drag gesture.
- Keep enlargement centered around the resting tracker.
- Make the active background behind the tracker grow with the lens.
- Keep the click pulse long enough to read as material feedback.
- Test dragging from both the tracker and empty track area.

## Don’t

- Don’t treat pointer down as an immediate value toggle.
- Don’t allow the synthetic post-drag click to toggle again.
- Don’t animate semantic value with an overshooting spring.
- Don’t delay drag position behind the pointer.
- Don’t turn the tracker into a circle while pressed.
- Don’t make blur stronger than the rim and refracted color cues.
- Don’t leave an inline drag coordinate after state has settled.

## API

```tsx
import { LiquidSwitch } from "@/components/ui/liquid-switch"

<LiquidSwitch
  checked={enabled}
  onCheckedChange={setEnabled}
  size="regular"
  tint="#34c759"
  aria-label="Automatic updates"
/>
```

Uncontrolled usage:

```tsx
<LiquidSwitch defaultChecked aria-label="Automatic updates" />
```

Install the registry item with Bun:

```bash
bunx --bun shadcn@latest add https://your-registry.example/r/liquid-switch.json
```

## Validation checklist

- [ ] Click toggles exactly once.
- [ ] Click-and-hold visibly enlarges the tracker.
- [ ] Drag follows the pointer without a dead frame.
- [ ] Drag release settles to the correct side.
- [ ] The post-drag click does not toggle again.
- [ ] The tracker remains a rounded rectangle in every phase.
- [ ] Controlled and uncontrolled examples both work.
- [ ] Space and Enter toggle the switch.
- [ ] Focus and disabled states remain visible.
- [ ] Disabled switches cannot engage, capture a pointer, drag, or retain an active lens.
- [ ] Reduced motion removes decorative interpolation without removing state.
- [ ] Production and registry builds pass.
