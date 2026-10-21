import type { Insets } from "./resolve.js";
export interface HeuristicEnv {
    ua: string;
    /** Running inside a native shell (Capacitor etc.) or as an installed PWA. A plain browser tab never needs padding. */
    native: boolean;
    standalone: boolean;
    screenW: number;
    screenH: number;
    innerW: number;
    innerH: number;
}
/**
 * Last-resort guess for when env() and the native bridge both read 0 on a device that clearly has bars.
 * Only fires when content is full-screen (innerHeight ~ screen.height, so bars overlap it) in a shell or installed PWA.
 * Android: status bar 24-48dp (we use 32), gesture bar 24. iPhone: notch 47pt / Dynamic Island 59pt, home bar 34pt.
 */
export declare function heuristicInsets(e: HeuristicEnv): Insets | null;
