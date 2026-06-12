import type { FoodSearchResult } from "../types";
import { searchOpenFoodFacts } from "./openFoodFacts";
import { searchUsdaFoods } from "./usdaFoodData";

export interface FoodSearchResponse {
  results: FoodSearchResult[];
  warnings: string[];
}

function fingerprint(result: FoodSearchResult): string {
  return `${result.name} ${result.brand ?? ""}`
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function relevance(result: FoodSearchResult, query: string): number {
  const normalizedQuery = query.toLocaleLowerCase().trim();
  const name = result.name.toLocaleLowerCase();
  const brand = result.brand?.toLocaleLowerCase() ?? "";
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  let score = tokens.reduce(
    (total, token) => total + (name.includes(token) ? 4 : 0) + (brand.includes(token) ? 3 : 0),
    0
  );
  if (name === normalizedQuery) score += 20;
  if (name.startsWith(normalizedQuery)) score += 8;
  if (tokens[0] && brand.includes(tokens[0])) score += 12;
  if (result.calories != null) score += 1;
  return score;
}

function sourceError(source: string, error: unknown): string {
  const message = error instanceof Error ? error.message : "Search failed.";
  if (message === "Failed to fetch") {
    return `${source} could not connect. Check your network or try again shortly.`;
  }
  return message.startsWith(source) ? message : `${source}: ${message}`;
}

export function combineFoodResults(
  usda: FoodSearchResult[],
  openFoodFacts: FoodSearchResult[],
  query: string
): FoodSearchResult[] {
  const seen = new Set<string>();
  return [...usda, ...openFoodFacts]
    .sort((a, b) => relevance(b, query) - relevance(a, query))
    .filter((result) => {
      const key = fingerprint(result);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 24);
}

export async function searchFoods(
  query: string,
  signal?: AbortSignal
): Promise<FoodSearchResponse> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) {
    return { results: [], warnings: [] };
  }

  const warnings: string[] = [];
  let usda: FoodSearchResult[] = [];
  let openFoodFacts: FoodSearchResult[] = [];

  try {
    usda = await searchUsdaFoods(cleanQuery, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(sourceError("USDA", error));
  }

  try {
    openFoodFacts = await searchOpenFoodFacts(cleanQuery, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(sourceError("Open Food Facts", error));
  }

  const results = combineFoodResults(usda, openFoodFacts, cleanQuery);
  if (!results.length && warnings.length === 2) {
    throw new Error(`${warnings.join(" ")} You can still add food manually.`);
  }

  return { results, warnings };
}
