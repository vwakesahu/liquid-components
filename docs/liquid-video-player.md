# Liquid Video Player: Implementation Guide

`LiquidVideoPlayer` keeps a native `<video>` element as the media authority and renders live refraction through WebGL. The component is in [`src/components/liquid-video-player.tsx`](../src/components/liquid-video-player.tsx); the renderer is [`src/hooks/use-video-refraction.ts`](../src/hooks/use-video-refraction.ts).

## Why WebGL

The DOM components can bend a known `SourceGraphic` with SVG filters. Live video is different: Safari commonly composites it outside that filter pipeline. The player therefore uploads the current video frame as a WebGL texture and draws the entire visible frame to one canvas.

If WebGL initialization or video texture upload fails, the canvas remains transparent and the native video stays visible. Controls continue to work without refraction.

## Rendering pipeline

```text
native video frame
  → WebGL video texture
generated 96 × 60 lens map
  → WebGL map texture
visible DOM controls
  → measured normalized lens rectangles
one fragment shader
  → base frame + displaced RGB samples + glow + specular
```

Up to eight visible controls can contribute lens regions in one draw. Hidden controls are excluded, so an auto-hidden control bar does not leave invisible refraction behind.

The renderer uses `requestVideoFrameCallback` when available and falls back to `requestAnimationFrame` while playing. Paused video renders only when seeking, resizing, or changing visible controls.

## Native media contract

The `<video>` element owns:

- Loading, buffering, duration, playback, and looping.
- Current time, volume, mute, and ended state.
- Media events forwarded through normal React props.
- `playsInline`, preload, poster, source, and cross-origin configuration.

The custom UI adds play/pause, backward/forward skip, time display, the shared Radix-based `LiquidSlider` scrubber, mute, and fullscreen. Reusing the same slider keeps the rail, lens physics, and endpoint geometry consistent; at 100% the tracker remains inside its layout slot instead of overlapping the volume button.

Keyboard shortcuts on the focused player:

| Key | Action |
| --- | --- |
| Space or `K` | Play or pause |
| Left arrow | Skip backward |
| Right arrow | Skip forward |
| `M` | Mute or unmute |
| `F` | Enter or exit fullscreen |

## Usage

```tsx
import { LiquidVideoPlayer } from "@/components/ui/liquid-video-player"

<LiquidVideoPlayer
  src="/media/demo.mp4"
  poster="/media/poster.jpg"
  preload="metadata"
  skipSeconds={10}
  lens={{ scale: 0.075, chroma: 0.45 }}
  aria-label="Product demonstration"
/>
```

For cross-origin media, the server must return an appropriate `Access-Control-Allow-Origin` header and the player must receive `crossOrigin="anonymous"`. Without that permission, browsers prohibit uploading the video to WebGL; the native fallback remains available.

## Do

- Keep the native video mounted even when the WebGL canvas is active.
- Use one canvas and shader for the full control family.
- Measure only visible lens elements.
- Preserve a non-WebGL fallback.
- Use CORS-enabled sources when live refraction is required.
- Keep controls operable by keyboard and screen reader.

## Don’t

- Don’t run one WebGL canvas per button.
- Don’t attempt to pipe Safari video through the DOM SVG filter.
- Don’t hide the native video until the first WebGL frame succeeds.
- Don’t redraw continuously while paused.
- Don’t let decorative canvas pixels receive pointer input.

QR will reuse the generated map with a canvas texture later, but it remains intentionally outside this component.
