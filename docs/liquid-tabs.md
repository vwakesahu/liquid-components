# Liquid Tabs: Implementation Guide

`LiquidTabs` combines Radix Tabs behavior with one persistent Liquid Glass selection indicator. The implementation is in [`packages/liquid-ui/src/components/ui/liquid-tabs.tsx`](../packages/liquid-ui/src/components/ui/liquid-tabs.tsx), and its installable styles are in [`packages/liquid-ui/src/styles/liquid.css`](../packages/liquid-ui/src/styles/liquid.css).

## Core rule

Do not render a separate glass background inside every active trigger. Keep one indicator alive, measure the active trigger, and animate that same material body to its next bounds.

```text
Radix Tabs.Root
└── LiquidTabsList
    ├── shared selection indicator
    │   ├── displaced highlight target
    │   ├── lens
    │   ├── rim
    │   └── pointer light
    ├── Radix Tabs.Trigger
    ├── Radix Tabs.Trigger
    └── Radix Tabs.Trigger
```

This preserves visual continuity when labels have different widths: the indicator changes both position and width instead of fading one capsule out and another in.

The highlighted target is processed by the shared generated displacement map. Tabs uses a medium-strength preset; every optical parameter can be overridden with `lens` on `LiquidTabsList`.

## Measurement

The list observes Radix’s `data-state="active"` attribute. When selection or layout changes, it measures the active trigger relative to the list and writes three CSS properties:

```css
--tabs-indicator-x
--tabs-indicator-width
--tabs-indicator-height
```

A `MutationObserver` catches selection and child changes. A `ResizeObserver` catches font, container, and responsive size changes. Measurements are grouped into one animation frame to avoid duplicate layout work.

The indicator is hidden until its first valid measurement, preventing a flash at the list origin.

## Interaction

- Pointer down immediately enlarges and lifts the selected indicator.
- Pressing anywhere on the segmented track selects the nearest enabled tab.
- Holding and dragging across the track continuously selects the nearest enabled tab.
- A quick selection retains the shared `380ms` material pulse.
- Pointer velocity can stretch, squash, and lean the indicator.
- During drag, selection position follows with a `500ms` liquid curve; width catches up with a moderate `460ms` spring.
- Engagement matches the other controls with `8px` of added tracker height and up to `14px` of velocity stretch.
- Selection position and indicator width settle with coordinated curves.
- Arrow-key selection uses the same material feedback.

Radix remains responsible for tab roles, relationships between triggers and panels, roving focus, keyboard navigation, controlled state, and automatic or manual activation.

Radix selects pointer-operated triggers from `mousedown`, not `click`. Drag selection therefore dispatches the same cancellable mouse-down path when the captured pointer crosses into a new segment. It must not call `.focus()` as a selection shortcut: programmatic focus exposes the keyboard focus ring during pointer input and couples selection to focus behavior.

## API

```tsx
import {
  LiquidTabs,
  LiquidTabsContent,
  LiquidTabsList,
  LiquidTabsTrigger,
} from "@/components/ui/liquid-tabs"

<LiquidTabs defaultValue="overview">
  <LiquidTabsList aria-label="Report view">
    <LiquidTabsTrigger value="overview">Overview</LiquidTabsTrigger>
    <LiquidTabsTrigger value="activity">Activity</LiquidTabsTrigger>
    <LiquidTabsTrigger value="insights">Insights</LiquidTabsTrigger>
  </LiquidTabsList>
  <LiquidTabsContent value="overview">Overview content</LiquidTabsContent>
  <LiquidTabsContent value="activity">Activity content</LiquidTabsContent>
  <LiquidTabsContent value="insights">Insights content</LiquidTabsContent>
</LiquidTabs>
```

`LiquidTabsList` adds `size`, `tint`, and `indicatorClassName` while retaining Radix List props. The current material is optimized for horizontal capsule lists.

The default tint is defined in CSS so `.dark` and `[data-theme="dark"]` ancestors automatically select the dark material. Passing `tint` is an explicit override; applications should provide a theme-aware value when that override must change between modes.

Tailwind customization uses the same source component:

```tsx
<LiquidTabsList
  className="bg-slate-950/10 dark:bg-white/10"
  indicatorClassName="!bg-white/70 dark:!bg-slate-700/70"
>
  ...
</LiquidTabsList>
```

All parts also expose stable `data-slot` attributes for Tailwind arbitrary variants or ordinary CSS selectors.

## Do

- Keep one indicator mounted across selections.
- Measure actual trigger bounds; labels and icons rarely have equal widths.
- Animate position and width with one curve.
- Keep trigger text above the glass layer.
- Let Radix own selection and focus.
- Remeasure after responsive layout and font changes.
- Capture the active pointer so a fast drag does not lose the gesture between triggers.

## Don’t

- Don’t mount a new glass capsule for each selected value.
- Don’t assume equal trigger widths.
- Don’t use an index multiplied by a fixed percentage for position.
- Don’t delay label state behind semantic selection.
- Don’t put the indicator above trigger hit targets.
- Don’t shrink individual triggers on press; keep the outer track stable while the glass indicator expands.
- Don’t apply spring overshoot to focus or selected state—only to visual geometry.

## Validation checklist

- [ ] The first selected indicator appears without flashing at `0,0`.
- [ ] Different label widths morph cleanly.
- [ ] Click, focus, and arrow navigation select the correct panel.
- [ ] Pressing gaps in the track selects the nearest enabled tab.
- [ ] Holding and dragging changes selection continuously.
- [ ] The outer track does not collapse or shrink during hold.
- [ ] Controlled and uncontrolled roots work.
- [ ] Resizing keeps the indicator aligned.
- [ ] Disabled triggers remain unavailable.
- [ ] Quick clicks show a readable glass pulse.
- [ ] Reduced motion preserves selection without interpolation.
- [ ] Production and registry builds pass.
