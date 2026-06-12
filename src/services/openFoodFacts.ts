import { round } from "../lib/nutrition";
import type { FoodDraft, FoodSearchResult } from "../types";

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
  [key: string]: unknown;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsProduct[];
}

function numberValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function preferredNutrient(
  nutrients: Record<string, number | string | undefined>,
  name: string,
  useServing: boolean
): number | null {
  const suffix = useServing ? "_serving" : "_100g";
  const value = nullableNumber(nutrients[`${name}${suffix}`]);
  return value == null ? null : round(value, 1);
}

function firstBrand(brands: OpenFoodFactsProduct["brands"]): string | null {
  const value = Array.isArray(brands) ? brands[0] : brands?.split(",")[0];
  return value?.trim() || null;
}

export function normalizeOpenFoodFactsProduct(
  product: OpenFoodFactsProduct
): FoodSearchResult | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  const nutrients = product.nutriments ?? {};
  const useServing =
    Boolean(product.serving_size?.trim()) &&
    ["energy-kcal", "proteins", "carbohydrates", "fat"].some(
      (key) => nutrients[`${key}_serving`] != null
    );
  const calories =
    preferredNutrient(nutrients, "energy-kcal", useServing) ??
    (!useServing
      ? nullableNumber(nutrients.energy_100g) != null
        ? nullableNumber(nutrients.energy_100g)! / 4.184
        : null
      : null);

  return {
    id: `off-${product.code || name.toLocaleLowerCase().replace(/\W+/g, "-")}`,
    source: "Open Food Facts",
    name,
    brand: firstBrand(product.brands),
    servingSize: useServing ? product.serving_size!.trim() : "100 g",
    calories: calories == null ? null : round(calories, 0),
    protein: preferredNutrient(nutrients, "proteins", useServing),
    carbs: preferredNutrient(nutrients, "carbohydrates", useServing),
    fat: preferredNutrient(nutrients, "fat", useServing),
    rawData: product
  };
}

export async function searchOpenFoodFacts(
  query: string,
  signal?: AbortSignal,
  pageSize = 8
): Promise<FoodSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(pageSize),
    fields: "code,product_name,brands,serving_size,nutriments"
  });
  const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
    signal,
    headers: { "User-Agent": "DailyFuel/1.0 (personal nutrition tracker)" }
  });

  if (!response.ok) {
    if (response.status === 429 || response.status === 503) {
      throw new Error("Open Food Facts is temporarily busy. USDA results are still available.");
    }
    throw new Error(`Open Food Facts search failed (${response.status}).`);
  }

  const data = (await response.json()) as OpenFoodFactsSearchResponse;
  return (data.products ?? [])
    .map(normalizeOpenFoodFactsProduct)
    .filter((result): result is FoodSearchResult => result != null);
}

export async function lookupBarcode(barcode: string, signal?: AbortSignal): Promise<FoodDraft> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    {
      signal,
      headers: { "User-Agent": "DailyFuel/1.0 (personal nutrition tracker)" }
    }
  );

  if (!response.ok) {
    throw new Error("The nutrition service is unavailable right now.");
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    throw new Error("We couldn't find that barcode. You can still add it manually.");
  }

  const nutrients = data.product.nutriments ?? {};
  const hasServingValues = nutrients["energy-kcal_serving"] != null;
  const suffix = hasServingValues ? "_serving" : "_100g";
  const calories =
    numberValue(nutrients[`energy-kcal${suffix}`]) ||
    numberValue(nutrients[`energy${suffix}`]) / 4.184;

  return {
    name: data.product.product_name?.trim() || "Scanned food",
    brand: data.product.brands?.split(",")[0]?.trim(),
    servingSize: data.product.serving_size?.trim() || (hasServingValues ? "1 serving" : "100 g"),
    servings: 1,
    calories: Math.round(calories),
    protein: numberValue(nutrients[`proteins${suffix}`]),
    carbs: numberValue(nutrients[`carbohydrates${suffix}`]),
    fat: numberValue(nutrients[`fat${suffix}`]),
    barcode,
    source: "barcode"
  };
}
