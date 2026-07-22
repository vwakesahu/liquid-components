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
npx shadcn@latest registry add \
  @liquid=https://liquid-ui.com/r/{name}.json

npx shadcn@latest add @liquid/switch @liquid/slider
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
- Engagement and settling motion
- Optical and motion tokens
- Component documentation
- Browser compatibility and performance work

## Component strategy

Create `LiquidSwitch` and `LiquidSlider` as separate components instead of silently overriding shadcn’s standard `Switch` and `Slider`.

This allows both styles to coexist:

```tsx
import { Switch } from "@/components/ui/switch"
import { LiquidSwitch } from "@/components/ui/liquid-switch"
```

Registry components should preserve the corresponding shadcn/Radix API wherever practical. This reduces migration cost and lets developers reuse existing knowledge.

## Refactor sequence

1. Preserve the current standalone prototype as a Git baseline.
2. Extract shared motion and pointer physics from switch and slider.
3. Add shadcn project configuration and Tailwind-compatible tokens.
4. Rebuild `LiquidSwitch` on Radix Switch.
5. Rebuild `LiquidSlider` on Radix Slider.
6. Support slider arrays, ranges, multiple thumbs, vertical orientation, and RTL.
7. Create and validate `registry.json` items.
8. Add installation fixtures that test a clean consumer project.
9. Publish through GitHub registry URLs first.
10. Add the stable `@liquid` namespace when hosted registry infrastructure is ready.

## Compatibility rule

The registry should add files and dependencies to a user project without requiring a runtime Liquid UI package. Users own the generated source in the same spirit as shadcn/ui.

Shared utilities may be installed as registry dependencies, but every dependency must remain visible and inspectable in the registry item.

## References

- [shadcn custom registries](https://ui.shadcn.com/docs/registry)
- [shadcn registry namespaces](https://ui.shadcn.com/docs/registry/namespace)
- [shadcn registry setup](https://ui.shadcn.com/docs/registry/getting-started)
- [shadcn Slider](https://ui.shadcn.com/docs/components/radix/slider)
- [shadcn Switch](https://ui.shadcn.com/docs/components/radix/switch)
