# HANDOFF: @nomadd3v/safe-area

**State (2026-10-21):** v0.1.0, built and tested (`npm test`: 33 tests; `npm run build`). Not published; not pushed. `dist/` is committed on purpose.

- Origin: Aaron, 2026-10-21, "have a sub agent build something to automatically detect not h on device" for My Squishy, then widened to all his apps.
- First consumer: `nomadd3v/wheres-my-squishy` via `"@nomadd3v/safe-area": "file:../safe-area"`. Switch to a GitHub ref before any Vercel deploy (Vercel cannot see `../safe-area`).
- Unverified on hardware: nothing here has run on a real notch phone or in a Capacitor WebView. The Java plugin (`android/SafeAreaPlugin.java`) is compiled only as part of the Squishy APK build when that is run.
- Design notes: env wins over native because env is what the engine actually applies (no double padding if the WebView already sits below the bars); the plugin also subtracts the WebView's own offset. The shell-injected vars share names with our output, so we track what we last wrote and treat only different values as the shell's.
- Open: no GitHub repo yet; no npm publish; no landscape heuristic verification.
