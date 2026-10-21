import { ZERO, type Insets, type Limits, type Override, type Resolution } from "./resolve.js";
export * from "./resolve.js";
export { heuristicInsets, type HeuristicEnv } from "./heuristic.js";
export { readEnv, readVars } from "./probe.js";
export { readNative, isNativeShell } from "./capacitor.js";
export interface Options {
    /** localStorage key for the manual override. Default "safe-area". */
    storageKey?: string;
    limits?: Limits;
    /** CSS custom properties to write. Default --safe-area-inset-{top,right,bottom,left}. */
    properties?: Record<keyof Insets, string>;
    /** Disable individual strategies (tests, debugging). */
    disable?: ("env" | "injected" | "native" | "heuristic")[];
}
export declare const DEFAULT_PROPERTIES: Record<keyof Insets, string>;
export interface SafeArea {
    start(): void;
    stop(): void;
    /** Re-read every strategy and write the CSS vars. */
    refresh(): Resolution;
    get(): Resolution;
    subscribe(fn: (r: Resolution) => void): () => void;
    /** Pass null (or {}) to return to automatic. Persisted. */
    setOverride(o: Override | null): void;
    getOverride(): Override | null;
}
/** Build a detector. `install()` is the one-line version that also starts it. */
export declare function createSafeArea(opts?: Options, win?: Window): SafeArea;
/** One-line setup: call before first render. Idempotent; returns the shared detector. */
export declare function install(opts?: Options): SafeArea;
export declare const getSafeArea: () => SafeArea | null;
/** Test helper. */
export declare function _resetForTests(): void;
export { ZERO };
