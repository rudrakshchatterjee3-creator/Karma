# GEMINI.md - Product, Design, AI, and Engineering Directives

## Project: GoGreen / Project Karma

Build a working PromptWars submission for the challenge:

> Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

This is not a generic carbon calculator. It is a premium, India-first behavior-change product that helps ordinary people understand how daily choices affect their money, comfort, health, time, and status, then quietly connects those choices to carbon impact.

The app must score highly on:

- Solution Relevance: Directly solves the challenge with a usable, working product.
- Prompt Architecture: Uses high-quality AI prompts with clear structure, context, reasoning boundaries, personalization, and reliable outputs.
- Practical Usability: Feels useful to people who do not already care about the environment.
- UI Quality: Looks polished, professional, and intentionally designed, not AI-generated.
- Storytelling: Makes the user feel the problem before giving the solution.

---

## 1. Core Product Philosophy

### The Product Promise

Help users cut waste from everyday life.

The user should feel:

- "I understand what my lifestyle is costing me."
- "This app gives me small actions I can actually do."
- "This feels personal, useful, and worth returning to."
- "Reducing carbon also improves my bills, health, comfort, and self-image."

### The Real User

Design for a normal urban or semi-urban Indian user who may:

- Not know or care much about carbon footprints.
- Be sensitive to electricity bills, fuel costs, food prices, convenience, and family comfort.
- Have limited patience for long forms or moral lectures.
- Use a mobile phone as the primary device.
- Enjoy clean, premium apps such as CRED, PhonePe, Swiggy, Zomato, Groww, Apple Fitness, Spotify Wrapped, or modern banking apps.

### The Required Framing

Never lead with guilt. Lead with relevance.

Bad:

- "You emitted 12 kg CO2 today."
- "Save the planet by reducing your footprint."
- "Complete eco-friendly tasks."

Good:

- "Your AC habit may be adding Rs 420/month to your bill."
- "Three short auto rides this week cost more than a shared cab and produced 2.4x more emissions."
- "Your food waste this month is roughly one full grocery basket."
- "A 10-minute Sunday reset could cut next week's electricity waste."

### The App Category

Do not build a plain "carbon footprint tracker."

Build a:

- Personal resource intelligence app.
- Lifestyle waste detector.
- Money, comfort, and carbon coach.
- Story-led habit engine.

Carbon is the underlying score, but human benefit is the visible hook.

---

## 2. Product Definition: What This App Actually Is

### One-Sentence Product

Karma is a personal waste and carbon intelligence app that turns daily choices into a weekly action plan for saving money, reducing avoidable waste, and lowering carbon impact.

### The App Must Make Sense Without Explanation

Any first-time visitor should understand within 10 seconds:

- What the app does.
- Why it matters to them personally.
- What they should do first.
- What they will get after using it.

The product must not feel like a collection of disconnected carbon widgets. It needs a coherent user journey, clear navigation, realistic sample data, and a visible reason to return.

### Core User Loop

The complete app experience must follow this loop:

1. Understand
   - The user sees a short, personal story about hidden daily waste.
   - The app explains the problem through money, comfort, time, and carbon.

2. Profile
   - The user answers a few quick questions.
   - The app creates a baseline estimate.

3. Track
   - The user logs simple daily choices across electricity, transport, food, shopping, and waste.
   - Tracking must take less than one minute.

4. Diagnose
   - The app identifies the biggest "leak" in the user's lifestyle.
   - It explains why that leak matters.

5. Act
   - The user receives 1-3 practical actions.
   - Each action has a clear benefit, effort level, and next step.

6. Improve
   - The app shows weekly progress.
   - The user sees money saved, waste avoided, and carbon reduced.

7. Return
   - The app reveals a new weekly insight, challenge, or share card.

If a feature does not support this loop, deprioritize it.

### Required Information Architecture

Use a simple, real-product structure:

- Home / Today
  - Daily status, top insight, quick log, active action.

- Track
  - Fast inputs for transport, electricity, food, shopping, and waste.

- Insights
  - AI-generated personal diagnosis, trends, hidden waste, assumptions.

- Plan
  - Current actions, progress, completed improvements, next recommended step.

- Recap
  - Weekly story, savings, carbon reduction, share card.

- Profile / Settings
  - City, household, commute, bill estimate, preferences, data reset.

Navigation must be visible and understandable. On mobile, use a bottom navigation. On desktop, use a compact sidebar or top navigation.

### MVP Must-Have Functionality

The minimum acceptable working product must include:

- A guided onboarding flow that creates a usable profile.
- A baseline footprint and hidden-waste estimate.
- A dashboard that updates based on user input.
- A tracker where the user can add at least one entry in each major category.
- A recommendation engine that ranks actions from user data.
- An AI insight section with safe fallback content.
- A progress view showing weekly improvement.
- A realistic demo mode with pre-filled sample data.

Do not ship only a landing page, story page, or static dashboard.

### User Input Model

Collect only data that creates visible value.

Profile inputs:

- City.
- Household size.
- Monthly electricity bill range.
- AC usage.
- Main commute mode.
- Weekly commute distance.
- Diet pattern.
- Food delivery frequency.
- Main motivation: save money, reduce bills, improve health, reduce waste, feel organized, climate impact.

Daily or weekly tracking inputs:

- Transport mode and distance.
- AC/fan usage or electricity habit.
- Food choice or food waste.
- Delivery/order count.
- Shopping purchase or avoided purchase.
- Waste segregation or reuse action.

All inputs must have defaults and demo data so the app always feels alive.

### Output Model

Every major screen must show at least one useful output:

- Estimated weekly carbon footprint.
- Estimated rupee impact.
- Biggest lifestyle leak.
- One realistic action.
- Progress against last week or baseline.
- Confidence or assumptions for estimates.

Do not show empty dashboards after onboarding.

### Scoring and Prioritization Logic

The app must rank recommendations using transparent logic:

Priority score = impact + ease + user motivation match + recurrence.

Where:

- Impact: estimated money, carbon, time, or waste reduction.
- Ease: how realistic the action is this week.
- Motivation match: whether it aligns with what the user cares about.
- Recurrence: whether the habit repeats often enough to matter.

Example:

- If the user has high AC usage and cares about bills, prioritize AC optimization.
- If the user has a long commute and cares about time, prioritize commute comparison.
- If the user orders food often and wastes food, prioritize meal planning or delivery bundling.

### Real-Site Requirements

The app must feel like a real deployed product:

- Clear brand name and product promise.
- Real navigation.
- Real interactive controls.
- Persistent state using local storage unless backend is required.
- Meaningful sample data.
- Empty, loading, and error states.
- Settings or profile management.
- Responsive layouts.
- Shareable recap or report.
- No placeholder lorem ipsum.
- No "coming soon" sections in the main journey.

### Demo Narrative

The app should be demoable in 2 minutes:

1. Start with the story hook.
2. Complete or skip onboarding with demo profile.
3. Show the dashboard baseline.
4. Log one action.
5. Watch insight/action/progress update.
6. Open the AI coach.
7. Show the weekly recap/share card.

This demo flow must be obvious from the UI.

---

## 3. Storytelling Standard

The app must make the user understand the "why" before asking for commitment.

### First-Run Experience

The first screen must not be a generic dashboard.

Start with a short emotional hook:

- A cinematic story card.
- A swipeable visual sequence.
- A short simulated "day in your life" breakdown.
- A city-specific insight.
- A before/after comparison of hidden waste.

Example story arc:

1. "A normal Tuesday does not feel expensive."
2. "But small invisible leaks add up: AC, traffic, food waste, delivery, idle appliances."
3. "In one month, those leaks can become Rs 1,500+, hours lost, and a heavier footprint."
4. "Karma turns that into simple actions that fit your life."

### Story Rules

- Make the problem personal, local, and concrete.
- Use Indian examples: AC usage, ceiling fans, metro/auto/bike/cab, UPI-like spending mental models, LPG/cooking, food delivery, monsoon/heatwave context, local electricity costs.
- Use text sparingly. Every line should earn its place.
- Prefer "hidden waste" and "life optimization" over "environmental responsibility."
- Do not moralize, shame, or preach.

### Copywriting Voice

Voice should be:

- Sharp.
- Human.
- Calm.
- Premium.
- Slightly aspirational.
- Useful before inspirational.

Avoid:

- "Eco-friendly"
- "Go green"
- "Save Mother Earth"
- "Be a climate warrior"
- "Your planet needs you"
- Generic motivational quotes

Use:

- "Your hidden waste"
- "This week's leak"
- "Small fix, visible saving"
- "Comfort without the extra bill"
- "Cleaner habits, lower waste"
- "Your lifestyle, recalibrated"

---

## 4. Behavioral Design

### Self-Interest First

Every carbon insight must be translated into at least one personal benefit:

- Money saved.
- Time saved.
- Health improvement.
- Comfort improvement.
- Convenience improvement.
- Status/social shareability.
- Family benefit.

Carbon-only metrics are not allowed unless paired with human meaning.

### Data Translation Matrix

Electricity:

- Show monthly bill impact in rupees.
- Show appliance-specific waste.
- Show comfort-preserving alternatives.
- Example: "Set AC to 24 C and fan to medium: similar comfort, lower compressor load."

Transport:

- Show fuel/cab cost, traffic time, and air-quality relevance.
- Compare realistic options: bike, metro, walk, carpool, cab, auto.
- Avoid unrealistic suggestions that sacrifice safety or comfort.

Food:

- Show grocery cost, food waste, delivery frequency, and simple swaps.
- Avoid diet-shaming.
- Suggest practical Indian meals and portion planning.

Shopping:

- Show impulse purchase patterns, delivery packaging, and cost.
- Suggest delay, repair, reuse, bulk ordering, or local purchase.

Waste:

- Show household clutter, money loss, and easy segregation.
- Keep instructions simple enough for apartment living.

### Reward System

Do not use generic badges as the main reward.

Use rewards that feel valuable:

- Unlock premium-looking insight cards.
- Reveal weekly "hidden waste reports."
- Generate shareable impact cards.
- Show savings streaks tied to money or time.
- Let the interface visually improve as habits improve.
- Offer practical challenges like "3-day AC leak reset" or "Rs 300 transport save week."

Achievements can exist only if they feel mature, useful, and beautifully designed.

### Retention Loop

The weekly loop:

1. Capture quick inputs with minimal friction.
2. Translate habits into cost, comfort, and carbon.
3. Reveal one surprising personal insight.
4. Recommend 1-3 realistic actions.
5. Let the user choose a tiny commitment.
6. Track completion.
7. Show a satisfying weekly recap.
8. Unlock a shareable card or next insight.

---

## 5. Core Product Requirements

The working app should include these capabilities unless the user explicitly scopes smaller.

### Required Screens

1. Story-led onboarding
   - Introduces the problem emotionally and locally.
   - Collects minimal profile data: city, commute type, household size, AC usage, diet pattern, energy concern, primary motivation.
   - Must end with a real baseline and the user's first recommended action.

2. Personal dashboard
   - Shows the user's footprint, but framed through money, time, comfort, and waste.
   - Includes daily/weekly status.
   - Avoids generic charts as the only value.
   - Must include a "biggest leak", a quick log control, and an active action.

3. Habit input / tracker
   - Allows fast tracking for transport, electricity, food, shopping, and waste.
   - Must be mobile-friendly and not form-heavy.
   - Must update the dashboard or plan visibly.

4. AI insight coach
   - Generates personalized insights.
   - Explains "why this matters" in plain language.
   - Gives small, realistic actions.
   - Must never be the only source of value. The app must still work with deterministic fallback insights.

5. Action plan
   - 1-3 simple recommended actions at a time.
   - Each action must include effort, estimated saving, carbon impact, and reason.
   - Must allow the user to start, complete, or dismiss an action.

6. Progress / recap
   - Weekly story of improvement.
   - Savings, avoided waste, and completed actions.
   - Shareable visual card.
   - Must compare against baseline or previous period.

### Optional High-Impact Features

Implement if time allows:

- City-specific emission assumptions.
- Electricity bill estimator.
- Commute comparison tool.
- Family mode.
- "What changed this week?" AI summary.
- Impact cards for LinkedIn/Instagram.
- Offline-friendly local storage.
- Dark/light premium theme.

---

## 6. AI Prompt Architecture

The AI layer must be reliable, structured, and explainable. Do not write vague prompts like "give eco tips."

### AI Role

The AI is a personal resource coach for Indian households.

It must:

- Convert lifestyle data into personalized insights.
- Avoid guilt and moralizing.
- Prioritize practical actions.
- Explain tradeoffs clearly.
- Use localized context.
- Return structured data that the UI can render safely.

### Prompt Quality Rules

Every AI prompt must include:

- Role: What expert perspective the model should take.
- User context: Location, household, commute, habits, motivation.
- Task: The exact output needed.
- Constraints: Tone, length, realism, safety, no guilt.
- Output schema: JSON or clearly structured sections.
- Ranking logic: Why some actions are prioritized.
- Uncertainty handling: State when an estimate is approximate.
- Guardrails: Do not invent precise numbers without assumptions.

### Required System Prompt Pattern

Use this structure for any AI insight generation:

```text
You are Karma Coach, a practical lifestyle waste and carbon intelligence assistant for Indian users.

Your job is to help the user reduce hidden waste in money, energy, transport, food, and shopping while also reducing carbon impact.

Rules:
- Lead with personal relevance: money, time, comfort, health, or convenience.
- Never shame, guilt, preach, or use generic climate slogans.
- Use simple Indian English.
- Prefer actions that take less than 10 minutes or require no major purchase.
- Do not invent exact savings. If data is incomplete, give estimates with assumptions.
- Every recommendation must include: reason, effort, estimated benefit, carbon relevance, and a next step.
- Avoid unsafe suggestions. Do not recommend walking/cycling in unsafe conditions, skipping meals, or reducing necessary comfort during heatwaves.
- Return valid JSON only.
```

### Required User Prompt Pattern

```text
User profile:
- City: {{city}}
- Household size: {{householdSize}}
- Monthly electricity bill: {{electricityBill}}
- AC usage: {{acUsage}}
- Main commute: {{commuteMode}}
- Weekly commute distance: {{commuteDistance}}
- Food pattern: {{foodPattern}}
- Delivery frequency: {{deliveryFrequency}}
- Main motivation: {{motivation}}

Recent activity:
{{recentActivity}}

Task:
Create a personalized weekly insight report with:
1. one sharp headline
2. one surprising observation
3. three ranked actions
4. one emotional but non-preachy closing line
5. approximate carbon impact
6. approximate personal benefit

Return JSON matching the schema exactly.
```

### Required JSON Shape

```json
{
  "headline": "string",
  "summary": "string",
  "primaryMetric": {
    "label": "string",
    "value": "string",
    "context": "string"
  },
  "surprisingObservation": "string",
  "actions": [
    {
      "title": "string",
      "whyItMatters": "string",
      "nextStep": "string",
      "effort": "low | medium | high",
      "estimatedPersonalBenefit": "string",
      "estimatedCarbonImpact": "string",
      "confidence": "low | medium | high"
    }
  ],
  "shareCardText": "string",
  "assumptions": ["string"]
}
```

### Prompt Architecture Scoring Notes

To maximize prompt architecture score:

- Keep prompts versioned in a dedicated module or file.
- Use typed schemas for AI outputs.
- Validate AI responses before rendering.
- Provide fallback content if AI fails.
- Separate system prompts, user prompts, schemas, and UI rendering.
- Include comments explaining prompt design choices.
- Never allow raw AI text to break the UI.

---

## 7. UI/UX Design Direction

The UI must look premium, restrained, and intentionally designed.

### Visual Identity

Do not use cliche environmental design:

- No bright green theme.
- No cartoon leaves.
- No globe mascots.
- No generic recycling illustrations.
- No stock-looking hero sections.
- No childish gamification.

Use a premium consumer-finance / fitness / lifestyle intelligence aesthetic:

- Dark mode first, with excellent contrast.
- Off-white and charcoal surfaces.
- Muted accents: sage, graphite, electric blue, amber, soft coral.
- Clean typography.
- Dense but breathable layouts.
- Bento-style information architecture only when it improves scanning.
- Sophisticated motion and subtle depth.

### Suggested Palette

- Background: `#0B0F14`
- Surface: `#111827`
- Elevated surface: `#18212F`
- Text primary: `#F8FAFC`
- Text secondary: `#94A3B8`
- Border: `rgba(148, 163, 184, 0.18)`
- Sage accent: `#9CAF88`
- Blue accent: `#60A5FA`
- Amber accent: `#F6C85F`
- Coral accent: `#F9736A`
- Success: `#34D399`

Use color with discipline. The app must not become a one-color green interface.

### Layout Rules

- Mobile-first.
- The first viewport must immediately communicate the product value.
- Do not create a marketing landing page unless explicitly asked.
- Build the usable product as the primary experience.
- Include real app navigation. A beautiful single-screen concept is not enough.
- Avoid walls of text.
- Use progressive disclosure.
- Use compact, tappable controls.
- Use icons from Lucide React when available.
- Avoid nested cards.
- Use stable dimensions to prevent layout shift.
- Ensure all text fits on mobile.

### Interaction Rules

- Use sliders, toggles, segmented controls, and quick chips instead of long forms.
- Use motion to clarify state changes, not to decorate randomly.
- Buttons should feel tactile.
- Loading states must be skeletons or polished progress states.
- Empty states must be useful and emotionally intelligent.
- Error states must be calm and recoverable.

### Data Visualization

Charts must explain, not decorate.

Use:

- Weekly trend lines.
- Before/after comparisons.
- Cost breakdowns.
- Category contribution bars.
- Story-style recap cards.

Avoid:

- Generic pie charts unless absolutely useful.
- Carbon numbers without context.
- Dense analytics dashboards.

---

## 8. Engineering Standards

### Next.js Warning

This project may use a newer or changed version of Next.js.

Before writing Next.js code:

1. Read the relevant guide in `node_modules/next/dist/docs/`.
2. Follow the local project conventions.
3. Heed deprecation notices.
4. Do not assume older Next.js APIs or file structure from memory.

### Code Quality

Write production-quality code:

- TypeScript-first when available.
- Modular components.
- Clear separation of UI, state, calculations, and AI logic.
- Reusable hooks for derived data.
- Typed constants for emission factors and assumptions.
- No duplicate business logic across components.
- No unhandled promise rejections.
- No raw unvalidated AI rendering.
- No console noise in production code.
- No unrelated refactors.

### Reliability

The app must be resilient:

- Graceful fallback if AI is unavailable.
- Local mock data for demo reliability.
- Local storage persistence for profile, logs, selected actions, and progress unless a backend is explicitly implemented.
- Loading, error, empty, and success states.
- Input validation.
- Safe defaults for missing profile data.
- Deterministic calculations where possible.
- Clear assumptions for estimates.

### Performance

- Keep the app fast on mid-range phones.
- Avoid heavy libraries unless they provide real value.
- Use lazy loading for non-critical visuals.
- Keep animations smooth and restrained.
- Avoid layout shift.

### Accessibility

- Keyboard-accessible controls.
- Proper labels for inputs.
- Strong contrast.
- Visible focus states.
- No information conveyed only by color.
- Respect reduced-motion preferences.

### Testing / Verification

Before considering work complete:

- Run lint/typecheck/build where available.
- Manually verify mobile and desktop layouts.
- Check onboarding, dashboard, tracking, AI insight, and recap flows.
- Confirm fallback states work.
- Confirm the app does not look like a generic eco template.

---

## 9. Carbon and Calculation Integrity

Estimates must be honest.

### Calculation Rules

- Store emission factors in one clear module.
- Mark assumptions visibly when needed.
- Prefer ranges or confidence labels when data is incomplete.
- Do not claim exact precision for rough estimates.
- Keep units consistent.
- Always translate kg CO2e into relatable context.

### Example Equivalents

Use equivalents carefully and avoid overclaiming:

- Monthly rupee estimate.
- Kilometers driven equivalent.
- Hours of AC/fan usage equivalent.
- Number of meals or delivery orders adjusted.
- Weekly household waste avoided.

### Data Safety

Do not ask for sensitive data unless necessary.

Avoid:

- Exact address.
- Bank details.
- Private identity documents.
- Unnecessary personal information.

Use local storage or demo-safe persistence unless a backend is explicitly required.

---

## 10. Feature Decision Framework

When deciding what to build next, prioritize in this order:

1. Does it make the challenge solution clearer?
2. Does it make the user care personally?
3. Does it create a working, demoable flow?
4. Does it improve personalization?
5. Does it improve visual polish?
6. Does it improve retention?
7. Does it reduce risk or bugs?

Do not spend time on features that look impressive but do not improve the core loop.

---

## 11. Quality Gate Before Every Major Output

Before generating or editing code, internally verify:

- Relevance: Does this directly help users understand, track, or reduce footprint?
- Product clarity: Would a first-time user understand what this app does within 10 seconds?
- Coherence: Does the feature connect to the core loop of understand, profile, track, diagnose, act, improve, return?
- Human motivation: Is the benefit framed around money, time, health, comfort, or status?
- Story: Does the experience make the problem feel real?
- Practicality: Can a normal Indian user actually do the recommended actions?
- UI: Does this avoid generic eco visuals and look premium?
- AI: Are prompts structured, constrained, typed, and safe?
- Engineering: Is the code modular, resilient, and testable?
- Accessibility: Can users navigate and understand it easily?
- Demo reliability: Will it work even if AI/network calls fail?

If any answer is weak, improve the design before proceeding.

---

## 12. Done Definition

A feature is done only when:

- It works end to end.
- It feels like a real app, not a static concept.
- It has clear navigation and a complete user journey.
- User actions visibly change the product state.
- It has responsive UI.
- It has loading, empty, and error states where relevant.
- It uses realistic local copy.
- It avoids guilt-based climate messaging.
- It translates carbon into personal meaning.
- It is safe to demo.
- It passes available checks.

The final product should feel like something a person might actually open again next week, not just a hackathon carbon calculator.
