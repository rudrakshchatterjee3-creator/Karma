import { NextResponse } from 'next/server';
import { type Profile, type LogEntry, createActions, totalsByCategory } from '@/utils/karmaLogic';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are Karma Coach, a practical, non-preachy lifestyle waste and carbon intelligence assistant for Indian households.

Your job is to write a personalized weekly diagnosis and suggest exactly 3 actionable next steps for the user based on their profile data and recent activity logs.

Rules:
1. Lead with personal relevance: money, time, comfort, health, convenience, and waste. Never shame, guilt, preach, or use generic climate slogans.
2. Address specific details logged by the user. For example, if they logged a "200 km diesel ride" or "ordered Swiggy deliveries", mention those specific behaviors and give tailored advice.
3. Suggest exactly 3 concrete, low-to-medium effort actions. Do not recommend massive lifestyle shifts. Keep them practical (e.g., carpool, metro swap, AC sleep timers, batch cooking).
4. For each action, calculate estimated carbon savings (in kg CO2e) and points (approximately 100 points per 1 kg CO2e saved).
5. Return ONLY a valid JSON block matching this schema exactly with NO other text:
{
  "headline": "string (A short, sharp 1-sentence personalized headline)",
  "summary": "string (A 2-3 sentence personalized lifestyle waste diagnosis based on their logs. Address their biggest leak, money cost, and comfort in plain Indian English.)",
  "actions": [
    {
      "id": "string (unique action ID, e.g. custom-diesel, custom-delivery)",
      "category": "transport" | "energy" | "food" | "shopping" | "waste",
      "title": "string (short actionable title under 8 words)",
      "why": "string (explanation of why it matters to their motivation, comfort, or wallet)",
      "step": "string (concrete first step to take this week)",
      "effort": "low" | "medium",
      "carbon": number,
      "points": number
    }
  ]
}
`;

function parseJSONBlock(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse matched JSON block:", e);
      }
    }
    throw new Error("Could not parse JSON from model response: " + text);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, logs } = body as { profile?: Profile; logs?: LogEntry[] };

    if (!profile || !logs) {
      return NextResponse.json({ error: 'profile and logs are required' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey) {
      try {
        const userPrompt = `User Profile:
- City: ${profile.city || 'your city'}, ${profile.country}
- Motivation: ${profile.motivation}
- Diet: ${profile.diet}
- AC Usage: ${profile.acHours} hrs/day
- Commute: ${profile.commuteKm} km/week by ${profile.commuteMode}
- Household Size: ${profile.household} people
- Monthly Electricity Bill: Rs. ${profile.bill}

Recent Activity Logs:
${logs.length === 0 ? '- No logs added yet.' : logs.map(l => `- [${l.category}] "${l.label}" | Carbon: ${l.carbon} kg, Points: ${l.points}, Note: ${l.note}`).join('\n')}

Task: Create a personalized weekly report and suggest 3 custom actions. Return JSON matching the schema.`;

        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseJSONBlock(content);
            return NextResponse.json({
              ...parsed,
              sourceEngine: "nvidia_nim"
            });
          }
        } else {
          const errText = await res.text();
          console.error(`NVIDIA NIM responded with error status ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error("AI Coach query failed, falling back to deterministic calculations:", err);
      }
    }

    // ── DETERMINISTIC LOCAL FALLBACK ──────────────────────────────────────────
    // If NIM key is not configured or queries fail, run the upgraded local fallback engine.
    const localActions = createActions(profile, logs).slice(0, 3);
    const topAction = localActions[0];
    
    const firstName = profile.name ? profile.name.split(" ")[0] : "Your";
    const location = profile.city || "your area";
    const motivateText = profile.motivation === "save" ? "cutting electricity bills and fuel waste" : "optimizing your daily comfort and carbon";

    const headline = `${firstName ? `${firstName}'s` : "Your"} ${location} routine has a clear priority this week.`;
    const summary = topAction 
      ? `We detected that optimizing your "${topAction.category}" habits is your best first move. We recommend starting with "${topAction.title}" because it matches your motivation of ${motivateText}.`
      : "Log a few choices in the Track tab and Karma Coach will analyze your biggest sources of lifestyle waste.";

    return NextResponse.json({
      headline,
      summary,
      actions: localActions.map(a => ({
        id: a.id,
        category: a.category,
        title: a.title,
        why: a.why,
        step: a.step,
        effort: a.effort,
        carbon: a.carbon,
        points: a.points
      })),
      sourceEngine: "physics_engine"
    });

  } catch (err) {
    console.error('Coach API error:', err);
    return NextResponse.json({ error: 'Failed to process AI coach' }, { status: 500 });
  }
}
