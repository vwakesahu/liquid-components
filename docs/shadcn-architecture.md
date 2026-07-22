# shadcn Extension Architecture

## Decision

Liquid UI will become a shadcn-compatible extension registry rather than a replacement component library.

The project will reuse shadcn and Radix for standard primitives, semantics, composition, and installation. Liquid UI will own only the optical material, interaction physics, component-specific rendering, and design guidance.

## Product position

> Liquid Glass components and variants for shadcn/ui.

Users should keep ordinary shadcn components such as `Field`, `Label`, `Dialog`, `Sheet`, `Tooltip`, and `Form`. Liquid UI will provide specialized components only where the material creates meaningful behavior.

Initial registry scope:

```text
@liquid/switch
@liquid/slider
@liquid/tabs
@liquid/qr
@liquid/player
@liquid/use-liquid-motion
@liquid/liquid-tokens
```

## Installation target

The intended user experience is:

```bash
bunx --bun shadcn@latest registry add \
  @liquid=https://liquid-ui.com/r/{name}.json

bunx --bun shadcn@latest add @liquid/switch @liquid/slider @liquid/tabs
```

The final namespace and domain are placeholders until branding and hosting are confirmed.

## Ownership boundary

### Reuse

- Radix behavior and accessibility primitives
- shadcn component composition
- `components.json`
- Tailwind and CSS-variable conventions
- The shadcn CLI and registry schema
- Existing project utilities such as `cn()`

### Own

- Liquid material layers
- Pointer-velocity physics
- Refraction rendering
- Generated displacement maps and SVG filter passes
- Engagement and settling motion
- Optical and motion tokens
- Component documentation
- Browser compatibility and performance work

## Component strategy

Create `LiquidSwitch`, `LiquidSlider`, and `LiquidTabs` as separate components instead of silently overriding shadcn’s standard controls.

This allows both styles to coexist:

```tsx
import { Switch } from "@/components/ui/switch"
import { LiquidSwitch } from "@/components/ui/liquid-switch"
```

Registry components should preserve the corresponding shadcn/Radix API wherever practical. This reduces migration cost and lets developers reuse existing knowledge.

## Refactor sequence

1. [x] Preserve the current standalone prototype as a Git baseline.
2. [x] Extract shared motion and pointer physics from switch and slider.
3. [x] Add shadcn project configuration, aliases, utilities, and shared tokens.
4. [x] Rebuild `LiquidSwitch` on Radix Switch.
5. [x] Rebuild `LiquidSlider` on Radix Slider.
6. [x] Adopt slider arrays, ranges, multiple thumbs, vertical orientation, and RTL at the Radix behavior layer.
7. [x] Create, validate, build, and dry-run the first `registry.json` items.
8. [x] Build Liquid Tabs on Radix Tabs with one measured shared indicator.
9. [x] Add shared DOM displacement maps and the WebGL Liquid Video Player.
10. [ ] Add a clean consumer fixture with interaction and visual tests.
11. [ ] Add per-thumb active material and vertical-axis deformation.
12. [ ] Publish through GitHub registry URLs first.
13. [ ] Add the stable `@liquid` namespace when hosted registry infrastructure is ready.

## Compatibility rule

The registry should add files and dependencies to a user project without requiring a runtime Liquid UI package. Users own the generated source in the same spirit as shadcn/ui.

Shared utilities may be installed as registry dependencies, but every dependency must remain visible and inspectable in the registry item.

## Styling compatibility

shadcn is a source-code registry and is not limited to Tailwind projects. Its registry can distribute component source, CSS, variables, hooks, and other files. Liquid UI therefore uses one hybrid styling contract instead of maintaining separate Tailwind and vanilla implementations.

### Portable core

`styles/liquid.css` owns the geometry, layered optics, state selectors, pointer deformation, and reduced-motion behavior. These rules are too coordinated to express as a long utility string without making the component difficult to tune. A project without Tailwind can use this file unchanged.

### Tailwind customization surface

Every public primitive exposes:

- A normal `className` prop merged with `cn()`.
- A stable shadcn-style `data-slot` attribute.
- State attributes supplied by Radix and Liquid UI.
- CSS custom properties for component geometry, tint, and motion.
- `indicatorClassName` on `LiquidTabsList` for direct indicator customization.

Tailwind consumers can style the root normally or target inner slots with arbitrary variants:

```tsx
<LiquidTabsList
  className="bg-zinc-950/10 dark:bg-white/10"
  indicatorClassName="!bg-white/65 dark:!bg-zinc-700/70"
>
  ...
</LiquidTabsList>
```

More specific internal targeting remains available without depending on generated class names:

```tsx
<LiquidSlider className="[&_[data-slot=liquid-slider-thumb]]:ring-1" />
```

Tailwind is an enhancement layer here, not a second renderer. Component behavior and Liquid material must remain identical in Tailwind and plain-CSS projects.

## References

- [shadcn custom registries](https://ui.shadcn.com/docs/registry)
- [shadcn registry namespaces](https://ui.shadcn.com/docs/registry/namespace)
- [shadcn registry setup](https://ui.shadcn.com/docs/registry/getting-started)
- [shadcn Slider](https://ui.shadcn.com/docs/components/radix/slider)
- [shadcn Switch](https://ui.shadcn.com/docs/components/radix/switch)
- [shadcn Tabs](https://ui.shadcn.com/docs/components/radix/tabs)
- [shadcn Tailwind v4 and data slots](https://ui.shadcn.com/docs/tailwind-v4)
