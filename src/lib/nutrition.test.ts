import { describe, expect, it } from "vitest";
import {
  goalsFromPercentages,
  goalTone,
  macroPercentageTotal,
  normalizeGoals,
  percentage,
  remaining,
  scaleNutrition,
  sumNutrition,
  totalsForDate
} from "./nutrition";
import type { FoodEntry } from "../types";

const entry: FoodEntry = {
  id: "entry-1",
  date: "2026-06-10",
  meal: "breakfast",
  name: "Test oats",
  servingSize: "1 bowl",
  servings: 1.5,
  calories: 300,
  protein: 12,
  carbs: 48,
  fat: 7,
  createdAt: "2026-06-10T12:00:00.000Z"
};

describe("nutrition calculations", () => {
  it("scales per-serving nutrition", () => {
    expect(scaleNutrition(entry, 1.5)).toEqual({
      calories: 450,
      protein: 18,
      carbs: 72,
      fat: 10.5
    });
  });

  it("sums and filters daily entries", () => {
    const previous = { ...entry, id: "entry-2", date: "2026-06-09" };
    expect(totalsForDate([entry, previous], "2026-06-10")).toEqual({
      calories: 450,
      protein: 18,
      carbs: 72,
      fat: 10.5
    });
    expect(sumNutrition([entry, entry]).calories).toBe(600);
  });

  it("calculates progress and remaining values", () => {
    expect(percentage(110, 100)).toBe(110);
    expect(
      remaining(
        { calories: 1800, protein: 110, carbs: 190, fat: 55 },
        {
          calories: 2200,
          protein: 165,
          carbs: 220,
          fat: 73.3,
          proteinPercent: 30,
          carbsPercent: 40,
          fatPercent: 30
        }
      )
    ).toEqual({ calories: 400, protein: 55, carbs: 30, fat: 18.3 });
  });

  it("classifies goal proximity", () => {
    expect(goalTone(1600, 2200)).toBe("under");
    expect(goalTone(2000, 2200)).toBe("near");
    expect(goalTone(2400, 2200)).toBe("over");
  });

  it("derives gram targets from a 100% calorie split", () => {
    const goals = goalsFromPercentages(2000, {
      proteinPercent: 30,
      carbsPercent: 45,
      fatPercent: 25
    });

    expect(goals).toEqual({
      calories: 2000,
      protein: 150,
      carbs: 225,
      fat: 55.6,
      proteinPercent: 30,
      carbsPercent: 45,
      fatPercent: 25
    });
    expect(macroPercentageTotal(goals)).toBe(100);
  });

  it("migrates old gram-only goals to percentages totaling 100%", () => {
    const fallback = goalsFromPercentages(2200, {
      proteinPercent: 30,
      carbsPercent: 40,
      fatPercent: 30
    });
    const migrated = normalizeGoals(
      { calories: 2200, protein: 150, carbs: 240, fat: 70 },
      fallback
    );

    expect(macroPercentageTotal(migrated)).toBe(100);
    expect(migrated.calories).toBe(2200);
    expect(migrated.protein).toBeCloseTo((2200 * migrated.proteinPercent) / 100 / 4, 1);
  });
});
