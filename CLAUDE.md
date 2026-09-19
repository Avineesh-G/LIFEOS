# LifeOS Project Guidelines & Stability Rules

## Stability Rules (Mandatory for Every Coding Session)

- **Post-Change Verification**: After every change, run `tsc --noEmit`, `eslint`, and `vite build` (`npm run build`), then open the app, click through Home, Gym, Nutrition, Finance, Study, Settings, and confirm the console has no errors.
- **Dependency Optimization**: When adding a dependency, add it to `optimizeDeps.include` in `vite.config.ts` and restart the dev server with `vite --force`.
- **Fast Refresh Hygiene**: Component files export ONLY components. Contexts, hooks, and constants live in their own dedicated files.
- **Immediate First Render**: Never block or gate the first render on async initialization. Render the shell and fallback skeleton immediately, with a 5-second background timeout fallback.
- **Persisted State Resilience**: Every new persisted field needs a default value, schema versioning, and an error-tolerant migration function.
- **Route Error Isolation**: Every route is wrapped in `RouteErrorBoundary` and `Suspense`.
- **HMR-Safe Module Singletons**: Never leave module-level side effects without HMR dispose handling (`import.meta.hot.dispose`). Firebase, IndexedDB, and global listeners must use singleton checks.
