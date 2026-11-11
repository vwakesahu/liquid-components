# Liquid UI component reference

Parts, props and one working example for each of the 21 registry items, in registry order. Props were read from the component source. Where a part passes its props straight through to Radix, the table names the Radix primitive instead of repeating them.

Rules that apply to every component:

- **Install** with the shadcn CLI. Each section gives the full URL. If the project registered the registry as `@liquid` (see SKILL.md), `npx shadcn@latest add @liquid/liquid-button` does the same thing.
- **Import** from the installed file, `@/components/ui/liquid-*`. Never import from `@liquid-ui/core`; that alias only exists inside the docs site.
- **Client components.** Every file starts with `"use client"`. In the Next.js App Router you can render them from a server component, but handlers you pass (`onClick`, `onValueChange`) and calls to `toast()` must come from a client component.
- **Tailwind v4.** Some class names use v4-only syntax (for example the `opacity-0!` important suffix).
- **Glass needs something behind it.** Glass surfaces refract and frost whatever is under them. Over photos, video, maps or scrolling content they look like glass; over a flat white page they look like a grey box. Chromium does true refraction. Safari and Firefox get frosted glass with the same rim, tint and shadow. With reduced transparency on, glass turns opaque.
- **Don't fade glass with `opacity`**, on the glass or on a parent. It cuts the glass off from its backdrop. The components animate `transform` and `scale` only; do the same.
- **Two lens types.** `LiquidGlassOptions` tunes glass surfaces (`refraction`, `bezel`, `frost`, `saturation`, `chroma`, `shadow`, `merge`...). `LiquidLensOptions` tunes the lens on controls while pressed (`scale`, `curvature`, `blur`, `chroma`, `shadow`...). Each table says which one a `lens` prop takes. Both are optional and have tuned defaults; leave them alone unless asked.

---

## Liquid Button (`liquid-button`)

**Use it for:** any button, including async submit buttons (`variant="status"`) and glass buttons over images or video (`variant="glass"`).
**Don't use it for:** switching app sections (use the tab bar) or a row of icon actions on a bar (use the toolbar).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-button.json
```

```tsx
import { LiquidButton, type LiquidButtonProps, type LiquidButtonStatus } from "@/components/ui/liquid-button"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `variant` | `"default" \| "primary" \| "secondary" \| "destructive" \| "outline" \| "ghost" \| "glass" \| "link" \| "status"` | `"default"` | `default` and `secondary` are the neutral grey surface. `primary` is filled with `tint`. `destructive` keeps the neutral surface with red text. `glass` is glass at rest. `link` has no surface. `status` morphs between the four states. |
| `size` | `"small" \| "regular" \| "large"` | `"regular"` | Height 36, 40 or 44 px. |
| `status` | `"idle" \| "loading" \| "success" \| "error"` | `"idle"` | Only read when `variant="status"`. `loading` disables the button and sets `aria-busy`. |
| `tint` | `string` | `"var(--liquid-accent, #0a84ff)"` | Fill for `primary` and `status`. |
| `errorTint` | `string` | `"#ef4444"` | Text colour for `destructive` and the error state. |
| `successTint` | `string` | `"#30d158"` | Fill for the success state. |
| `loadingLabel` | `ReactNode` | `"Loading…"` | Announced to screen readers while loading. Not shown. |
| `errorLabel` / `successLabel` | `ReactNode` | `"Try again"` / `"Done"` | Shown and announced in those states. |
| `lens` | `LiquidLensOptions` | button preset | Press refraction. Ignored by `variant="glass"`. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Pass `type="submit"` inside a form. |

Every other prop goes to the native `<button>`.

```tsx
"use client"

import { useState } from "react"
import { LiquidButton, type LiquidButtonStatus } from "@/components/ui/liquid-button"

export function SaveButton({ save }: { save: () => Promise<void> }) {
  const [status, setStatus] = useState<LiquidButtonStatus>("idle")

  async function submit() {
    setStatus("loading")
    try {
      await save()
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <LiquidButton variant="status" status={status} successLabel="Saved" onClick={submit}>
      Save changes
    </LiquidButton>
  )
}
```

Gotchas:
- The button never runs your request or resets itself. Keep the status in your state; `success` stays until you set `idle`.
- `status` buttons have a fixed width (142 px regular, 122 small, 166 large), so keep the idle label short.
- Icon-only buttons need `aria-label`. Icons placed as direct children are sized to 1.15em; give them `aria-hidden="true"`.
- `glass` only looks right over images, video or rich content.

---

## Liquid Switch (`liquid-switch`)

**Use it for:** an on or off setting that applies at once.
**Don't use it for:** picking one of several options (use tabs or a menu).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-switch.json
```

```tsx
import { LiquidSwitch } from "@/components/ui/liquid-switch"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `size` | `"small" \| "regular" \| "large"` | `"regular"` | 50×26, 64×32 or 74×36 px. |
| `tint` | `string` | `"#34c759"` | Track colour when on. |
| `lens` | `LiquidLensOptions` | switch preset | Thumb lens while pressed or dragged. |

Everything else (`checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `required`, `name`, `value`) comes from Radix `@radix-ui/react-switch` `Switch.Root`.

```tsx
"use client"

import { useState } from "react"
import { LiquidSwitch } from "@/components/ui/liquid-switch"

export function WifiRow() {
  const [wifi, setWifi] = useState(true)
  return (
    <div className="flex items-center justify-between">
      <span>Wi-Fi</span>
      <LiquidSwitch checked={wifi} onCheckedChange={setWifi} tint="var(--liquid-accent)" aria-label="Wi-Fi" />
    </div>
  )
}
```

Gotchas:
- The default tint is iOS green and does **not** follow `--liquid-accent`. Pass `tint="var(--liquid-accent)"` to follow the theme, as the docs demo does.
- It renders no label. Give it `aria-label` or wrap it in a `<label>`.
- Works controlled (`checked` + `onCheckedChange`) or uncontrolled (`defaultChecked`). Dragging the thumb past the middle sets the value.
- Size it with `size`, not width or height classes.

---

## Liquid Slider (`liquid-slider`)

**Use it for:** a value on a continuous range (volume, brightness), or a range with two thumbs.
**Don't use it for:** small whole-number counts (use the stepper).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-slider.json
```

```tsx
import { LiquidSlider, type LiquidSliderProps, type LiquidSliderTrackerSize } from "@/components/ui/liquid-slider"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `size` | `"small" \| "regular" \| "large"` | `"regular"` | Tracker 32×22, 40×28 or 46×32 px; track 6, 8 or 10 px tall. |
| `trackerSize` | `{ width?: number; height?: number; trackHeight?: number }` | none | Custom geometry in px. Overrides `size`. |
| `tint` | `string` | `"var(--liquid-accent, #0a84ff)"` | Fill colour. |
| `lens` | `LiquidLensOptions` | slider preset | Tracker lens while dragging. |

Everything else (`value`, `defaultValue`, `onValueChange`, `onValueCommit`, `min`, `max`, `step`, `disabled`, `name`, `orientation`) comes from Radix `@radix-ui/react-slider` `Slider.Root`.

```tsx
"use client"

import { useState } from "react"
import { LiquidSlider } from "@/components/ui/liquid-slider"

export function Volume() {
  const [volume, setVolume] = useState([64])
  return <LiquidSlider value={volume} onValueChange={setVolume} aria-label="Volume" className="w-full" />
}
```

Gotchas:
- `value` and `defaultValue` are arrays: `defaultValue={[64]}`, not `64`. Two values render two thumbs.
- `aria-label` on the root is copied to each thumb (the focusable part), with " 1" and " 2" added for a range. Always set it.
- The default width is `min(320px, 100%)`. Add `className="w-full"` to fill the container.

---

## Liquid Tabs (`liquid-tabs`)

**Use it for:** switching views inside one screen, like a segmented control (Day, Week, Month).
**Don't use it for:** top-level app navigation (use the tab bar) or actions (use the toolbar).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-tabs.json
```

```tsx
import { LiquidTabs, LiquidTabsContent, LiquidTabsList, LiquidTabsTrigger } from "@/components/ui/liquid-tabs"
```

`LiquidTabsList`:

| Prop | Type | Default | What it does |
|---|---|---|---|
| `size` | `"small" \| "regular" \| "large"` | `"regular"` | Indicator height 30, 36 or 42 px, with matching padding and text. |
| `tint` | `string` | translucent white (light), grey (dark) | Indicator colour. |
| `indicatorClassName` | `string` | none | Classes for the indicator. |
| `lens` | `LiquidLensOptions` | tabs preset | Indicator lens while pressed or dragged. |

`LiquidTabs` is Radix `@radix-ui/react-tabs` `Tabs.Root` (`value`, `defaultValue`, `onValueChange`, `activationMode`). `LiquidTabsTrigger` and `LiquidTabsContent` are Radix `Tabs.Trigger` and `Tabs.Content`.

```tsx
<LiquidTabs defaultValue="day">
  <LiquidTabsList aria-label="Calendar range">
    <LiquidTabsTrigger value="day">Day</LiquidTabsTrigger>
    <LiquidTabsTrigger value="week">Week</LiquidTabsTrigger>
    <LiquidTabsTrigger value="month">Month</LiquidTabsTrigger>
  </LiquidTabsList>
  <LiquidTabsContent value="day"><DayView /></LiquidTabsContent>
  <LiquidTabsContent value="week"><WeekView /></LiquidTabsContent>
  <LiquidTabsContent value="month"><MonthView /></LiquidTabsContent>
</LiquidTabs>
```

Gotchas:
- Put `aria-label` on `LiquidTabsList`.
- The indicator is a neutral pill and doesn't use `--liquid-accent` (only the focus rings do). Change it with `tint`.
- Pressing and dragging along the list selects the tab under the pointer, so `onValueChange` can fire several times in one drag.
- `LiquidTabs` is `w-full`, triggers are `flex-1`, and the list is at least `min(100%, 360px)` wide. `LiquidTabsContent` adds an 18 px top margin.

---

## Liquid Glass (`liquid-glass`)

**Use it for:** your own glass surfaces: a label or card over a photo, round glass buttons over media, shapes that merge.
**Don't use it for:** a control on its own (put a button inside it), or glass inside other glass.

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-glass.json
```

```tsx
import {
  LiquidGlass,
  LiquidGlassGroup,
  LiquidGlassScope,
  liquidChromeMaterial,
  liquidFillMaterial,
  liquidPanelMaterial,
  type LiquidGlassGroupProps,
  type LiquidGlassProps,
} from "@/components/ui/liquid-glass"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidGlass` | `lens` | `LiquidGlassOptions` | refraction 13, bezel 18, frost 2.5 | Optics. Ignored inside a group. |
| `LiquidGlassGroup` | `lens` | `LiquidGlassOptions` | same | Optics for every shape in the group. |
| `LiquidGlassGroup` | `merge` | `number` | `14` | Shapes closer than this many px fuse through a liquid bridge. |

Both also take every `div` prop. `LiquidGlass` defaults to `rounded-[24px]`.

```tsx
import { LiquidGlass, LiquidGlassGroup } from "@/components/ui/liquid-glass"

<div className="relative overflow-hidden rounded-3xl">
  <img src="/photos/big-sur.jpg" alt="Cliffs above the sea at Big Sur" className="h-80 w-full object-cover" />
  <LiquidGlass className="absolute bottom-4 left-4 rounded-[22px] px-4 py-3 text-white">
    Big Sur, California
  </LiquidGlass>
</div>

<LiquidGlassGroup merge={22} className="relative h-14 w-[420px]">
  <LiquidGlass className="absolute left-0 h-14 w-36 rounded-full transition-[translate] duration-700" style={{ translate: joined ? "112px 0" : "0 0" }} />
  <LiquidGlass className="absolute left-[268px] h-14 w-36 rounded-full" />
</LiquidGlassGroup>
```

Gotchas:
- It needs a photo, video or content behind it. See the rules at the top.
- Size and round it with ordinary utilities. The glass follows the element's box and border radius, including transitions, every frame.
- Inside a `LiquidGlassGroup`, a `LiquidGlass` doesn't draw itself; the group draws one fused piece of glass and its `lens` applies.
- Tint one surface with `--liquid-glass-tint` (and `--liquid-glass-solid` for reduced transparency), for example `className="[--liquid-glass-tint:rgba(255,255,255,.4)] dark:[--liquid-glass-tint:rgba(20,20,24,.5)]"`, or add a material class (see Shared exports).
- If you portal your own `LiquidGlass` out of a group, wrap it in `LiquidGlassScope` (see Shared exports).

---

## Liquid Toolbar (`liquid-toolbar`)

**Use it for:** actions on the current view, floating over content (back, forward, share, text formatting).
**Don't use it for:** top-level app sections (use the tab bar) or switching views (use tabs).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-toolbar.json
```

```tsx
import {
  LiquidToolbar,
  LiquidToolbarButton,
  LiquidToolbarGroup,
  LiquidToolbarSeparator,
  type LiquidToolbarProps,
} from "@/components/ui/liquid-toolbar"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidToolbar` | `merged` | `boolean` | `false` | Fuses every group into one capsule. Toggling it morphs. |
| `LiquidToolbar` | `merge` | `number` | `10` | Distance in px at which groups start to fuse. |
| `LiquidToolbar` | `lens` | `LiquidGlassOptions` | `{ frost: 4, refraction: 12 }` | Glass of every group. |
| `LiquidToolbarGroup` | `lens` | `LiquidLensOptions` | tabs preset | The droplet that swells under a pressed button. |

`LiquidToolbar` also takes Radix `@radix-ui/react-toolbar` `Toolbar.Root` props (`orientation`, `loop`, `dir`). `LiquidToolbarGroup` takes `div` props. `LiquidToolbarButton` is Radix `Toolbar.Button` with `type="button"` by default. `LiquidToolbarSeparator` is Radix `Toolbar.Separator`.

```tsx
import { ChevronLeft, ChevronRight, Share } from "lucide-react"

<LiquidToolbar merged={scrolledDown} aria-label="Browser controls" className="fixed bottom-6 left-1/2 -translate-x-1/2">
  <LiquidToolbarGroup>
    <LiquidToolbarButton aria-label="Back" onClick={back}><ChevronLeft /></LiquidToolbarButton>
    <LiquidToolbarButton aria-label="Forward" onClick={forward}><ChevronRight /></LiquidToolbarButton>
  </LiquidToolbarGroup>
  <LiquidToolbarGroup>
    <LiquidToolbarButton aria-label="Share" onClick={share}><Share /></LiquidToolbarButton>
  </LiquidToolbarGroup>
</LiquidToolbar>
```

Gotchas:
- It doesn't position itself. Place it over the content it acts on so the glass has something to bend.
- `aria-label` on the toolbar and on every icon-only `LiquidToolbarButton`.
- Only `LiquidToolbarButton` gets the droplet press feedback. Other elements in a group work but have no press effect.
- Drive `merged` from your app (scroll direction, focus, a compact layout).
- Radix gives it the `toolbar` role and roving focus, so arrow keys move between buttons.

---

## Liquid Menu (`liquid-menu`)

**Use it for:** a list of actions or choices opened from a button.
**Don't use it for:** free content or form controls (use the popover), or press and hold on content (use the context menu).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-menu.json
```

```tsx
import {
  LiquidMenu,
  LiquidMenuContent,
  LiquidMenuGroup,
  LiquidMenuItem,
  LiquidMenuLabel,
  LiquidMenuSeparator,
  LiquidMenuShortcut,
  LiquidMenuTrigger,
} from "@/components/ui/liquid-menu"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidMenuTrigger` | `asChild` | `boolean` | `false` | `false` renders a `LiquidButton` (takes every button prop, like `variant` and `size`). `true` opens from your own child element. |
| `LiquidMenuContent` | `align` | Radix align | `"start"` | Alignment against the trigger. |
| `LiquidMenuContent` | `sideOffset` | `number` | `8` | Gap from the trigger in px. |
| `LiquidMenuContent` | `lens` | `LiquidLensOptions` | tabs preset, magnifying | The gliding highlight. |
| `LiquidMenuItem` | `destructive` | `boolean` | `false` | Red text and icon. |

`LiquidMenu` is Radix `@radix-ui/react-dropdown-menu` `DropdownMenu.Root` (`open`, `defaultOpen`, `onOpenChange`, `modal`). The rest of `LiquidMenuContent`, `LiquidMenuItem` (`onSelect`, `disabled`, `textValue`), `LiquidMenuLabel`, `LiquidMenuSeparator` and `LiquidMenuGroup` are the matching Radix parts. `LiquidMenuShortcut` is a `span`.

```tsx
import { Copy, Ellipsis, Pencil, Trash2 } from "lucide-react"

<LiquidMenu>
  <LiquidMenuTrigger variant="ghost" size="small" aria-label="Options for Itinerary.pdf">
    <Ellipsis aria-hidden="true" />
  </LiquidMenuTrigger>
  <LiquidMenuContent align="end">
    <LiquidMenuItem onSelect={rename}><Pencil />Rename<LiquidMenuShortcut>⌘R</LiquidMenuShortcut></LiquidMenuItem>
    <LiquidMenuItem onSelect={duplicate}><Copy />Duplicate<LiquidMenuShortcut>⌘D</LiquidMenuShortcut></LiquidMenuItem>
    <LiquidMenuSeparator />
    <LiquidMenuItem destructive onSelect={remove}><Trash2 />Delete</LiquidMenuItem>
  </LiquidMenuContent>
</LiquidMenu>
```

Gotchas:
- Only the parts above exist. There are no submenu, checkbox or radio items.
- Put the lucide icon first, as a direct child of the item; it's sized to 16 px and greyed (red when `destructive`).
- `className` on `LiquidMenuContent` styles the outer Radix element (min width 220 px), not the glass panel.
- Content is portalled and scoped already, so it works from inside a toolbar or tab bar.
- An icon-only trigger needs `aria-label`. Closing waits for a short exit animation before Radix unmounts it.

---

## Liquid Popover (`liquid-popover`)

**Use it for:** free content anchored to a control, like a few settings with sliders and switches.
**Don't use it for:** a list of actions (use the menu), naming a control (use the tooltip), or a multi-step task (use the drawer).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-popover.json
```

```tsx
import {
  LiquidPopover,
  LiquidPopoverAnchor,
  LiquidPopoverClose,
  LiquidPopoverContent,
  LiquidPopoverTrigger,
} from "@/components/ui/liquid-popover"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidPopoverTrigger` | every `LiquidButton` prop | | | Always renders a `LiquidButton`. |
| `LiquidPopoverContent` | `align` | Radix align | `"center"` | Alignment against the trigger. |
| `LiquidPopoverContent` | `sideOffset` | `number` | `10` | Gap in px. |
| `LiquidPopoverContent` | `lens` | `LiquidGlassOptions` | `{ frost: 16, refraction: 11 }` | Panel glass. |
| `LiquidPopoverContent` | `className` | `string` | `w-72 rounded-[22px] p-4` | Goes to the glass panel. |

`LiquidPopover` is Radix `@radix-ui/react-popover` `Popover.Root`. The rest of `LiquidPopoverContent` (`side`, `collisionPadding`, `onOpenAutoFocus`) is Radix `Popover.Content`. `LiquidPopoverClose` and `LiquidPopoverAnchor` are Radix `Popover.Close` and `Popover.Anchor`.

```tsx
import { SlidersHorizontal } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-button"
import { LiquidSlider } from "@/components/ui/liquid-slider"
import { LiquidSwitch } from "@/components/ui/liquid-switch"

<LiquidPopover>
  <LiquidPopoverTrigger variant="outline"><SlidersHorizontal aria-hidden="true" />Display</LiquidPopoverTrigger>
  <LiquidPopoverContent>
    <div className="grid gap-4">
      <strong>Display</strong>
      <LiquidSlider size="small" defaultValue={[70]} aria-label="Brightness" />
      <div className="flex items-center justify-between">
        Night Shift <LiquidSwitch size="small" aria-label="Night Shift" />
      </div>
      <LiquidPopoverClose asChild>
        <LiquidButton size="small" variant="outline">Done</LiquidButton>
      </LiquidPopoverClose>
    </div>
  </LiquidPopoverContent>
</LiquidPopover>
```

Gotchas:
- `LiquidPopoverTrigger` has no `asChild`. To open from another element, control `open` and position with `LiquidPopoverAnchor`.
- `LiquidPopoverClose` renders a plain button unless you use `asChild` with a `LiquidButton`.
- Change the panel width with `className` on the content (`className="w-80"`).
- Radix handles focus, Escape, outside clicks and collision-aware placement.

---

## Liquid Toast (`liquid-toast`)

**Use it for:** short status after something happened ("Saved", "Uploaded").
**Don't use it for:** a question that needs an answer (use the alert) or live status that lasts (use the island).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-toast.json
```

```tsx
import { LiquidToaster, toast, type LiquidToastOptions } from "@/components/ui/liquid-toast"
```

| Option | Type | Default | What it does |
|---|---|---|---|
| `title` | `ReactNode` | required | The main line. |
| `description` | `ReactNode` | none | A second, quieter line. |
| `icon` | `ReactNode` | none | Shown before the text. |
| `action` | `{ label: ReactNode; onClick: () => void }` | none | A button. Clicking it runs `onClick` and dismisses the toast. |
| `duration` | `number` | `4000` | Milliseconds before it leaves. `Infinity` keeps it. |

Calls: `toast(input)` takes options or a string (the title) and returns a numeric id. `toast.success`, `toast.error` and `toast.info` add a coloured icon. `toast.update(id, partialOptions)` changes a toast in place. `toast.dismiss(id)` removes one; `toast.dismiss()` removes all. `toast.promise(promise, { loading, success, error })` shows one toast that follows the promise; `success` and `error` can be functions of the result or error. `LiquidToaster` takes only `className`.

```tsx
"use client"

import { Wifi } from "lucide-react"
import { LiquidToaster, toast } from "@/components/ui/liquid-toast"

// Once, near the root of the app:
<LiquidToaster />

// Anywhere in client code:
toast.success({ title: "Saved to Photos", description: "IMG_2048.heic" })
toast({
  title: "Wi-Fi disconnected",
  description: "Reconnecting to Home",
  icon: <Wifi />,
  action: { label: "Retry", onClick: reconnect },
})
toast.promise(uploadPhotos(), { loading: "Uploading 3 photos…", success: "Uploaded to iCloud", error: "Upload failed" })
```

Gotchas:
- Mount `LiquidToaster` once. If two are mounted, only the first draws. `toast()` needs no provider.
- It sits fixed at the top centre (z-index 100) and portals into `document.body`. There's no position prop; `className` goes on the fixed wrapper.
- Up to three show at once. Hovering spreads the stack and pauses the timers; timers also pause while the tab is hidden. Swipe up to dismiss. There is no close button.
- Each toast is `role="status"` with a polite live region.

---

## Liquid Stepper (`liquid-stepper`)

**Use it for:** a small whole-number count (guests, quantity, font size).
**Don't use it for:** a wide continuous range (use the slider) or a long list of values (use the wheel picker).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-stepper.json
```

```tsx
import { LiquidStepper, type LiquidStepperProps } from "@/components/ui/liquid-stepper"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `value` | `number` | none | Controlled value. |
| `defaultValue` | `number` | `0` | Uncontrolled starting value. |
| `onValueChange` | `(value: number) => void` | none | Fires on every step, including held repeats. |
| `min` / `max` | `number` | `-Infinity` / `Infinity` | Bounds. The buttons disable at each end. |
| `step` | `number` | `1` | Amount per press. |
| `format` | `(value: number) => ReactNode` | none | Formats the shown value, e.g. `` (v) => `${v} pt` ``. |
| `showValue` | `boolean` | `true` | `false` gives the compact iOS form with a divider. |
| `disabled` | `boolean` | `false` | Disables both buttons. |
| `lens` | `LiquidGlassOptions` | `{ frost: 6, shadow: 0 }` | Glass of the capsule. |
| `aria-label` | `string` | `"Value"` | Names the group. |

Every other prop goes to the wrapping `div`.

```tsx
"use client"

import { useState } from "react"
import { LiquidStepper } from "@/components/ui/liquid-stepper"

export function Quantity() {
  const [quantity, setQuantity] = useState(1)
  return <LiquidStepper value={quantity} onValueChange={setQuantity} min={1} max={9} aria-label="Quantity" />
}
```

Gotchas:
- Always set `min` and `max`; the defaults are unbounded.
- Values snap to multiples of `step` counted from 0, then clamp to `min` and `max`. With `min={1} step={5}` the values are 1, 5, 10.
- It's a `group` with two buttons labelled "Decrease" and "Increase" (fixed English), not a `spinbutton`. Tab moves between them; Enter or Space steps once. Holding the pointer repeats after 400 ms.

---

## Liquid Wheel Picker (`liquid-wheel-picker`)

**Use it for:** picking from a long list, like a time, a date or a duration.
**Don't use it for:** two or three options (use tabs or a menu) or a small count (use the stepper).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-wheel-picker.json
```

```tsx
import {
  LiquidWheel,
  LiquidWheelPicker,
  type LiquidWheelOption,
  type LiquidWheelPickerProps,
  type LiquidWheelProps,
} from "@/components/ui/liquid-wheel-picker"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidWheel` | `options` | `Array<string \| number \| { value: string; label: ReactNode }>` | required | Rows. Numbers become strings. |
| `LiquidWheel` | `value` | `string` | none | Controlled value. |
| `LiquidWheel` | `defaultValue` | `string` | first option | Uncontrolled starting value. |
| `LiquidWheel` | `onValueChange` | `(value: string) => void` | none | Fires once the wheel settles on a row, not during a spin. |
| `LiquidWheel` | `unit` | `ReactNode` | none | Fixed label beside the selected row ("min"). |
| `LiquidWheel` | `aria-label` | `string` | required | Names the `spinbutton`. |
| `LiquidWheelPicker` | `lens` | `LiquidLensOptions` | gentle magnifier | The band lens while a wheel turns. |

Both parts take `div` props.

```tsx
import { LiquidWheel, LiquidWheelPicker } from "@/components/ui/liquid-wheel-picker"

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

export function AlarmTime() {
  return (
    <LiquidWheelPicker aria-label="Alarm time">
      <LiquidWheel aria-label="Hour" options={hours} defaultValue="7" />
      <LiquidWheel aria-label="Minute" options={minutes} defaultValue="30" />
      <LiquidWheel aria-label="Period" options={["AM", "PM"]} defaultValue="AM" />
    </LiquidWheelPicker>
  )
}
```

Gotchas:
- Values are strings even when options are numbers: `defaultValue="7"`, not `7`.
- Option values must be unique; they're used as React keys.
- Always put `LiquidWheel` inside `LiquidWheelPicker`; the picker draws the selection band and lens. The picker is a fixed 204 px tall.
- For dependent wheels (days in a month), compute `options` from the other wheels' state.
- Keys: up and down move one row, Page Up and Page Down five, Home and End jump to the ends.

---

## Liquid Drawer (`liquid-drawer`)

**Use it for:** a short task or a set of options that slides up over the page, with views for steps.
**Don't use it for:** one yes or no question (use the alert) or a short list of actions (use the menu).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-drawer.json
```

```tsx
import { LiquidDrawer, LiquidDrawerClose, LiquidDrawerContent, LiquidDrawerDescription, LiquidDrawerTitle, LiquidDrawerTrigger } from "@/components/ui/liquid-drawer"
```

`LiquidDrawerContent`:

| Prop | Type | Default | What it does |
|---|---|---|---|
| `view` | `string \| number` | none | Names the current content. Changing it cross-fades and morphs the height. |
| `closeOnOutsideClick` | `boolean` | `true` | `false` makes a backdrop click nudge the drawer instead. |
| `closeOnDrag` | `boolean` | `true` | `false` makes dragging only rubber-band. |
| `lens` | `LiquidGlassOptions` | `{ frost: 16, refraction: 14 }` | Card glass. |
| `className` | `string` | none | Goes to the glass card. |

`LiquidDrawer` is Radix `@radix-ui/react-dialog` `Dialog.Root` (`open`, `defaultOpen`, `onOpenChange`). The rest of `LiquidDrawerContent` is Radix `Dialog.Content`. `LiquidDrawerTrigger` takes every `LiquidButton` prop. `LiquidDrawerClose`, `LiquidDrawerTitle` and `LiquidDrawerDescription` are the Radix parts (title and description styled).

```tsx
"use client"

import { useState } from "react"
import { Share } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-button"

export function AlbumOptions() {
  const [view, setView] = useState<"album" | "share">("album")
  return (
    <LiquidDrawer onOpenChange={(open) => open && setView("album")}>
      <LiquidDrawerTrigger variant="outline">Album options</LiquidDrawerTrigger>
      <LiquidDrawerContent view={view}>
        {view === "album" ? (
          <>
            <LiquidDrawerTitle>Summer 2026</LiquidDrawerTitle>
            <LiquidDrawerDescription>48 photos, shared with 3 people.</LiquidDrawerDescription>
            <LiquidButton variant="secondary" size="large" className="mt-5 w-full" onClick={() => setView("share")}>
              <Share aria-hidden="true" />Share album
            </LiquidButton>
          </>
        ) : (
          <>
            <LiquidDrawerTitle>Share album</LiquidDrawerTitle>
            <LiquidDrawerDescription>Anyone with the link can view it.</LiquidDrawerDescription>
            <LiquidDrawerClose asChild>
              <LiquidButton variant="primary" size="large" className="mt-5 w-full">Copy link</LiquidButton>
            </LiquidDrawerClose>
          </>
        )}
      </LiquidDrawerContent>
    </LiquidDrawer>
  )
}
```

Gotchas:
- Render a `LiquidDrawerTitle` in every view; it's the dialog's accessible name. Reset `view` when it opens, as above.
- It floats 16 px above the bottom, max 380 px wide, with `p-6` per view, and is as tall as its content.
- Drags never start on buttons, links, fields, labels, switches, sliders or tabs. Add `data-drawer-no-drag` to anything else that shouldn't start one (a horizontal scroller).
- `LiquidDrawerTrigger` has no `asChild`. Opened through `open` instead, it grows from the button pressed in the last 1.5 s, or the focused element.
- Escape always closes it, even with `closeOnOutsideClick={false}` and `closeOnDrag={false}`.

---

## Liquid Alert (`liquid-alert`)

**Use it for:** one question with two or three answers, especially before something destructive.
**Don't use it for:** status after the fact (use a toast) or anything with more than one field (use the drawer).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-alert.json
```

```tsx
import {
  LiquidAlert,
  LiquidAlertAction,
  LiquidAlertCancel,
  LiquidAlertContent,
  LiquidAlertInput,
  LiquidAlertTrigger,
} from "@/components/ui/liquid-alert"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidAlertContent` | `title` | `ReactNode` | required | The question. |
| `LiquidAlertContent` | `description` | `ReactNode` | none | One or two lines under it. |
| `LiquidAlertContent` | `body` | `ReactNode` | none | Sits between the text and the actions, e.g. a `LiquidAlertInput`. |
| `LiquidAlertContent` | `stacked` | `boolean` | stacks at 3 or more actions | Stack the actions vertically. |
| `LiquidAlertContent` | `lens` | `LiquidGlassOptions` | `{ frost: 18, refraction: 12 }` | Card glass. |
| `LiquidAlertAction` | `destructive` | `boolean` | `false` | Red text on the neutral surface instead of the `primary` fill. |

`LiquidAlert` is Radix `@radix-ui/react-alert-dialog` `AlertDialog.Root` (`open`, `defaultOpen`, `onOpenChange`); the rest of `LiquidAlertContent` is `AlertDialog.Content` (`onOpenAutoFocus`). `LiquidAlertTrigger`, `LiquidAlertAction` and `LiquidAlertCancel` take every `LiquidButton` prop. `LiquidAlertInput` takes `input` props.

```tsx
<LiquidAlert>
  <LiquidAlertTrigger variant="destructive">Delete album</LiquidAlertTrigger>
  <LiquidAlertContent title="Delete “Summer”?" description="This album and its 48 photos will be removed from all your devices.">
    <LiquidAlertCancel>Cancel</LiquidAlertCancel>
    <LiquidAlertAction destructive onClick={deleteAlbum}>Delete</LiquidAlertAction>
  </LiquidAlertContent>
</LiquidAlert>
```

Gotchas:
- Focus starts on Cancel, so a stray Enter never confirms. A backdrop click doesn't close it; Escape and the buttons do.
- Any action closes it. Call `event.preventDefault()` in an action's `onClick` to keep it open while async work runs, then set `open` to `false` yourself (control `open` for this).
- Actions are `primary` by default; pass `variant="secondary"` for a neutral one.
- With `LiquidAlertInput`, focus it in `onOpenAutoFocus` (call `event.preventDefault()` first).
- `LiquidAlertTrigger` has no `asChild`; to open from elsewhere, control `open`.

---

## Liquid Search Field (`liquid-search-field`)

**Use it for:** search over a list, a map or a page, with a cancel button that flows out of the field while it's focused.
**Don't use it for:** ordinary text fields.

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-search-field.json
```

```tsx
import { LiquidSearchField, type LiquidSearchFieldProps } from "@/components/ui/liquid-search-field"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `value` | `string` | none | Controlled value. |
| `defaultValue` | `string` | `""` | Uncontrolled starting value. |
| `onValueChange` | `(value: string) => void` | none | Fires on typing and on clearing. |
| `onCancel` | `() => void` | none | Fires when the round cancel button or Escape dismisses the search. |
| `placeholder` | `string` | `"Search"` | Also the `aria-label` unless you pass one. |
| `lens` | `LiquidGlassOptions` | `{ frost: 10, refraction: 10 }` | Glass of the field and the cancel button. |

Every other prop (`name`, `autoFocus`, `onFocus`, `onBlur`, `onKeyDown`) goes to the `<input>`. `className` goes to the outer wrapper.

```tsx
"use client"

import { useState } from "react"
import { LiquidSearchField } from "@/components/ui/liquid-search-field"

export function PlaceSearch({ places }: { places: string[] }) {
  const [query, setQuery] = useState("")
  const results = places.filter((place) => place.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="grid gap-3">
      <LiquidSearchField value={query} onValueChange={setQuery} placeholder="Search places" />
      <ul>{results.map((place) => <li key={place}>{place}</li>)}</ul>
    </div>
  )
}
```

Gotchas:
- Use `onValueChange`. `onChange` isn't part of its props.
- The round cancel button and Escape clear the field and blur it. The small inline clear button only clears and keeps focus.
- It's `w-full` and 44 px tall; size it with its container. The wrapper has `role="search"`.
- It uses the fill material (a light grey tint), so it reads correctly on a plain background.

---

## Liquid Island (`liquid-island`)

**Use it for:** a live activity at the top of the screen (a timer, a call, now playing) that expands on tap.
**Don't use it for:** one-off confirmations that need no live state (use a toast).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-island.json
```

```tsx
import { LiquidIsland, type LiquidIslandProps } from "@/components/ui/liquid-island"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `expanded` | `boolean` | `false` | Shows `children` when true, `leading` and `trailing` when false. |
| `onExpandedChange` | `(expanded: boolean) => void` | none | Called on click, Enter, Space and Escape. |
| `leading` / `trailing` | `ReactNode` | none | Compact content at each end. |
| `children` | `ReactNode` | none | Expanded content. |
| `expandedSize` | `{ width: number; height: number }` | `{ width: 360, height: 84 }` | Expanded size in px. |
| `compactSize` | `{ width: number; height: number }` | `{ width: 168, height: 37 }` | Compact size. Use `126` wide for the empty idle pill. |

Every other prop goes to the root `div`.

```tsx
"use client"

import { useState } from "react"
import { Pause, Timer } from "lucide-react"
import { LiquidIsland } from "@/components/ui/liquid-island"

export function TimerIsland({ left, onPause }: { left: string; onPause: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <LiquidIsland
      expanded={expanded}
      onExpandedChange={setExpanded}
      aria-label={`Timer, ${left} remaining`}
      leading={<Timer className="size-4 text-[#ff9f0a]" aria-hidden="true" />}
      trailing={<span className="text-[#ff9f0a]">{left}</span>}
      className="fixed left-1/2 top-2 -translate-x-1/2"
    >
      <strong className="flex-1 text-3xl tabular-nums">{left}</strong>
      <button type="button" aria-label="Pause" onClick={(event) => { event.stopPropagation(); onPause() }}>
        <Pause aria-hidden="true" />
      </button>
    </LiquidIsland>
  )
}
```

Gotchas:
- Controlled only. There's no `defaultExpanded`, and without `onExpandedChange` a tap does nothing.
- It isn't glass. It's a solid black pill with white text, like the hardware island, so it works on any background.
- The whole island is `role="button"` with `aria-expanded`. Give it an `aria-label` that describes the activity.
- Buttons inside must call `event.stopPropagation()`, or the press also toggles the island.
- Expanded content stays mounted (transparent and `aria-hidden`) while compact. It centres itself with `mx-auto` but doesn't pin itself; position it.

---

## Liquid Video Player (`liquid-video-player`)

**Use it for:** video with glass controls (play, skip, timeline, mute, fullscreen) that refract the video.
**Don't use it for:** background or decorative video with no controls (use a plain `<video>`).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-video-player.json
```

```tsx
import { LiquidVideoPlayer } from "@/components/ui/liquid-video-player"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `src` | `string` | none | Video URL. |
| `crossOrigin` | `"anonymous" \| "use-credentials"` | none | Needed for cross-origin video (see gotchas). |
| `muted` | `boolean` | `false` | Starting muted state; the mute button changes it after. |
| `volume` | `number` | `1` | 0 to 1. |
| `skipSeconds` | `number` | `10` | Seconds for the back and forward buttons and arrow keys. |
| `lens` | `LiquidLensOptions` | none | Refraction of the controls. |
| `className` | `string` | none | Goes to the wrapper (`aspect-video w-full rounded-[28px]`). |
| `videoClassName` | `string` | none | Goes to the `<video>`. |
| `aria-label` | `string` | `"Video player"` | Names the player. |

Every other `<video>` attribute (`poster`, `loop`, `preload`, `onEnded`) goes to the video element. `controls` isn't accepted. The `ref` is the `<video>` element.

```tsx
<LiquidVideoPlayer
  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  crossOrigin="anonymous"
  poster="/media/flower-poster.webp"
  aria-label="Flower opening, time-lapse"
/>
```

Gotchas:
- The refraction is drawn in WebGL from the video's pixels. A cross-origin video needs `crossOrigin="anonymous"` and CORS headers on the server. Without them, or without WebGL, it falls back to the plain video with the same controls.
- It installs `lucide-react` (for its icons) and `liquid-slider` (the timeline).
- Keys while the player is focused: Space or K play and pause, left and right arrows skip, M mutes, F toggles fullscreen.
- Controls hide 2.4 s after the pointer stops moving during playback, and stay while paused.

---

## Liquid Tab Bar (`liquid-tab-bar`)

**Use it for:** the 3 to 5 top-level sections of an app, floating at the bottom over scrolling content.
**Don't use it for:** switching views inside one screen (use tabs) or actions (use the toolbar).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-tab-bar.json
```

```tsx
import { LiquidTabBar, LiquidTabBarButton, LiquidTabBarItem } from "@/components/ui/liquid-tab-bar"
// Types: LiquidTabBarProps, LiquidTabBarItemProps, LiquidTabBarButtonProps
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidTabBar` | `value` / `defaultValue` | `string` | none | Selected tab, controlled or not. |
| `LiquidTabBar` | `onValueChange` | `(value: string) => void` | none | Fires on tap, drag and arrow keys. |
| `LiquidTabBar` | `minimized` | `boolean` | `false` | Folds the bar to the current tab. |
| `LiquidTabBar` | `accessory` | `ReactNode` | none | A separate glass control beside the bar. |
| `LiquidTabBar` | `glass` | `LiquidGlassOptions` | `{ frost: 6 }` | The bar's glass. |
| `LiquidTabBar` | `lens` | `LiquidLensOptions` | tabs preset | The droplet while pressed or dragged. |
| `LiquidTabBar` | `aria-label` | `string` | `"Tabs"` | Names the tab list. |
| `LiquidTabBarItem` | `value`, `icon` | `string`, `ReactNode` | required | The tab's value and icon. Children are the label. |
| `LiquidTabBarItem` | `badge` | `ReactNode` | none | Red count on the icon. Hidden for `undefined`, `null` or `false`. |

`LiquidTabBarItem` also takes Radix `@radix-ui/react-tabs` `Tabs.Trigger` props (`disabled`). `LiquidTabBarButton` is a round glass `<button>` for the accessory.

```tsx
"use client"

import { useState } from "react"
import { Images, Search, SquareStack, Users } from "lucide-react"

export function PhotosTabBar({ scrolledDown }: { scrolledDown: boolean }) {
  const [tab, setTab] = useState("library")
  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center">
      <LiquidTabBar
        aria-label="Photos"
        value={tab}
        onValueChange={setTab}
        minimized={scrolledDown}
        accessory={<LiquidTabBarButton aria-label="Search"><Search aria-hidden="true" /></LiquidTabBarButton>}
      >
        <LiquidTabBarItem value="library" icon={<Images aria-hidden="true" />}>Library</LiquidTabBarItem>
        <LiquidTabBarItem value="albums" icon={<SquareStack aria-hidden="true" />}>Albums</LiquidTabBarItem>
        <LiquidTabBarItem value="shared" icon={<Users aria-hidden="true" />} badge={2}>Shared</LiquidTabBarItem>
      </LiquidTabBar>
    </div>
  )
}
```

Gotchas:
- It has no content parts. Render the screen for `value` yourself.
- It doesn't place itself. Pin it at the bottom centre over content that scrolls under it.
- The selected colour is `--tab-bar-tint`, which defaults to `--liquid-accent`. Set it on the bar itself (`className="[--tab-bar-tint:#ff375f]"`), not on a parent.
- While `minimized`, the other tabs are `inert`. Reopening the bar (on scroll up or a tap) is up to you.
- The accessory sits in the bar's glass group, so make it glass: `LiquidTabBarButton` or a `LiquidGlass`.

---

## Liquid Context Menu (`liquid-context-menu`)

**Use it for:** actions on one item (a message, a photo, a link) on press and hold or right-click, with the item lifted above a blurred backdrop.
**Don't use it for:** a menu opened from a button (use the menu).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-context-menu.json
```

```tsx
import {
  LiquidContextMenu,
  LiquidContextMenuContent,
  LiquidContextMenuGroup,
  LiquidContextMenuItem,
  LiquidContextMenuLabel,
  LiquidContextMenuSeparator,
  LiquidContextMenuShortcut,
  LiquidContextMenuTrigger,
  type LiquidContextMenuTriggerProps,
} from "@/components/ui/liquid-context-menu"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidContextMenu` | `onOpenChange` | `(open: boolean) => void` | none | Open state changes. |
| `LiquidContextMenu` | `modal` | `boolean` | `true` | Radix modal behaviour. |
| `LiquidContextMenuTrigger` | `disabled` | `boolean` | `false` | Stops it opening. Also takes `div` props. |
| `LiquidContextMenuContent` | `side` / `align` / `sideOffset` | Radix | `"bottom"` / `"start"` / `14` | Placement against the lifted item. Also takes every `LiquidMenuContent` prop. |
| `LiquidContextMenuItem` | `destructive` | `boolean` | `false` | Red text and icon. Plus Radix `onSelect`, `disabled`. |

Items, labels, separators, shortcuts and groups are the `liquid-menu` parts, built on Radix `@radix-ui/react-dropdown-menu`.

```tsx
import { Copy, Heart, Trash2 } from "lucide-react"

<LiquidContextMenu>
  <LiquidContextMenuTrigger>
    <div tabIndex={0} className="rounded-2xl bg-[#e9e9eb] px-4 py-2">Dinner at 8 still works?</div>
  </LiquidContextMenuTrigger>
  <LiquidContextMenuContent>
    <LiquidContextMenuItem onSelect={like}><Heart />Like</LiquidContextMenuItem>
    <LiquidContextMenuItem onSelect={copy}><Copy />Copy</LiquidContextMenuItem>
    <LiquidContextMenuSeparator />
    <LiquidContextMenuItem destructive onSelect={remove}><Trash2 />Delete</LiquidContextMenuItem>
  </LiquidContextMenuContent>
</LiquidContextMenu>
```

Gotchas:
- Uncontrolled only: there's no `open` or `defaultOpen`. Only the hold (480 ms), a right-click or the menu key opens it.
- The trigger isn't focusable. For keyboard users, put a focusable element inside (as above); the menu key or Shift F10 then opens it.
- The lifted item is a static DOM clone, so style the content with its own classes, not with selectors that depend on its parent.
- Moving more than 8 px cancels the hold, so scrolling still works. The press that opens the menu isn't also a click on the content.

---

## Liquid Tooltip (`liquid-tooltip`)

**Use it for:** naming an icon-only control on hover and keyboard focus, with an optional shortcut.
**Don't use it for:** anything people need to read carefully or act on (use a popover).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-tooltip.json
```

```tsx
import {
  LiquidTooltip,
  LiquidTooltipContent,
  LiquidTooltipProvider,
  LiquidTooltipShortcut,
  LiquidTooltipTrigger,
} from "@/components/ui/liquid-tooltip"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidTooltipProvider` | `delayDuration` | `number` | `500` | Wait before the first tooltip, in ms. |
| `LiquidTooltipProvider` | `skipDelayDuration` | `number` | `300` | Window in which the next tooltip shows at once. |
| `LiquidTooltipContent` | `sideOffset` | `number` | `8` | Gap in px. |
| `LiquidTooltipContent` | `lens` | `LiquidGlassOptions` | `{ frost: 10, refraction: 8, shadow: 0.05 }` | Capsule glass. |

All from Radix `@radix-ui/react-tooltip`: `LiquidTooltip` is `Tooltip.Root`, `LiquidTooltipTrigger` is `Tooltip.Trigger`, and the rest of `LiquidTooltipContent` (`side`, `align`) is `Tooltip.Content`. `className` on the content goes to the glass capsule. `LiquidTooltipShortcut` is a `kbd`.

```tsx
import { Bold } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-button"

<LiquidTooltipProvider>
  <LiquidTooltip>
    <LiquidTooltipTrigger asChild>
      <LiquidButton variant="ghost" aria-label="Bold"><Bold aria-hidden="true" /></LiquidButton>
    </LiquidTooltipTrigger>
    <LiquidTooltipContent>
      Bold <LiquidTooltipShortcut>⌘B</LiquidTooltipShortcut>
    </LiquidTooltipContent>
  </LiquidTooltip>
</LiquidTooltipProvider>
```

Gotchas:
- `LiquidTooltipProvider` is required; Radix throws without it. Wrap the app, or a toolbar, in one.
- Use `asChild` on the trigger with an element that forwards its ref (`LiquidButton` and `LiquidToolbarButton` do).
- A tooltip doesn't replace `aria-label`. The icon button still needs its own.

---

## Liquid Progress (`liquid-progress`)

**Use it for:** upload and download progress (bar or App Store style ring) and an iOS activity spinner.
**Don't use it for:** a value people set (use the slider).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-progress.json
```

```tsx
import {
  LiquidProgress,
  LiquidProgressRing,
  LiquidSpinner,
  type LiquidProgressProps,
  type LiquidProgressRingProps,
  type LiquidSpinnerProps,
} from "@/components/ui/liquid-progress"
```

| Part | Prop | Type | Default | What it does |
|---|---|---|---|---|
| `LiquidProgress` | `value` | `number \| null` | `null` | 0 to `max`. `null` sweeps (indeterminate). |
| `LiquidProgress` | `max` | `number` | `100` | Count in your own units. |
| `LiquidProgress` | `size` | `"small" \| "regular" \| "large"` | `"regular"` | 4, 6 or 10 px tall. |
| `LiquidProgress` | `tint` | `string` | `var(--liquid-accent, #0a84ff)` | Fill colour. |
| `LiquidProgressRing` | `value` / `max` / `tint` | as above | `null` / `100` / accent | `null` spins. |
| `LiquidProgressRing` | `size` | `number` | `28` | Diameter in px. |
| `LiquidProgressRing` | `children` | `ReactNode` | stop square | Drawn in the centre. |
| `LiquidSpinner` | `size` | `number` | `20` | Diameter in px. |
| `LiquidSpinner` | `aria-label` | `string` | `"Loading"` | Names the `status`. |

Each part also takes `div` (bar) or `span` (ring, spinner) props.

```tsx
<LiquidProgress value={sentMb} max={sizeMb} size="small" aria-label="Uploading IMG_2048.heic" />

<button type="button" aria-label="Stop download" onClick={stop}>
  <LiquidProgressRing value={percent} />
</button>

<LiquidSpinner aria-label="Loading messages" />
```

Gotchas:
- `value` defaults to `null`, which is the indeterminate animation. Pass a number for real progress.
- The bar and ring are `progressbar`s: give each an `aria-label` (or label the button around a ring).
- The spinner is grey (`#8e8e93`). Colour it with a `text-*` class. Tint the bar or ring with `tint` or `--progress-tint`.
- The bar is `w-full`. None of these are glass.

---

## Liquid Page Control (`liquid-page-control`)

**Use it for:** the dots under a carousel or paged view.
**Don't use it for:** numbered pagination of search results (it shows no numbers).

```bash
npx shadcn@latest add https://liquidcomponents.xyz/r/liquid-page-control.json
```

```tsx
import { LiquidPageControl, type LiquidPageControlProps } from "@/components/ui/liquid-page-control"
```

| Prop | Type | Default | What it does |
|---|---|---|---|
| `count` | `number` | required | Number of pages. |
| `value` | `number` | none | Current page, from 0. |
| `defaultValue` | `number` | `0` | Uncontrolled starting page. |
| `onValueChange` | `(page: number) => void` | none | Fires on tap, scrub and keys. |
| `lens` | `LiquidGlassOptions` | `{ frost: 8, refraction: 8, shadow: 0.04 }` | Capsule glass. |
| `aria-label` | `string` | `"Page"` | Names the slider. |

Every other prop goes to the root `div`.

```tsx
"use client"

import { useState } from "react"
import { LiquidPageControl } from "@/components/ui/liquid-page-control"

export function Memories({ slides }: { slides: { src: string; alt: string }[] }) {
  const [page, setPage] = useState(0)
  return (
    <div className="relative">
      <img src={slides[page].src} alt={slides[page].alt} className="aspect-[3/2] w-full rounded-3xl object-cover" />
      <LiquidPageControl
        count={slides.length}
        value={page}
        onValueChange={setPage}
        aria-label="Memory"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white"
      />
    </div>
  )
}
```

Gotchas:
- `value` is 0-based. Screen readers hear "Page 2 of 5" (`role="slider"`).
- Tap a dot to go there, tap beside the dots to step one page, or press and scrub. Arrow keys step; Home and End jump.
- The dots use `currentColor`; set a text colour that reads over the content (`text-white` over photos). Darken the capsule with `--page-control-tint`.
- It doesn't move your carousel. Keep both in sync (update the carousel in `onValueChange`, and `value` when the carousel scrolls).

---

## Shared exports

### `liquidSpring`

The spring every component moves on, as a CSS `linear()` easing string (stiffness 260, damping 20, about 8% overshoot, settles in about 0.7 s). It lives in the `lib/utils.ts` the registry installs, next to `cn` and `composeRefs`.

```tsx
import { liquidSpring } from "@/lib/utils"

// Web Animations API
element.animate([{ scale: "0.9" }, { scale: "1" }], { duration: 520, easing: liquidSpring })

// A CSS transition, e.g. <div style={slide} />
const slide: React.CSSProperties = { transition: `translate 0.6s ${liquidSpring}` }
```

Components also set it as `--liquid-spring` on their root and use it in classes like `[transition:scale_.5s_var(--liquid-spring)]`. Use it for your own motion so it matches; the components pair it with durations of 0.45 to 0.75 s. The components import `cn`, `composeRefs` and `liquidSpring` from `lib/utils.ts`, so if the CLI asks to overwrite an existing `lib/utils.ts`, the result must still export all three.

### Materials: `liquidPanelMaterial`, `liquidChromeMaterial`, `liquidFillMaterial`

Tailwind class strings that set `--liquid-glass-tint` from a theme variable, with a fallback. Add one to a `LiquidGlass` or `LiquidGlassGroup` with `cn`.

| Export | Reads | Fallback (light / dark) | Used by |
|---|---|---|---|
| `liquidPanelMaterial` | `--liquid-panel-tint` | `rgba(255,255,255,.66)` / `rgba(30,29,36,.68)` | Menu, popover, tooltip, toast, alert, drawer |
| `liquidChromeMaterial` | `--liquid-chrome-tint` | `rgba(255,255,255,.5)` / `rgba(40,39,48,.52)` | Toolbar, tab bar |
| `liquidFillMaterial` | `--liquid-fill-tint` | `rgba(118,118,128,.14)` / `rgba(118,118,128,.26)` | Search field, stepper |

```tsx
import { cn } from "@/lib/utils"
import { LiquidGlass, liquidPanelMaterial } from "@/components/ui/liquid-glass"

<LiquidGlass className={cn("rounded-[22px] p-4", liquidPanelMaterial)}>…</LiquidGlass>
```

A plain `LiquidGlass` without a material uses a lighter default tint (`rgba(255,255,255,.3)` light, `rgba(255,255,255,.06)` dark).

### `LiquidGlassGroup` and `merge`

Every `LiquidGlass` inside a group renders as one continuous material. Shapes closer than `merge` px (default 14, clamped to 0 to 120) fuse through a liquid bridge and pull apart as they separate, following moves, resizes and CSS transitions. `LiquidToolbar` and `LiquidTabBar` are groups with `merge` 10, and `LiquidSearchField` is a group with `merge` 14.

### `LiquidGlassScope`

Starts a fresh glass scope. React context crosses portals, so glass portalled out of a group would otherwise think it's one of the group's shapes and never draw. The built-in menu, popover, tooltip, toast, alert, drawer and context menu already wrap their panels in it. Use it only for your own portals:

```tsx
import { createPortal } from "react-dom"
import { LiquidGlass, LiquidGlassScope } from "@/components/ui/liquid-glass"

createPortal(
  <LiquidGlassScope>
    <LiquidGlass className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2">Now playing</LiquidGlass>
  </LiquidGlassScope>,
  document.body,
)
```

### CSS variables

Set them in `:root` for light mode and `.dark` for dark mode. Anything unset falls back to the component default. The `.dark` block assumes class-based dark mode, which is what shadcn sets up.

| Variable | Read by | Default |
|---|---|---|
| `--liquid-accent` | `LiquidButton` `primary` and `status` fill, `LiquidSlider` fill, `LiquidTabBar` selected tab, `LiquidProgress` and `LiquidProgressRing`, and focus rings on every control | `#0a84ff` |
| `--liquid-panel-tint` | `liquidPanelMaterial` | see Materials |
| `--liquid-chrome-tint` | `liquidChromeMaterial` | see Materials |
| `--liquid-fill-tint` | `liquidFillMaterial` | see Materials |

`LiquidSwitch` (iOS green) and the `LiquidTabs` indicator (neutral pill) don't follow `--liquid-accent`; pass `tint` to change them. Per-component variables: `--liquid-glass-tint` and `--liquid-glass-solid` (one glass surface), `--tab-bar-tint` (tab bar selection), `--progress-tint` (bar and ring), `--page-control-tint` (page control capsule).

This is the block the docs theme page generates for the Blue accent and Regular glass:

```css
:root {
  --liquid-accent: #0a8ad0;
  --liquid-panel-tint: rgba(255, 255, 255, 0.66);
  --liquid-chrome-tint: rgba(255, 255, 255, 0.5);
  --liquid-fill-tint: rgba(118, 118, 128, 0.14);
}

.dark {
  --liquid-accent: #69d7ff;
  --liquid-panel-tint: rgba(30, 29, 36, 0.68);
  --liquid-chrome-tint: rgba(40, 39, 48, 0.52);
  --liquid-fill-tint: rgba(118, 118, 128, 0.26);
}
```

Lower tint opacities (the theme page's Clear: panel 0.5, chrome 0.32, fill 0.1 in light) let more of the page through; higher ones (Frosted: 0.82, 0.68, 0.2) let less.
