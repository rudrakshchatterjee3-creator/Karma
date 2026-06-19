
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const karmaLogic_1 = require("../src/utils/karmaLogic");
function getLuminance(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const [sR, sG, sB] = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}
function getContrastRatio(c1, c2) {
    const l1 = getLuminance(c1);
    const l2 = getLuminance(c2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
}
function runTests() {
    console.log("=========================================");
    console.log("RUNNING KARMA LOGIC & CONTRAST ASSERTIONS");
    console.log("=========================================");
    let failed = false;
    // 1. Verify Monthly Leak Formula
    console.log("\n[Test 1] Asserting Monthly Leak Formula...");
    const testProfile1 = {
        ...karmaLogic_1.defaultProfile,
        bill: 2000,
        acHours: 6,
        commuteMode: "cab",
        deliveries: 4,
    };
    // Hand calculated expected monthly leak:
    // electricityLeak = bill * 0.15 + acHours * 120 = 2000 * 0.15 + 6 * 120 = 300 + 720 = 1020
    // deliveryLeak = deliveries * 4 * 45 = 4 * 4 * 45 = 720
    // transportLeak = cab = 1200
    // Total = 1020 + 720 + 1200 = 2940
    const expectedLeak = 2940;
    const actualLeak = (0, karmaLogic_1.calculateMonthlyLeak)(testProfile1);
    if (actualLeak === expectedLeak) {
        console.log(`✅ Passed: Monthly leak calculation correctly computed ${actualLeak} (expected ${expectedLeak}).`);
    }
    else {
        console.error(`❌ Failed: Monthly leak calculation returned ${actualLeak}, expected ${expectedLeak}.`);
        failed = true;
    }
    // 2. Verify acHours: 12 Action Ranking
    console.log("\n[Test 2] Asserting AC Action Ranking with acHours: 12...");
    const testProfileHighAC = {
        ...karmaLogic_1.defaultProfile,
        acHours: 12,
        commuteKm: 30, // Moderate commute
        deliveries: 2,
        motivation: "comfort",
    };
    const actionsHighAC = (0, karmaLogic_1.createActions)(testProfileHighAC, []);
    const topActionHighAC = actionsHighAC[0];
    if (topActionHighAC && topActionHighAC.id === "ac-24-fan") {
        console.log(`✅ Passed: AC action 'ac-24-fan' ranks #1 when acHours is 12 (Score: ${topActionHighAC.score.toFixed(1)}).`);
    }
    else {
        console.error(`❌ Failed: Top action is '${topActionHighAC ? topActionHighAC.id : "none"}' instead of 'ac-24-fan'.`);
        failed = true;
    }
    // 3. Verify acHours: 0 Action Exclusion
    console.log("\n[Test 3] Asserting AC Action Exclusion with acHours: 0...");
    const testProfileNoAC = {
        ...karmaLogic_1.defaultProfile,
        acHours: 0,
    };
    const actionsNoAC = (0, karmaLogic_1.createActions)(testProfileNoAC, []);
    const acActionExists = actionsNoAC.some(a => a.id === "ac-24-fan");
    if (!acActionExists) {
        console.log(`✅ Passed: AC action 'ac-24-fan' is successfully excluded when acHours is 0.`);
    }
    else {
        console.error(`❌ Failed: AC action 'ac-24-fan' was recommended even when user has 0 AC hours.`);
        failed = true;
    }
    // 4. Verify Theme Contrast (Light Mode)
    console.log("\n[Test 4] Asserting Light Mode Theme contrast ratio...");
    try {
        const globalsCssPath = path.resolve(__dirname, "../src/app/globals.css");
        const cssContent = fs.readFileSync(globalsCssPath, "utf-8");
        // Extract background & foreground colors for theme-light
        const bgMatch = cssContent.match(/--background:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/);
        const lightThemeBlock = cssContent.match(/\.theme-light\s*\{([^}]+)\}/);
        let lightBg = "#eef4ea"; // fallback from code
        let lightFg = "#0b1310"; // fallback from code
        if (lightThemeBlock) {
            const block = lightThemeBlock[1];
            const blockBgMatch = block.match(/--background:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/);
            const blockFgMatch = block.match(/--foreground:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/);
            if (blockBgMatch)
                lightBg = blockBgMatch[1];
            if (blockFgMatch)
                lightFg = blockFgMatch[1];
        }
        const ratio = getContrastRatio(lightBg, lightFg);
        console.log(`- Detected light mode background: ${lightBg}`);
        console.log(`- Detected light mode foreground: ${lightFg}`);
        console.log(`- Computed contrast ratio: ${ratio.toFixed(2)}:1`);
        if (ratio >= 4.5) {
            console.log(`✅ Passed: Light mode contrast ratio ${ratio.toFixed(2)}:1 meets WCAG AA (>= 4.5:1).`);
        }
        else {
            console.error(`❌ Failed: Light mode contrast ratio is too low (${ratio.toFixed(2)}:1).`);
            failed = true;
        }
    }
    catch (err) {
        console.error("❌ Failed to analyze globals.css:", err.message);
        failed = true;
    }
    console.log("\n=========================================");
    if (failed) {
        console.error("❌ VERIFICATION COMPLETED WITH ERRORS.");
        process.exit(1);
    }
    else {
        console.log("🎉 ALL VERIFICATION CRITERIA PASSED SUCCESSFULLY.");
        process.exit(0);
    }
}
runTests();

