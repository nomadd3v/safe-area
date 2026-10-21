import type { Insets } from "./resolve.js";

interface CapacitorGlobal { isNativePlatform?: () => boolean; nativePromise?: (plugin: string, method: string, opts?: object) => Promise<unknown> }
const cap = (w: Window): CapacitorGlobal | undefined => (w as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;

export const isNativeShell = (w: Window = window): boolean => !!cap(w)?.isNativePlatform?.();

/**
 * Strategy (b): the tiny `SafeArea` Android plugin (android/SafeAreaPlugin.java in this repo) returns WindowInsets
 * (system bars + display cutout) in CSS px. Zero dependencies: it talks to the injected Capacitor global directly.
 * Resolves null when the shell has no such plugin (older APK) or is not Capacitor.
 */
export async function readNative(w: Window = window): Promise<Insets | null> {
  const c = cap(w);
  if (!c?.isNativePlatform?.() || !c.nativePromise) return null;
  try {
    const r = (await c.nativePromise("SafeArea", "getInsets", {})) as Partial<Insets> | null;
    if (!r) return null;
    return { top: Number(r.top) || 0, right: Number(r.right) || 0, bottom: Number(r.bottom) || 0, left: Number(r.left) || 0 };
  } catch { return null; }
}
