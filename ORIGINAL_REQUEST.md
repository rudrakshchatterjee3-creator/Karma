# Original User Request

## Initial Request — 2026-06-17T01:51:13+05:30

# Teamwork Project Prompt — Draft

> Status: Launched

Fix critical UI/UX bugs in the Karma onboarding flow and comprehensively audit and polish the entire application (copy, UI elements, data persistence) for production readiness.

Working directory: c:/Users/muzee/OneDrive/Documents/GoGreen

Integrity mode: benchmark

## Requirements

### R1. Deep Data Integration
Fundamentally rewire the Action Plan logic in `page.tsx` so that recommendations are strictly driven by the details collected in the new Setup Overlay. Ensure that the dashboard and story cards accurately reflect these personalized data points rather than generic defaults.

### R2. Aggressive UI/UX Production Polish
Perform a comprehensive audit of the entire application. Actively redesign and polish any component that feels unpolished or non-premium. Fix any layout breaks or unreadable text specifically occurring between Light and Dark mode toggles.

## Acceptance Criteria

### Data Logic & Rewiring
- [ ] A programmatic verification script can verify that when `Profile` has `acHours: 12`, the "AC Optimization" action is ranked first in the Action Plan.
- [ ] A programmatic verification script confirms the Dashboard `monthlyLeak` metric mathematically matches the formula utilizing the newly collected setup data.

### UX Polish
- [ ] An agent-as-judge script verifies that no text elements have poor contrast (e.g. white text on light background) when `themePreference: "light"` is active.
- [ ] The app successfully passes `npm run build` with zero TypeScript errors.
