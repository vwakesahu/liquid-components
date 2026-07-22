# Liquid UI

Liquid UI is an independent React component study that translates the observable behavior of Apple’s Liquid Glass design language to the web.

The project is not an Apple rendering clone. Apple’s Liquid Glass renderer is proprietary and supplied automatically by system frameworks. This project uses browser-native layers, pointer input, and motion to recreate the important design qualities in reusable web components.

The first four components are `LiquidSwitch`, `LiquidSlider`, `LiquidTabs`, and `LiquidVideoPlayer`. The same material and interaction system will be reused for QR interactions next.

Detailed engineering context:

- [Liquid Slider implementation guide](docs/liquid-slider.md)
- [Liquid Switch implementation guide](docs/liquid-switch.md)
- [Liquid Tabs implementation guide](docs/liquid-tabs.md)
- [Liquid displacement renderer](docs/liquid-displacement.md)
- [Liquid Video Player implementation guide](docs/liquid-video-player.md)
- [shadcn extension architecture](docs/shadcn-architecture.md)
- [Publishing the registry and docs](docs/publishing.md)

## Documentation site

The public docs live in `apps/docs`. They use the same foundation as the current shadcn site—Next.js, Tailwind CSS, and Fumadocs—with a dark-first shell adapted from the Erebuz docs app.

```bash
bun run docs:dev
bun run docs:build
```

The component pages render the registry source directly, so a docs build also checks that the Switch, Slider, Tabs, and Video Player work across a Next.js client boundary.

## Credits

Liquid UI is an independent project inspired by Apple's Liquid Glass design language and informed by Aave Labs' published cross-browser glass research.

- Apple design references: [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass), [Materials HIG](https://developer.apple.com/design/human-interface-guidelines/materials), and the WWDC25 Liquid Glass sessions.
- Aave engineering reference: [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web), including the work credited there to Abhijeet Singh, Lochie Axon, Alex Vanderzon, Ana Howard, and the wider Aave Labs team.

This project is not affiliated with Apple or Aave Labs and contains no proprietary Apple framework code. See the full [credits and references page](apps/docs/content/docs/credits.mdx).

## Design principles

### 1. Quiet at rest

Liquid Glass is an interaction material, not a permanent decoration. Resting controls should remain familiar, legible, and visually lightweight. The stronger lens, lighting, and deformation appear when the person engages the control.

### 2. Material and motion are one system

Do not animate position separately from shape and light. When a control moves:

- Its lens follows the pointer or finger.
- Its body stretches in the direction of movement.
- Its height compresses slightly as velocity increases.
- Its highlight moves toward the interaction point.
- Its shadow and rim strengthen as the material lifts.
- All properties settle together after release.

### 3. Preserve component anatomy

Liquid motion can deform a component without changing what the component is. A capsule remains a capsule throughout idle, press, hold, drag, and release states. Avoid transformations that accidentally turn a tracker into a circle or an irregular blob.

### 4. Glass belongs to the functional layer

Use the material for controls, navigation, selection indicators, and transient interactions. Avoid placing glass on every content surface, and avoid stacking one glass element directly on another.

### 5. Behavior before visual fidelity

Every component must remain semantic, keyboard accessible, touch friendly, and understandable without transparency or animation. The optical treatment enhances the control; it never defines its meaning.

## Material anatomy

Each interactive element uses four layers:

| Layer | Purpose | Web implementation |
| --- | --- | --- |
| State surface | Communicates value and provides stable geometry | Solid or tinted background |
| Adaptive lens | Reveals content and color beneath the active element | Translucency, `backdrop-filter`, saturation, brightness |
| Specular rim | Defines the glass silhouette against any background | Inset highlights, subtle border, adaptive shadow |
| Interaction light | Connects the material to the pointer or finger | Pointer-positioned radial gradient |
| Refraction target | Supplies intentional component pixels to the lens | Synchronized track or selection copy filtered by a generated displacement map |

These layers belong to one component surface. Avoid applying independent glass effects to every inner child.

## Interaction state machine

All Liquid UI components should use the same state model.

```text
rest
  └─ pointer down / key press → engage
       ├─ hold → energized
       ├─ pointer movement → drag
       │    └─ release → settle
       └─ quick release → pulse → settle
                                └─ rest
```

### Rest

- Use stable component geometry.
- Keep the lens mostly opaque or visually quiet.
- Show state without depending only on color.
- Avoid continuous decorative animation.

### Engage

- Begin immediately on pointer down, not after a completed click.
- Lift the interactive element beyond the resting surface.
- Increase width and height together.
- Reveal translucency, rim light, and interaction light.
- Use a smooth ease-out curve so the response feels direct but not abrupt.

### Hold

- Preserve the enlarged glass surface for as long as input remains active.
- Keep the component’s defining shape. Capsules keep fully rounded ends.
- Position the brightest light close to the active pointer or touch coordinate.

### Drag

- Back-sync movement with the semantic component value.
- Follow the pointer without a noticeable start delay.
- Stretch using filtered pointer velocity rather than raw frame-to-frame movement.
- Lean toward the direction of travel.
- Compress height slightly as horizontal stretch increases.
- Smooth direction reversals to prevent jitter.

### Settle

- Start immediately after a drag release; never insert a paused frame.
- Resolve position, shape, light, and shadow together.
- Use a spring-like curve without excessive bounce.
- For a quick click, preserve a minimum visible pulse before settling so the glass response can be perceived.

## Motion tokens

The current switch establishes the initial motion scale for the system.

| Token | Value | Usage |
| --- | ---: | --- |
| `motion-pulse-min` | `380ms` | Minimum visible glass response for a quick click |
| `motion-engage` | `300ms` | Expansion into the active glass shape |
| `motion-drag-position` | `90ms` | Pointer-following position response |
| `motion-drag-shape` | `140ms` | Stretch and compression response during drag |
| `motion-settle-position` | `460ms` | Final spring-like position resolution |
| `motion-settle-shape` | `300ms` | Return to resting geometry |

Recommended curves:

```css
--liquid-ease-out: cubic-bezier(.16, 1, .3, 1);
--liquid-follow: cubic-bezier(.2, .72, .25, 1);
```

Use the shorter follow curve only while dragging. Rest, engage, and settle should use the softer system curve.

## Geometry tokens

The switch uses a wide track and a capsule tracker in every state.

| Size | Track | Idle tracker | Track inset |
| --- | --- | --- | ---: |
| Small | `50 × 26px` | `32 × 22px` | `2px` |
| Regular | `64 × 32px` | `40 × 28px` | `2px` |
| Large | `74 × 36px` | `46 × 32px` | `2px` |

During engagement, the tracker adds `8px` to its base width and becomes `8px` taller than the track. Drag velocity can add up to another `14px` of horizontal stretch.

All track and tracker states use a full capsule radius:

```css
border-radius: 999px;
```

Do not interpolate to a circle-specific radius or an asymmetric organic border radius.

## Pointer physics

Raw pointer deltas are noisy. Filter both stretch and direction before applying them to the material.

```ts
const targetStretch = Math.min(
  maximumStretch,
  Math.abs(deltaX) * 0.75 + velocity * 18,
)

setShape((current) => ({
  stretch: current.stretch * 0.62 + targetStretch * 0.38,
  direction: current.direction * 0.58 + Math.sign(deltaX) * 0.42,
}))
```

This low-pass filter preserves responsiveness while preventing twitching during slow movement and snapping during direction changes.

Keep click and drag release behavior separate:

- A drag settles immediately after pointer release.
- A quick click completes its minimum visible pulse before settling.

This avoids a pause after dragging without making click feedback too fast to see.

## Optical tokens

The current switch uses these starting values:

```css
--liquid-tint-green: #34c759;
--liquid-tint-blue: #0a84ff;
--liquid-idle-surface: #e9e9eb;
--liquid-lens-fill: rgba(255, 255, 255, 0.18);
--liquid-lens-border: rgba(255, 255, 255, 0.7);
--liquid-lens-blur: 1.5px;
--liquid-lens-saturation: 2;
--liquid-lens-brightness: 1.18;
```

Treat these as material defaults rather than fixed brand colors. Components may expose tint, but tint should communicate state or emphasis rather than decoration.

## React component contract

`LiquidSwitch` supports controlled and uncontrolled usage.

```tsx
import { useState } from "react"
import { LiquidSwitch } from "./components/glass-switch"

export function AutomaticUpdates() {
  const [enabled, setEnabled] = useState(true)

  return (
    <LiquidSwitch
      checked={enabled}
      onCheckedChange={setEnabled}
      aria-label="Automatic updates"
    />
  )
}
```

Uncontrolled usage:

```tsx
<LiquidSwitch defaultChecked aria-label="Automatic updates" />
```

Form usage:

```tsx
<LiquidSwitch
  name="automaticUpdates"
  value="enabled"
  defaultChecked
  aria-label="Automatic updates"
/>
```

### Props

| Prop | Type | Default |
| --- | --- | --- |
| `checked` | `boolean` | — |
| `defaultChecked` | `boolean` | `false` |
| `onCheckedChange` | `(checked: boolean) => void` | — |
| `size` | `"small" \| "regular" \| "large"` | `"regular"` |
| `tint` | CSS color string | `#34c759` |
| `disabled` | `boolean` | `false` |
| `name` | `string` | — |
| `value` | `string` | `"on"` |

## Accessibility contract

Every component added to this system must:

- Use an appropriate native element or recognized ARIA role.
- Expose its current value through semantic state.
- Support keyboard interaction equivalent to pointer interaction.
- Provide a visible focus indicator.
- Maintain a comfortable pointer and touch target.
- Remain understandable when transparency is reduced.
- Respect `prefers-reduced-motion`.
- Never rely only on color to communicate state.
- Keep form behavior intact when the component represents form data.

For the switch, the interactive element is a button with `role="switch"` and `aria-checked`. Space and Enter toggle its value.

## Reduced motion and transparency

Motion is supplemental feedback. Under reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Future components should also introduce a reduced-transparency mode that replaces backdrop filtering with a more opaque surface while preserving borders, state, and focus.

## Building the next components

Each component should reuse the same states and material layers, but adapt its geometry to its job.

### Slider

- Status: implemented as `LiquidSlider`.
- Uses Radix Slider as the semantic and behavioral surface while Liquid layers decorate its track, range, and thumbs.
- The glass tracker reveals the value underneath it.
- The filled and unfilled rail is redrawn inside the active lens and bent by the shared generated displacement map rather than merely blurred.
- Keep the tracker as a capsule at rest and during drag.
- Use less optical distortion than the switch so values remain readable.
- Movement must remain directly synchronized with the input value.
- Do not delay settling after pointer release.

```tsx
import { LiquidSlider } from "./components/liquid-slider"

<LiquidSlider
  value={[volume]}
  onValueChange={([next]) => setVolume(next)}
  min={0}
  max={100}
  aria-label="Volume"
/>
```

### Tabs and segmented controls

- Status: implemented as `LiquidTabs`, `LiquidTabsList`, `LiquidTabsTrigger`, and `LiquidTabsContent`.
- Use one shared glass selection indicator.
- Morph or glide the indicator between items rather than recreating it.
- Preserve label contrast while the lens moves underneath.
- Use spring settling only after the selected index is known.
- Support arrow-key navigation and selection semantics.

### QR interaction

- Keep the code itself high contrast and reliably scannable at rest.
- Apply refraction only as a temporary tactile response.
- Render distortion on canvas or WebGL when DOM filtering cannot manipulate the pixels safely.
- Return to an undistorted QR immediately after feedback completes.

### Media player

- Status: implemented as `LiquidVideoPlayer` with a native video element and one WebGL renderer.
- Treat controls as one coordinated glass family over the video.
- Share interaction lighting and motion tokens between play, skip, volume, and scrubber controls.
- Preserve control contrast over both bright and dark frames.
- Use WebGL when browser compositing prevents live-video filtering.
- Maintain native media semantics and keyboard shortcuts.

## Component implementation checklist

Before considering a component complete, verify:

- [ ] The resting state is visually quiet.
- [ ] Glass appears immediately on engagement.
- [ ] Quick clicks produce visible feedback.
- [ ] Dragging begins without a paused frame.
- [ ] Shape responds to filtered velocity.
- [ ] The component preserves its defining geometry.
- [ ] Movement, light, shadow, and shape settle together.
- [ ] Both controlled and uncontrolled usage work where applicable.
- [ ] Pointer, touch, and keyboard behavior match.
- [ ] Focus, disabled, dark, and reduced-motion states work.
- [ ] The component remains legible over varied content.
- [ ] The production TypeScript build passes.

## Project structure

```text
src/
├── components/
│   ├── glass-switch.tsx   # Radix Switch with Liquid material
│   ├── liquid-slider.tsx  # Radix Slider with Liquid material
│   ├── liquid-tabs.tsx    # Radix Tabs with a shared Liquid indicator
│   └── liquid-video-player.tsx # Native video with WebGL control lenses
├── hooks/
│   ├── use-liquid-motion.ts
│   ├── use-liquid-displacement.tsx
│   └── use-video-refraction.ts
├── lib/
│   └── utils.ts
├── styles/
│   └── liquid.css         # Installable material and motion system
├── App.tsx                # Documentation and live component study
├── main.tsx
└── styles.css             # Documentation-site styles
```

## Development

Install dependencies and start the local server:

```bash
bun install
bun run dev
```

Create a production build:

```bash
bun run build
```

Validate and build the shadcn registry:

```bash
bun run registry:validate
bun run registry:build
```

## Styling with or without Tailwind

Liquid UI ships its optical renderer in `styles/liquid.css`, so the components work in plain CSS projects. The same components are Tailwind-friendly: roots accept `className`, internal primitives expose stable `data-slot` attributes, and component colors and geometry are CSS variables. Tabs also exposes `indicatorClassName` for direct utility-class customization.

There is intentionally no second Tailwind-only implementation. This keeps the motion and glass rendering identical while allowing shadcn/Tailwind consumers to theme the public surfaces with utilities.

## References

- [Meet Liquid Glass — WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Build a SwiftUI app with the new design — WWDC25](https://developer.apple.com/videos/play/wwdc2025/323/)
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple Human Interface Guidelines: Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)
- [Aave: Building Glass for the Web](https://aave.com/design/building-glass-for-the-web)

## Disclaimer

Liquid UI is an independent web implementation and is not affiliated with, endorsed by, or sponsored by Apple Inc. Apple, SwiftUI, and Liquid Glass are trademarks or technologies of Apple Inc.
