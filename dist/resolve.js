/** Pure resolver: given readings from independent strategies, pick the best. No DOM access in this file. */
export const DEFAULT_LIMITS = { top: 80, bottom: 60, left: 60, right: 60 };
export const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const SIDES = ["top", "right", "bottom", "left"];
const clamp = (n, max) => (Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0);
export const clampInsets = (i, l = DEFAULT_LIMITS) => ({ top: clamp(i.top, l.top), right: clamp(i.right, l.right), bottom: clamp(i.bottom, l.bottom), left: clamp(i.left, l.left) });
export const hasAny = (i) => !!i && SIDES.some((s) => clamp(i[s], 1e6) > 0);
/**
 * Precedence for automatic detection: env() (what the engine really applies, no double-padding risk), then
 * shell-injected vars, then the native bridge, then the heuristic (callers must only supply it when nothing else
 * reads non-zero). Manual override beats everything, per side.
 */
export function resolve(r, limits = DEFAULT_LIMITS) {
    const order = [["env", r.env], ["injected", r.injected], ["native", r.native], ["heuristic", r.heuristic]];
    let source = "none";
    let auto = ZERO;
    for (const [name, v] of order) {
        if (hasAny(v)) {
            source = name;
            auto = clampInsets(v, limits);
            break;
        }
    }
    const insets = { ...auto };
    const overridden = [];
    for (const s of SIDES) {
        const o = r.override?.[s];
        if (typeof o === "number" && Number.isFinite(o)) {
            insets[s] = clamp(o, limits[s]);
            overridden.push(s);
        }
    }
    return { insets, source: overridden.length ? "override" : source, detected: { insets: auto, source }, overridden };
}
