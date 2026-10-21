import { useCallback, useSyncExternalStore, type ReactElement } from "react";
import { DEFAULT_LIMITS, getSafeArea, install, type Override, type Resolution, type SafeArea } from "./index.js";

const detector = (sa?: SafeArea): SafeArea => sa ?? getSafeArea() ?? install();

/** Live resolved insets + which strategy won. Re-renders when they change. */
export function useSafeArea(sa?: SafeArea): Resolution & { override: Override | null; setOverride: (o: Override | null) => void; refresh: () => Resolution } {
  const d = detector(sa);
  const res = useSyncExternalStore(d.subscribe, d.get, d.get);
  return { ...res, override: d.getOverride(), setOverride: d.setOverride, refresh: d.refresh };
}

export interface ScreenFitState {
  top: number;
  bottom: number;
  /** True when no manual override is active. */
  auto: boolean;
  min: number;
  maxTop: number;
  maxBottom: number;
  step(side: "top" | "bottom", delta: number): void;
  reset(): void;
  source: Resolution["source"];
}

/** Headless "Screen fit" model: step the top/bottom padding by hand, reset to auto. Bring your own markup. */
export function useScreenFit(sa?: SafeArea, stepPx = 4): ScreenFitState {
  const r = useSafeArea(sa);
  const step = useCallback((side: "top" | "bottom", delta: number): void => {
    const max = DEFAULT_LIMITS[side];
    const cur = r.insets[side];
    const next = Math.min(max, Math.max(0, cur + delta * stepPx));
    r.setOverride({ ...(r.override ?? {}), [side]: next });
  }, [r, stepPx]);
  const reset = useCallback(() => r.setOverride(null), [r]);
  return { top: r.insets.top, bottom: r.insets.bottom, auto: !r.override, min: 0, maxTop: DEFAULT_LIMITS.top, maxBottom: DEFAULT_LIMITS.bottom, step, reset, source: r.source };
}

/** Minimal unstyled stepper (class names: safe-area-fit, -row, -btn, -val). Wrap it or use `useScreenFit` for your own UI. */
export function ScreenFit({ sa, className = "safe-area-fit" }: { sa?: SafeArea; className?: string }): ReactElement {
  const f = useScreenFit(sa);
  const row = (side: "top" | "bottom", label: string, v: number): ReactElement => (
    <div className={`${className}-row`} role="group" aria-label={`${label} padding`}>
      <span>{label}</span>
      <button type="button" className={`${className}-btn`} aria-label={`${label} less`} disabled={v <= f.min} onClick={() => f.step(side, -1)}>-</button>
      <output className={`${className}-val`}>{v}px</output>
      <button type="button" className={`${className}-btn`} aria-label={`${label} more`} disabled={v >= (side === "top" ? f.maxTop : f.maxBottom)} onClick={() => f.step(side, 1)}>+</button>
    </div>
  );
  return (
    <div className={className}>
      {row("top", "Top", f.top)}
      {row("bottom", "Bottom", f.bottom)}
      <button type="button" className={`${className}-btn`} disabled={f.auto} onClick={f.reset}>Auto</button>
    </div>
  );
}
