export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";
export type FoodSearchSource = "USDA" | "Open Food Facts";

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodDraft extends Nutrition {
  name: string;
  brand?: string;
  servingSize: string;
  servings: number;
  barcode?: string;
  source?: "manual" | "barcode" | "search" | "saved" | "recipe" | "copied";
  databaseSource?: FoodSearchSource;
  externalId?: string;
}

export interface FoodEntry extends FoodDraft {
  id: string;
  date: string;
  meal: MealType;
  createdAt: string;
}

export interface SavedFood extends Omit<FoodDraft, "servings"> {
  id: string;
  servings: number;
  createdAt: string;
}

export interface RecipeItem extends Nutrition {
  id: string;
  name: string;
  servingSize: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  items: RecipeItem[];
  createdAt: string;
}

export interface FoodSearchResult {
  id: string;
  source: FoodSearchSource;
  name: string;
  brand: string | null;
  servingSize: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  rawData: Record<string, unknown>;
}

export interface MacroPercentages {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export type Goals = Nutrition & MacroPercentages;

export interface AppState {
  entries: FoodEntry[];
  savedFoods: SavedFood[];
  recipes: Recipe[];
  goals: Goals;
  updatedAt: string;
}

export type SyncStatus = "local" | "syncing" | "synced" | "offline" | "error";
