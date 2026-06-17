# Context

## Application Overview
GoGreen (Project Karma) is a carbon footprint intelligence app tailored for urban/semi-urban Indian households. It targets daily habits across energy (AC), transport (commute), food, shopping, and waste to help users reduce hidden financial leaks and carbon emissions.

## Technology Stack
- Next.js v16.2.9 (using app router)
- React v19.2.4
- Tailwind CSS v4.0.0
- Framer Motion v12.40.0
- Lucide React v1.18.0
- Persistence: Local Storage (`karma-product-state-v1`)

## Key Files
1. `src/app/page.tsx`: Contains the core application state (`AppState`, `Profile`, `LogEntry`, `Action`), the onboarding story flow, the `SetupOverlay` wizard, and all main views (Today, Track, Insights, Plan, Recap, Profile).
2. `src/components/LivingFragment.tsx`: Framer-motion driven SVG canvas visualizing "friction" (carbon impact/smog).
3. `src/app/ledger/page.tsx`: Interactive timeline tracking and logging actions, communicating with the analysis API.
4. `src/app/api/analyze/route.ts`: Analysis API that evaluates manual inputs using a keyword/regex engine and returns friction and rupee impact.

## Critical UI/UX Bugs & Deficiencies Identified
1. **Light Mode Contrast on Dark Modals/Overlays**:
   - The `.theme-light` styling in `src/app/globals.css` overrides white text colors (`.text-white`, `.text-white/50`, etc.) globally when light mode is active.
   - When the user is in the onboarding flow (`SetupOverlay` modal or story cards), which have dark/image backgrounds, the text is overridden to a dark color (`#0b1310`), causing severe readability issues (dark text on dark backgrounds).
2. **Electricity Bill Formatting Bug**:
   - In both `OnboardingCard` and `ProfileView`, the electricity bill range slider displays the value using `formatPoints` (e.g., "800 pts"), which is confusing since it represents Rupees (₹). It must be formatted as currency (e.g., "₹800").
3. **Setup Overlay Scope Gap**:
   - The `SetupOverlay` collects name, city, commute mode, AC hours, deliveries, and motivation. It is missing the monthly electricity bill input, which is essential to construct the baseline footprint and calculate the dashboard leak metric correctly.
4. **Action Plan Data Dependency**:
   - The Action Plan currently relies on default profile configurations rather than strictly using the data collected in the `SetupOverlay` to compute personalized scores and rank actions.
5. **Missing Dashboard Leak Metric**:
   - The dashboard requires a `monthlyLeak` metric displaying the Rupee cost of lifestyle waste based on the setup data formula: `Math.round(profile.bill * 0.18 + profile.deliveries * 95 + (profile.commuteMode === "cab" ? 1200 : 420))`.
