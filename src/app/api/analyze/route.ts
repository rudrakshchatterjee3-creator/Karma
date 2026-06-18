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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionText, category: hintCategory } = body as { actionText?: string; category?: string };

    if (!actionText || typeof actionText !== 'string') {
      return NextResponse.json({ error: 'actionText is required' }, { status: 400 });
    }

    const t = actionText.toLowerCase();

    let carbonKg = 0;
    let detectedCategory: string = hintCategory ?? 'transport';
    let note = '';
    let confidence: 'low' | 'medium' | 'high' = 'low';
    const assumptions: string[] = [];

    // ── TRANSPORT ─────────────────────────────────────────────────────────────
    const isBike = /\b(bike|motorcycle|motorbike|scooty|scooter|moto)\b/.test(t);
    const isCar  = /\b(car|suv|sedan|hatchback|drove|drive)\b/.test(t);
    const isCab  = /\b(cab|taxi|ola|uber|rapido|auto)\b/.test(t);
    const isMetro= /\b(metro|train|local train|subway|rail)\b/.test(t);
    const isBus  = /\b(bus|shuttle|minibus)\b/.test(t);
    const isFlight=/\b(flight|flew|fly|airplane|plane)\b/.test(t);
    const isWalk = /\b(walk|walked|walking|stroll)\b/.test(t);
    const isCycle= /\b(cycle|bicycle|cycling|e-bike|ebike)\b/.test(t);

    const isTransport = isBike || isCar || isCab || isMetro || isBus || isFlight || isWalk || isCycle;

    // ── ENERGY ────────────────────────────────────────────────────────────────
    const isAC    = /\b(ac|air.?con(?:ditioner)?|cooling)\b/.test(t);
    const isFan   = /\b(fan|ceiling fan)\b/.test(t);
    const isHeater= /\b(heater|heating|room heat)\b/.test(t);
    const isTV    = /\b(tv|television|screen)\b/.test(t);
    const isLaptop= /\b(laptop|computer|pc)\b/.test(t);
    const isWash  = /\b(washing machine|wash(?:ed)? clothes|laundry)\b/.test(t);
    const isEnergy= isAC || isFan || isHeater || isTV || isLaptop || isWash;

    // ── FOOD ──────────────────────────────────────────────────────────────────
    const isBeef  = /\b(beef|burger|steak|mutton|lamb|red meat)\b/.test(t);
    const isChicken=/\b(chicken|poultry)\b/.test(t);
    const isFish  = /\b(fish|seafood|prawn|shrimp)\b/.test(t);
    const isVeg   = /\b(veg(?:an)?|vegetarian|salad|daal|lentil|tofu|plant)\b/.test(t);
    const isDelivery=/\b(order(?:ed)?|deliver(?:y|ed)?|swiggy|zomato|takeout|takeaway)\b/.test(t);
    const isFoodWaste=/\b(wast(?:ed?|e)|threw|throw|trash|leftover|rott)\b/.test(t);
    const isFood  = isBeef || isChicken || isFish || isVeg || isDelivery || isFoodWaste;

    // ── SHOPPING ──────────────────────────────────────────────────────────────
    const isShopping=/\b(bought|buy|purchase|cloth(?:es|ing)?|shirt|shoe|appli(?:ance)?|gadget|phone|tv|amazon|flipkart)\b/.test(t);

    // ── WASTE / GOOD HABITS ───────────────────────────────────────────────────
    const isCompost= /\b(compost(?:ed)?)\b/.test(t);
    const isRecycle= /\b(recycl(?:ed)?|segregat(?:ed)?|sorted)\b/.test(t);
    const isReuse  = /\b(reusabl|reuse[d]?|bottle|refill)\b/.test(t);

    // ── Fuel type modifiers ───────────────────────────────────────────────────
    const isE20   = /\b(e20|ethanol|flex.?fuel)\b/.test(t);
    const isEV    = /\b(ev|electric|e-(?:bike|car|scooter))\b/.test(t);
    const isFast  = /\b(fast|race|100\s*(?:kmph|kph)|high.?speed)\b/.test(t);

    // ── CALCULATION ───────────────────────────────────────────────────────────

    if (isTransport) {
      detectedCategory = 'transport';
      const km = extractNumber(t, KM_PATTERNS);

      if (isFlight) {
        const dist = km ?? 500; // assume 500km if unspecified
        carbonKg = dist * EF.flight_short;
        note = `Flight of ~${dist} km estimated at ${EF.flight_short} kg CO2e/km (short-haul IPCC AR6).`;
        confidence = km ? 'high' : 'medium';
        if (!km) assumptions.push('Distance assumed 500 km — update for accuracy.');
      } else if (isWalk || isCycle || isEV) {
        carbonKg = 0;
        note = isEV
          ? 'Electric vehicle — near-zero tailpipe emissions on Indian grid mix.'
          : 'Walking or cycling produces zero direct emissions. Well done.';
        confidence = 'high';
        carbonKg = isEV ? -0.5 : -(km ?? 3) * 0.03; // relative saving vs car
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
      } else if (isFan) {
        carbonKg = hrs * EF.fan_hour;
        note = `Ceiling fan for ${hrs} hours: ${EF.fan_hour} kg CO2e/hr (75W).`;
        confidence = 'high';
      } else if (isHeater) {
        carbonKg = hrs * EF.heater_hour;
        note = `Room heater for ${hrs} hours: ${EF.heater_hour} kg CO2e/hr.`;
        confidence = 'high';
      } else if (isTV) {
        carbonKg = hrs * EF.tv_hour;
        note = `TV for ${hrs} hours: ${EF.tv_hour} kg CO2e/hr.`;
        confidence = 'medium';
      } else if (isLaptop) {
        carbonKg = hrs * EF.laptop_hour;
        note = `Laptop for ${hrs} hours: ${EF.laptop_hour} kg CO2e/hr.`;
        confidence = 'medium';
      } else if (isWash) {
        const cycles = extractNumber(t, [/(\d+)\s*(load|cycle|wash)/i]) ?? 1;
        carbonKg = cycles * EF.washing_cycle;
        note = `${cycles} wash cycle(s): ${EF.washing_cycle} kg CO2e each.`;
        confidence = 'medium';
      }
      if (t.includes('off') || t.includes('unplugged') || t.includes('saved')) {
        carbonKg = -Math.abs(carbonKg);
        note = 'Turning off / saving — converted to avoided emissions.';
      }

    } else if (isFood) {
      detectedCategory = 'food';
      const meals = extractNumber(t, [/(\d+)\s*meal/i, /(\d+)\s*order/i, /(\d+)\s*plate/i]) ?? 1;

      if (isBeef) {
        carbonKg = meals * EF.beef_meal;
        note = `${meals} beef/red-meat meal(s): ${EF.beef_meal} kg CO2e each.`;
        confidence = 'high';
      } else if (isChicken) {
        carbonKg = meals * EF.chicken_meal;
        note = `${meals} chicken meal(s): ${EF.chicken_meal} kg CO2e each.`;
        confidence = 'high';
      } else if (isFish) {
        carbonKg = meals * EF.fish_meal;
        note = `${meals} fish meal(s): ${EF.fish_meal} kg CO2e each.`;
        confidence = 'medium';
      } else if (isVeg) {
        carbonKg = -(meals * (EF.chicken_meal - EF.veg_meal)); // saving vs meat
        note = `${meals} plant-based meal(s): saves ${(EF.chicken_meal - EF.veg_meal).toFixed(1)} kg CO2e vs chicken.`;
        confidence = 'high';
      } else if (isDelivery) {
        carbonKg = meals * EF.delivery_order;
        note = `${meals} food delivery order(s): ${EF.delivery_order} kg CO2e each (food + packaging + rider).`;
        confidence = 'medium';
      } else if (isFoodWaste) {
        carbonKg = meals * EF.waste_meal;
        note = `${meals} wasted meal(s): ${EF.waste_meal} kg CO2e each (upstream food emissions lost).`;
        confidence = 'medium';
      }

    } else if (isShopping) {
      detectedCategory = 'shopping';
      const items = extractNumber(t, [/(\d+)\s*item/i, /(\d+)\s*piece/i, /(\d+)\s*pair/i]) ?? 1;
      carbonKg = items * EF.clothing_item;
      note = `${items} shopping item(s): ~${EF.clothing_item} kg CO2e each (clothing avg).`;
      confidence = 'low';
      assumptions.push('Carbon estimate is for typical clothing/goods. Electronics are higher.');

    } else if (isCompost || isRecycle || isReuse) {
      detectedCategory = 'waste';
      if (isCompost) {
        carbonKg = -0.5;
        note = 'Composting avoids ~0.5 kg CO2e of methane emissions per session.';
        confidence = 'medium';
      } else if (isRecycle) {
        carbonKg = -0.3;
        note = 'Dry waste segregation enables recycling — estimated 0.3 kg CO2e avoided.';
        confidence = 'medium';
      } else {
        carbonKg = -0.2;
        note = 'Reusable item avoids single-use plastic. Estimated 0.2 kg CO2e saved.';
        confidence = 'medium';
      }

    } else {
      // Soft fallback — at least signal direction
      const isGood = /\b(saved|good|reduced|efficient|clean|green|avoided|better)\b/.test(t);
      carbonKg = isGood ? -0.3 : 0.5;
      note = isGood
        ? 'Positive habit detected — estimated minor avoided emissions.'
        : 'Activity logged — estimated minor emissions added. Add more detail for accuracy.';
      confidence = 'low';
      assumptions.push('Cannot parse specifics. Mention distance (km), hours, or item type for a real estimate.');
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
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}
