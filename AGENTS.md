# LifeOS Project Guidelines & Stability Rules

## Stability Rules (Mandatory for Every Coding Session)

- **Post-Change Verification**: After every change, run `tsc --noEmit`, `eslint`, and `vite build` (`npm run build`), then open the app, click through Home, Gym, Nutrition, Finance, Study, Settings, and confirm the console has no errors.
- **Dependency Optimization**: When adding a dependency, add it to `optimizeDeps.include` in `vite.config.ts` and restart the dev server with `vite --force`.
- **Fast Refresh Hygiene**: Component files export ONLY components. Contexts, hooks, and constants live in their own dedicated files.
- **Immediate First Render**: Never block or gate the first render on async initialization. Render the shell and fallback skeleton immediately, with a 5-second background timeout fallback.
- **Persisted State Resilience**: Every new persisted field needs a default value, schema versioning, and an error-tolerant migration function.
- **Route Error Isolation**: Every route is wrapped in `RouteErrorBoundary` and `Suspense`.
- **HMR-Safe Module Singletons**: Never leave module-level side effects without HMR dispose handling (`import.meta.hot.dispose`). Firebase, IndexedDB, and global listeners must use singleton checks.

---

## Performance Rules (Mandatory — Android WebView / Capacitor APK)

These rules are permanent guardrails established after Build 3 performance profiling.
Violations cause jank, input delay, or battery drain on physical Android devices.

### Animation Rules

- **Only animate `transform` and `opacity`**. Never animate `height`, `width`, `top`, `left`,
  `margin`, `padding`, `box-shadow`, `border-radius`, or `filter`. These trigger layout reflow
  on every frame on Android WebView.
- **No `backdrop-filter` or `filter: blur()`** anywhere in the app. These force the GPU to create
  compositor layers and re-render every frame. Use a semi-opaque solid background instead.
  *Exception*: The AppLock overlay blur is intentional UI — keep it, but do not add more.
- **No permanent `willChange`**. `willChange: 'transform'` set permanently on elements that don't
  move wastes GPU memory. Only set it when an animation is about to start; remove it after.
- **Accordion / collapse patterns**: Use `scaleY + opacity` with `transformOrigin: 'top'`.
  Never use `height: 0 → 'auto'`. See `Settings.tsx` for the reference pattern.
- **AnimatePresence mode**: Use `mode="popLayout"` or `mode="sync"` for icon swaps and toggles.
  Only use `mode="wait"` for full page transitions where blocking is intentional.

### Input Responsiveness Rules

- **`touch-action: manipulation`** must be on all `button`, `[role="button"]`, and `a` elements
  (already applied globally in `index.css`). Do not remove this rule.
- **`navigate()` inside sheets or modals** must be wrapped in `startTransition(...)`. This marks
  the new route render as low-priority so sheet close animations complete without stalling.
- **MutationObserver on `document.body`**: Do not add MutationObservers with `subtree: true`.
  They fire synchronously on every DOM mutation on the main thread. Use custom events instead:
  - `window.dispatchEvent(new Event('lifeos-subinterface-open'))` to signal sub-interface open
  - `window.dispatchEvent(new Event('lifeos-subinterface-close'))` to signal close

### Measurement Rules

- **Measure before/after every optimization**. No performance change without a before/after number.
- **Baseline document**: See `docs/perf-baseline.md`. Update it with every Build release.
- **Profiling method**: Real device + chrome://inspect + Performance tab, OR `adb shell dumpsys
  gfxinfo com.avineesh.lifeos framestats`.
- **Desktop proxy**: Chrome CPU 4× throttle = rough proxy for a low-end Android device.
- **Targets per `docs/perf-baseline.md`**: Janky frames < 1%, p95 ≤ 8.3ms @120Hz, INP < 100ms.

### Capacitor-Specific Rules

- **No Service Worker in native APK**: The native app unregisters any cached SW on startup
  (see `main.tsx`). Do not re-register SW from Capacitor native context.
- **Hardware acceleration**: Already enabled in `AndroidManifest.xml` — do not disable it.
- **Refresh rate**: Already maximized in `MainActivity.java` — do not modify the display mode code.
