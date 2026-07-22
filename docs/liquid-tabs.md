# Liquid Tabs: Implementation Guide

`LiquidTabs` combines Radix Tabs behavior with one persistent Liquid Glass selection indicator. The implementation is in [`src/components/liquid-tabs.tsx`](../src/components/liquid-tabs.tsx), and its installable styles are in [`src/styles/liquid.css`](../src/styles/liquid.css).

## Core rule

Do not render a separate glass background inside every active trigger. Keep one indicator alive, measure the active trigger, and animate that same material body to its next bounds.

```text
Radix Tabs.Root
└── LiquidTabsList
    ├── shared selection indicator
    │   ├── lens
    │   ├── rim
    │   └── pointer light
    ├── Radix Tabs.Trigger
    ├── Radix Tabs.Trigger
    └── Radix Tabs.Trigger
```

This preserves visual continuity when labels have different widths: the indicator changes both position and width instead of fading one capsule out and another in.

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
- A quick selection retains the shared `380ms` material pulse.
- Pointer velocity can stretch, squash, and lean the indicator.
- Selection position and indicator width settle with the same spring.
- Arrow-key selection uses the same material feedback.

Radix remains responsible for tab roles, relationships between triggers and panels, roving focus, keyboard navigation, controlled state, and automatic or manual activation.

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

`LiquidTabsList` adds `size` and `tint` while retaining Radix List props. The current material is optimized for horizontal capsule lists.

## Do

- Keep one indicator mounted across selections.
- Measure actual trigger bounds; labels and icons rarely have equal widths.
- Animate position and width with one curve.
- Keep trigger text above the glass layer.
- Let Radix own selection and focus.
- Remeasure after responsive layout and font changes.

## Don’t

- Don’t mount a new glass capsule for each selected value.
- Don’t assume equal trigger widths.
- Don’t use an index multiplied by a fixed percentage for position.
- Don’t delay label state behind semantic selection.
- Don’t put the indicator above trigger hit targets.
- Don’t apply spring overshoot to focus or selected state—only to visual geometry.

## Validation checklist

- [ ] The first selected indicator appears without flashing at `0,0`.
- [ ] Different label widths morph cleanly.
- [ ] Click, focus, and arrow navigation select the correct panel.
- [ ] Controlled and uncontrolled roots work.
- [ ] Resizing keeps the indicator aligned.
- [ ] Disabled triggers remain unavailable.
- [ ] Quick clicks show a readable glass pulse.
- [ ] Reduced motion preserves selection without interpolation.
- [ ] Production and registry builds pass.
