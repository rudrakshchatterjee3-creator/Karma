# Karma

**A personal waste and carbon intelligence app that turns daily choices into a weekly action plan.**

---

## 🌍 The Problem
A normal Tuesday doesn't feel expensive. But small, invisible leaks add up—running the AC too cold, taking an unnecessary cab, throwing away delivery packaging. In one month, those leaks can become thousands of rupees lost, hours wasted in traffic, and a heavier carbon footprint. 

Most carbon calculators lead with guilt: *"You emitted 12kg of CO2 today. Save the planet."*  
We believe that guilt doesn't scale. Self-interest does.

## 💡 The Solution
**Karma is not a generic carbon calculator.** It is a premium, India-first behavior-change product.

Karma helps you understand how daily choices affect your **money, comfort, health, time, and status**, then quietly connects those choices to carbon impact. By finding the hidden waste in your routine, Karma gives you simple, personalized ways to plug the leaks.

### How it works:
1. **Understand:** Read a short, cinematic story about hidden daily waste.
2. **Profile:** Set a realistic baseline footprint based on your city, commute, and habits.
3. **Track:** Fast, under-a-minute inputs for your transport, energy, food, and shopping choices.
4. **Diagnose:** The AI Coach identifies the biggest "leak" in your lifestyle and explains why it matters.
5. **Act:** Receive a small, practical action ranked by effort and personal benefit.
6. **Improve:** Watch your weekly progress as you save money, avoid waste, and cut carbon.

---

## ✨ Features
- **Dynamic Storytelling Onboarding:** A personalized setup flow that frames carbon impact around your primary motivation.
- **AI Coach & Analytics:** An intelligent server-side engine powered by NVIDIA NIM that parses free-form natural language logs (e.g. *"ate 200g of chicken instead of 300g"*) to calculate accurate avoided emissions and net deltas.
- **Live Footprint Map:** An interactive, animated constellation that visualizes where your footprint pressure is coming from.
- **Ranked Action Plan:** Suggests high-impact, low-effort lifestyle tweaks tailored exactly to your profile and tracked habits.
- **Premium Cinematic UI:** A meticulous dark-mode-first aesthetic with a beautifully engineered "loop of feedback" interface.

---

## 🛠 Tech Stack & Architecture
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (v4), Framer Motion for micro-animations
- **AI Engine:** LLaMA 3.1 8B Instruct (via NVIDIA NIM API) running securely on server-side Edge functions (`/api/analyze` and `/api/coach`).
- **Data Persistence:** Zero-dependency local-storage state management for instant loading and privacy, synced gracefully with backend compute.

---

## 🚀 Getting Started

### 1. Configure the Environment
To power the smart NLP analysis and AI Coach, you need an NVIDIA NIM API key. The frontend no longer requires users to paste their keys; everything is secured on the backend.

1. Get a free API key from [NVIDIA NIM build.nvidia.com](https://build.nvidia.com/).
2. Create a `.env.local` file in the root of your project:
```bash
NVIDIA_API_KEY="nvapi-your-key-here"
```
*(Note: If the API key is omitted, Karma automatically falls back to an upgraded deterministic local physics engine).*

### 2. Install and Run
Clone the repository and install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience Karma.

---

## 🧠 AI Integration Notes
Karma features a sophisticated hybrid analysis pipeline:
- **Net Delta Calculations:** When a user logs a substitution (e.g., swapping a cab for the metro), the AI explicitly calculates the `Actual Emissions - Baseline Emissions` yielding **avoided emissions** (negative carbon value) and positive karma points.
- **Graceful Degradation:** If the NVIDIA API is unreachable or rate-limited, the `/api/analyze` endpoint gracefully falls back to a deterministic regex-based local parser that maintains app functionality seamlessly.
