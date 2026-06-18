export interface AIAnalysisResult {
  carbon: number;
  points: number;
  category: "transport" | "energy" | "food" | "shopping" | "waste";
  note: string;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
}

const SYSTEM_PROMPT = `You are Karma Estimate AI, a precise carbon footprint analyzer for Indian lifestyles.
Your task is to parse a user's description of a daily activity and estimate its carbon footprint and points.

You MUST use these exact emission factors (EF) to calculate the carbon footprint (in kg CO2e):
- Petrol Bike / Scooter: 0.089 kg CO2e/km (high-speed/aggressive: 0.115, E20 fuel: 0.072)
- Petrol Car: 0.192 kg CO2e/km
- Diesel Car: 0.171 kg CO2e/km
- Cab / Taxi: 0.210 kg CO2e/km
- Auto-rickshaw (CNG): 0.096 kg CO2e/km
- Metro / Train: 0.025 kg CO2e/km
- Bus: 0.055 kg CO2e/km
- Flight: 0.255 kg CO2e/km (short-haul) or 0.195 kg CO2e/km (long-haul)
- Air Conditioner (AC): 0.82 kg CO2e/hour per ton
- Ceiling Fan: 0.034 kg CO2e/hour
- Room Heater: 0.95 kg CO2e/hour
- TV: 0.058 kg CO2e/hour
- Laptop/PC: 0.022 kg CO2e/hour
- Washing Machine: 0.45 kg CO2e/load
- Vegetarian/Vegan meal: 0.8 kg CO2e
- Chicken meal: 2.1 kg CO2e
- Mutton/Beef/Red Meat meal: 6.5 kg CO2e
- Food delivery order: 1.4 kg CO2e (packaging + delivery rider)
- Food waste: 1.1 kg CO2e/meal
- Shopping item (clothing average): 10.0 kg CO2e
- Composting: -0.5 kg CO2e (avoided methane)
- Recycling / Segregating waste: -0.3 kg CO2e
- Reusable item (bottle, cup, bag): -0.2 kg CO2e

Calculation Rules:
1. Identify the activity category: "transport", "energy", "food", "shopping", or "waste".
2. Extract quantities (distance in km, time in hours, count of items, etc.). If unspecified, use a reasonable default.
3. Multiply the quantity by the emission factor.
4. IMPORTANT:
   - If the user is SAVING energy (e.g. "turned off AC", "unplugged laptop") or performing a green action (composting, recycling, reusable item, walking/cycling), the carbon value should be NEGATIVE (representing avoided emissions).
   - If the user is CONSUMING or emitting (e.g. driving a car, running AC, ordering delivery, buying clothes, food waste), the carbon value should be POSITIVE.
5. Karma points = Math.round(carbon * -100). (i.e. positive points for savings/negative carbon, negative points for emissions/positive carbon).
6. Output a short 1-sentence note explaining the math.

You must return valid JSON matching this schema exactly, with NO other text:
{
  "carbon": number,
  "points": number,
  "category": "transport" | "energy" | "food" | "shopping" | "waste",
  "note": "string",
  "confidence": "high" | "medium" | "low",
  "assumptions": ["string"]
}

Example inputs and expected outputs:
- Input: "Rode petrol bike for 15 km" -> {"carbon": 1.34, "points": -134, "category": "transport", "note": "15 km on petrol bike at 0.089 kg CO2e/km.", "confidence": "high", "assumptions": ["Assumed standard speed and solo ride"]}
- Input: "Composted kitchen waste" -> {"carbon": -0.5, "points": 50, "category": "waste", "note": "Composting avoids methane emissions from landfill.", "confidence": "high", "assumptions": []}
- Input: "Turned off AC 2 hours early" -> {"carbon": -1.64, "points": 164, "category": "energy", "note": "Avoided 2 hours of AC usage (0.82 kg CO2e/hr).", "confidence": "high", "assumptions": ["Assumed 1-ton AC"]}
`;

export function parseJSONBlock(text: string): AIAnalysisResult {
  try {
    return JSON.parse(text) as AIAnalysisResult;
  } catch {
    // Try to extract JSON from markdown or raw text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
      } catch (e) {
        console.error("Failed to parse matched JSON block:", e);
      }
    }
    throw new Error("Could not parse JSON from model response: " + text);
  }
}

export async function queryNvidiaNim(
  apiKey: string,
  modelName: string,
  text: string
): Promise<AIAnalysisResult> {
  const model = modelName || "meta/llama-3.1-8b-instruct";
  
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA NIM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA NIM API");
  }

  return parseJSONBlock(content);
}
