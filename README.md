# Karma

> **𝑴𝒐𝒔𝒕 𝒄𝒂𝒓𝒃𝒐𝒏 𝒕𝒓𝒂𝒄𝒌𝒆𝒓𝒔 𝒇𝒂𝒊𝒍 𝒃𝒆𝒄𝒂𝒖𝒔𝒆 𝒕𝒉𝒆𝒚 𝒃𝒖𝒊𝒍𝒅 𝒂 𝒅𝒂𝒕𝒂𝒃𝒂𝒔𝒆, 𝒏𝒐𝒕 𝒂 𝒑𝒓𝒐𝒅𝒖𝒄𝒕.**

Karma is a production-grade behavior engine built for the **PromptWars Virtual Hackathon by Hack2Skill and Google for Developers**. Instead of using environmental guilt and generic charts, Karma proves that reducing your carbon footprint is actually just a byproduct of saving your own money, comfort, and time.

🔗 **Production URL**: [karma-3jf.pages.dev](https://karma-3jf.pages.dev)

---

## 🚀 The Architecture

Karma was built with strict production standards, pushing the boundaries of edge compute and AI integration:

### 🧠 Prompt Architecture & AI Edge Engineering
Karma leverages **Google Gemini 3.1 Flash-Lite** as a strict computational reasoning engine deployed directly on the Cloudflare Edge runtime.
- **Strict JSON Typing**: Gemini is constrained by a robust System Prompt instructing it to map free-text logs into strict, deterministic JSON schemas.
- **Low Temperature (0.2)**: Maximizes structural consistency, prevents hallucinations, and ensures highly factual, conservative emission estimates based on real-world Indian grid-mix data.

### 🛡️ Zod Validation & Edge Security
Incoming edge payloads are aggressively sanitized using `zod` to guarantee perfect structural consistency and zero API crashes. We do not blindly trust AI outputs or client inputs.

### 🧪 Tested Offline Physics Fallback
If the Gemini API experiences network latency, Karma instantly falls back to a deterministic, zero-dependency local TypeScript physics engine. 
- The offline fallback is thoroughly tested with an automated **Vitest** suite to ensure mathematical integrity.

### ♿ Inclusive UI & Full-Stack Polish
- **Stack**: Next.js 14, Strict TypeScript, Tailwind CSS, and Framer Motion.
- **Auth**: Google OAuth via NextAuth, optimized to bypass strict Edge runtime limitations.
- **Accessibility**: 100% WCAG AA compliant with hidden `aria-live` screen-reader announcers for real-time AI generation states.
- **Aesthetic**: Premium dark-mode, fintech-inspired glassmorphism.

---

## 🎯 The Behavioral Hook

The AI doesn't preach. It dynamically analyzes your local city (e.g., Delhi, Mumbai) and isolates your highest-leverage "lifestyle leaks" (AC usage, commute modes, food delivery frequency), ranking them by immediate financial return. 

Instead of eco-fluff, it hits with real-world reality: 
> *"Running your AC at 18°C doesn't cool the room faster—it just burns money, grid power, and pushes heat into your neighborhood."*

---

## 🛠️ Local Development

Clone the repo and run the app locally:

```bash
# Install dependencies
npm install

# Run the Vitest test suite
npm run test

# Run the development server
npm run dev
```

Create a `.env.local` file with the following keys:
```env
GEMINI_API_KEY=your_google_gemini_key
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_secure_random_string
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_secret
```

---

*Built with Google Antigravity & Vibe Coding.*
