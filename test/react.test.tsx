// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSafeArea } from "../src/index";
import { ScreenFit, useSafeArea } from "../src/react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement, root: Root;
beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("style"); host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

function Probe({ sa }: { sa: ReturnType<typeof createSafeArea> }) {
  const r = useSafeArea(sa);
  return <p data-testid="p">{r.source}:{r.insets.top}:{r.insets.bottom}</p>;
}
const text = (): string => host.querySelector("p")!.textContent!;
const btn = (name: string): HTMLButtonElement => host.querySelector(`button[aria-label="${name}"]`)!;

describe("react bindings", () => {
  it("useSafeArea follows the detector", () => {
    const sa = createSafeArea(); sa.refresh();
    act(() => root.render(<Probe sa={sa} />));
    expect(text()).toBe("none:0:0");
    act(() => sa.setOverride({ top: 20, bottom: 8 }));
    expect(text()).toBe("override:20:8");
  });
  it("ScreenFit steps top/bottom by 4px, clamps, and Auto resets", () => {
    const sa = createSafeArea(); sa.refresh();
    act(() => root.render(<ScreenFit sa={sa} />));
    expect(btn("Top less").disabled).toBe(true);
    act(() => btn("Top more").click());
    act(() => btn("Top more").click());
    act(() => btn("Bottom more").click());
    expect(sa.get().insets).toMatchObject({ top: 8, bottom: 4 });
    expect(host.textContent).toContain("8px");
    const auto = Array.from(host.querySelectorAll("button")).find((b) => b.textContent === "Auto")!;
    expect(auto.disabled).toBe(false);
    act(() => auto.click());
    expect(sa.get().source).toBe("none");
    expect(auto.disabled).toBe(true);
  });
  it("cannot step past 80 / 60", () => {
    const sa = createSafeArea(); sa.setOverride({ top: 80, bottom: 60 });
    act(() => root.render(<ScreenFit sa={sa} />));
    expect(btn("Top more").disabled).toBe(true);
    expect(btn("Bottom more").disabled).toBe(true);
  });
});
