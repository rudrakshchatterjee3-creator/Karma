import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Smart carbon estimator for free-text activity descriptions.
 *
 * Design goals:
 * - Parse quantity signals (distance in km, hours, count) from the text
 * - Use realistic CO2e emission factors (kg CO2e per unit)
 * - Return carbon (kg CO2e), points (integer), category, and a human-readable note
 * - Never return 0 for a recognized activity — always estimate with stated assumptions
 * - Fall back gracefully to soft estimates with lower confidence
 */

// ── Emission factors ───────────────────────────────────────────────────────────
// Source: IPCC AR6, IEA 2024, ECOINVENT averages
const EF = {
  // Transport (kg CO2e per km)
  petrol_bike:   0.089,  // 100cc-150cc petrol motorcycle
  petrol_bike_high: 0.115, // aggressive/fast riding (+30% fuel)
  e20_bike:      0.072,  // 20% ethanol blend reduces CO2 ~10-15%
  car_petrol:    0.192,
  car_diesel:    0.171,
  cab_taxi:      0.210,  // cab includes deadhead + AC
  auto:          0.096,  // CNG auto
  metro:         0.025,  // Indian metro grid mix
  bus:           0.055,
  walk:          0.000,
  cycle:         0.000,
  flight_short:  0.255,  // per km, short-haul
  flight_long:   0.195,  // per km, long-haul (per person)

  // Energy (kg CO2e per hour)
  ac_ton_hour:   0.82,   // 1-ton AC, Indian grid (0.82 kg/kWh * ~1kW)
  fan_hour:      0.034,  // 75W fan
  heater_hour:   0.95,   // 1kW room heater
  tv_hour:       0.058,
  laptop_hour:   0.022,
  washing_cycle: 0.45,   // one wash cycle

  // Food (kg CO2e per item)
  beef_meal:     6.5,
  chicken_meal:  2.1,
  fish_meal:     1.4,
  veg_meal:      0.8,
  delivery_order:1.4,    // food + packaging + rider
  waste_meal:    1.1,    // wasted food upstream emissions

  // Shopping
  clothing_item: 10.0,
  electronics_small: 15.0,

  // Waste
  compost_kg:    -0.5,   // avoided methane
  recycle_kg:    -0.3,
};

// Points ≈ ±1 point per 0.01 kg CO2e impact (scaled)
function toPoints(carbonKg: number): number {
  return Math.round(carbonKg * -100); // negative carbon = positive points
}

// Extract the first number found in text
function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const n = parseFloat(m[1]);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

const KM_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*km/i,
  /(\d+(?:\.\d+)?)\s*kilo/i,
  /(\d+(?:\.\d+)?)\s*k\b/i,
];

const HOUR_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*hr/i,
  /(\d+(?:\.\d+)?)\s*hour/i,
  /(\d+(?:\.\d+)?)\s*h\b/i,
  /for\s+(\d+(?:\.\d+)?)/i,
];

const SPEED_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*km\s*(?:per\s*hour|\/\s*hr?|ph|kmph)/i,
  /at\s+(\d+(?:\.\d+)?)/i,
];

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
- Air Conditioner (AC): Baseline is 0.82 kg CO2e/hour per ton (for a standard non-inverter at 24°C).
  Modifiers (apply cumulatively):
  - Inverter AC: Multiply final emissions by 0.70 (-30%)
  - 5-Star AC: Multiply final emissions by 0.80 (-20%)
  - 3-Star AC: Multiply final emissions by 0.90 (-10%)
  - Tonnage: Multiply by exact tonnage (e.g., 1.5 ton = 1.5x)
  - Temperature: For every 1°C ABOVE 24°C, emissions decrease. Multiply by 0.94 for each degree. (e.g. 26°C is 2 degrees higher = 0.94 * 0.94 = ~0.88x)
  - Temperature: For every 1°C BELOW 24°C, emissions increase. Multiply by 1.06 for each degree.
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
   - If the user specifies a REDUCTION, SUBSTITUTION, or REPLACEMENT comparison (e.g. "used X instead of Y", "ate 200g of chicken instead of 300g", "took metro instead of auto", "ordered veg instead of chicken"), you MUST calculate the NET DELTA = (Actual Emissions - Baseline/Replaced Emissions).
     If the actual emissions are LESS than what they would have emitted in the baseline, this net delta will be NEGATIVE.
     For example: "ate 200g of chicken instead of 300g" -> Actual 200g chicken (approx 1.4 kg) minus Baseline 300g chicken (approx 2.1 kg) = -0.7 kg CO2e.
     For example: "took metro instead of auto for 10km" -> Actual metro (0.25 kg) minus Baseline auto (0.96 kg) = -0.71 kg CO2e.
     SPECIAL CASE FOR AC TEMPERATURE: Higher temperatures use LESS energy (saves ~6% per degree). "Used AC at 27C instead of 24C" -> Actual 27C uses LESS energy than Baseline 24C, so the carbon delta is NEGATIVE.
     If actual emissions are less than baseline/replaced, the final "carbon" value MUST be NEGATIVE, and "points" must be POSITIVE.
     If actual emissions are higher than baseline, the final "carbon" value MUST be POSITIVE, and "points" must be NEGATIVE.
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
    const { actionText, category: hintCategory } = body as { actionText?: string; category?: string };

    if (!actionText || typeof actionText !== 'string') {
      return NextResponse.json({ error: 'actionText is required' }, { status: 400 });
    }

    // 1. Try server-side NVIDIA NIM query if key exists
    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey) {
      try {
        const nimRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: actionText },
            ],
            temperature: 0.0,
            max_tokens: 400,
          }),
        });

        if (nimRes.ok) {
          const data = await nimRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = parseJSONBlock(content);
            const carbonRounded = parseFloat(parsed.carbon.toFixed(2));
            const points = typeof parsed.points === 'number' ? parsed.points : Math.round(carbonRounded * -100);

            return NextResponse.json({
              carbon: carbonRounded,
              points,
              category: parsed.category,
              note: parsed.note,
              confidence: parsed.confidence,
              assumptions: parsed.assumptions,
              // Legacy fields
              type: carbonRounded < 0 ? 'lightness' : 'friction',
              frictionDelta: parseFloat((carbonRounded / 10).toFixed(3)),
              moneyDelta: Math.round(Math.abs(points) * 1.2),
              summary: parsed.note,
              sourceEngine: "nvidia_nim"
            });
          }
        } else {
          const errText = await nimRes.text();
          console.error(`NVIDIA NIM responded with error status ${nimRes.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Backend NVIDIA NIM query failed, falling back to deterministic parser:", err);
      }
    }

    const t = actionText.toLowerCase();

    let carbonKg = 0;
    let detectedCategory: string = hintCategory ?? 'transport';
    let note = '';
    let confidence: 'low' | 'medium' | 'high' = 'low';
    const assumptions: string[] = [];

    // ── TRANSPORT ─────────────────────────────────────────────────────────────
    const isBike = /\b(bike|motorcycle|motorbike|scooty|scooter|moto|splendor|activa|bullet|pulsar|vespa)\b/.test(t);
    const isCar  = /\b(car|suv|sedan|hatchback|drove|drive|driving|jeep|innova|swift|creta|nexon|thar)\b/.test(t);
    const isCab  = /\b(cab|taxi|ola|uber|rapido|auto|rickshaw|tuk.?tuk)\b/.test(t);
    const isMetro= /\b(metro|train|local train|subway|rail|railway|tram)\b/.test(t);
    const isBus  = /\b(bus|shuttle|minibus|volvo|coach)\b/.test(t);
    const isFlight=/\b(flight|flew|fly|airplane|plane|airport|airline|indigo|air india|vistara|spicejet)\b/.test(t);
    const isWalk = /\b(walk|walked|walking|stroll|run|running|jog|jogging|hike|hiking)\b/.test(t);
    const isCycle= /\b(cycle|bicycle|cycling|e-bike|ebike|pedal)\b/.test(t);
    
    // ── Fuel type modifiers ───────────────────────────────────────────────────
    const isE20   = /\b(e20|ethanol|flex.?fuel)\b/.test(t);
    const isEV    = /\b(ev|electric|e-(?:bike|car|scooter)|tesla|ather|ola s1|nexon ev)\b/.test(t);
    const isFast  = /\b(fast|race|100\s*(?:kmph|kph)|high.?speed|speeding)\b/.test(t);

    const isTransport = isBike || isCar || isCab || isMetro || isBus || isFlight || isWalk || isCycle || isEV;

    // ── ENERGY ────────────────────────────────────────────────────────────────
    const isAC    = /\b(ac|air.?con(?:ditioner)?|cooling|split ac|window ac|hvac)\b/.test(t);
    const isFan   = /\b(fan|ceiling fan|pedestal fan|table fan|exhaust fan)\b/.test(t);
    const isHeater= /\b(heater|heating|room heat|geyser|water heater|boiler)\b/.test(t);
    const isTV    = /\b(tv|television|screen|monitor|projector|led tv|smart tv)\b/.test(t);
    const isLaptop= /\b(laptop|computer|pc|macbook|ipad|tablet|desktop|gaming pc|playstation|ps4|ps5|xbox|console)\b/.test(t);
    const isWash  = /\b(washing machine|wash(?:ed)? clothes|laundry|dryer|dishwasher)\b/.test(t);
    const isLight = /\b(light|bulb|lamp|led|tube.?light|cfl)\b/.test(t);
    const isKitchenAppliance = /\b(microwave|oven|induction|stove|fridge|refrigerator|mixer|grinder|blender|air.?fryer|kettle|coffee maker)\b/.test(t);
    const isEnergy= isAC || isFan || isHeater || isTV || isLaptop || isWash || isLight || isKitchenAppliance;

    // ── FOOD ──────────────────────────────────────────────────────────────────
    const isBeef  = /\b(beef|burger|steak|mutton|lamb|red meat|pork|bacon|ham|sausage)\b/.test(t);
    const isChicken=/\b(chicken|poultry|turkey|nuggets|wings)\b/.test(t);
    const isFish  = /\b(fish|seafood|prawn|shrimp|crab|lobster|sushi|salmon|tuna)\b/.test(t);
    const isDairy = /\b(cheese|milk|butter|paneer|yogurt|curd|ice.?cream)\b/.test(t);
    const isVeg   = /\b(veg(?:an)?|vegetarian|salad|daal|dal|lentil|tofu|plant|rice|roti|bread|fruit|apple|banana|vegetable|potato|tomato|onion)\b/.test(t);
    const isDelivery=/\b(order(?:ed)?|deliver(?:y|ed)?|swiggy|zomato|takeout|takeaway|blinkit|zepto|instamart)\b/.test(t);
    const isFoodWaste=/\b(wast(?:ed?|e)|threw|throw|trash|leftover|rott|expired|spoiled|garbage|bin)\b/.test(t);
    const isFood  = isBeef || isChicken || isFish || isDairy || isVeg || isDelivery || isFoodWaste;

    // ── SHOPPING ──────────────────────────────────────────────────────────────
    const isShopping=/\b(bought|buy|purchase|cloth(?:es|ing)?|shirt|shoe|appli(?:ance)?|gadget|phone|tv|amazon|flipkart|myntra|zara|h&m|ikea|furniture|toy|book|cosmetic|makeup)\b/.test(t);

    // ── WASTE / GOOD HABITS ───────────────────────────────────────────────────
    const isCompost= /\b(compost(?:ed)?|organic waste)\b/.test(t);
    const isRecycle= /\b(recycl(?:ed)?|segregat(?:ed)?|sorted|dry waste|wet waste|scrap)\b/.test(t);
    const isReuse  = /\b(reusabl|reuse[d]?|bottle|refill|upcycle|mend|repair|fix|second.?hand|thrift)\b/.test(t);
    
    // Check if the input is purely unclassified/gibberish
    const hasAnyRecognizedContext = isTransport || isEnergy || isFood || isShopping || isCompost || isRecycle || isReuse;

    // ── CALCULATION ───────────────────────────────────────────────────────────

    if (hasAnyRecognizedContext) {
      if (isTransport) {
        detectedCategory = 'transport';
        const km = extractNumber(t, KM_PATTERNS);

        if (isFlight) {
          const dist = km ?? 500; // assume 500km if unspecified
          carbonKg = dist * EF.flight_short;
          note = `Flight of ~${dist} km estimated at ${EF.flight_short} kg CO2e/km.`;
          confidence = km ? 'high' : 'medium';
          if (!km) assumptions.push('Distance assumed 500 km — update for accuracy.');
        } else if (isEV) {
          carbonKg = -0.5;
          note = 'Electric vehicle — near-zero tailpipe emissions on Indian grid mix.';
          confidence = 'high';
          assumptions.push(`Saving vs. equivalent petrol car trip of ~${km ?? 3} km.`);
        } else if (isBike) {
          const dist = km ?? 10;
          let ef = EF.petrol_bike;
          if (isE20) { ef = EF.e20_bike; assumptions.push('E20 fuel blend reduces CO2 ~10% vs pure petrol.'); }
          if (isFast) { ef = EF.petrol_bike_high; assumptions.push('High-speed riding increases fuel burn ~25%.'); }
          carbonKg = dist * ef;
          note = `${dist} km on bike (${isE20 ? 'E20' : 'petrol'}${isFast ? ', high-speed' : ''}): ${ef} kg CO2e/km.`;
          confidence = km ? 'high' : 'medium';
          if (!km) assumptions.push('Distance assumed 10 km — mention "X km" for better accuracy.');
        } else if (isCar) {
          const dist = km ?? 15;
          carbonKg = dist * EF.car_petrol;
          note = `${dist} km by car: ${EF.car_petrol} kg CO2e/km (petrol).`;
          confidence = km ? 'high' : 'medium';
          if (!km) assumptions.push('Distance assumed 15 km — mention "X km" for better accuracy.');
        } else if (isWalk || isCycle) {
          carbonKg = 0;
          note = 'Walking or cycling produces zero direct emissions. Well done.';
          confidence = 'high';
          carbonKg = -(km ?? 3) * 0.03; // relative saving vs car
          assumptions.push(`Saving vs. equivalent petrol car trip of ~${km ?? 3} km.`);
        } else if (isCab) {
          const dist = km ?? 10;
          const ef = t.includes('auto') ? EF.auto : EF.cab_taxi;
          carbonKg = dist * ef;
          note = `${dist} km by ${t.includes('auto') ? 'auto' : 'cab'}: ${ef} kg CO2e/km.`;
          confidence = km ? 'high' : 'medium';
          if (!km) assumptions.push('Distance assumed 10 km — mention "X km" for better accuracy.');
        } else if (isMetro) {
          const dist = km ?? 10;
          carbonKg = -(dist * (EF.car_petrol - EF.metro)); // saving vs driving
          note = `Metro for ${dist} km saves ~${Math.abs(carbonKg).toFixed(2)} kg CO2e vs driving.`;
          confidence = km ? 'high' : 'medium';
          if (!km) assumptions.push('Distance assumed 10 km.');
        } else if (isBus) {
          const dist = km ?? 10;
          carbonKg = dist * EF.bus;
          note = `${dist} km by bus: ${EF.bus} kg CO2e/km.`;
          confidence = km ? 'medium' : 'low';
          if (!km) assumptions.push('Distance assumed 10 km.');
        }

      } else if (isEnergy) {
        detectedCategory = 'energy';
        const hrs = extractNumber(t, HOUR_PATTERNS) ?? 2;

        if (isAC) {
          const tons = t.match(/(\d+(?:\.\d+)?)\s*ton/) ? parseFloat(t.match(/(\d+(?:\.\d+)?)\s*ton/)![1]) : 1;
          carbonKg = hrs * EF.ac_ton_hour * tons;
          note = `AC (${tons}-ton) for ${hrs} hours: ${EF.ac_ton_hour} kg CO2e/hr × Indian grid.`;
          confidence = 'high';
        } else if (isHeater) {
          carbonKg = hrs * EF.heater_hour;
          note = `Heater/Geyser for ${hrs} hours: ${EF.heater_hour} kg CO2e/hr.`;
          confidence = 'high';
        } else if (isKitchenAppliance) {
          carbonKg = hrs * 1.2; // approx 1.2 kg per hour for heavy kitchen appliances
          note = `Kitchen appliance for ${hrs} hours: ~1.2 kg CO2e/hr.`;
          confidence = 'medium';
        } else if (isWash) {
          const cycles = extractNumber(t, [/(\d+)\s*(load|cycle|wash)/i]) ?? 1;
          carbonKg = cycles * EF.washing_cycle;
          note = `${cycles} wash cycle(s): ${EF.washing_cycle} kg CO2e each.`;
          confidence = 'medium';
        } else if (isTV) {
          carbonKg = hrs * EF.tv_hour;
          note = `TV/Screen for ${hrs} hours: ${EF.tv_hour} kg CO2e/hr.`;
          confidence = 'medium';
        } else if (isLaptop) {
          carbonKg = hrs * EF.laptop_hour;
          note = `Device for ${hrs} hours: ${EF.laptop_hour} kg CO2e/hr.`;
          confidence = 'medium';
        } else if (isFan) {
          carbonKg = hrs * EF.fan_hour;
          note = `Fan for ${hrs} hours: ${EF.fan_hour} kg CO2e/hr.`;
          confidence = 'high';
        } else if (isLight) {
          carbonKg = hrs * 0.01;
          note = `Lighting for ${hrs} hours: ~0.01 kg CO2e/hr.`;
          confidence = 'high';
        }

        if (t.includes('off') || t.includes('unplugged') || t.includes('saved')) {
          carbonKg = -Math.abs(carbonKg);
          note = 'Turning off / saving — converted to avoided emissions.';
        }

      } else if (isFood) {
        detectedCategory = 'food';
        const meals = extractNumber(t, [/(\d+)\s*meal/i, /(\d+)\s*order/i, /(\d+)\s*plate/i, /(\d+)\s*item/i]) ?? 1;

        if (isBeef) {
          carbonKg = meals * EF.beef_meal;
          note = `${meals} heavy meat/beef meal(s): ${EF.beef_meal} kg CO2e each.`;
          confidence = 'high';
        } else if (isChicken) {
          carbonKg = meals * EF.chicken_meal;
          note = `${meals} poultry meal(s): ${EF.chicken_meal} kg CO2e each.`;
          confidence = 'high';
        } else if (isDairy) {
          carbonKg = meals * 1.5; // approx 1.5kg for heavy dairy
          note = `${meals} dairy-heavy meal(s): ~1.5 kg CO2e each.`;
          confidence = 'medium';
        } else if (isFish) {
          carbonKg = meals * EF.fish_meal;
          note = `${meals} seafood meal(s): ${EF.fish_meal} kg CO2e each.`;
          confidence = 'medium';
        } else if (isVeg) {
          carbonKg = -(meals * (EF.chicken_meal - EF.veg_meal)); // saving vs meat
          note = `${meals} plant-based meal(s): saves ${(EF.chicken_meal - EF.veg_meal).toFixed(1)} kg CO2e vs chicken.`;
          confidence = 'high';
        } else if (isDelivery) {
          carbonKg = meals * EF.delivery_order;
          note = `${meals} food delivery order(s): ${EF.delivery_order} kg CO2e each (packaging + rider).`;
          confidence = 'medium';
        } else if (isFoodWaste) {
          carbonKg = meals * EF.waste_meal;
          note = `${meals} wasted meal(s): ${EF.waste_meal} kg CO2e each (upstream emissions lost).`;
          confidence = 'medium';
        }

      } else if (isShopping) {
        detectedCategory = 'shopping';
        const items = extractNumber(t, [/(\d+)\s*item/i, /(\d+)\s*piece/i, /(\d+)\s*pair/i]) ?? 1;
        
        let avgEF = EF.clothing_item;
        if (/\b(phone|gadget|tv|appliance|laptop)\b/.test(t)) {
          avgEF = EF.electronics_small;
        } else if (/\b(furniture|sofa|bed)\b/.test(t)) {
          avgEF = 40.0;
        }

        carbonKg = items * avgEF;
        note = `${items} shopping item(s): ~${avgEF} kg CO2e each.`;
        confidence = 'low';
        assumptions.push(`Carbon estimate is averaged for this item type.`);

      } else if (isCompost || isRecycle || isReuse) {
        detectedCategory = 'waste';
        if (isCompost) {
          carbonKg = -0.5;
          note = 'Composting avoids ~0.5 kg CO2e of methane emissions per session.';
          confidence = 'medium';
        } else if (isRecycle) {
          carbonKg = -0.3;
          note = 'Waste segregation enables recycling — estimated 0.3 kg CO2e avoided.';
          confidence = 'medium';
        } else {
          carbonKg = -0.2;
          note = 'Reusable/Repaired item avoids new production. Estimated 0.2 kg CO2e saved.';
          confidence = 'medium';
        }
      }
    } else {
      // ── ZERO-IMPACT FALLBACK ────────────────────────────────────────────────
      // Triggers if no keywords match, e.g., "what is nvidia", random gibberish
      carbonKg = 0;
      note = 'No recognizable lifestyle action found. Please mention a specific activity (e.g. "drove 5km", "ran AC for 3 hours", "ordered chicken").';
      confidence = 'low';
      assumptions.push('Local engine fallback: Returned 0 impact to avoid false penalties on unrecognized text.');
    }

    // Round for display
    const carbonRounded = parseFloat(carbonKg.toFixed(2));
    const points = toPoints(carbonRounded);

    return NextResponse.json({
      carbon: carbonRounded,
      points,
      category: detectedCategory,
      note,
      confidence,
      assumptions,
      // Legacy fields kept for any existing UI that reads them
      type: carbonRounded < 0 ? 'lightness' : 'friction',
      frictionDelta: parseFloat((carbonRounded / 10).toFixed(3)),
      moneyDelta: Math.round(Math.abs(points) * 1.2),
      summary: note,
      sourceEngine: "physics_engine",
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}
