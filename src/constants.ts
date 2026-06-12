import { goalsFromPercentages } from "./lib/nutrition";
import type { AppState, Goals, MealType } from "./types";

export const DEFAULT_GOALS: Goals = goalsFromPercentages(2200, {
  proteinPercent: 30,
  carbsPercent: 40,
  fatPercent: 30
});

export const EMPTY_STATE: AppState = {
  entries: [],
  savedFoods: [],
  recipes: [],
  goals: DEFAULT_GOALS,
  updatedAt: new Date(0).toISOString()
};

export const MEALS: Array<{ id: MealType; label: string; hint: string }> = [
  { id: "breakfast", label: "Breakfast", hint: "Start steady" },
  { id: "lunch", label: "Lunch", hint: "Keep momentum" },
  { id: "dinner", label: "Dinner", hint: "Finish balanced" },
  { id: "snacks", label: "Snacks", hint: "Everything between" }
];

export const MACRO_COLORS = {
  protein: "#e97851",
  carbs: "#d5a735",
  fat: "#61877b"
} as const;
