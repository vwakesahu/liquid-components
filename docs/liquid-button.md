# Liquid Button: Implementation Guide

`LiquidButton` uses the same tracker material as Switch, Slider, and Tabs, but locks that tracker in place. Its implementation, Tailwind utilities, optical layers, and motion states live in [`packages/liquid-ui/src/components/ui/liquid-button.tsx`](../packages/liquid-ui/src/components/ui/liquid-button.tsx).

## Objective

The button must remain a familiar semantic button at rest while feeling like a non-movable Liquid tracker when pressed.

- Its layout box and content stay fixed.
- Its internal capsule expands beyond the resting bounds without reflowing nearby UI.
- Refraction, rim light, glass shadow, and pointer light remain quiet at rest and appear together on engagement.
- The displaced color target fills the capsule; it must never read as a smaller bar or rail behind the label.
- Pointer movement changes only the light position. It never drags, stretches from velocity, skews, or changes the button's location.
- A quick click preserves the shared `380ms` minimum material pulse.
- The capsule stays fully rounded during rest, press, hold, and release.
- Visual prominence comes from style and role, not from making the preferred action larger than its peers.

## Anatomy

```text
native button (stable layout and semantics; the refraction surface)
├── state surface      (stays at the resting bounds)
├── tracker body       (the lens: expands past the surface while pressed)
│   └── pointer light
└── label and icon
```

The native `<button>` owns focus, keyboard activation, disabled behavior, form submission, and the click event. The internal tracker body is decorative and has `pointer-events: none`.

## Fixed tracker geometry

The outer button never grows during pointer engagement. Only the absolutely positioned tracker body changes its inset:

```css
.liquid-button__body {
  inset: 0;
}

.liquid-button[data-interacting] .liquid-button__body {
  inset: -6px -5px;
}
```

The regular tracker therefore becomes `10px` wider and `12px` taller while its center, label, hit target, and surrounding layout stay unchanged. Small and large sizes use proportional expansion values.

This distinction is essential. Growing the native button's padding or height causes neighboring elements to move and makes the control feel like a resizing web button rather than a lifted material tracker.

## Optical states

### Rest

- Render one stable, opaque state surface.
- Use compact, conventional button geometry and a quiet one-pixel inset boundary; keep Ghost and Link borderless.
- Keep refraction and pointer light off; the filter is not applied at rest.
- Use the same quiet tracker shadow as Slider and Switch.

### Press and hold

- Expand the internal body immediately.
- Replace the opaque surface with its translucent active material.
- Ramp in refraction: the button magnifies its own surface so it swells to fill the expanded body, with one lit rim.
- Keep the enlarged material visible for the entire hold.
- Move the radial light toward the held pointer without moving the capsule.

### Release

- A quick click completes the shared `380ms` pulse.
- A held press settles as soon as the pulse requirement is satisfied.
- Body inset, surface, refraction, rim, light, and shadow settle together.

The Button preset uses negative `scale`, which magnifies instead of compressing. That way the resting surface swells into the larger lens rather than shrinking inside it, which would read as two borders. The label sits in the lens's flat center, so it stays crisp.

## Variants

Variants change the stable state surface; they do not create separate motion systems.

- `default`: conventional neutral secondary treatment
- `primary`: blue emphasized action
- `secondary`: explicit alias for the neutral treatment
- `destructive`: neutral secondary surface with semantic red text
- `outline`: ordinary bordered surface
- `ghost`: quiet neutral action until hover or engagement
- `link`: compact text action with no button surface and a short click underline
- `status`: controlled idle, loading, error, and success morphology

The `status` variant is application-controlled. Loading disables repeated activation and spring-morphs into a compact spinner-only control while retaining `loadingLabel` for the live-region announcement. Error uses the same secondary surface and red text as a destructive action; Success uses a filled green surface. `errorTint` and `successTint` provide simple semantic color overrides.

## Do

- Keep the native button layout fixed during press feedback.
- Expand one internal capsule symmetrically around its resting bounds.
- Reveal all optical layers from the same interaction state.
- Keep the label and icon above the displaced target.
- Use pointer capture only to preserve a held press and light position.
- Preserve ordinary click, Space, Enter, disabled, and form behavior.

## Don't

- Don't drag the button or apply pointer-velocity stretch.
- Don't animate padding or height on the native layout box.
- Don't keep chromatic refraction permanently visible at rest.
- Don't make the resting button look like a glass tracker; the material is interaction feedback.
- Don't give the expanded body an opaque fill or its own box-shadow while pressed; the filter draws the glass.
- Don't use heavy backdrop blur as a replacement for displacement.
- Don't move the label when the material expands.
- Don't let variants fork the motion or accessibility contract.

## Validation checklist

- [ ] Pressing does not move neighboring layout.
- [ ] The tracker grows equally around its fixed center.
- [ ] Quick clicks show a readable material pulse.
- [ ] Holding preserves the enlarged state.
- [ ] Pointer movement changes light but not position or geometry.
- [ ] Refraction is hidden at rest and visible while engaged.
- [ ] Every variant uses the same press motion.
- [ ] Space and Enter trigger material feedback.
- [ ] Disabled and loading buttons cannot engage.
- [ ] Reduced motion and reduced transparency remain usable.
- [ ] Registry and production builds pass.
