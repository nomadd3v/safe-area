// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSafeArea, install, _resetForTests } from "../src/index";

const root = document.documentElement;
const v = (n: string): string => root.style.getPropertyValue(n);
beforeEach(() => { localStorage.clear(); root.removeAttribute("style"); });
afterEach(() => { _resetForTests(); delete (window as unknown as { Capacitor?: unknown }).Capacitor; vi.restoreAllMocks(); });

/** jsdom has no env(): fake the probe's computed padding. */
const fakeEnv = (top: number, bottom = 0) => vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ paddingTop: `${top}px`, paddingBottom: `${bottom}px`, paddingLeft: "0px", paddingRight: "0px" }) as CSSStyleDeclaration);

describe("createSafeArea", () => {
  it("(a) env probe wins and is written to --safe-area-inset-*", () => {
    fakeEnv(44, 34);
    const sa = createSafeArea();
    const r = sa.refresh();
    expect(r.source).toBe("env");
    expect([v("--safe-area-inset-top"), v("--safe-area-inset-bottom")]).toEqual(["44px", "34px"]);
  });
  it("jsdom with nothing: none, 0px written", () => {
    const sa = createSafeArea();
    expect(sa.refresh().source).toBe("none");
    expect(v("--safe-area-inset-top")).toBe("0px");
  });
  it("(b) reads values a shell injected, even after we have written", () => {
    const sa = createSafeArea();
    sa.start();
    root.style.setProperty("--safe-area-inset-top", "38px"); // Capacitor SystemBars
    expect(sa.refresh().source).toBe("injected");
    expect(v("--safe-area-inset-top")).toBe("38px");
    sa.refresh(); // our own write must not be mistaken for a shell report, and must stay stable
    expect(sa.get()).toMatchObject({ source: "injected", insets: { top: 38 } });
    sa.stop();
  });
  it("(b) native bridge result is used when env and injected are zero", async () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, nativePromise: vi.fn().mockResolvedValue({ top: 41, bottom: 21, left: 0, right: 0 }) };
    const sa = createSafeArea();
    sa.start();
    await vi.waitFor(() => expect(sa.get().source).toBe("native"));
    expect(v("--safe-area-inset-top")).toBe("41px");
    sa.stop();
  });
  it("(c) heuristic only when nothing else reads, and only in a shell", async () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 16)");
    vi.spyOn(window, "screen", "get").mockReturnValue({ width: 412, height: 915 } as Screen);
    Object.defineProperty(window, "innerWidth", { value: 412, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 915, configurable: true });
    expect(createSafeArea().refresh().source).toBe("none"); // browser tab
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, nativePromise: vi.fn().mockRejectedValue(new Error("no plugin")) };
    const sa = createSafeArea();
    expect(sa.refresh()).toMatchObject({ source: "heuristic", insets: { top: 32, bottom: 24 } });
  });
  it("(d) override beats env, persists, and returns to auto", () => {
    fakeEnv(44, 34);
    const sa = createSafeArea({ storageKey: "t:sa" });
    sa.setOverride({ top: 10 });
    expect(sa.get()).toMatchObject({ source: "override", insets: { top: 10, bottom: 34 } });
    expect(JSON.parse(localStorage.getItem("t:sa")!)).toEqual({ top: 10 });
    expect(createSafeArea({ storageKey: "t:sa" }).refresh().insets.top).toBe(10); // survives reload
    sa.setOverride(null);
    expect(sa.get().source).toBe("env");
    expect(localStorage.getItem("t:sa")).toBeNull();
  });
  it("override is clamped (top 80, bottom 60) and bad stored JSON is ignored", () => {
    localStorage.setItem("safe-area", "{nope");
    const sa = createSafeArea();
    expect(sa.refresh().source).toBe("none");
    sa.setOverride({ top: 500, bottom: 500 });
    expect(sa.get().insets).toMatchObject({ top: 80, bottom: 60 });
  });
  it("re-runs on resize / orientationchange / visibilitychange and notifies subscribers once per change", () => {
    const env = fakeEnv(0);
    const sa = createSafeArea();
    const fn = vi.fn();
    sa.subscribe(fn);
    sa.start();
    env.mockImplementation(() => ({ paddingTop: "30px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" }) as CSSStyleDeclaration);
    window.dispatchEvent(new Event("resize"));
    expect(sa.get().insets.top).toBe(30);
    expect(fn).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("orientationchange"));
    document.dispatchEvent(new Event("visibilitychange"));
    expect(fn).toHaveBeenCalledTimes(1); // unchanged
    sa.stop();
  });
  it("custom properties and install() singleton", () => {
    fakeEnv(12);
    const props = { top: "--sa-top", right: "--sa-right", bottom: "--sa-bottom", left: "--sa-left" };
    const a = install({ properties: props });
    expect(install()).toBe(a);
    expect(v("--sa-top")).toBe("12px");
  });
});
