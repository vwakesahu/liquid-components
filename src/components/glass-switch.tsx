import {
  forwardRef,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type LiquidSwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  size?: "small" | "regular" | "large";
  tint?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const metrics = {
  small: { width: 50, height: 26, thumbWidth: 32, inset: 2 },
  regular: { width: 64, height: 32, thumbWidth: 40, inset: 2 },
  large: { width: 74, height: 36, thumbWidth: 46, inset: 2 },
};

type SwitchStyle = CSSProperties & {
  "--switch-width": string;
  "--switch-height": string;
  "--switch-inset": string;
  "--thumb-width": string;
  "--switch-tint": string;
  "--thumb-x": string;
  "--press-x": string;
  "--drag-stretch": string;
  "--drag-offset": string;
  "--drag-squash": string;
  "--drag-skew": string;
};

export const LiquidSwitch = forwardRef<HTMLButtonElement, LiquidSwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      name,
      value = "on",
      required,
      size = "regular",
      tint = "#34c759",
      className = "",
      ...accessibility
    },
    forwardedRef,
  ) => {
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const [interacting, setInteracting] = useState(false);
    const [dragProgress, setDragProgress] = useState<number | null>(null);
    const [pressX, setPressX] = useState(50);
    const [dragShape, setDragShape] = useState({ stretch: 0, direction: 0 });
    const [dragging, setDragging] = useState(false);
    const pointerStart = useRef<{ x: number; progress: number } | null>(null);
    const previousPointer = useRef<{ x: number; time: number } | null>(null);
    const pressStartedAt = useRef(0);
    const releaseTimer = useRef<number | null>(null);
    const didDrag = useRef(false);
    const isControlled = checked !== undefined;
    const isOn = isControlled ? checked : uncontrolled;
    const geometry = metrics[size];
    const travel = geometry.width - geometry.thumbWidth - geometry.inset * 2;
    const visualProgress = dragProgress ?? (isOn ? 1 : 0);

    const update = (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    };

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerStart.current = { x: event.clientX, progress: visualProgress };
      previousPointer.current = { x: event.clientX, time: event.timeStamp };
      pressStartedAt.current = event.timeStamp;
      didDrag.current = false;
      setDragging(false);
      setDragShape({ stretch: 0, direction: 0 });
      const bounds = event.currentTarget.getBoundingClientRect();
      setPressX(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)));
      setInteracting(true);
      setDragProgress(visualProgress);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
      if (!pointerStart.current || disabled) return;
      const distance = event.clientX - pointerStart.current.x;
      if (Math.abs(distance) > 2 && !didDrag.current) {
        didDrag.current = true;
        setDragging(true);
      }
      const next = Math.min(1, Math.max(0, pointerStart.current.progress + distance / travel));
      const previous = previousPointer.current;
      if (previous) {
        const delta = event.clientX - previous.x;
        const elapsed = Math.max(8, event.timeStamp - previous.time);
        const velocity = Math.abs(delta) / elapsed;
        const targetStretch = Math.min(14, Math.abs(delta) * 0.75 + velocity * 18);
        const targetDirection = Math.sign(delta);
        setDragShape((current) => ({
          stretch: current.stretch * 0.62 + targetStretch * 0.38,
          direction: current.direction * 0.58 + targetDirection * 0.42,
        }));
      }
      previousPointer.current = { x: event.clientX, time: event.timeStamp };
      const bounds = event.currentTarget.getBoundingClientRect();
      setPressX(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)));
      setDragProgress(next);
    };

    const finishPointer = (event: PointerEvent<HTMLButtonElement>) => {
      if (!pointerStart.current || disabled) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const next = didDrag.current ? visualProgress >= 0.5 : !isOn;
      const wasDragging = didDrag.current;
      pointerStart.current = null;
      previousPointer.current = null;
      update(next);
      setDragProgress(null);
      setDragShape({ stretch: 0, direction: 0 });
      setDragging(false);
      if (wasDragging) {
        setInteracting(false);
      } else {
        const remaining = Math.max(0, 380 - (event.timeStamp - pressStartedAt.current));
        releaseTimer.current = window.setTimeout(() => {
          setInteracting(false);
          releaseTimer.current = null;
        }, remaining);
      }
    };

    const cancelPointer = () => {
      pointerStart.current = null;
      previousPointer.current = null;
      setDragProgress(null);
      setDragShape({ stretch: 0, direction: 0 });
      setDragging(false);
      setInteracting(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      setInteracting(true);
      update(!isOn);
      window.setTimeout(() => setInteracting(false), 180);
    };

    const style: SwitchStyle = {
      "--switch-width": `${geometry.width}px`,
      "--switch-height": `${geometry.height}px`,
      "--switch-inset": `${geometry.inset}px`,
      "--thumb-width": `${geometry.thumbWidth}px`,
      "--switch-tint": tint,
      "--thumb-x": `${visualProgress * travel}px`,
      "--press-x": `${pressX}%`,
      "--drag-stretch": `${dragShape.stretch}px`,
      "--drag-offset": `${dragShape.direction * dragShape.stretch * 0.14 - dragShape.stretch / 2}px`,
      "--drag-squash": `${1 - dragShape.stretch / 110}`,
      "--drag-skew": `${dragShape.direction * Math.min(8, dragShape.stretch * 0.55)}deg`,
    };

    return (
      <>
        <button
          {...accessibility}
          ref={forwardedRef}
          type="button"
          role="switch"
          aria-checked={isOn}
          disabled={disabled}
          className={`liquid-switch liquid-switch--${size} ${className}`}
          data-state={isOn ? "on" : "off"}
          data-interacting={interacting || undefined}
          data-dragging={dragging || undefined}
          style={style}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          onKeyDown={handleKeyDown}
        >
          <span className="liquid-switch__track" aria-hidden="true">
            <span className="liquid-switch__tint" />
            <span className="liquid-switch__thumb">
              <span className="liquid-switch__lens" />
              <span className="liquid-switch__rim" />
              <span className="liquid-switch__light" />
            </span>
          </span>
        </button>
        {name && (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={isOn}
            required={required}
            tabIndex={-1}
            aria-hidden="true"
            readOnly
            className="liquid-switch__form-input"
          />
        )}
      </>
    );
  },
);

LiquidSwitch.displayName = "LiquidSwitch";
