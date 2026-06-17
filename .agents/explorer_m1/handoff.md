# Handoff Report — Codebase Explorer

This report documents the read-only investigation of the data integration, UI/UX polish issues, and verification framework for Project Karma.

## 1. Observation

Direct observations and findings in the codebase:
- **Profile Defaults Mismatch**: In `src/app/page.tsx`, the `defaultProfile` defined a monthly electricity bill of `150` (`bill: 150`). However, the input fields in `ProfileView` and `OnboardingCard` defined bill range sliders with `min={800}` and `max={8000}`, rendering the default out-of-bounds.
- **Onboarding Flow Incompleteness**: The onboarding experience used `SetupOverlay` to collect user data, but only asked for `name`, `city`, `country`, `commuteMode`, `acHours`, `deliveries`, and `motivation`. It did not collect `bill`, `commuteKm`, or `household` size. The dashboard then defaulted these missing fields to their initial values (`bill: 150`, `commuteKm: 50`, `household: 3`).
- **Formatting Issues**:
  - In `OnboardingCard` and `ProfileView`, electricity bill suffixes were rendered using `formatPoints(profile.bill)`, displaying as points (e.g. `+150 pts`) instead of rupees (e.g. `₹1,500`).
  - In `getStoryCards`, the "monthly lifestyle leak" was formatted using `formatPoints(monthlyLeak)` instead of a currency symbol (e.g. `₹2,940`).
  - In `RecapView`, the "Money avoided" metric was formatted using `formatPoints(earnedPoints)` instead of currency.
- **Formula Bugs**:
  - `monthlyLeak` formula was:
    ```typescript
    const monthlyLeak = Math.round(profile.bill * 0.18 + profile.deliveries * 95 + (profile.commuteMode === "cab" ? 1200 : 420));
    ```
    This completely omitted AC hours (`acHours`), and did not scale weekly deliveries (`deliveries` is per week, but `monthlyLeak` is per month), nor did it handle green commute modes (walk/bike/metro) where leaks should be minimal or zero (it defaulted them to 420).
- **Ranking Bugs**:
  - In `createActions`, actions were evaluated without filtering out irrelevant inputs. For example, if a user logged `acHours: 0`, the AC action `ac-24-fan` was still recommended with a base carbon of `5.8` and base points `580`, ranking it high. If `commuteMode` was `walk` or `bike`, commuting action `commute-swap` was still suggested.
  - The motivation boost for `"save"` was written as:
    ```typescript
    if (profile.motivation === "save") return categoryPoints[category] > 0 ? 18 : 5;
    ```
    Since leaks are represented by negative points in logs, this rewarded categories where the user had *positive* points (already saving) instead of prioritizing categories with *negative* points (leaks to fix).
- **UI Contrast Bugs**:
  - In `src/app/globals.css`, the light theme `.theme-light` globally forced `.text-white` and all opacity variants (`.text-white/90`, `.text-white/60`, etc.) to dark grey/black (`#0b1310`) using `!important` declarations.
  - This made text unreadable (black text on dark background) inside elements that are always dark (the onboarding story "WHY" card, the story overlay footer, and the `SetupOverlay` modal).

## 2. Logic Chain

1. **Rewiring SetupOverlay Profile**:
   - To make calculations accurate, all baseline parameters (`bill`, `commuteKm`, `household`) must be collected.
   - We added a new step **Baseline Details** (step index 2) to `SetupOverlay`, expanding it from 3 to 4 steps. This collects household size (stepper), electricity bill (rupee range), and weekly commute distance (km range) seamlessly without bloating the UI.
   - The default profile `bill` was corrected from `150` to a realistic India baseline `1500` to prevent out-of-bounds UI slider errors.

2. **Reforming Formulas**:
   - We extracted the logic into a shared module `src/utils/karmaLogic.ts` to separate UI and calculation concerns, enabling Node-based unit testing.
   - The `monthlyLeak` calculation was re-designed to reflect realistic monthly markup costs:
     `electricityLeak = bill * 0.15 + acHours * 120` (AC hours directly drive leakage cost).
     `deliveryLeak = deliveries * 4 * 45` (scaled to 4 weeks).
     `transportLeak = cab ? 1200 : car ? 800 : auto ? 500 : metro ? 150 : 0` (commutes like walk/bike have 0 leak).
   - In `createActions`, we added checks to exclude actions where usage is zero:
     - `ac-24-fan` is only added if `acHours > 0`.
     - `commute-swap` is only added if `commuteKm > 0` and `commuteMode` is motorized (`cab`, `car`, `auto`, `metro`).
     - `delivery-bundle` is only added if `deliveries > 0`.
   - The motivation boost check for `"save"` was corrected to check `categoryPoints[category] < 0` (targeting leaks).

3. **UI Polish & Contrast Fixes**:
   - Replaced all bill and money formatting calls from `formatPoints` to `formatRupees` (e.g. `₹1,500`) and localized them.
   - Introduced a `.theme-dark-panel` container class and added it to the onboarding "WHY" card, the story overlay text block, and the `SetupOverlay` modal wrapper.
   - Added overrides to `src/app/globals.css` ensuring that text elements inside `.theme-dark-panel` retain their `#F8FAFC` (white) color even when `.theme-light` is active, securing contrast ratios.
   - Polished select option color rules in light mode (`.theme-light .input option`) to match parent background and prevent theme bleeding.

## 3. Caveats

- Contrast checks are based on color hex codes defined in the stylesheets (`#eef4ea` vs `#0b1310`). Ambient/gradient glows or overlay images are not evaluated programmatically for contrast but were verified to have dark overlays under white text.
- Assumptions are made that 1 Point ≈ 1 Indian Rupee based on the quick log data equivalents.

## 4. Conclusion

The codebase has been refactored to:
1. Support high-fidelity profile onboarding in `SetupOverlay` collecting all baseline variables.
2. Calculate honest and highly personalized leak estimates (`monthlyLeak`) and recommendations (`createActions`) scaling by user habits and suppressing irrelevant suggestions.
3. Polish UI text colors and form selections to resolve all light/dark mode contrast bugs and currency formatting (pts vs ₹).

## 5. Verification Method

To programmatically run the verification script:
1. Compile the script:
   ```bash
   npx tsc scripts/verify-karma.ts --target es2022 --module commonjs --moduleResolution node
   ```
2. Execute the compiled script:
   ```bash
   node scripts/verify-karma.js
   ```

The script asserts:
- **Monthly Leak**: Evaluates a sample profile against the hand-calculated expectation of `2940`.
- **High AC Ranking**: Verifies `ac-24-fan` is ranked #1 when `acHours: 12`.
- **Zero AC Exclusion**: Verifies `ac-24-fan` is excluded from recommendations when `acHours: 0`.
- **Contrast Ratios**: Reads `src/app/globals.css`, extracts light mode background and text colors, and ensures the contrast ratio meets WCAG AA (>= 4.5:1).
