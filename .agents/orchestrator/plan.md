# Plan

## Architecture & Goal
The goal is to fix onboarding UI/UX bugs, audit the application, and achieve production-readiness. We will execute the Project Pattern, utilizing special subagents for exploration, implementation, review, and verification.

## Parallel Tracks
1. **Implementation Track**: Implements code, layout, logic, and style changes.
2. **E2E / Verification Track**: Writes verification scripts and verifies criteria.

## Milestones

### M1. Verification Script & Exploration Setup (Implementation & Verification Track)
- **Objective**: Establish verification scripts to measure baseline behavior and check acceptance criteria (acHours ranking, monthlyLeak calculation, and light theme contrast).
- **Verifications**: Verify project builds via `npm run build` initially.

### M2. Onboarding Flow & Setup Overlay Polish (Implementation Track)
- **Objective**: Improve the setup overlay inputs and resolve copy/format issues.
- **Tasks**:
  - Add Monthly Electricity Bill input to Step 1 of `SetupOverlay` with Rupees formatting.
  - Set default `bill` in `defaultProfile` to a realistic value like `2500`.
  - Fix the formatting of electricity bill display in `SetupOverlay`, `ProfileView`, and `OnboardingCard` from points (`pts`) to Rupees (`₹`).
- **Verifications**: Verify correct rendering of sliders.

### M3. Action Plan & Dashboard Rewiring (Implementation Track)
- **Objective**: Rewire scoring and display the monthly leak metric on the dashboard.
- **Tasks**:
  - Update `createActions` to calculate scores strictly from the setup overlay details. Ensure that if `acHours: 12`, the "AC Optimization" action (`ac-24-fan`) is ranked first under all motivations.
  - Scale commute actions based on `profile.commuteMode` (e.g., set `commuteKm` automatically during setup, and scale commute score to 0 if mode is walk/bike).
  - Calculate and display the `monthlyLeak` metric in `TodayView` using a new `MetricCard` with `data-testid="monthly-leak"`.
- **Verifications**: Run M1 verification scripts.

### M4. Light/Dark Mode Contrast & Aesthetic Polish (Implementation Track)
- **Objective**: Fix unreadable text on dark overlays in light mode, and audit UI elements.
- **Tasks**:
  - Add `.theme-dark` rules in `globals.css` to prevent light mode overrides from turning text black on dark backgrounds.
  - Apply `theme-dark` to `SetupOverlay`, story card image overlay, and `why-card`.
  - Review layouts, padding, and borders to ensure the app feels like a premium, polished, India-first lifestyle assistant.
- **Verifications**: Contrast and layout checks.

### M5. Verification & Forensic Audit (Review, Challenge & Audit Track)
- **Objective**: Perform a comprehensive build, run the verification scripts, and run the Forensic Auditor.
- **Tasks**:
  - Run build command (`npm run build`) and assert zero errors.
  - Run M1 verification scripts.
  - Run Forensic Auditor.
