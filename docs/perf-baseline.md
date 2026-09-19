# LifeOS — Performance Baseline & Tracking

> Version: v1.2.1 · Build 3  
> Established: 2026-09-19  
> Targets: 120Hz device p95 ≤ 8.3ms · 60Hz device p95 ≤ 16.7ms · Janky frames < 1% · INP < 100ms

---

## Targets (All Must Pass on Release APK)

| Metric | Target |
|--------|--------|
| Janky frames | < 1% |
| Frame time p95 @ 120Hz | ≤ 8.3ms |
| Frame time p95 @ 60Hz | ≤ 16.7ms |
| Long task (> 50ms) during taps / scroll | 0 |
| Tap-to-visual-response (INP) | < 100ms |
| More button — 50 rapid taps responded | 50/50 |
| More button — mid-animation tap responded | Yes |

---

## Phase 0 — Baseline (Pre-Build-3)

> Run with: real device, release APK, chrome://inspect DevTools Performance tab.  
> Throttle CPU: 4× slowdown on desktop Chrome as proxy for low-end device.

### Scenario A — Cold Start (after APK update install)

| Metric | Measured | Notes |
|--------|----------|-------|
| Time to Interactive | _TODO_ | Record from APK launch to first tap response |
| First Contentful Paint | _TODO_ | |
| Long tasks during startup | _TODO_ | |

### Scenario B — Hub Open / Close (×10)

| Metric | Before Build 3 (static analysis) | After Build 3 | Delta |
|--------|-----------------------------------|---------------|-------|
| Worst frame time | ~40-60ms (blur filter + height anim) | TBD | TBD |
| Janky frames % | ~8-15% | TBD | TBD |
| Long tasks on open | 1-2 (MutationObserver + navigate) | TBD | TBD |
| More button miss rate | ~10-20% rapid taps | TBD | TBD |

**Root causes identified (Build 3 fixes applied):**
- `filter: blur(75px)` on SectionAccentBlob → replaced with radial-gradient (0 GPU blur passes)
- `MutationObserver` on full DOM subtree → removed (was firing synchronously at tap time)
- `AnimatePresence mode="wait"` in squircle → changed to `mode="popLayout"` (icon swap no longer blocks re-taps)
- No `touch-action: manipulation` on nav → added globally (removes 300ms tap delay)
- `navigate()` in hub not wrapped in `startTransition` → wrapped (new route render is now low-priority)

### Scenario C — Settings (scroll + 10 toggle switches)

| Metric | Before Build 3 | After Build 3 | Delta |
|--------|----------------|---------------|-------|
| Frame time on accordion open | ~30-50ms (height anim layout reflow) | TBD | TBD |
| Toggle response time | < 16ms (optimistic update already in place) | TBD | TBD |

**Root causes identified (Build 3 fixes applied):**
- `height: 0 → 'auto'` accordion animation (8 instances) → replaced with `scaleY + opacity` (no layout reflow)
- `backdrop-blur-xl` on header buttons → removed (no more compositor layer per button)

### Scenario D — Tab Switching (Home → Gym → Nutrition)

| Metric | Before Build 3 | After Build 3 | Delta |
|--------|----------------|---------------|-------|
| Route transition frame drop | TBD | TBD | TBD |

### Scenario E — Rapid More Button Taps (50×)

| Metric | Before Build 3 | After Build 3 | Delta |
|--------|----------------|---------------|-------|
| Registered taps / 50 | TBD | TBD | TBD |

---

## Build 3 Changes Summary

### GPU / Compositor (Biggest Wins)
- **SectionAccentBlob**: `filter: blur(75px)` → `radial-gradient` (eliminates GPU blur pass)
- **Layout header**: `backdrop-filter: blur` → solid `bg-black/50` (eliminates compositor layer)
- **Settings accordions** (×8): `height: 0 → auto` → `scaleY + opacity` (no layout reflow)

### Input Responsiveness
- **Global**: `touch-action: manipulation` on all `button`, `[role=button]`, `a` (removes 300ms delay)
- **Nav bar**: `touchAction: 'manipulation'` inline on `motion.nav`
- **Squircle**: `AnimatePresence mode="popLayout"` (icon swap never blocks re-taps)
- **Squircle**: `squircleAnimatingRef` guard with `setMenuOpen(prev => !prev)` (every tap registers)
- **Scrim**: `pointer-events: none` on exit (taps pass through during close animation)

### Main Thread
- **MutationObserver removed**: was firing on every DOM mutation synchronously
- **Hub navigate**: wrapped in `startTransition` (route render deferred, close animation unblocked)
- **Service Worker**: skipped inside Capacitor native APK (was adding startup overhead)

---

## How to Re-Measure (After Each Release)

1. Install release APK on device
2. Open `chrome://inspect` on desktop Chrome → find device WebView → Open DevTools
3. Performance tab → Record while running each scenario
4. Check for long tasks (red blocks > 50ms)
5. Run `adb shell dumpsys gfxinfo com.avineesh.lifeos framestats` — check janky frames row
6. Also test on desktop Chrome with CPU 4× throttle as low-end proxy

---

## Guardrails (Enforced from Build 3 Forward)

See `AGENTS.md` Performance Rules section.

- Never animate `height`, `width`, `top`, `left`, `margin`, `box-shadow`, or `filter`
- No `backdrop-filter` or `filter: blur` anywhere
- No permanent `willChange`
- All buttons must have `touch-action: manipulation`
- `navigate()` inside sheets must use `startTransition`
- Every new animation must be profiled on 4× CPU throttle before merge
