# Project: GoGreen Onboarding & UI/UX Polish

## Architecture
- Single-page dashboard application (`src/app/page.tsx`) utilizing React local state and LocalStorage persistence.
- Component-driven UI (`LivingFragment` SVG visualizer) styling driven by Tailwind CSS and globals (`src/app/globals.css`).
- Analytical API (`src/app/api/analyze/route.ts`) computing action impacts.

## Code Layout
- `src/app/page.tsx` — Main application logic, onboarding, dashboard tabs, actions structure.
- `src/app/globals.css` — Global stylesheets and theme overrides (Light/Dark mode styles).
- `src/components/LivingFragment.tsx` — Dynamic visualizer based on friction score.
- `src/app/ledger/page.tsx` — Actions timeline.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Exploration & Tests | Setup verification scripts and explore codebase | None | DONE |
| 2 | M2: Onboarding Setup | Add electricity bill input, fix pts -> ₹ formatting | M1 | DONE |
| 3 | M3: Data Integration | Rewrite createActions based on setup, display monthlyLeak | M2 | DONE |
| 4 | M4: Style & Contrast | Fix light theme text overrides, apply theme-dark resets | M3 | DONE |
| 5 | M5: Verification | Build project and run validation scripts | M4 | DONE |
