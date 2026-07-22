import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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

import type { LiquidLensOptions } from "@/hooks/use-liquid-displacement";
import { useVideoRefraction } from "@/hooks/use-video-refraction";
import { cn, composeRefs } from "@/lib/utils";
import "@/styles/liquid.css";

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

type PlayerStyle = CSSProperties & {
  "--video-progress": string;
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

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const playerStyle: PlayerStyle = { "--video-progress": `${progress}%` };

    return (
      <div
        ref={renderer.containerRef}
        data-slot="liquid-video-player"
        data-controls-visible={controlsVisible || paused || undefined}
        data-renderer-ready={renderer.ready || undefined}
        data-paused={paused || undefined}
        className={cn("liquid-video", className)}
        style={playerStyle}
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
          className={cn("liquid-video__media", videoClassName)}
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
          className="liquid-video__canvas"
          aria-hidden="true"
        />

        <button
          type="button"
          data-liquid-video-lens
          data-slot="liquid-video-center-play"
          className="liquid-video__center-play"
          aria-label={paused ? "Play video" : "Pause video"}
          onClick={() => void togglePlayback()}
        >
          {paused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
        </button>

        <div data-slot="liquid-video-controls" className="liquid-video__controls">
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button"
            aria-label={paused ? "Play" : "Pause"}
            onClick={() => void togglePlayback()}
          >
            {paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button"
            aria-label={`Back ${skipSeconds} seconds`}
            onClick={() => skip(-skipSeconds)}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button"
            aria-label={`Forward ${skipSeconds} seconds`}
            onClick={() => skip(skipSeconds)}
          >
            <RotateCw size={16} />
          </button>
          <span className="liquid-video__time" aria-label={`${formatTime(currentTime)} of ${formatTime(duration)}`}>
            {formatTime(currentTime)} <i>/</i> {formatTime(duration)}
          </span>
          <div className="liquid-video__scrubber">
            <span className="liquid-video__scrubber-track">
              <span className="liquid-video__scrubber-fill" />
            </span>
            <span data-liquid-video-lens className="liquid-video__scrubber-thumb" />
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              aria-label="Video progress"
              onChange={(event) => seek(event.currentTarget.valueAsNumber)}
              onPointerDown={showControls}
            />
          </div>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button"
            aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            aria-pressed={muted || volume === 0}
            onClick={toggleMuted}
          >
            {muted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            type="button"
            data-liquid-video-lens
            className="liquid-video__button"
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
