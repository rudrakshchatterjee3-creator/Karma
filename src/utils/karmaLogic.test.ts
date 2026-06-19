import { expect, test, describe } from "vitest";
import {
  defaultProfile,
  calculateMonthlyLeak,
  totalsByCategory,
  formatPoints,
  formatRupees,
  carbon,
  createActions,
  type LogEntry
} from "./karmaLogic";

describe("karmaLogic", () => {
  test("defaultProfile has valid structure", () => {
    expect(defaultProfile.name).toBe("");
    expect(defaultProfile.household).toBeGreaterThan(0);
    expect(defaultProfile.motivation).toBeDefined();
  });

  test("calculateMonthlyLeak estimates costs correctly", () => {
    const leak = calculateMonthlyLeak(defaultProfile);
    expect(typeof leak).toBe("number");
    expect(leak).toBeGreaterThan(0);
  });

  test("totalsByCategory groups entries correctly", () => {
    const logs: LogEntry[] = [
      { id: "1", category: "transport", label: "A", carbon: 10, points: -5, note: "", createdAt: new Date().toISOString() },
      { id: "2", category: "transport", label: "B", carbon: 5, points: -2, note: "", createdAt: new Date().toISOString() },
      { id: "3", category: "food", label: "C", carbon: -2, points: 10, note: "", createdAt: new Date().toISOString() }
    ];
    
    const carbonTotals = totalsByCategory(logs, "carbon");
    expect(carbonTotals.transport).toBe(15);
    expect(carbonTotals.food).toBe(-2);
    expect(carbonTotals.energy).toBe(0);

    const pointTotals = totalsByCategory(logs, "points");
    expect(pointTotals.transport).toBe(-7);
    expect(pointTotals.food).toBe(10);
  });

  test("format formats numbers correctly", () => {
    expect(formatPoints(1200)).toBe("+1,200 pts");
    expect(formatPoints(-500)).toBe("-500 pts");
    expect(formatPoints(0)).toBe("0 pts");

    expect(formatRupees(1500)).toBe("+₹1,500");
    expect(carbon(10.5)).toBe("+10.5 kg CO2e");
    expect(carbon(-5)).toBe("-5.0 kg CO2e");
  });

  test("createActions generates default actions based on profile", () => {
    const defaultActions = createActions(defaultProfile, []);
    expect(defaultActions.length).toBeGreaterThan(0);
    expect(defaultActions[0]).toHaveProperty("id");
    expect(defaultActions[0]).toHaveProperty("title");
    expect(defaultActions[0]).toHaveProperty("status");
  });
});
