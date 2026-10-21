import { heuristicInsets } from "./heuristic.js";
import { isNativeShell, readNative } from "./capacitor.js";
import { readEnv, readVars } from "./probe.js";
import { DEFAULT_LIMITS, ZERO, resolve, type Insets, type Limits, type Override, type Readings, type Resolution } from "./resolve.js";

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
export const DEFAULT_PROPERTIES: Record<keyof Insets, string> = { top: "--safe-area-inset-top", right: "--safe-area-inset-right", bottom: "--safe-area-inset-bottom", left: "--safe-area-inset-left" };

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

const same = (a: Resolution, b: Resolution): boolean => a.source === b.source && (["top", "right", "bottom", "left"] as const).every((s) => a.insets[s] === b.insets[s]);

/** Build a detector. `install()` is the one-line version that also starts it. */
export function createSafeArea(opts: Options = {}, win: Window = window): SafeArea {
  const doc = win.document;
  const root = doc.documentElement;
  const key = opts.storageKey ?? "safe-area";
  const limits = opts.limits ?? DEFAULT_LIMITS;
  const props = opts.properties ?? DEFAULT_PROPERTIES;
  const off = new Set(opts.disable ?? []);
  const subs = new Set<(r: Resolution) => void>();
  let override: Override | null = null;
  try { const raw = win.localStorage.getItem(key); if (raw) override = JSON.parse(raw) as Override; } catch { override = null; }
  let native: Insets | null = null;
  let nativeAsked = false;
  let injected: Insets | null = null;
  const written: Record<string, string> = {};
  let current: Resolution = resolve({ override }, limits);
  let cleanup: (() => void) | null = null;

  const readInjected = (): Insets | null => {
    // A shell (Capacitor SystemBars) writes the same property names as us. Ignore a value identical to what we last
    // wrote (it is ours); remember anything else as the shell's latest report.
    const mine = (Object.keys(props) as (keyof Insets)[]).every((s) => root.style.getPropertyValue(props[s]).trim() === (written[props[s]] ?? ""));
    if (!mine) injected = readVars(root, props);
    return injected;
  };

  const compute = (): Resolution => {
    const r: Readings = { override };
    if (!off.has("env")) r.env = readEnv(doc);
    if (!off.has("injected")) r.injected = readInjected();
    if (!off.has("native")) r.native = native;
    const sofar = resolve(r, limits);
    if (!off.has("heuristic") && sofar.detected.source === "none") {
      const standalone = !!win.matchMedia?.("(display-mode: standalone)").matches || (win.navigator as { standalone?: boolean }).standalone === true;
      r.heuristic = heuristicInsets({ ua: win.navigator.userAgent, native: isNativeShell(win), standalone, screenW: win.screen?.width ?? 0, screenH: win.screen?.height ?? 0, innerW: win.innerWidth, innerH: win.innerHeight });
    }
    return resolve(r, limits);
  };

  const write = (res: Resolution): void => {
    for (const s of ["top", "right", "bottom", "left"] as const) {
      const v = `${res.insets[s]}px`;
      written[props[s]] = v;
      if (root.style.getPropertyValue(props[s]) !== v) root.style.setProperty(props[s], v);
    }
  };

  const refresh = (): Resolution => {
    const next = compute();
    write(next);
    if (!same(next, current)) { current = next; subs.forEach((f) => f(next)); }
    return current;
  };

  const askNative = (): void => {
    if (off.has("native")) return;
    void readNative(win).then((n) => {
      nativeAsked = true;
      const changed = JSON.stringify(n) !== JSON.stringify(native);
      native = n;
      if (changed) refresh();
    });
  };

  return {
    start() {
      if (cleanup) return;
      const onChange = (): void => { refresh(); askNative(); };
      const vv = win.visualViewport;
      win.addEventListener("resize", onChange);
      win.addEventListener("orientationchange", onChange);
      vv?.addEventListener("resize", onChange);
      doc.addEventListener("visibilitychange", onChange);
      // Shell reports (Capacitor) land as inline style writes on :root.
      const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(() => { if (!(Object.keys(props) as (keyof Insets)[]).every((s) => root.style.getPropertyValue(props[s]).trim() === written[props[s]])) refresh(); }) : null;
      mo?.observe(root, { attributes: true, attributeFilter: ["style"] });
      cleanup = () => { win.removeEventListener("resize", onChange); win.removeEventListener("orientationchange", onChange); vv?.removeEventListener("resize", onChange); doc.removeEventListener("visibilitychange", onChange); mo?.disconnect(); };
      refresh();
      if (!nativeAsked) askNative();
    },
    stop() { cleanup?.(); cleanup = null; },
    refresh,
    get: () => current,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    setOverride(o) {
      const clean = o && Object.values(o).some((v) => typeof v === "number") ? o : null;
      override = clean;
      try { if (clean) win.localStorage.setItem(key, JSON.stringify(clean)); else win.localStorage.removeItem(key); } catch { /* private mode */ }
      refresh();
    },
    getOverride: () => override,
  };
}

let singleton: SafeArea | null = null;
/** One-line setup: call before first render. Idempotent; returns the shared detector. */
export function install(opts: Options = {}): SafeArea {
  if (!singleton) { singleton = createSafeArea(opts); singleton.start(); }
  return singleton;
}
export const getSafeArea = (): SafeArea | null => singleton;
/** Test helper. */
export function _resetForTests(): void { singleton?.stop(); singleton = null; }
export { ZERO };
