import type { Insets } from "./resolve.js";
export declare const isNativeShell: (w?: Window) => boolean;
/**
 * Strategy (b): the tiny `SafeArea` Android plugin (android/SafeAreaPlugin.java in this repo) returns WindowInsets
 * (system bars + display cutout) in CSS px. Zero dependencies: it talks to the injected Capacitor global directly.
 * Resolves null when the shell has no such plugin (older APK) or is not Capacitor.
 */
export declare function readNative(w?: Window): Promise<Insets | null>;
