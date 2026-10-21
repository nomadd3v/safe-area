import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LIMITS, getSafeArea, install } from "./index.js";
const detector = (sa) => sa ?? getSafeArea() ?? install();
/** Live resolved insets + which strategy won. Re-renders when they change. */
export function useSafeArea(sa) {
    const d = detector(sa);
    const res = useSyncExternalStore(d.subscribe, d.get, d.get);
    return { ...res, override: d.getOverride(), setOverride: d.setOverride, refresh: d.refresh };
}
/** Headless "Screen fit" model: step the top/bottom padding by hand, reset to auto. Bring your own markup. */
export function useScreenFit(sa, stepPx = 4) {
    const r = useSafeArea(sa);
    const step = useCallback((side, delta) => {
        const max = DEFAULT_LIMITS[side];
        const cur = r.insets[side];
        const next = Math.min(max, Math.max(0, cur + delta * stepPx));
        r.setOverride({ ...(r.override ?? {}), [side]: next });
    }, [r, stepPx]);
    const reset = useCallback(() => r.setOverride(null), [r]);
    return { top: r.insets.top, bottom: r.insets.bottom, auto: !r.override, min: 0, maxTop: DEFAULT_LIMITS.top, maxBottom: DEFAULT_LIMITS.bottom, step, reset, source: r.source };
}
/** Minimal unstyled stepper (class names: safe-area-fit, -row, -btn, -val). Wrap it or use `useScreenFit` for your own UI. */
export function ScreenFit({ sa, className = "safe-area-fit" }) {
    const f = useScreenFit(sa);
    const row = (side, label, v) => (_jsxs("div", { className: `${className}-row`, role: "group", "aria-label": `${label} padding`, children: [_jsx("span", { children: label }), _jsx("button", { type: "button", className: `${className}-btn`, "aria-label": `${label} less`, disabled: v <= f.min, onClick: () => f.step(side, -1), children: "-" }), _jsxs("output", { className: `${className}-val`, children: [v, "px"] }), _jsx("button", { type: "button", className: `${className}-btn`, "aria-label": `${label} more`, disabled: v >= (side === "top" ? f.maxTop : f.maxBottom), onClick: () => f.step(side, 1), children: "+" })] }));
    return (_jsxs("div", { className: className, children: [row("top", "Top", f.top), row("bottom", "Bottom", f.bottom), _jsx("button", { type: "button", className: `${className}-btn`, disabled: f.auto, onClick: f.reset, children: "Auto" })] }));
}
