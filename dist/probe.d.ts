import type { Insets } from "./resolve.js";
/** Strategy (a): read env(safe-area-inset-*) back through a hidden probe's computed padding. */
export declare function readEnv(doc?: Document): Insets | null;
/** Parse a --safe-area-inset-* style value ("47px"); null when unset. */
export declare function readVars(root: HTMLElement, names: Record<keyof Insets, string>): Insets | null;
