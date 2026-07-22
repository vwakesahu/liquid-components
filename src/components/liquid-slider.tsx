import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type LiquidSliderProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "size" | "value" | "defaultValue" | "onChange"
> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "small" | "regular" | "large";
  tint?: string;
};

const geometry = {
  small: { height: 26, thumbWidth: 32, trackHeight: 6 },
  regular: { height: 32, thumbWidth: 40, trackHeight: 8 },
  large: { height: 38, thumbWidth: 48, trackHeight: 10 },
};

type SliderStyle = CSSProperties & {
  "--slider-progress": string;
  "--slider-height": string;
  "--slider-thumb-width": string;
  "--slider-track-height": string;
  "--slider-tint": string;
  "--slider-stretch": string;
  "--slider-offset": string;
  "--slider-squash": string;
  "--slider-skew": string;
  "--slider-light-x": string;
};

export const LiquidSlider = forwardRef<HTMLInputElement, LiquidSliderProps>(
  (
    {
      value,
      defaultValue = 50,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      size = "regular",
      tint = "#0a84ff",
      disabled = false,
      className = "",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const [interacting, setInteracting] = useState(false);
    const [dragging, setDragging] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const shape = useRef({ stretch: 0, direction: 0 });
    const lightX = useRef(50);
    const visualFrame = useRef<number | null>(null);
    const valueFrame = useRef<number | null>(null);
    const previousPointer = useRef<{ x: number; time: number } | null>(null);
    const pointerStartedAt = useRef(0);
    const moved = useRef(false);
    const releaseTimer = useRef<number | null>(null);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolled;
    const pendingValue = useRef(currentValue);
    const inputBounds = useRef({ left: 0, width: 1 });
    const range = Math.max(1, max - min);
    const progress = Math.min(1, Math.max(0, (currentValue - min) / range));
    const metrics = geometry[size];

    useEffect(() => {
      return () => {
        if (visualFrame.current !== null) window.cancelAnimationFrame(visualFrame.current);
        if (valueFrame.current !== null) window.cancelAnimationFrame(valueFrame.current);
        if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      };
    }, []);

    const paintDynamics = () => {
      if (visualFrame.current !== null) return;
      visualFrame.current = window.requestAnimationFrame(() => {
        const element = wrapperRef.current;
        const current = shape.current;
        if (element) {
          element.style.setProperty("--slider-stretch", `${current.stretch}px`);
          element.style.setProperty(
            "--slider-offset",
            `${current.direction * current.stretch * 0.15 - current.stretch / 2}px`,
          );
          element.style.setProperty("--slider-squash", `${1 - current.stretch / 125}`);
          element.style.setProperty(
            "--slider-skew",
            `${current.direction * Math.min(7, current.stretch * 0.45)}deg`,
          );
          element.style.setProperty("--slider-light-x", `${lightX.current}%`);
        }
        visualFrame.current = null;
      });
    };

    const emitValue = (next: number) => {
      pendingValue.current = next;
      const nextProgress = Math.min(1, Math.max(0, (next - min) / range));
      wrapperRef.current?.style.setProperty("--slider-progress", `${nextProgress * 100}%`);
      if (valueFrame.current !== null) return;
      valueFrame.current = window.requestAnimationFrame(() => {
        const latest = pendingValue.current;
        if (!isControlled) setUncontrolled(latest);
        onValueChange?.(latest);
        valueFrame.current = null;
      });
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      emitValue(Number(event.target.value));
    };

    const handlePointerDown = (event: PointerEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      previousPointer.current = { x: event.clientX, time: event.timeStamp };
      pointerStartedAt.current = event.timeStamp;
      moved.current = false;
      shape.current = { stretch: 0, direction: 0 };
      setDragging(false);
      setInteracting(true);
      const bounds = event.currentTarget.getBoundingClientRect();
      inputBounds.current = { left: bounds.left, width: bounds.width };
      lightX.current = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      paintDynamics();
      onPointerDown?.(event);
    };

    const handlePointerMove = (event: PointerEvent<HTMLInputElement>) => {
      if (!previousPointer.current || disabled) {
        onPointerMove?.(event);
        return;
      }
      const delta = event.clientX - previousPointer.current.x;
      const elapsed = Math.max(8, event.timeStamp - previousPointer.current.time);
      if (!moved.current && Math.abs(event.clientX - previousPointer.current.x) > 0.5) {
        moved.current = true;
        setDragging(true);
      }
      const velocity = Math.abs(delta) / elapsed;
      const targetStretch = Math.min(16, Math.abs(delta) * 0.8 + velocity * 20);
      const targetDirection = Math.sign(delta);
      shape.current = {
        stretch: shape.current.stretch * 0.62 + targetStretch * 0.38,
        direction: shape.current.direction * 0.58 + targetDirection * 0.42,
      };
      const bounds = inputBounds.current;
      lightX.current = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      paintDynamics();
      previousPointer.current = { x: event.clientX, time: event.timeStamp };
      onPointerMove?.(event);
    };

    const finishPointer = (event: PointerEvent<HTMLInputElement>) => {
      if (!previousPointer.current) {
        onPointerUp?.(event);
        return;
      }
      const wasDragging = moved.current;
      previousPointer.current = null;
      shape.current = { stretch: 0, direction: 0 };
      paintDynamics();
      setDragging(false);
      if (wasDragging) {
        setInteracting(false);
      } else {
        const remaining = Math.max(0, 380 - (event.timeStamp - pointerStartedAt.current));
        releaseTimer.current = window.setTimeout(() => {
          setInteracting(false);
          releaseTimer.current = null;
        }, remaining);
      }
      onPointerUp?.(event);
    };

    const cancelPointer = (event: PointerEvent<HTMLInputElement>) => {
      previousPointer.current = null;
      shape.current = { stretch: 0, direction: 0 };
      paintDynamics();
      setDragging(false);
      setInteracting(false);
      onPointerCancel?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        setInteracting(true);
      }
      onKeyDown?.(event);
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
      window.setTimeout(() => setInteracting(false), 220);
      onKeyUp?.(event);
    };

    const style: SliderStyle = {
      "--slider-progress": `${progress * 100}%`,
      "--slider-height": `${metrics.height}px`,
      "--slider-thumb-width": `${metrics.thumbWidth}px`,
      "--slider-track-height": `${metrics.trackHeight}px`,
      "--slider-tint": tint,
      "--slider-stretch": `${shape.current.stretch}px`,
      "--slider-offset": `${shape.current.direction * shape.current.stretch * 0.15 - shape.current.stretch / 2}px`,
      "--slider-squash": `${1 - shape.current.stretch / 125}`,
      "--slider-skew": `${shape.current.direction * Math.min(7, shape.current.stretch * 0.45)}deg`,
      "--slider-light-x": `${lightX.current}%`,
    };

    return (
      <span
        ref={wrapperRef}
        className={`liquid-slider liquid-slider--${size} ${className}`}
        data-interacting={interacting || undefined}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        style={style}
      >
        <span className="liquid-slider__track" aria-hidden="true">
          <span className="liquid-slider__fill" />
          <span className="liquid-slider__thumb">
            <span className="liquid-slider__occlusion" />
            <span className="liquid-slider__refraction" />
            <span className="liquid-slider__lens" />
            <span className="liquid-slider__rim" />
            <span className="liquid-slider__light" />
          </span>
        </span>
        <input
          {...props}
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="liquid-slider__input"
        />
      </span>
    );
  },
);

LiquidSlider.displayName = "LiquidSlider";
