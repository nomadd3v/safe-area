/** Pure resolver: given readings from independent strategies, pick the best. No DOM access in this file. */
export interface Insets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export type Source = "override" | "env" | "injected" | "native" | "heuristic" | "none";
/** Manual override per side; a side that is undefined stays automatic. */
export interface Override {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}
export interface Readings {
    env?: Insets | null;
    /** Values some shell injected into CSS vars (Capacitor's SystemBars writes --safe-area-inset-*). */
    injected?: Insets | null;
    /** Values from the native bridge (WindowInsets: systemBars + displayCutout, in CSS px). */
    native?: Insets | null;
    heuristic?: Insets | null;
    override?: Override | null;
}
export interface Limits {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export declare const DEFAULT_LIMITS: Limits;
export declare const ZERO: Insets;
export interface Resolution {
    insets: Insets;
    /** Winning strategy; "override" when any side is manually set (see `detected` for the automatic result). */
    source: Source;
    /** What automatic detection alone picked. */
    detected: {
        insets: Insets;
        source: Exclude<Source, "override">;
    };
    /** Sides the manual override is controlling. */
    overridden: ("top" | "bottom" | "left" | "right")[];
}
export declare const clampInsets: (i: Insets, l?: Limits) => Insets;
export declare const hasAny: (i: Insets | null | undefined) => i is Insets;
/**
 * Precedence for automatic detection: env() (what the engine really applies, no double-padding risk), then
 * shell-injected vars, then the native bridge, then the heuristic (callers must only supply it when nothing else
 * reads non-zero). Manual override beats everything, per side.
 */
export declare function resolve(r: Readings, limits?: Limits): Resolution;
