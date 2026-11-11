# Liquid UI

[![CI](https://github.com/vwakesahu/liquid-components/actions/workflows/ci.yml/badge.svg)](https://github.com/vwakesahu/liquid-components/actions/workflows/ci.yml)

Liquid UI is Apple's iOS 26 Liquid Glass, rebuilt as React components. They ship as a shadcn registry, so the shadcn CLI copies the source straight into your project and there's no package to depend on. Every component has a live demo at https://liquidcomponents.xyz.

Apple's renderer is closed, so all of this is worked out from what you can see it do and redone with SVG filters, canvas and WebGL. Most components sit on Radix, the headless primitives that own roles, focus and keyboard. Liquid UI adds the glass, the refraction, the pointer physics and the springs on top.

## Install a component

You need React 18 or 19 and a project already set up for shadcn, that's Tailwind plus a `components.json`. If you don't have that yet, follow the [shadcn/ui installation guide](https://ui.shadcn.com/docs/installation). Any package manager works.

```
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-switch.json
```

The item name is `liquid-` plus the component, so the tab bar is `liquid-tab-bar`. The CLI copies in the component, the hooks and utilities it needs and a copy of the license, then installs the npm dependencies. Read the diff and commit it, those files are part of your app now.

To install by name instead of pasting the URL, register the registry once as `@liquid`.

```
npx shadcn@latest registry add '@liquid=https://liquidcomponents.xyz/r/{name}.json'
npx shadcn@latest add @liquid/liquid-slider
```

There's no stylesheet to import. The styles are Tailwind classes in the source you just installed, and pointer position, geometry and refraction are CSS variables set at runtime. Change a component with `className`, its `data-slot` attributes or those variables. The reduced motion and reduced transparency fallbacks sit next to the layers they change, so they come along with the component.

## Use it with AI

AI can build a frontend fast, it just tends to look like every other AI frontend. The Liquid UI skill teaches your assistant which component fits which screen, where glass works, how to fix it when it looks wrong and which edge cases to check.

```
npx skills add vwakesahu/liquid-components
```

Or copy [`skills/liquid-ui`](skills/liquid-ui) into your project's `.claude/skills/`. More on the [AI skill page](https://liquidcomponents.xyz/docs/skill).

## Components

Each one links to its page on the site, with a live demo.

- [Button](https://liquidcomponents.xyz/docs/components/button). An ordinary button at rest that turns to glass while you press it, plus a `glass` variant for over photos and video.
- [Switch](https://liquidcomponents.xyz/docs/components/switch). A Radix switch with a glass tracker you can drag.
- [Slider](https://liquidcomponents.xyz/docs/components/slider). A Radix slider with a refractive tracker, ranges and multiple thumbs.
- [Stepper](https://liquidcomponents.xyz/docs/components/stepper). The iOS minus and plus stepper, in glass.
- [Wheel picker](https://liquidcomponents.xyz/docs/components/wheel-picker). The iOS wheel picker you set an alarm with, and a glass lens magnifies the row passing through it.
- [Tabs](https://liquidcomponents.xyz/docs/components/tabs). Radix tabs with one glass indicator that measures each tab and drags between them.
- [Tab bar](https://liquidcomponents.xyz/docs/components/tab-bar). The iOS 26 tab bar, floating glass with a droplet you drag between tabs, and it folds to the current tab while the page scrolls.
- [Page control](https://liquidcomponents.xyz/docs/components/page-control). Page dots in a glass capsule, with a pill that glides and stretches between them.
- [Progress](https://liquidcomponents.xyz/docs/components/progress). The iOS progress bar, the App Store download ring and the activity indicator.
- [Glass](https://liquidcomponents.xyz/docs/components/glass). A glass surface that bends whatever sits behind it, and groups whose shapes flow together like liquid.
- [Toolbar](https://liquidcomponents.xyz/docs/components/toolbar). A floating glass toolbar whose groups fuse into one capsule and split apart again.
- [Menu](https://liquidcomponents.xyz/docs/components/menu). A glass dropdown that springs out of its trigger, with one lens that glides between the items.
- [Context menu](https://liquidcomponents.xyz/docs/components/context-menu). Press and hold to lift a copy of the content above a blurred backdrop, with a glass menu beside it.
- [Popover](https://liquidcomponents.xyz/docs/components/popover). A glass panel that springs out of its trigger.
- [Tooltip](https://liquidcomponents.xyz/docs/components/tooltip). A small glass capsule that springs out to name a control.
- [Toast](https://liquidcomponents.xyz/docs/components/toast). Glass notifications that stack like Sonner's, render `LiquidToaster` once and call `toast()` from anywhere.
- [Drawer](https://liquidcomponents.xyz/docs/components/drawer). A floating glass drawer that grows out of its button and morphs its height between views, after the one in Family, the wallet app.
- [Alert](https://liquidcomponents.xyz/docs/components/alert). The iOS alert, a centred glass card that asks one question.
- [Search field](https://liquidcomponents.xyz/docs/components/search-field). The iOS 26 search field, and a round glass close button flows out of it while it's focused.
- [Island](https://liquidcomponents.xyz/docs/components/island). A Dynamic Island that morphs between compact and expanded.
- [Video player](https://liquidcomponents.xyz/docs/components/video-player). A native `<video>` with glass controls, WebGL only draws the refraction around them and the player still works without it.

## How it works

Glass here is something you touch, not decoration. A control looks ordinary at rest and turns to glass while you press or drag it. A panel that floats over the page is glass all the time, because the glass is what separates it from what's under it.

Controls bend their own pixels in place. An SVG `feDisplacementMap` with a generated lens map pulls the track, rail or label under the lens into its rim and paints the rim light and shadow. Nothing is sampled from behind the glass, so there's no copy of the content to keep in sync, and at rest the filter comes off completely so an idle control costs nothing.

Panels and groups, anything built on `LiquidGlass`, go through the glass engine instead. It measures every shape in a group each frame while something moves, joins them into one smooth field and paints that as a backdrop filter, so two shapes that come close grow a liquid bridge and snap apart as they separate. Chromium bends the backdrop through an SVG filter, Safari and Firefox get the blur and saturation without the bend.

Video goes through WebGL with the same lens maps, one per control, because Safari won't pass live video pixels through an SVG filter.

None of this touches input or accessibility. Roles, focus and keyboard come from Radix or native elements, so a component still works where a renderer doesn't. With reduced transparency the refraction never turns on and lenses stay opaque, with reduced motion the springs and deformation go and the state stays.

Anything with an accent reads `--liquid-accent`, set it once on `:root` and the primary button, the slider fill, the tab bar, progress and every focus ring follow. Without it they fall back to iOS blue, `#0a84ff`. The switch stays iOS green unless you pass `tint`.

The glass tint comes from three materials exported from `liquid-glass.tsx`. `liquidPanelMaterial` is for anything that floats over the page, `liquidChromeMaterial` for bars over content and `liquidFillMaterial` for controls inside content. They're Tailwind class strings with a light and a dark tint, put one on your own `LiquidGlass` and it matches the menus and drawers. Each reads a theme variable first, so setting `--liquid-panel-tint`, `--liquid-chrome-tint` or `--liquid-fill-tint` in `:root` and `.dark` retunes all the glass of that kind at once.

Every component moves on one spring, `liquidSpring` in `lib/utils.ts`, a CSS `linear()` easing that overshoots a little and settles. Use it for your own motion so it matches.

The long versions are in [`docs/liquid-displacement.md`](docs/liquid-displacement.md) and [`docs/liquid-glass.md`](docs/liquid-glass.md).

## Working on the repo

`packages/liquid-ui/` is the source, a private workspace called `@liquid-ui/core`. `registry.json` at the root says which of its files go into each registry item. Components are in `src/components/ui`, the motion, displacement, glass and video hooks in `src/hooks`.

`apps/docs/` is the site, Next.js 16 and Tailwind 4, with Fumadocs turning the MDX in `content/docs` into pages. It imports the same source, so a docs build also checks the components across a Next.js client boundary.

`apps/playground/` is a Vite sandbox to build components against. `studio.html` in there is a dev-only stage for recording the hero film on the docs home page, it isn't part of the build.

`apps/teaser/` renders the switch teaser video, `scripts/capture.mjs` steps it frame by frame in headless Chrome.

`public/r` and `apps/docs/public/r` are the built registry, the first for checking locally and the second is what the site serves. Don't edit them by hand. Change the source, run `bun run registry:build` and commit what it writes, CI fails if they're out of date.

[`docs/`](docs) has the engineering notes, one per renderer, one each for the button, switch, slider, tabs and video player, and how publishing works.

Development runs on Bun 1.3.10, pinned in `package.json`. Install with that exact version through `bunx` so a newer Bun doesn't rewrite the lockfile. The components themselves don't need Bun.

```
bunx bun@1.3.10 install
bun run dev
bun run docs:dev
```

`dev` starts the playground on port 5173 and `docs:dev` starts the site on port 3000. `bun run check` type-checks the package and the playground. `bun run ci` runs the type checks, registry validation and both builds, the same gate GitHub Actions runs, so run it before you push.

## Deploy

The site deploys with the Vercel CLI straight from the working tree. The project isn't connected to Git, which keeps Git authorship separate from the Vercel account. Its root directory is `apps/docs` with files outside it included, so Next.js can read `packages/liquid-ui`. Run `bun run ci` first, then follow [`docs/publishing.md`](docs/publishing.md) for the deploy, the domain and the checks to run after.

## Credits

Apple designed Liquid Glass, and its controls, materials, lensing and accessibility guidance are the reference for everything here. We worked from the [Liquid Glass technology overview](https://developer.apple.com/documentation/technologyoverviews/liquid-glass), the Human Interface Guidelines on [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) and [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles), [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views), and three WWDC25 sessions, [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/), [Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/) and [Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/). There's no Apple framework code in here and it doesn't claim pixel-identical rendering.

Aave Labs published [Building Glass for the Web](https://aave.com/design/building-glass-for-the-web), and it was the main engineering reference for the cross-browser refraction. The generated displacement maps, the rounded rectangle computed by quadrants, fresh filter IDs for Safari and WebGL for live video all come from studying it. The article credits Abhijeet Singh for leading research and development, Lochie Axon for writing, Alex Vanderzon and Ana Howard for design direction, and the wider Aave Labs team for testing and refinement. Thank you to them for publishing it. The code here was written independently, it isn't an Aave release.

The drawer follows the one in [Family](https://family.co), designed by Benji Taylor and the Family team. It's an independent build in Liquid Glass and isn't affiliated with Family.

- [shadcn/ui](https://ui.shadcn.com). The open code registry model these components ship through.
- [Radix Primitives](https://www.radix-ui.com/primitives). The accessible behaviour under the switch, slider, tabs, tab bar, toolbar, menus, popover, tooltip, drawer and alert.
- [Vaul](https://vaul.emilkowal.ski) by Emil Kowalski. The drawer's drag feel and easing curve.
- [Notionists](https://heyzoish.gumroad.com/l/notionists) by Zoish (CC0), generated with [DiceBear](https://www.dicebear.com). The avatars in the examples.

The photos in the examples are from [Unsplash](https://unsplash.com), served through [Lorem Picsum](https://picsum.photos) and used under the Unsplash License. Every photographer is named on the [credits page](https://liquidcomponents.xyz/docs/credits).

Liquid UI isn't affiliated with, endorsed by or sponsored by Apple or Aave Labs. Apple, SwiftUI and Liquid Glass are trademarks or technologies of Apple Inc.

## License

MIT, see [`LICENSE`](LICENSE). Copyright 2026 Vivek Sahu. Every component you install brings a copy of it along.
