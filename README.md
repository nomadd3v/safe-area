# @nomadd3v/safe-area

Stop the notch, punch-hole, status bar and gesture bar from covering crucial UI. Several independent detection strategies, one resolved answer with a `source` tag, a manual override, zero runtime dependencies. ESM + types, built with `tsc` only.

## Install

```
npm i @nomadd3v/safe-area            # or "file:../safe-area" / a GitHub ref while unpublished
```
Needs `viewport-fit=cover` in your viewport meta, otherwise browsers never expose insets:
`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`

## One-line setup

```ts
import { install } from "@nomadd3v/safe-area";
install({ storageKey: "myapp:safe-area" }); // before first render
```

## CSS contract

`install()` writes `--safe-area-inset-top|right|bottom|left` (in `px`) on `:root`, always, even when 0. Consume them with a fallback so first paint before JS still works:

```css
:root {
  --sa-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
  --sa-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
  --sa-left: var(--safe-area-inset-left, env(safe-area-inset-left, 0px));
  --sa-right: var(--safe-area-inset-right, env(safe-area-inset-right, 0px));
}
.topbar { padding-top: calc(var(--sa-top) + 0.4rem); }
.tabbar { padding-bottom: var(--sa-bottom); }
```
Do not use `max(env(), var(--safe-area-inset-*))`: it makes the manual override unable to shrink a value.

## Strategies and precedence

Automatic detection takes the first strategy that reads a non-zero side; the manual override then replaces individual sides.

| order | `source` | what |
|---|---|---|
| 1 | `env` | `env(safe-area-inset-*)` read back from a hidden probe's computed padding. What the engine really applies; works on iOS Safari/PWA and Chrome 140+ WebViews. |
| 2 | `injected` | `--safe-area-inset-*` that a shell wrote on `:root` before/after us (Capacitor 8 SystemBars). Remembered; our own writes are not mistaken for it. |
| 3 | `native` | The Android bridge (`./capacitor`): WindowInsets system bars + display cutout in CSS px, measured relative to the WebView, queried on start, resize, rotation and visibility. |
| 4 | `heuristic` | Only when 1-3 all read 0, and only in a native shell or installed PWA whose content is full-screen (`screen - inner < 24`): Android 32 top / 24 bottom; iPhone Dynamic Island 59/34, notch 47/34, SE 20/0. Never in a plain browser tab. |
| top | `override` | Player-chosen `{top?, bottom?, left?, right?}` in `localStorage[storageKey]`. Per side, beats everything. |

All values are rounded and clamped: top 0-80, bottom 0-60, left/right 0-60. Re-runs on `resize`, `orientationchange`, `visualViewport` resize, `visibilitychange`, and when a shell writes the vars.

## API

- `.`: `install(opts)`, `createSafeArea(opts)` -> `{start, stop, refresh, get, subscribe, setOverride, getOverride}`, pure `resolve(readings)`, `heuristicInsets(env)`, `readEnv()`, `readVars()`, `readNative()`.
- `./react`: `useSafeArea()` -> `{insets, source, detected, overridden, override, setOverride}`; `useScreenFit()` headless stepper model (`top`, `bottom`, `auto`, `step(side, +-1)` in 4px steps, `reset()`); `<ScreenFit/>` unstyled default (classes `safe-area-fit`, `-row`, `-btn`, `-val`).
- `./capacitor`: `readNative()`, `isNativeShell()`. Needs the Java plugin below.

Options: `storageKey` (default `"safe-area"`), `properties` (custom CSS var names), `limits`, `disable` (turn strategies off for debugging).

## Android bridge (only needed if env/injected read 0 in your shell)

1. Copy `android/SafeAreaPlugin.java` into `android/app/src/main/java/<your/package>/` and fix the `package` line.
2. In `MainActivity`: `public void onCreate(Bundle b) { registerPlugin(SafeAreaPlugin.class); super.onCreate(b); }`
3. Rebuild the APK. No npm plugin and no Capacitor JS import: the JS side calls `Capacitor.nativePromise("SafeArea", "getInsets")`. Apps with an older APK simply skip this strategy.

## Verify on a device

1. Open the app with a debug readout of `useSafeArea()` (`source` and the four values).
2. Expect on a cutout phone in a browser/PWA: `env`. In a Capacitor shell: `env` (WebView 140+), `injected` (older) or `native`. `none` with 0 on a phone with a visible notch means nothing detected: rotate, then use the manual stepper.
3. Chrome remote debugging: `getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top")`.
4. Push the stepper to 40: the top bar must move down; "Auto" restores.

## Add to an existing app (checklist)

1. `npm i @nomadd3v/safe-area`.
2. Confirm `viewport-fit=cover` in `index.html`.
3. `install({ storageKey: "<app>:safe-area" })` at the top of your entry file.
4. Add the `--sa-*` CSS wrapper above to `:root`.
5. Replace hard-coded or `env()` paddings on fixed top/bottom UI with `var(--sa-top)` / `var(--sa-bottom)`.
6. Add a "Screen fit" control to settings using `useScreenFit()` (or `<ScreenFit/>`).
7. Show `useSafeArea()` `source` + values in your debug view.
8. Capacitor Android: add `SafeAreaPlugin.java` and register it (section above).
9. If your bundler runs React from another path (`file:` dependency), set `resolve.dedupe: ["react"]`.
10. Check on a real notch phone (steps above).

## Dev

`npm test` (vitest, jsdom), `npm run build` (tsc to `dist/`, which is committed so `file:` and git-ref installs work without a build step).
