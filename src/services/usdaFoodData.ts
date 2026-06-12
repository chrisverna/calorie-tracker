import { round } from "../lib/nutrition";
import type { FoodSearchResult } from "../types";

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const apiKey = import.meta.env.VITE_USDA_API_KEY;

export const isUsdaConfigured = Boolean(apiKey);

interface UsdaNutrient {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

interface UsdaFood {
  fdcId: number;
  description?: string;
  dataType?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
  [key: string]: unknown;
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

function nutrientValue(food: UsdaFood, nutrientId: number): number | null {
  const nutrient = food.foodNutrients?.find(
    (item) =>
      item.nutrientId === nutrientId ||
      (nutrientId === 1008 &&
        item.nutrientName?.toLocaleLowerCase() === "energy" &&
        item.unitName?.toLocaleUpperCase() === "KCAL")
  );
  return Number.isFinite(nutrient?.value) ? nutrient!.value! : null;
}

function servingDetails(food: UsdaFood): { label: string; scale: number } {
  const amount = food.servingSize;
  const unit = food.servingSizeUnit?.trim();
  const isGramServing =
    Number.isFinite(amount) && unit?.toLocaleLowerCase() === "g" && amount! > 0;

  if (!isGramServing) {
    return { label: "100 g", scale: 1 };
  }

  const metric = `${round(amount!, 1)} ${unit}`;
  const household = food.householdServingFullText?.trim();
  return {
    label: household ? `${household} (${metric})` : metric,
    scale: amount! / 100
  };
}

function scaled(value: number | null, scale: number): number | null {
  return value == null ? null : round(value * scale, value >= 100 ? 0 : 1);
}

export function normalizeUsdaFood(food: UsdaFood): FoodSearchResult {
  const serving = servingDetails(food);
  return {
    id: `usda-${food.fdcId}`,
    source: "USDA",
    name: food.description?.trim() || "USDA food",
    brand: food.brandName?.trim() || food.brandOwner?.trim() || null,
    servingSize: serving.label,
    calories: scaled(nutrientValue(food, 1008), serving.scale),
    protein: scaled(nutrientValue(food, 1003), serving.scale),
    carbs: scaled(nutrientValue(food, 1005), serving.scale),
    fat: scaled(nutrientValue(food, 1004), serving.scale),
    rawData: food
  };
}

export async function searchUsdaFoods(
  query: string,
  signal?: AbortSignal,
  pageSize = 12
): Promise<FoodSearchResult[]> {
  if (!apiKey) {
    throw new Error(
      "USDA search is not configured. Add VITE_USDA_API_KEY to .env.local and restart the app."
    );
  }

  const request = async (searchQuery: string, size: number): Promise<UsdaFood[]> => {
    const params = new URLSearchParams({
      query: searchQuery,
      pageSize: String(size),
      api_key: apiKey
    });
    const response = await fetch(`${USDA_SEARCH_URL}?${params}`, { signal });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("USDA search rate limit reached. Please wait and try again.");
      }
      throw new Error(`USDA search failed (${response.status}).`);
    }

    const data = (await response.json()) as UsdaSearchResponse;
    return data.foods ?? [];
  };

  const foods = await request(query, pageSize);
  const firstToken = query.trim().split(/\s+/)[0]?.toLocaleLowerCase();
  const hasFirstToken =
    !firstToken ||
    foods.some((food) =>
      `${food.description ?? ""} ${food.brandName ?? ""} ${food.brandOwner ?? ""}`
        .toLocaleLowerCase()
        .includes(firstToken)
    );

  if (!hasFirstToken && firstToken.length >= 4) {
    const brandFoods = await request(firstToken, 8);
    const seen = new Set(foods.map((food) => food.fdcId));
    foods.push(...brandFoods.filter((food) => !seen.has(food.fdcId)));
  }

  return foods.map(normalizeUsdaFood);
}
