import type { Insets } from "./resolve.js";

const px = (v: string): number => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/** Strategy (a): read env(safe-area-inset-*) back through a hidden probe's computed padding. */
export function readEnv(doc: Document = document): Insets | null {
  const el = doc.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
  (doc.body ?? doc.documentElement).appendChild(el);
  try {
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) return null;
    return { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
  } finally { el.remove(); }
}

/** Parse a --safe-area-inset-* style value ("47px"); null when unset. */
export function readVars(root: HTMLElement, names: Record<keyof Insets, string>): Insets | null {
  const g = (n: string): string => root.style.getPropertyValue(n).trim();
  const raw = { top: g(names.top), right: g(names.right), bottom: g(names.bottom), left: g(names.left) };
  if (!raw.top && !raw.right && !raw.bottom && !raw.left) return null;
  return { top: px(raw.top), right: px(raw.right), bottom: px(raw.bottom), left: px(raw.left) };
}
