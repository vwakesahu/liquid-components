import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Ref } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

/**
 * An iOS-like spring as a CSS easing: stiffness 260, damping 20 (about 8%
 * overshoot, settled in ~0.7s), sampled from the closed-form damped spring.
 * Use it for presses, merges, and pops; set it as `--liquid-spring` on a root.
 */
export const liquidSpring =
  "linear(0,0.049,0.168,0.323,0.487,0.642,0.776,0.886,0.968,1.026,1.061,1.079,1.083,1.079,1.068,1.055,1.042,1.029,1.018,1.009,1.002,0.998,0.995,0.993,0.993,0.993,0.994,0.995,0.997,0.998,0.999,0.999,1)";
