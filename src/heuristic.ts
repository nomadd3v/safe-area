import type { Insets } from "./resolve.js";

export interface HeuristicEnv {
  ua: string;
  /** Running inside a native shell (Capacitor etc.) or as an installed PWA. A plain browser tab never needs padding. */
  native: boolean;
  standalone: boolean;
  screenW: number; screenH: number; innerW: number; innerH: number;
}

/**
 * Last-resort guess for when env() and the native bridge both read 0 on a device that clearly has bars.
 * Only fires when content is full-screen (innerHeight ~ screen.height, so bars overlap it) in a shell or installed PWA.
 * Android: status bar 24-48dp (we use 32), gesture bar 24. iPhone: notch 47pt / Dynamic Island 59pt, home bar 34pt.
 */
export function heuristicInsets(e: HeuristicEnv): Insets | null {
  if (!e.native && !e.standalone) return null;
  const landscape = e.screenW > e.screenH;
  const w = Math.min(e.screenW, e.screenH), h = Math.max(e.screenW, e.screenH);
  if (!(w > 0) || w > 600) return null; // tablets/desktops: leave alone
  const bars = landscape ? e.screenW - e.innerW : e.screenH - e.innerH;
  if (bars >= 24) return null; // the system already keeps content out from under the bars
  const ios = /iPhone|iPod/.test(e.ua);
  const android = /Android/.test(e.ua);
  if (ios) {
    if (h >= 812) return landscape ? { top: 0, right: 47, bottom: 21, left: 47 } : { top: h >= 852 ? 59 : 47, right: 0, bottom: 34, left: 0 };
    return landscape ? null : { top: 20, right: 0, bottom: 0, left: 0 };
  }
  if (android) return landscape ? { top: 24, right: 0, bottom: 24, left: 0 } : { top: 32, right: 0, bottom: 24, left: 0 };
  return null;
}
