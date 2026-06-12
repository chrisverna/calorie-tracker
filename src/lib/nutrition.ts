import { eachDayOfInterval, format, parseISO, startOfWeek, subDays } from "date-fns";
import type { FoodEntry, Goals, MacroPercentages, Nutrition } from "../types";

export const ZERO_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

export function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function macroPercentageTotal(percentages: MacroPercentages): number {
  return round(
    percentages.proteinPercent + percentages.carbsPercent + percentages.fatPercent,
    2
  );
}

export function goalsFromPercentages(
  calories: number,
  percentages: MacroPercentages
): Goals {
  const safeCalories = Math.max(0, calories);
  return {
    calories: safeCalories,
    proteinPercent: percentages.proteinPercent,
    carbsPercent: percentages.carbsPercent,
    fatPercent: percentages.fatPercent,
    protein: round((safeCalories * percentages.proteinPercent) / 100 / 4, 1),
    carbs: round((safeCalories * percentages.carbsPercent) / 100 / 4, 1),
    fat: round((safeCalories * percentages.fatPercent) / 100 / 9, 1)
  };
}

export function normalizeGoals(goals: Partial<Goals> | undefined, fallback: Goals): Goals {
  if (!goals) return { ...fallback };

  const calories = Number.isFinite(goals.calories) ? Math.max(0, goals.calories!) : fallback.calories;
  const hasPercentages =
    Number.isFinite(goals.proteinPercent) &&
    Number.isFinite(goals.carbsPercent) &&
    Number.isFinite(goals.fatPercent);

  if (hasPercentages) {
    const percentages = {
      proteinPercent: Math.max(0, goals.proteinPercent!),
      carbsPercent: Math.max(0, goals.carbsPercent!),
      fatPercent: Math.max(0, goals.fatPercent!)
    };
    if (macroPercentageTotal(percentages) === 100) {
      return goalsFromPercentages(calories, percentages);
    }
  }

  const proteinCalories = Math.max(0, goals.protein ?? fallback.protein) * 4;
  const carbsCalories = Math.max(0, goals.carbs ?? fallback.carbs) * 4;
  const fatCalories = Math.max(0, goals.fat ?? fallback.fat) * 9;
  const macroCalories = proteinCalories + carbsCalories + fatCalories;

  if (macroCalories > 0) {
    const proteinPercent = round((proteinCalories / macroCalories) * 100, 2);
    const carbsPercent = round((carbsCalories / macroCalories) * 100, 2);
    const fatPercent = round(100 - proteinPercent - carbsPercent, 2);
    return goalsFromPercentages(calories, { proteinPercent, carbsPercent, fatPercent });
  }

  return goalsFromPercentages(calories, fallback);
}

export function scaleNutrition<T extends Nutrition>(nutrition: T, servings: number): Nutrition {
  return {
    calories: round(nutrition.calories * servings, 0),
    protein: round(nutrition.protein * servings),
    carbs: round(nutrition.carbs * servings),
    fat: round(nutrition.fat * servings)
  };
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce(
    (total, item) => ({
      calories: round(total.calories + item.calories, 0),
      protein: round(total.protein + item.protein),
      carbs: round(total.carbs + item.carbs),
      fat: round(total.fat + item.fat)
    }),
    { ...ZERO_NUTRITION }
  );
}

export function entriesForDate(entries: FoodEntry[], date: string): FoodEntry[] {
  return entries.filter((entry) => entry.date === date);
}

export function totalsForDate(entries: FoodEntry[], date: string): Nutrition {
  return sumNutrition(
    entriesForDate(entries, date).map((entry) => scaleNutrition(entry, entry.servings))
  );
}

export function percentage(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, round((value / goal) * 100, 2));
}

export function goalTone(calories: number, goal: number): "under" | "near" | "over" {
  const ratio = goal > 0 ? calories / goal : 0;
  if (ratio > 1.05) return "over";
  if (ratio >= 0.85) return "near";
  return "under";
}

export function remaining(totals: Nutrition, goals: Goals): Nutrition {
  return {
    calories: round(goals.calories - totals.calories, 0),
    protein: round(goals.protein - totals.protein),
    carbs: round(goals.carbs - totals.carbs),
    fat: round(goals.fat - totals.fat)
  };
}

export interface DailyTrend {
  date: string;
  label: string;
  nutrition: Nutrition;
}

export function getWeekTrend(entries: FoodEntry[], anchorDate: string): DailyTrend[] {
  const anchor = parseISO(anchorDate);
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end: subDays(new Date(start.getTime() + 7 * 86400000), 1) }).map(
    (date) => {
      const value = format(date, "yyyy-MM-dd");
      return {
        date: value,
        label: format(date, "EEE"),
        nutrition: totalsForDate(entries, value)
      };
    }
  );
}

export function getRollingTrend(entries: FoodEntry[], anchorDate: string, days = 14): DailyTrend[] {
  const end = parseISO(anchorDate);
  return eachDayOfInterval({ start: subDays(end, days - 1), end }).map((date) => {
    const value = format(date, "yyyy-MM-dd");
    return {
      date: value,
      label: format(date, "MMM d"),
      nutrition: totalsForDate(entries, value)
    };
  });
}
