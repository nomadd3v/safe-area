import { type ReactElement } from "react";
import { type Override, type Resolution, type SafeArea } from "./index.js";
/** Live resolved insets + which strategy won. Re-renders when they change. */
export declare function useSafeArea(sa?: SafeArea): Resolution & {
    override: Override | null;
    setOverride: (o: Override | null) => void;
    refresh: () => Resolution;
};
export interface ScreenFitState {
    top: number;
    bottom: number;
    /** True when no manual override is active. */
    auto: boolean;
    min: number;
    maxTop: number;
    maxBottom: number;
    step(side: "top" | "bottom", delta: number): void;
    reset(): void;
    source: Resolution["source"];
}
/** Headless "Screen fit" model: step the top/bottom padding by hand, reset to auto. Bring your own markup. */
export declare function useScreenFit(sa?: SafeArea, stepPx?: number): ScreenFitState;
/** Minimal unstyled stepper (class names: safe-area-fit, -row, -btn, -val). Wrap it or use `useScreenFit` for your own UI. */
export declare function ScreenFit({ sa, className }: {
    sa?: SafeArea;
    className?: string;
}): ReactElement;
