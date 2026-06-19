export type Category = "transport" | "energy" | "food" | "shopping" | "waste";
export type Motivation = "save" | "comfort" | "health" | "organize" | "climate";
export type Diet = "veg" | "mixed" | "high-meat";

export type Profile = {
  name: string;
  country: string;
  city: string;
  themePreference: "dark" | "light";
  household: number;
  bill: number;
  acHours: number;
  commuteMode: "bike" | "car" | "metro" | "auto" | "cab" | "walk";
  commuteKm: number;
  diet: Diet;
  deliveries: number;
  motivation: Motivation;
};

export type LogEntry = {
  id: string;
  category: Category;
  label: string;
  carbon: number;
  points: number;
  note: string;
  createdAt: string;
};

export type Action = {
  id: string;
  category: Category;
  title: string;
  why: string;
  step: string;
  effort: "low" | "medium";
  carbon: number;
  points: number;
  status: "suggested" | "active" | "done" | "dismissed";
  score: number;
};

export type StoryCard = {
  eyebrow: string;
  title: string;
  image: string;
  metric: string;
  metricLabel: string;
  insight: string;
  iconName: string;
  accent: string;
  isWhyCard?: boolean;
};

export const defaultProfile: Profile = {
  name: "",
  country: "India",
  city: "",
  themePreference: "dark",
  household: 3,
  bill: 1500,
  acHours: 5,
  commuteMode: "car",
  commuteKm: 50,
  diet: "mixed",
  deliveries: 4,
  motivation: "climate",
};

// ─────────────────────────────────────────────────────────────
// REAL COUNTRY CO2 DATA (IEA / Global Carbon Budget 2024)
// Annual CO2 emissions in million tonnes (MtCO2/year)
// These are fossil fuel + industry emissions from 2023 estimates.
// ─────────────────────────────────────────────────────────────
export const countryEmissionsData: Record<string, { annual: number; label: string }> = {
  "china":          { annual: 12_500,  label: "China" },
  "united states":  { annual: 4_900,   label: "United States" },
  "usa":            { annual: 4_900,   label: "United States" },
  "us":             { annual: 4_900,   label: "United States" },
  "india":          { annual: 2_800,   label: "India" },
  "russia":         { annual: 1_900,   label: "Russia" },
  "japan":          { annual: 1_050,   label: "Japan" },
  "germany":        { annual: 640,     label: "Germany" },
  "south korea":    { annual: 610,     label: "South Korea" },
  "korea":          { annual: 610,     label: "South Korea" },
  "iran":           { annual: 750,     label: "Iran" },
  "canada":         { annual: 570,     label: "Canada" },
  "saudi arabia":   { annual: 680,     label: "Saudi Arabia" },
  "brazil":         { annual: 490,     label: "Brazil" },
  "indonesia":      { annual: 690,     label: "Indonesia" },
  "mexico":         { annual: 440,     label: "Mexico" },
  "south africa":   { annual: 470,     label: "South Africa" },
  "australia":      { annual: 390,     label: "Australia" },
  "turkey":         { annual: 440,     label: "Turkey" },
  "united kingdom": { annual: 330,     label: "United Kingdom" },
  "uk":             { annual: 330,     label: "United Kingdom" },
  "france":         { annual: 290,     label: "France" },
  "italy":          { annual: 290,     label: "Italy" },
  "poland":         { annual: 310,     label: "Poland" },
  "thailand":       { annual: 290,     label: "Thailand" },
  "ukraine":        { annual: 200,     label: "Ukraine" },
  "spain":          { annual: 230,     label: "Spain" },
  "egypt":          { annual: 260,     label: "Egypt" },
  "pakistan":       { annual: 210,     label: "Pakistan" },
  "vietnam":        { annual: 280,     label: "Vietnam" },
  "malaysia":       { annual: 250,     label: "Malaysia" },
  "argentina":      { annual: 200,     label: "Argentina" },
  "netherlands":    { annual: 145,     label: "Netherlands" },
  "bangladesh":     { annual: 120,     label: "Bangladesh" },
  "philippines":    { annual: 140,     label: "Philippines" },
  "uae":            { annual: 190,     label: "UAE" },
  "nigeria":        { annual: 120,     label: "Nigeria" },
  "colombia":       { annual: 95,      label: "Colombia" },
  "singapore":      { annual: 50,      label: "Singapore" },
  "new zealand":    { annual: 34,      label: "New Zealand" },
  "sweden":         { annual: 40,      label: "Sweden" },
  "norway":         { annual: 42,      label: "Norway" },
  "switzerland":    { annual: 35,      label: "Switzerland" },
};

export const worldCo2TonnesPerYear = 41_600_000_000; // 41.6 Gt CO2 — Global Carbon Budget 2024

/**
 * Returns annual CO2 emissions in tonnes/year for a given country string.
 * Falls back to null if not found.
 */
export function getCountryEmissions(country: string): { annual: number; label: string } | null {
  if (!country?.trim()) return null;
  const key = country.trim().toLowerCase();
  return countryEmissionsData[key] ?? null;
}

export function totalsByCategory(logs: LogEntry[], key: "carbon" | "points") {
  return logs.reduce(
    (acc, log) => {
      acc[log.category] += log[key];
      return acc;
    },
    { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 } as Record<Category, number>,
  );
}

export function formatPoints(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value).toLocaleString("en-US")} pts`;
}

export function formatRupees(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`;
}

export function carbon(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)} kg CO2e`;
}

// Diet multiplier for food-related calculations
function dietMultiplier(diet: Diet): number {
  if (diet === "veg") return 0.65;
  if (diet === "high-meat") return 1.45;
  return 1.0; // mixed
}

export function calculateMonthlyLeak(profile: Profile): number {
  const bill = Math.max(800, Math.min(8000, profile.bill)); // clamped
  const electricityLeak = bill * 0.15 + profile.acHours * 120;
  const deliveryLeak = profile.deliveries * 4 * 45 * dietMultiplier(profile.diet);
  let transportLeak = 0;
  if (profile.commuteMode === "cab") {
    transportLeak = 1200;
  } else if (profile.commuteMode === "car") {
    transportLeak = 800;
  } else if (profile.commuteMode === "auto") {
    transportLeak = 500;
  } else if (profile.commuteMode === "metro") {
    transportLeak = 150;
  } else {
    transportLeak = 0;
  }
  // Household scale — shared costs are divided but individual impact remains
  const householdFactor = 0.7 + (Math.min(8, Math.max(1, profile.household)) - 1) * 0.06;
  return Math.round((electricityLeak + deliveryLeak + transportLeak) * householdFactor);
}

export function getStoryCards(profile: Profile): StoryCard[] {
  const acWaste = Math.max(1, Math.round(profile.acHours * 1.9));
  const commuteCarbon = Math.max(2, Math.round(profile.commuteKm * (profile.commuteMode === "metro" ? 0.04 : profile.commuteMode === "walk" ? 0.01 : 0.12)));
  const deliveryCarbon = Math.max(1, Math.round(profile.deliveries * 0.8 * dietMultiplier(profile.diet)));
  const monthlyLeak = calculateMonthlyLeak(profile);

  const cityLabel = profile.city ? `A week in ${profile.city}` : "A normal week";

  return [
    {
      eyebrow: cityLabel,
      title: "Your lifestyle leaves an invisible trail.",
      image: "/images/story_intro.png",
      metric: `${acWaste + commuteCarbon + deliveryCarbon} kg`,
      metricLabel: "weekly CO2e footprint",
      insight: "Every AC blast, cab ride, and food delivery adds up to real money, comfort, and carbon.",
      iconName: "Wind",
      accent: "text-sage",
    },
    {
      eyebrow: "The comfort trap",
      title: "Cooling your room shouldn't heat the city.",
      image: "/images/story_energy.png",
      metric: `${acWaste} kg`,
      metricLabel: "weekly AC footprint",
      insight: "Running your AC at 18°C doesn't cool the room faster - it just burns money and grid power.",
      iconName: "ThermometerSun",
      accent: "text-amber-300",
    },
    {
      eyebrow: "The daily grind",
      title: "One cab ride feels harmless. A week of them is heavy.",
      image: "/images/story_transport.png",
      metric: `${commuteCarbon} kg`,
      metricLabel: "weekly commute footprint",
      insight: "Fuel-based trips trap us in traffic and exhaust. Small swaps save hours and clear the air.",
      iconName: "Train",
      accent: "text-sky-300",
    },
    {
      eyebrow: "The convenience cost",
      title: "Delivery brings food, but leaves plastic behind.",
      image: "/images/story_waste.png",
      metric: `${deliveryCarbon} kg`,
      metricLabel: "weekly delivery footprint",
      insight: "The real price of 10-minute delivery is hidden in single-use plastics and exhausted riders.",
      iconName: "Utensils",
      accent: "text-coral",
    },
    {
      eyebrow: "Take control",
      title: "You can't fix what you can't see.",
      image: "/images/story_future.png",
      metric: `₹${monthlyLeak.toLocaleString("en-IN")}`,
      metricLabel: "monthly lifestyle leak",
      insight: "Karma finds the hidden waste in your routine and gives you simple ways to plug the leaks.",
      iconName: "Sparkles",
      accent: "text-sage",
    },
    {
      eyebrow: "The Motive",
      title: "WHY",
      image: "/images/story_why.png",
      metric: "",
      metricLabel: "",
      insight: "Because fighting climate change shouldn't feel like a punishment. Karma exists to prove that cutting carbon also cuts costs, improves your comfort, and declutters your life.",
      iconName: "Sparkles",
      accent: "text-white",
      isWhyCard: true,
    },
  ];
}

export function createActions(profile: Profile, logs: LogEntry[]): Action[] {
  const categoryCarbon = totalsByCategory(logs, "carbon");
  const categoryPoints = totalsByCategory(logs, "points");

  const motivationBoost = (category: Category) => {
    if (profile.motivation === "save") {
      return categoryPoints[category] < 0 ? 18 : 5;
    }
    if (profile.motivation === "comfort") return category === "energy" ? 20 : 6;
    if (profile.motivation === "health") return category === "transport" || category === "food" ? 18 : 5;
    if (profile.motivation === "organize") return category === "shopping" || category === "waste" ? 18 : 5;
    return categoryCarbon[category] > 0 ? 16 : 8;
  };

  const candidates: Omit<Action, "score" | "status">[] = [];

  // ── DYNAMIC ACTIONS SCANNED FROM RECENT LOGS ────────────────────────────────
  
  // 1. Long diesel trip check
  const hasDieselTrip = logs.some(
    (log) => log.category === "transport" && log.label.toLowerCase().includes("diesel") && log.carbon > 12
  );
  if (hasDieselTrip) {
    candidates.push({
      id: "diesel-mitigation",
      category: "transport",
      title: "Offset diesel vehicle emissions",
      why: "You logged a long diesel trip. Diesel engines produce higher particulates and nitrogen oxides per km compared to other transits.",
      step: "For routes over 40 km, coordinate a shared carpool or pre-book a rail ticket.",
      effort: "medium",
      carbon: 12.0,
      points: 1200,
    });
  }

  // 2. High transport emissions fallback (if no specific diesel trip)
  const transportCarbon = categoryCarbon["transport"] || 0;
  if (transportCarbon > 20 && !hasDieselTrip) {
    candidates.push({
      id: "commute-rationalize",
      category: "transport",
      title: "Consolidate transit routes",
      why: "Your transport footprint is elevated. Grouping trips and swapping private cabs for public rail yields immediate savings.",
      step: "Merge your next three local errands into a single loop, or swap two cab trips for the metro.",
      effort: "low",
      carbon: 6.5,
      points: 650,
    });
  }

  // 3. Repeated food delivery check
  const deliveryLogs = logs.filter(
    (log) =>
      log.category === "food" &&
      (log.label.toLowerCase().includes("order") ||
        log.label.toLowerCase().includes("delivery") ||
        log.label.toLowerCase().includes("swiggy") ||
        log.label.toLowerCase().includes("zomato"))
  );
  if (deliveryLogs.length >= 2) {
    candidates.push({
      id: "delivery-reduce",
      category: "food",
      title: "Batch cook dinners to avoid delivery waste",
      why: "You logged multiple food deliveries. Upstream cooking, packaging plastic, and courier transit multiply packaging waste.",
      step: "Cook one simple batch meal (e.g. dal or fried rice) to cover two dinners this week.",
      effort: "medium",
      carbon: 4.8,
      points: 480,
    });
  }

  // 4. Large AC cooling carbon check
  const hasHighAcUsage = logs.some(
    (log) => log.category === "energy" && log.label.toLowerCase().includes("ac") && log.carbon > 3.5
  );
  if (hasHighAcUsage) {
    candidates.push({
      id: "ac-timer-fallback",
      category: "energy",
      title: "Activate AC sleep timer pre-dawn",
      why: "Cooling is a major electricity driver. Sleep timers prevent the compressor running in the naturally cooler pre-dawn hours.",
      step: "Program your AC to turn off automatically at 4:00 AM tonight, letting the ceiling fan run.",
      effort: "low",
      carbon: 3.2,
      points: 320,
    });
  }

  // 5. Waste generation logged
  const hasWasteLogs = logs.some(
    (log) =>
      log.category === "waste" &&
      (log.label.toLowerCase().includes("waste") ||
        log.label.toLowerCase().includes("plastic") ||
        log.label.toLowerCase().includes("threw") ||
        log.label.toLowerCase().includes("food waste"))
  );
  if (hasWasteLogs) {
    candidates.push({
      id: "organic-compost-fallback",
      category: "waste",
      title: "Separate organic waste for local composting",
      why: "Mixed landfill waste generates potent greenhouse methane. Composting avoids this entirely.",
      step: "Set aside a small covered container solely for kitchen food scraps this week.",
      effort: "low",
      carbon: 2.5,
      points: 250,
    });
  }

  // ── STANDARD PROFILE-BASED ACTIONS ──────────────────────────────────────────

  // AC efficiency (if profile acHours > 0 and not already covered by high AC usage)
  if (profile.acHours > 0 && !hasHighAcUsage) {
    candidates.push({
      id: "ac-24-fan",
      category: "energy",
      title: "Run AC at 24°C with fan support",
      why: "Cooling is your most expensive comfort habit. This keeps the room comfortable without forcing the compressor to work as hard.",
      step: "Tonight, set AC to 24°C and fan to medium for the first 45 minutes.",
      effort: "low",
      carbon: 2.0 + profile.acHours * 1.1,
      points: 200 + profile.acHours * 110,
    });
  }

  // Transport swap (if motorized commute and not already covered by high transport emissions)
  if (profile.commuteKm > 0 && profile.commuteMode !== "walk" && profile.commuteMode !== "bike" && transportCarbon <= 20) {
    candidates.push({
      id: "commute-swap",
      category: "transport",
      title: "Swap two cab or car trips for metro or shared route",
      why: "Your commute repeats often enough that even two better trips change the week.",
      step: "Pick the two most predictable commute days and pre-plan the shared route.",
      effort: "medium",
      carbon: profile.commuteKm * 0.08,
      points: profile.commuteKm * 8,
    });
  }

  // Food deliveries (if deliveries > 0 and not already covered by repeated deliveries)
  if (profile.deliveries > 0 && deliveryLogs.length < 2) {
    const foodTitle = profile.diet === "high-meat"
      ? "Replace two meat-heavy deliveries with a home-cooked meal"
      : "Replace two delivery dinners with one planned meal batch";
    candidates.push({
      id: "delivery-bundle",
      category: "food",
      title: foodTitle,
      why: "Delivery is convenient, but the repeated packaging, fees, and add-ons create a silent monthly leak.",
      step: "Choose one simple dinner you can repeat twice this week.",
      effort: "medium",
      carbon: profile.deliveries * 0.7 * dietMultiplier(profile.diet),
      points: profile.deliveries * 70,
    });
  }

  // Shopping pause
  candidates.push({
    id: "order-pause",
    category: "shopping",
    title: "Use a 24-hour pause before non-urgent orders",
    why: "The cheapest and cleanest order is the one you decide you do not need tomorrow.",
    step: "Move one non-urgent cart item to a tomorrow list.",
    effort: "low",
    carbon: 3.2,
    points: 320,
  });

  // Dry waste setup (if not already composting)
  if (!hasWasteLogs) {
    candidates.push({
      id: "dry-waste",
      category: "waste",
      title: "Set up one dry-waste bag near the kitchen",
      why: "Segregation fails when it needs effort. A visible dry bag makes the right action automatic.",
      step: "Keep one paper or cloth bag only for dry packaging this week.",
      effort: "low",
      carbon: 1.8,
      points: 180,
    });
  }

  return candidates
    .map((action) => ({
      ...action,
      status: "suggested" as const,
      score:
        action.carbon * 5 +
        Math.abs(action.points) / 35 +
        motivationBoost(action.category) +
        (action.effort === "low" ? 18 : 8),
    }))
    .sort((a, b) => b.score - a.score);
}
