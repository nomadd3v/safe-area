import { describe, expect, it } from "vitest";
import { clampInsets, resolve, ZERO } from "../src/resolve";
import { heuristicInsets, type HeuristicEnv } from "../src/heuristic";

const I = (top: number, bottom = 0, left = 0, right = 0) => ({ top, bottom, left, right });

describe("resolve: precedence", () => {
  it("nothing reads anything: none, all zero", () => {
    const r = resolve({});
    expect(r.source).toBe("none");
    expect(r.insets).toEqual(ZERO);
  });
  it("env wins over injected, native and heuristic", () => {
    const r = resolve({ env: I(10), injected: I(20), native: I(30), heuristic: I(40) });
    expect([r.source, r.insets.top]).toEqual(["env", 10]);
  });
  it("injected beats native", () => expect(resolve({ env: I(0), injected: I(20), native: I(30) }).source).toBe("injected"));
  it("native beats heuristic and is used when env/injected are zero", () => {
    const r = resolve({ env: ZERO, injected: ZERO, native: I(36, 24), heuristic: I(32, 24) });
    expect([r.source, r.insets.top, r.insets.bottom]).toEqual(["native", 36, 24]);
  });
  it("heuristic only when everything else reads 0", () => {
    expect(resolve({ env: ZERO, native: null, heuristic: I(32, 24) }).source).toBe("heuristic");
  });
  it("null and NaN readings are treated as zero", () => {
    expect(resolve({ env: null, injected: { top: NaN, bottom: 0, left: 0, right: 0 } }).source).toBe("none");
  });
});

describe("resolve: manual override", () => {
  it("beats every strategy and is per side", () => {
    const r = resolve({ env: I(10, 20), override: { top: 50 } });
    expect(r.source).toBe("override");
    expect(r.insets).toMatchObject({ top: 50, bottom: 20 });
    expect(r.overridden).toEqual(["top"]);
    expect(r.detected.source).toBe("env");
  });
  it("can shrink to 0 below a detected value", () => expect(resolve({ env: I(30), override: { top: 0 } }).insets.top).toBe(0));
  it("empty override is automatic", () => expect(resolve({ env: I(30), override: {} }).source).toBe("env"));
});

describe("resolve: clamping", () => {
  it("top 0-80, bottom 0-60, sides 0-60", () => {
    expect(clampInsets({ top: 500, bottom: 500, left: 500, right: -5 })).toEqual({ top: 80, bottom: 60, left: 60, right: 0 });
  });
  it("applies to detected values and overrides", () => {
    expect(resolve({ native: I(300, 300) }).insets).toMatchObject({ top: 80, bottom: 60 });
    expect(resolve({ override: { top: 999, bottom: -3 } }).insets).toMatchObject({ top: 80, bottom: 0 });
  });
  it("rounds to whole px and survives Infinity", () => {
    expect(clampInsets({ top: 24.6, bottom: Infinity, left: 0, right: 0 })).toMatchObject({ top: 25, bottom: 0 });
  });
});

const base: HeuristicEnv = { ua: "", native: true, standalone: false, screenW: 412, screenH: 915, innerW: 412, innerH: 915 };
describe("heuristicInsets", () => {
  it("a plain browser tab never gets padding", () => expect(heuristicInsets({ ...base, native: false, ua: "Android" })).toBeNull());
  it("Android shell with full-screen content: 32 top, 24 bottom", () => expect(heuristicInsets({ ...base, ua: "Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro)" })).toEqual(I(32, 24)));
  it("Android where the system already keeps content out (screen-inner >= 24): null", () => expect(heuristicInsets({ ...base, ua: "Android", innerH: 860 })).toBeNull());
  it("installed Android PWA counts as a shell", () => expect(heuristicInsets({ ...base, native: false, standalone: true, ua: "Android" })).not.toBeNull());
  it("iPhone Dynamic Island: 59 / 34", () => expect(heuristicInsets({ ...base, ua: "iPhone", screenW: 393, screenH: 852, innerW: 393, innerH: 852 })).toEqual(I(59, 34)));
  it("iPhone notch (812): 47 / 34", () => expect(heuristicInsets({ ...base, ua: "iPhone", screenW: 375, screenH: 812, innerW: 375, innerH: 812 })).toEqual(I(47, 34)));
  it("iPhone SE style: status bar only", () => expect(heuristicInsets({ ...base, ua: "iPhone", screenW: 375, screenH: 667, innerW: 375, innerH: 667 })).toEqual(I(20)));
  it("iPhone landscape: sides", () => expect(heuristicInsets({ ...base, ua: "iPhone", screenW: 852, screenH: 393, innerW: 852, innerH: 393 })).toEqual({ top: 0, right: 47, bottom: 21, left: 47 }));
  it("tablets/desktops and unknown UAs: null", () => {
    expect(heuristicInsets({ ...base, ua: "Android", screenW: 800, screenH: 1280, innerW: 800, innerH: 1280 })).toBeNull();
    expect(heuristicInsets({ ...base, ua: "X11; Linux" })).toBeNull();
  });
});
