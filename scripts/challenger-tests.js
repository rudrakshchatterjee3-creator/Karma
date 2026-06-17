const { calculateMonthlyLeak, getStoryCards, createActions, defaultProfile } = require("../src/utils/karmaLogic");

console.log("=========================================");
console.log("RUNNING CHALLENGER ADVERSARIAL TESTS");
console.log("=========================================");

let failed = false;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ Passed: ${message}`);
  } else {
    console.error(`❌ Failed: ${message}`);
    failed = true;
  }
}

// 1. Verify that when acHours is high (e.g. 12), the AC Optimization action is ranked first.
console.log("\n[Test 1] AC Optimization ranking with high acHours...");
const profileHighAC = {
  ...defaultProfile,
  acHours: 12,
  commuteKm: 10,
  deliveries: 1,
};
const actionsHighAC = createActions(profileHighAC, []);
assert(actionsHighAC.length > 0, "Actions generated");
assert(actionsHighAC[0].id === "ac-24-fan", `Top action is '${actionsHighAC[0]?.id}', expected 'ac-24-fan'`);

// 2. Verify that when acHours is 0, the AC Optimization action is excluded.
console.log("\n[Test 2] AC Optimization exclusion when acHours is 0...");
const profileNoAC = {
  ...defaultProfile,
  acHours: 0,
};
const actionsNoAC = createActions(profileNoAC, []);
assert(!actionsNoAC.some(a => a.id === "ac-24-fan"), "AC Optimization action excluded when acHours is 0");

// 3. Verify that when commuteKm is 0 or walk/bike, the commute swap action is excluded.
console.log("\n[Test 3] Commute swap exclusion when commuteKm is 0 or walk/bike...");
const profileNoCommute = {
  ...defaultProfile,
  commuteKm: 0,
  commuteMode: "car",
};
const actionsNoCommute = createActions(profileNoCommute, []);
assert(!actionsNoCommute.some(a => a.id === "commute-swap"), "Commute swap excluded when commuteKm is 0");

const profileWalkCommute = {
  ...defaultProfile,
  commuteKm: 10,
  commuteMode: "walk",
};
const actionsWalkCommute = createActions(profileWalkCommute, []);
assert(!actionsWalkCommute.some(a => a.id === "commute-swap"), "Commute swap excluded when commuteMode is 'walk'");

const profileBikeCommute = {
  ...defaultProfile,
  commuteKm: 10,
  commuteMode: "bike",
};
const actionsBikeCommute = createActions(profileBikeCommute, []);
assert(!actionsBikeCommute.some(a => a.id === "commute-swap"), "Commute swap excluded when commuteMode is 'bike'");

// 4. Try edge values and verify robust behavior
console.log("\n[Test 4] Robustness testing with edge values...");

const edgeCases = [
  { name: "Negative values", patch: { acHours: -5, commuteKm: -10, deliveries: -2, bill: -500, household: -1 } },
  { name: "Extremely high values", patch: { acHours: 1000, commuteKm: 100000, deliveries: 500, bill: 5000000, household: 100 } },
  { name: "Infinity values", patch: { acHours: Infinity, commuteKm: Infinity, deliveries: Infinity, bill: Infinity, household: Infinity } },
  { name: "NaN values", patch: { acHours: NaN, commuteKm: NaN, deliveries: NaN, bill: NaN, household: NaN } },
  { name: "Empty strings", patch: { acHours: "", commuteKm: "", deliveries: "", bill: "", household: "", name: "", city: "", commuteMode: "", motivation: "" } },
  { name: "Null values", patch: { acHours: null, commuteKm: null, deliveries: null, bill: null, household: null, name: null, city: null, commuteMode: null, motivation: null } },
  { name: "Undefined values", patch: { acHours: undefined, commuteKm: undefined, deliveries: undefined, bill: undefined, household: undefined, name: undefined, city: undefined, commuteMode: undefined, motivation: undefined } },
  { name: "String numbers", patch: { acHours: "12", commuteKm: "50", deliveries: "4", bill: "1500", household: "3" } },
  { name: "Invalid string categories", patch: { commuteMode: "teleport", motivation: "lazy" } }
];

edgeCases.forEach(({ name, patch }) => {
  try {
    const testProfile = { ...defaultProfile, ...patch };
    
    // Call functions and ensure no crashes
    const monthlyLeak = calculateMonthlyLeak(testProfile);
    const storyCards = getStoryCards(testProfile);
    const actions = createActions(testProfile, []);
    
    console.log(`- Edge case [${name}]: OK (Leak: ${monthlyLeak}, Story Cards: ${storyCards.length}, Actions: ${actions.length})`);
  } catch (err) {
    console.error(`❌ Edge case [${name}] crashed:`, err.message);
    failed = true;
  }
});

console.log("\n=========================================");
if (failed) {
  console.error("❌ CHALLENGER VERIFICATION COMPLETED WITH ERRORS.");
  process.exit(1);
} else {
  console.log("🎉 ALL CHALLENGER VERIFICATION CRITERIA PASSED SUCCESSFULLY.");
  process.exit(0);
}
