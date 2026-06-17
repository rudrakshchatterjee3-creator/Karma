"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worldCo2TonnesPerYear = exports.defaultProfile = void 0;
exports.totalsByCategory = totalsByCategory;
exports.formatPoints = formatPoints;
exports.formatRupees = formatRupees;
exports.carbon = carbon;
exports.calculateMonthlyLeak = calculateMonthlyLeak;
exports.getStoryCards = getStoryCards;
exports.createActions = createActions;
exports.defaultProfile = {
    name: "",
    country: "",
    city: "",
    timezone: "UTC",
    themePreference: "dark",
    household: 3,
    bill: 1500, // Fixed out-of-bounds bug
    acHours: 5,
    commuteMode: "car",
    commuteKm: 50,
    diet: "mixed",
    deliveries: 4,
    motivation: "climate",
};
exports.worldCo2TonnesPerYear = 41_600_000_000;
function totalsByCategory(logs, key) {
    return logs.reduce((acc, log) => {
        acc[log.category] += log[key];
        return acc;
    }, { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 });
}
function formatPoints(value) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${Math.round(value).toLocaleString("en-US")} pts`;
}
function formatRupees(value) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`;
}
function carbon(value) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${Math.abs(value).toFixed(1)} kg CO2e`;
}
function calculateMonthlyLeak(profile) {
    const electricityLeak = profile.bill * 0.15 + (profile.acHours * 120);
    const deliveryLeak = profile.deliveries * 4 * 45;
    let transportLeak = 0;
    if (profile.commuteMode === "cab") {
        transportLeak = 1200;
    }
    else if (profile.commuteMode === "car") {
        transportLeak = 800;
    }
    else if (profile.commuteMode === "auto") {
        transportLeak = 500;
    }
    else if (profile.commuteMode === "metro") {
        transportLeak = 150;
    }
    else {
        transportLeak = 0;
    }
    return Math.round(electricityLeak + deliveryLeak + transportLeak);
}
function getStoryCards(profile) {
    const acWaste = Math.max(1, Math.round(profile.acHours * 1.9));
    const commuteCarbon = Math.max(2, Math.round(profile.commuteKm * (profile.commuteMode === "metro" ? 0.04 : profile.commuteMode === "walk" ? 0.01 : 0.12)));
    const deliveryCarbon = Math.max(1, Math.round(profile.deliveries * 0.8));
    const monthlyLeak = calculateMonthlyLeak(profile);
    return [
        {
            eyebrow: profile.city ? `A week in ${profile.city}` : "A normal week",
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
            insight: "Running your AC at 18°C doesn't cool the room faster—it just burns money and grid power.",
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
            metric: `₹${monthlyLeak.toLocaleString("en-IN")}`, // Rupee formatted
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
function createActions(profile, logs) {
    const categoryCarbon = totalsByCategory(logs, "carbon");
    const categoryPoints = totalsByCategory(logs, "points");
    const motivationBoost = (category) => {
        if (profile.motivation === "save") {
            // Prioritize categories where user is leaking (negative points)
            return categoryPoints[category] < 0 ? 18 : 5;
        }
        if (profile.motivation === "comfort")
            return category === "energy" ? 20 : 6;
        if (profile.motivation === "health")
            return category === "transport" || category === "food" ? 18 : 5;
        if (profile.motivation === "organize")
            return category === "shopping" || category === "waste" ? 18 : 5;
        return categoryCarbon[category] > 0 ? 16 : 8;
    };
    const candidates = [];
    // 1. Run AC efficiently: only if acHours > 0
    if (profile.acHours > 0) {
        candidates.push({
            id: "ac-24-fan",
            category: "energy",
            title: "Run AC at 24 C with fan support",
            why: "Cooling is your most expensive comfort habit. This keeps the room comfortable without forcing the compressor to work as hard.",
            step: "Tonight, set AC to 24 C and fan to medium for the first 45 minutes.",
            effort: "low",
            carbon: 2.0 + profile.acHours * 1.1,
            points: 200 + profile.acHours * 110,
        });
    }
    // 2. Transport swap: only if commuteKm > 0 and mode is motorized leak
    if (profile.commuteKm > 0 && profile.commuteMode !== "walk" && profile.commuteMode !== "bike") {
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
    // 3. Food deliveries: only if deliveries > 0
    if (profile.deliveries > 0) {
        candidates.push({
            id: "delivery-bundle",
            category: "food",
            title: "Replace two delivery dinners with one planned meal batch",
            why: "Delivery is convenient, but the repeated packaging, fees, and add-ons create a silent monthly leak.",
            step: "Choose one simple dinner you can repeat twice this week.",
            effort: "medium",
            carbon: profile.deliveries * 0.7,
            points: profile.deliveries * 70,
        });
    }
    // 4. Shopping pause
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
    // 5. Dry waste setup
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
    return candidates
        .map((action) => ({
        ...action,
        status: "suggested",
        score: action.carbon * 5 +
            Math.abs(action.points) / 35 +
            motivationBoost(action.category) +
            (action.effort === "low" ? 18 : 8),
    }))
        .sort((a, b) => b.score - a.score);
}
