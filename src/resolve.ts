/** Pure resolver: given readings from independent strategies, pick the best. No DOM access in this file. */

export interface Insets { top: number; right: number; bottom: number; left: number }
export type Source = "override" | "env" | "injected" | "native" | "heuristic" | "none";
/** Manual override per side; a side that is undefined stays automatic. */
export interface Override { top?: number; bottom?: number; left?: number; right?: number }
export interface Readings {
  env?: Insets | null;
  /** Values some shell injected into CSS vars (Capacitor's SystemBars writes --safe-area-inset-*). */
  injected?: Insets | null;
  /** Values from the native bridge (WindowInsets: systemBars + displayCutout, in CSS px). */
  native?: Insets | null;
  heuristic?: Insets | null;
  override?: Override | null;
}
export interface Limits { top: number; bottom: number; left: number; right: number }
export const DEFAULT_LIMITS: Limits = { top: 80, bottom: 60, left: 60, right: 60 };
export const ZERO: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export interface Resolution {
  insets: Insets;
  /** Winning strategy; "override" when any side is manually set (see `detected` for the automatic result). */
  source: Source;
  /** What automatic detection alone picked. */
  detected: { insets: Insets; source: Exclude<Source, "override"> };
  /** Sides the manual override is controlling. */
  overridden: ("top" | "bottom" | "left" | "right")[];
}

const SIDES = ["top", "right", "bottom", "left"] as const;
const clamp = (n: number, max: number): number => (Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0);
export const clampInsets = (i: Insets, l: Limits = DEFAULT_LIMITS): Insets => ({ top: clamp(i.top, l.top), right: clamp(i.right, l.right), bottom: clamp(i.bottom, l.bottom), left: clamp(i.left, l.left) });
export const hasAny = (i: Insets | null | undefined): i is Insets => !!i && SIDES.some((s) => clamp(i[s], 1e6) > 0);

/**
 * Precedence for automatic detection: env() (what the engine really applies, no double-padding risk), then
 * shell-injected vars, then the native bridge, then the heuristic (callers must only supply it when nothing else
 * reads non-zero). Manual override beats everything, per side.
 */
export function resolve(r: Readings, limits: Limits = DEFAULT_LIMITS): Resolution {
  const order: [Exclude<Source, "override" | "none">, Insets | null | undefined][] = [["env", r.env], ["injected", r.injected], ["native", r.native], ["heuristic", r.heuristic]];
  let source: Exclude<Source, "override"> = "none";
  let auto: Insets = ZERO;
  for (const [name, v] of order) {
    if (hasAny(v)) { source = name; auto = clampInsets(v, limits); break; }
  }
  const insets = { ...auto };
  const overridden: Resolution["overridden"] = [];
  for (const s of SIDES) {
    const o = r.override?.[s];
    if (typeof o === "number" && Number.isFinite(o)) { insets[s] = clamp(o, limits[s]); overridden.push(s); }
  }
  return { insets, source: overridden.length ? "override" : source, detected: { insets: auto, source }, overridden };
}
