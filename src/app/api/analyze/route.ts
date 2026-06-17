import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { actionText } = await request.json();

    if (!actionText || typeof actionText !== 'string') {
      return NextResponse.json({ error: 'Action text is required' }, { status: 400 });
    }

    const text = actionText.toLowerCase();

    // Default baseline values
    let frictionDelta = 0; // Negative means clearing smog (good), positive means adding smog (bad)
    let moneyDelta = 0;    // Negative means saving money (good), positive means burning money (bad)
    let detectedType: "lightness" | "friction" = "friction";
    let summaryText = "Action logged. Minor atmospheric impact detected.";

    // HEAVY LOGIC ENGINE: Keyword & Regex matching

    // 1. Transportation - Positive
    if (text.match(/\b(walk|walked|walking|bike|biked|bicycle|cycle|cycled|metro|subway|train|bus|carpool)\b/)) {
      frictionDelta -= 0.15;
      moneyDelta -= 150;
      detectedType = "lightness";
      summaryText = "Skipped the fuel cost today. Kept the neighborhood air just a bit lighter without the exhaust.";
      
      if (text.match(/\b(metro|train|bus)\b/)) {
        frictionDelta -= 0.05;
        summaryText = "Took the shared route. Saved on gas and cut down the heavy traffic rolling through town.";
      }
    }
    // 2. Transportation - Negative
    else if (text.match(/\b(drive|drove|car|suv|uber|cab|taxi|flight|flew|fly)\b/)) {
      frictionDelta += 0.2;
      moneyDelta += 300;
      detectedType = "friction";
      summaryText = "Took the car out. That is extra fuel burned and more heat trapped in the local streets.";
      
      if (text.match(/\b(flight|flew|fly)\b/)) {
        frictionDelta += 0.4;
        moneyDelta += 5000;
        summaryText = "Flew out today. The convenience comes with a heavy, lasting weight on the air we all breathe.";
      }
    }

    // 3. Energy/Appliance - Positive
    if (text.match(/\b(off|turned off|unplugged|lower|lowered|cold water|line dry)\b/)) {
      if (text.match(/\b(ac|air conditioner|heater|lights|screen|tv|pc|computer|standby)\b/)) {
        frictionDelta -= 0.1;
        moneyDelta -= 50;
        detectedType = "lightness";
        summaryText = "Powered down the heavy appliances. Saved some money on the meter and gave the grid a rest.";
      }
    }
    // 4. Energy/Appliance - Negative
    else if (text.match(/\b(ac|air conditioner|heater)\b/) && text.match(/\b(on|blast|max|all day)\b/)) {
      frictionDelta += 0.15;
      moneyDelta += 200;
      detectedType = "friction";
      summaryText = "The AC ran hard during the afternoon heat. That is an extra ₹200 burned and more heat pushed back out into Kalna.";
    }

    // 5. Diet/Waste - Positive
    if (text.match(/\b(vegan|vegetarian|plant|local|compost|reusable|recycled)\b/)) {
      frictionDelta -= 0.05;
      moneyDelta -= 80;
      detectedType = "lightness";
      summaryText = "Kept it local and clean. Bypassed the heavy cost of packaged goods and shipping.";
    }
    // 6. Diet/Waste - Negative
    else if (text.match(/\b(beef|meat|steak|plastic|single use|thrown|trash)\b/)) {
      frictionDelta += 0.1;
      moneyDelta += 120;
      detectedType = "friction";
      summaryText = "Heavy consumption today. The packaging and processing add a quiet, lasting weight to the local landfill.";
    }

    // Edge case: if no keywords matched
    if (frictionDelta === 0) {
      if (text.match(/\b(saved|helped|reduced|clean|good|efficient)\b/)) {
        frictionDelta -= 0.05;
        moneyDelta -= 20;
        detectedType = "lightness";
        summaryText = "A quiet shift in the right direction. Every little bit of lightness counts.";
      } else {
        frictionDelta += 0.05;
        moneyDelta += 40;
        detectedType = "friction";
        summaryText = "Another action logged in the daily routine. The weight slowly adds up.";
      }
    }

    // Ensure we don't return absolute zero for the UI animation
    const finalFrictionDelta = parseFloat(frictionDelta.toFixed(2));
    const finalMoneyDelta = Math.round(moneyDelta);

    // Simulate network latency for a "professional crunching data" feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      type: detectedType,
      frictionDelta: finalFrictionDelta,
      moneyDelta: finalMoneyDelta,
      summary: summaryText,
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: 'Failed to analyze action' }, { status: 500 });
  }
}
