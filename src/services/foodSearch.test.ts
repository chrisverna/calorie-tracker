import { afterEach, describe, expect, it, vi } from "vitest";
import { combineFoodResults, searchFoods } from "./foodSearch";
import type { FoodSearchResult } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

function result(
  id: string,
  source: FoodSearchResult["source"],
  name: string,
  brand: string | null
): FoodSearchResult {
  return {
    id,
    source,
    name,
    brand,
    servingSize: "1 serving",
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 2,
    rawData: {}
  };
}

describe("combined food search", () => {
  it("removes duplicate-looking cross-source products", () => {
    const results = combineFoodResults(
      [result("usda-1", "USDA", "Core Power Chocolate Shake", "Fairlife")],
      [
        result("off-1", "Open Food Facts", "Core Power Chocolate Shake", "Fairlife"),
        result("off-2", "Open Food Facts", "Core Power Vanilla Shake", "Fairlife")
      ],
      "fairlife core power"
    );

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.id)).toContain("usda-1");
    expect(results.map((item) => item.id)).toContain("off-2");
  });

  it("ranks query matches above unrelated results", () => {
    const results = combineFoodResults(
      [
        result("usda-1", "USDA", "Banana", null),
        result("usda-2", "USDA", "Peanut spread", "Banana Flavored")
      ],
      [],
      "banana"
    );

    expect(results[0].id).toBe("usda-1");
  });

  it("keeps source-specific details when every provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      })
    );

    await expect(searchFoods("banana")).rejects.toThrow("USDA");
    await expect(searchFoods("banana")).rejects.toThrow(
      "Open Food Facts is temporarily busy"
    );
  });
});
