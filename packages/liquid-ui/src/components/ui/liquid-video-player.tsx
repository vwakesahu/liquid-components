"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { LiquidLensOptions } from "../../hooks/use-liquid-displacement";
import { useVideoRefraction } from "../../hooks/use-video-refraction";
import { cn, composeRefs } from "../../lib/utils";
import { LiquidSlider } from "./liquid-slider";

type LiquidVideoPlayerProps = Omit<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  "className" | "controls"
> & {
  className?: string;
  videoClassName?: string;
  lens?: LiquidLensOptions;
  skipSeconds?: number;
  volume?: number;
};

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const LiquidVideoPlayer = forwardRef<HTMLVideoElement, LiquidVideoPlayerProps>(
  (
    {
      className,
      videoClassName,
      lens,
      skipSeconds = 10,
      src,
      crossOrigin,
      muted: mutedProp = false,
      volume: volumeProp = 1,
      onLoadedMetadata,
      onDurationChange,
      onTimeUpdate,
      onPlay,
      onPause,
      onEnded,
      onVolumeChange,
      onClick,
      ...props
    },
    forwardedRef,
  ) => {
    const renderer = useVideoRefraction({ lens });
    const hideTimer = useRef<number | null>(null);
    const [paused, setPaused] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(mutedProp);
    const [volume, setVolume] = useState(volumeProp);
    const [controlsVisible, setControlsVisible] = useState(true);

    useEffect(() => setMuted(mutedProp), [mutedProp]);
    useEffect(() => {
      const next = Math.min(1, Math.max(0, volumeProp));
      setVolume(next);
      if (renderer.videoRef.current) renderer.videoRef.current.volume = next;
    }, [volumeProp]);
    useEffect(() => {
      return () => {
        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      };
    }, []);
    useEffect(() => renderer.invalidate(), [controlsVisible, paused, renderer.invalidate]);

    const showControls = () => {
      setControlsVisible(true);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      if (!renderer.videoRef.current?.paused) {
        hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2400);
      }
      renderer.invalidate();
    };

    const togglePlayback = async () => {
      const video = renderer.videoRef.current;
      if (!video) return;
      if (video.paused) await video.play();
      else video.pause();
      showControls();
    };

    const skip = (amount: number) => {
      const video = renderer.videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(video.duration || 0, Math.max(0, video.currentTime + amount));
      setCurrentTime(video.currentTime);
      renderer.invalidate();
      showControls();
    };

    const seek = (next: number) => {
      const video = renderer.videoRef.current;
      if (!video || !Number.isFinite(next)) return;
      video.currentTime = next;
      setCurrentTime(next);
      renderer.invalidate();
      showControls();
    };

    const toggleMuted = () => {
      const video = renderer.videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setMuted(video.muted);
      showControls();
    };

    const toggleFullscreen = async () => {
      const container = renderer.containerRef.current;
      if (!container) return;
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.requestFullscreen();
      showControls();
    };

    return (
      <div
        ref={renderer.containerRef}
        data-slot="liquid-video-player"
        data-controls-visible={controlsVisible || paused || undefined}
        data-renderer-ready={renderer.ready || undefined}
        data-paused={paused || undefined}
        className={cn(
          "liquid-video group/liquid-video relative isolate aspect-video w-full overflow-hidden rounded-[28px] bg-[#09090b] text-white shadow-[0_24px_70px_rgba(0,0,0,.24)] outline-none",
          "focus-visible:outline-[3px] focus-visible:outline-white/70 focus-visible:outline-offset-4 max-sm:rounded-[20px]",
          className,
        )}
        role="group"
        aria-label={props["aria-label"] ?? "Video player"}
        tabIndex={0}
        onPointerMove={showControls}
        onPointerLeave={() => {
          if (!paused) setControlsVisible(false);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === " " || event.key === "k") {
            event.preventDefault();
            void togglePlayback();
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            skip(-skipSeconds);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            skip(skipSeconds);
          } else if (event.key.toLowerCase() === "m") {
            toggleMuted();
          } else if (event.key.toLowerCase() === "f") {
            void toggleFullscreen();
          }
        }}
      >
        <video
          ref={composeRefs(forwardedRef, renderer.videoRef)}
          data-slot="liquid-video-media"
          className={cn(
            "liquid-video__media absolute inset-0 z-0 size-full object-cover opacity-100 transition-opacity duration-200 group-data-[renderer-ready]/liquid-video:opacity-0 motion-reduce:transition-none",
            videoClassName,
          )}
          crossOrigin={crossOrigin}
          src={src}
          muted={muted}
          playsInline
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration || 0);
            setPaused(event.currentTarget.paused);
            onLoadedMetadata?.(event);
          }}
          onDurationChange={(event) => {
            setDuration(event.currentTarget.duration || 0);
            onDurationChange?.(event);
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
            onTimeUpdate?.(event);
          }}
          onPlay={(event) => {
            setPaused(false);
            showControls();
            onPlay?.(event);
          }}
          onPause={(event) => {
            setPaused(true);
            setControlsVisible(true);
            onPause?.(event);
          }}
          onEnded={(event) => {
            setPaused(true);
            setControlsVisible(true);
            onEnded?.(event);
          }}
          onVolumeChange={(event) => {
            setMuted(event.currentTarget.muted);
            setVolume(event.currentTarget.volume);
            onVolumeChange?.(event);
          }}
          onClick={(event) => {
            void togglePlayback();
            onClick?.(event);
          }}
          {...props}
        />
        <canvas
          ref={renderer.canvasRef}
          data-slot="liquid-video-refraction"
          className="liquid-video__canvas pointer-events-none absolute inset-0 z-[1] size-full object-cover opacity-0 transition-opacity duration-200 group-data-[renderer-ready]/liquid-video:opacity-100 motion-reduce:transition-none"
          aria-hidden="true"
        />

        <button
          type="button"
          data-liquid-video-lens
          data-slot="liquid-video-center-play"
          className="liquid-video__center-play pointer-events-none absolute left-1/2 top-1/2 z-[3] grid h-[58px] w-16 -translate-x-1/2 -translate-y-1/2 scale-[.86] cursor-pointer place-items-center rounded-full border-[.5px] border-white/50 bg-white/20 p-0 text-white opacity-0 shadow-[0_9px_24px_rgba(0,0,0,.28),inset_1px_1px_1.5px_rgba(255,255,255,.62),inset_-1px_-1px_1.5px_rgba(0,0,0,.18)] [backdrop-filter:blur(2px)_saturate(1.7)] [transition:width_.42s_cubic-bezier(.18,1.28,.3,1),height_.42s_cubic-bezier(.18,1.28,.3,1),transform_.42s_cubic-bezier(.18,1.28,.3,1),opacity_.2s_ease] active:h-[66px] active:w-[72px] focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 group-data-[paused]/liquid-video:pointer-events-auto group-data-[paused]/liquid-video:scale-100 group-data-[paused]/liquid-video:opacity-100 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]"
          aria-label={paused ? "Play video" : "Pause video"}
          onClick={() => void togglePlayback()}
        >
          {paused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
        </button>

        <div
          data-slot="liquid-video-controls"
          className="liquid-video__controls pointer-events-none absolute bottom-4 left-4 right-4 z-[4] flex min-h-[58px] translate-y-3 items-center gap-[7px] rounded-[20px] border-[.5px] border-white/25 bg-[rgba(18,18,20,.3)] p-2 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,.25),inset_0_1px_1px_rgba(255,255,255,.14)] [backdrop-filter:blur(18px)_saturate(1.35)] [transition:opacity_.28s_ease,transform_.4s_cubic-bezier(.16,1,.3,1)] group-data-[controls-visible]/liquid-video:pointer-events-auto group-data-[controls-visible]/liquid-video:translate-y-0 group-data-[controls-visible]/liquid-video:opacity-100 max-sm:bottom-2 max-sm:left-2 max-sm:right-2 max-sm:min-h-[52px] max-sm:gap-[5px] max-sm:p-1.5 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)] [@media(prefers-reduced-transparency:reduce)]:[backdrop-filter:none]"
        >
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button grid size-10 flex-none cursor-pointer place-items-center rounded-full border-[.5px] border-white/30 bg-white/15 p-0 text-white shadow-[0_4px_11px_rgba(0,0,0,.18),inset_1px_1px_1px_rgba(255,255,255,.32)] [transition:width_.34s_cubic-bezier(.18,1.28,.3,1),height_.34s_cubic-bezier(.18,1.28,.3,1),transform_.34s_cubic-bezier(.18,1.28,.3,1),background_.2s_ease] active:h-11 active:w-[46px] active:scale-y-[.96] active:bg-white/20 focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 max-sm:size-9 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)]"
            aria-label={paused ? "Play" : "Pause"}
            onClick={() => void togglePlayback()}
          >
            {paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button grid size-10 flex-none cursor-pointer place-items-center rounded-full border-[.5px] border-white/30 bg-white/15 p-0 text-white shadow-[0_4px_11px_rgba(0,0,0,.18),inset_1px_1px_1px_rgba(255,255,255,.32)] [transition:width_.34s_cubic-bezier(.18,1.28,.3,1),height_.34s_cubic-bezier(.18,1.28,.3,1),transform_.34s_cubic-bezier(.18,1.28,.3,1),background_.2s_ease] active:h-11 active:w-[46px] active:scale-y-[.96] active:bg-white/20 focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 max-sm:hidden motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)]"
            aria-label={`Back ${skipSeconds} seconds`}
            onClick={() => skip(-skipSeconds)}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button grid size-10 flex-none cursor-pointer place-items-center rounded-full border-[.5px] border-white/30 bg-white/15 p-0 text-white shadow-[0_4px_11px_rgba(0,0,0,.18),inset_1px_1px_1px_rgba(255,255,255,.32)] [transition:width_.34s_cubic-bezier(.18,1.28,.3,1),height_.34s_cubic-bezier(.18,1.28,.3,1),transform_.34s_cubic-bezier(.18,1.28,.3,1),background_.2s_ease] active:h-11 active:w-[46px] active:scale-y-[.96] active:bg-white/20 focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 max-sm:hidden motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)]"
            aria-label={`Forward ${skipSeconds} seconds`}
            onClick={() => skip(skipSeconds)}
          >
            <RotateCw size={16} />
          </button>
          <span className="liquid-video__time min-w-[67px] text-center text-[10px] tabular-nums text-white/80 max-sm:hidden" aria-label={`${formatTime(currentTime)} of ${formatTime(duration)}`}>
            {formatTime(currentTime)} <i className="not-italic text-white/40">/</i> {formatTime(duration)}
          </span>
          <div className="liquid-video__scrubber flex h-[42px] min-w-[100px] flex-1 items-center overflow-visible px-1.5">
            <LiquidSlider
              className="w-full flex-1 [--slider-track-color:rgba(255,255,255,.24)] [&_[data-slot=liquid-slider-thumb]]:bg-white/85 [&_[data-slot=liquid-slider-thumb]]:shadow-[0_4px_10px_rgba(0,0,0,.25),inset_1px_1px_1px_rgba(255,255,255,.55)]"
              size="small"
              tint="rgba(255,255,255,.92)"
              min={0}
              max={Math.max(duration, 0.01)}
              step={0.01}
              value={[Math.min(currentTime, duration || 0)]}
              aria-label="Video progress"
              onValueChange={([next]) => seek(next)}
              onPointerDown={showControls}
            />
          </div>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button grid size-10 flex-none cursor-pointer place-items-center rounded-full border-[.5px] border-white/30 bg-white/15 p-0 text-white shadow-[0_4px_11px_rgba(0,0,0,.18),inset_1px_1px_1px_rgba(255,255,255,.32)] [transition:width_.34s_cubic-bezier(.18,1.28,.3,1),height_.34s_cubic-bezier(.18,1.28,.3,1),transform_.34s_cubic-bezier(.18,1.28,.3,1),background_.2s_ease] active:h-11 active:w-[46px] active:scale-y-[.96] active:bg-white/20 focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 max-sm:size-9 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)]"
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            aria-pressed={muted || volume === 0}
            onClick={toggleMuted}
          >
            {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button grid size-10 flex-none cursor-pointer place-items-center rounded-full border-[.5px] border-white/30 bg-white/15 p-0 text-white shadow-[0_4px_11px_rgba(0,0,0,.18),inset_1px_1px_1px_rgba(255,255,255,.32)] [transition:width_.34s_cubic-bezier(.18,1.28,.3,1),height_.34s_cubic-bezier(.18,1.28,.3,1),transform_.34s_cubic-bezier(.18,1.28,.3,1),background_.2s_ease] active:h-11 active:w-[46px] active:scale-y-[.96] active:bg-white/20 focus-visible:outline-2 focus-visible:outline-white/90 focus-visible:outline-offset-2 max-sm:size-9 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-[rgba(28,28,30,.94)]"
            aria-label="Enter fullscreen"
            onClick={() => void toggleFullscreen()}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    );
  },
);

LiquidVideoPlayer.displayName = "LiquidVideoPlayer";
