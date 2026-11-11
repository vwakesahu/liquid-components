---
name: liquid-ui
description: Build iOS 26 style Liquid Glass interfaces in React with Liquid UI, a shadcn registry of 21 glass components. Use when the user asks for liquid glass, glassmorphism, an iOS or Apple style UI, a tab bar, drawer, context menu, toolbar, page control, island or glass panel in a React and Tailwind project, when they want a frontend that doesn't look AI generated, when glass looks wrong (grey, flat, see-through, missing in Safari), or when editing files under components/ui/liquid-*.
---

# Liquid UI

Liquid UI is a set of 21 React components in the style of Apple's iOS 26 Liquid Glass. They're built on Radix and install as source through the shadcn CLI, so the code lands in the user's project. Docs: https://liquidcomponents.xyz/docs.

The point of using it is craft. The components already carry the refraction, the spring and the gestures. Your job is to pick the right one, put real content in it and stay out of its way. Every component's parts, props and an example are in [references/components.md](references/components.md). Read a component's section before you write it, and don't invent props.

## 1. How to think about a screen

Work through these in order before you write code. Most bad results come from skipping the first two.

1. **What is the screen for?** Name its one job in a sentence ("pick a photo and share it"). If it has three jobs, it's three screens, or a screen with a drawer.
2. **What would the iOS app do?** Liquid UI copies iOS patterns, so borrow the structure too: sections in a tab bar, actions in a toolbar, a short task in a drawer, a question in an alert, actions on a thing in a context menu. If you can't name the iOS equivalent, the design probably fights the components.
3. **Where does the glass go, and what's behind it?** Glass is only beautiful when it bends something. Decide the content first (photos, a map, video, a feed that scrolls under the bar), then float the glass over it. A screen with no content under the glass should use plain surfaces and the fill material.
4. **Pick the fewest components** that do the job (table in section 3). One primary action, three to five tabs, one menu per thing.
5. **Write it with real content.** Real names, photos, numbers and copy, in the length they'll really be. Placeholder content hides layout bugs and makes everything look generated.
6. **Walk the states** in section 7 before you call it done: empty, loading, error, long text, many items, small screen, dark mode, reduced motion, keyboard.

When the request is vague ("make it look like iOS"), make these calls yourself, say which ones you made in one line each, and build. Ask only when the answer changes the whole structure, for example a phone app or a desktop dashboard.

## 2. Set up

1. Check for `components.json` at the project root. If there isn't one, the project needs shadcn first: `npx shadcn@latest init`.
2. Check the stack: React 19 (or a compatible React 18) and **Tailwind CSS v4**. The components use v4 class syntax (for example `opacity-0!`) and tailwind-merge 3, so a Tailwind v3 project needs upgrading first, or styles go missing.
3. Register the registry once, so components install by name:
   ```bash
   npx shadcn@latest registry add '@liquid=https://liquidcomponents.xyz/r/{name}.json'
   ```
4. Install only what the screen uses:
   ```bash
   npx shadcn@latest add @liquid/liquid-tab-bar @liquid/liquid-drawer
   ```
   Without the registry entry, use the full URL: `npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-tab-bar.json`.
5. Import from the installed files (usually `@/components/ui/liquid-*`). There's no CSS file to import and no provider to add. Every component already starts with `"use client"`.

Use the package manager the project already has. Don't hand-copy component code from the docs, install it. The registry also writes `lib/utils.ts` (`cn`, `composeRefs`, `liquidSpring`); if the project already had one, merge them so every export survives.

## 3. Pick the component

| The screen needs | Use | Not |
|---|---|---|
| Top-level sections of an app, 3 to 5 of them | `LiquidTabBar` at the bottom | Tabs or a toolbar |
| Switching views inside one screen (Day, Week, Month) | `LiquidTabs` | A tab bar |
| Actions on the current view (back, share, format) | `LiquidToolbar` with groups | A tab bar |
| A short task or a picker that slides over the page | `LiquidDrawer`, with views for steps | A full page or a hand-built modal |
| One question with a yes or no | `LiquidAlert` | A drawer |
| Actions on one item (a photo, a message, a row) | `LiquidContextMenu` on press and hold | A menu button on every row |
| A list of choices from a button | `LiquidMenu` | A popover with buttons in it |
| Free content anchored to a control | `LiquidPopover` | A menu |
| Naming an icon-only control | `LiquidTooltip` | A visible label on every icon |
| Status after something happened | `toast` from `LiquidToast` | An alert |
| Live status at the top (a timer, a call, a download) | `LiquidIsland` | A toast |
| On and off | `LiquidSwitch` | A checkbox styled as a switch |
| A value on a range | `LiquidSlider` | A number input |
| A small count (guests, quantity) | `LiquidStepper` | A slider |
| One value from a long list (time, size) | `LiquidWheelPicker` | A select with 50 options |
| Search | `LiquidSearchField` | A plain input with a magnifier |
| Pages of a carousel | `LiquidPageControl` | Your own dots |
| Upload, download or loading | `LiquidProgress`, `LiquidProgressRing`, `LiquidSpinner` | A custom bar |
| A glass surface of your own (a card, a label over a photo) | `LiquidGlass`, and `LiquidGlassGroup` to merge nearby ones | A div with `backdrop-blur` |
| Video with glass controls | `LiquidVideoPlayer` | Native controls under glass |
| A primary action | `LiquidButton` | A gradient button |

On wide screens, the phone patterns change: a tab bar becomes a sidebar or top tabs, a drawer can become a popover or a side panel. Keep the glass, change the structure.

## 4. Make it look made, not generated

These are the habits that make AI frontends look like AI frontends. Don't do them.

- **Give the glass something to bend.** Float glass (tab bars, toolbars, labels, the island) over photos, maps, video or content that scrolls under it. On a flat white page, glass looks like a grey box.
- **One accent.** Set `--liquid-accent` once. No gradients, glows, neon, or a purple to blue default palette. Colour comes from the content (photos, avatars), not from the chrome.
- **Real content.** No lorem ipsum, no grey placeholder boxes, no initials in circles when a photo would do, no emoji as icons. Use `lucide-react` icons, the set the components use.
- **Follow iOS structure.** Section 1, step 2.
- **Don't stack glass on glass.** A drawer over a page is fine; a glass card inside a glass panel isn't. When glass shapes sit close together, put them in one `LiquidGlassGroup` so they fuse instead of overlapping.
- **Don't animate on top.** The components already move on a spring. Don't add transitions, hover scales or fade-ins to them. For your own motion, use the exported `liquidSpring` easing so it matches.
- **Quiet type.** One family (the system stack or the project's font), sentence case, 17px body and 13px secondary on phones. No all-caps labels, no letter-spaced eyebrows above every heading.
- **Fewer things.** One primary action per screen. A screen that does one job beats a dashboard of cards.

## 5. Theme it

The components read CSS variables. Set them in `:root` for light mode and `.dark` for dark mode; anything you leave out falls back to the default.

```css
:root {
  --liquid-accent: #0a84ff;      /* buttons, sliders, progress, the tab bar's selected tab, focus rings */
  --liquid-panel-tint: rgba(255, 255, 255, .66);  /* menus, popovers, alerts, drawers */
  --liquid-chrome-tint: rgba(255, 255, 255, .5);  /* tab bars and toolbars */
  --liquid-fill-tint: rgba(118, 118, 128, .14);   /* fields and steppers */
}
.dark {
  --liquid-accent: #0a84ff;
  --liquid-panel-tint: rgba(30, 29, 36, .68);
  --liquid-chrome-tint: rgba(40, 39, 48, .52);
  --liquid-fill-tint: rgba(118, 118, 128, .26);
}
```

To match a brand, change `--liquid-accent` only. Switches default to iOS green; pass `tint="var(--liquid-accent)"` to make one follow the accent. https://liquidcomponents.xyz/docs/theme generates the full block. Higher tints make glass more opaque (easier to read on busy photos); lower tints let more through.

## 6. When something looks wrong

Find the symptom, check the cause, apply the fix. Don't patch over it with extra CSS.

| Symptom | Likely cause | Fix |
|---|---|---|
| Glass is a flat grey or white box | Nothing behind it to bend, or the tint is too high | Put it over a photo, video or scrolling content; lower the tint; inside plain content use `liquidFillMaterial` |
| No bending at the rim in Safari or Firefox | Expected. Only Chromium can run SVG filters inside `backdrop-filter`, so other engines get a frosted fallback | Leave it. Don't polyfill or swap components. Controls (switch, slider, tabs) still refract their own surface everywhere |
| Glass shows nothing behind it, or only part of the page | An ancestor with `opacity` below 1, `filter`, `mask` or `backdrop-filter` limits what the glass can see | Move the glass out of that ancestor, or animate `transform` on the parent instead of `opacity` or `filter` |
| Glass looks solid and opaque | The user has reduced transparency on, which swaps in a solid fallback | Expected. Make sure the layout still reads with solid surfaces |
| Two glass shapes overlap with a hard seam | They're separate surfaces | Put them in one `LiquidGlassGroup` and set `merge` |
| Glass inside your own portal (a custom overlay) renders oddly | The group context crossed the portal | Wrap the portal's content in `LiquidGlassScope`. The built-in overlays already do this |
| Styles missing, classes do nothing | Tailwind v3, or the component files aren't in Tailwind's sources | Upgrade to Tailwind v4; make sure `components/ui` is scanned |
| Hydration mismatch in Next.js | A prop depends on something only the browser knows (a saved theme from `next-themes`, `localStorage`, the window size) | Render a neutral value until mounted, then the real one |
| Text on glass is hard to read | Busy or bright content behind light glass | Raise the tint, move the glass over a calmer part of the image, or use dark glass with light text. Never light text on light glass |
| Janky motion with big glass panels | Each surface draws a refraction map, and very large ones cost more while they move | Keep big glass still, move it with `transform`, and keep a screen to a few glass surfaces |
| A switch ignores the accent | The switch defaults to iOS green | Pass `tint="var(--liquid-accent)"` |
| A drag fights a scroll container, or the page won't scroll over a control | Both want the same gesture. The slider, switch and page control take every touch on them (`touch-none`); the toolbar lets vertical scrolling through | Don't put draggable controls inside a horizontal scroller, and leave scrollable room around sliders and switches on long pages |

If a fix needs you to edit the component source, say so and keep the change small; the source is the user's to own, but a one-off override is better done with `className`, a `data-slot` selector or a CSS variable.

## 7. Edge cases to walk before you're done

- **Empty:** what the screen shows with no items. A sentence and one action, not a blank page or a grey box.
- **Loading:** `LiquidSpinner` for unknown waits, `LiquidProgress` when you know the amount. Keep the layout's shape while it loads.
- **Errors:** say what happened and what to do next. A button's error status shakes; an alert asks one question. Don't toast an error the user has to act on.
- **Long text:** tab bar labels are one short word; toolbar buttons are icon-only with an `aria-label`; drawer titles wrap, so test a long one.
- **Many items:** a tab bar holds 3 to 5 tabs; the page control is for a handful of pages, not 40; a menu with more than about 8 items wants a search field or a drawer.
- **Small screens:** test at 320px and 375px. Floating bars need room for the home indicator: add `env(safe-area-inset-bottom)` to their bottom offset.
- **Dark mode:** check every glass surface over dark and bright content; set the `.dark` variables if you changed `:root`.
- **Reduced motion and reduced transparency:** handled inside the components. Don't override them, and don't add your own motion that ignores `prefers-reduced-motion`.
- **Keyboard and screen readers:** Radix handles roles, focus and keys. Every icon-only control and every slider, switch, stepper, tab list and page control needs an `aria-label` or a visible label tied to it. Don't remove focus outlines.

## 8. Before you say it's done

- [ ] Each component was installed with the shadcn CLI, on Tailwind v4.
- [ ] Floating glass sits over something with texture.
- [ ] One accent through `--liquid-accent`. No gradients or glows.
- [ ] Real content and lucide icons. No placeholders, no emoji icons.
- [ ] No extra transitions on Liquid UI components.
- [ ] The section 7 states work: empty, loading, error, long text, many items.
- [ ] Labels on every icon-only control.
- [ ] Works at 375px, in dark mode and with the keyboard.
- [ ] You looked at it in a browser, in Chromium and in Safari if you can.

## Reference

- Every component's parts, props and an example: [references/components.md](references/components.md)
- Docs and live demos: https://liquidcomponents.xyz/docs
- Source: https://github.com/vwakesahu/liquid-components
