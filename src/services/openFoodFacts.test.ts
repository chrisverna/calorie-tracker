import { afterEach, describe, expect, it, vi } from "vitest";
import {
  lookupBarcode,
  normalizeOpenFoodFactsProduct,
  searchOpenFoodFacts
} from "./openFoodFacts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Open Food Facts lookup", () => {
  it("prefers serving-level values for text search results", () => {
    expect(
      normalizeOpenFoodFactsProduct({
        code: "123",
        product_name: "Protein shake",
        brands: "Example Brand",
        serving_size: "1 bottle (400 ml)",
        nutriments: {
          "energy-kcal_100g": 40,
          "energy-kcal_serving": 160,
          proteins_100g: 6,
          proteins_serving: 24,
          carbohydrates_serving: 8,
          fat_serving: 4
        }
      })
    ).toMatchObject({
      id: "off-123",
      source: "Open Food Facts",
      servingSize: "1 bottle (400 ml)",
      calories: 160,
      protein: 24,
      carbs: 8,
      fat: 4
    });
  });

  it("uses the full-text product search endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            code: "123",
            product_name: "Fairlife protein shake",
            brands: ["Fairlife"],
            nutriments: {
              "energy-kcal_100g": 44,
              proteins_100g: 9,
              carbohydrates_100g: 1,
              fat_100g: 1
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchOpenFoodFacts("fairlife protein shake")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://world.openfoodfacts.org/cgi/search.pl?search_terms=fairlife+protein+shake"
      ),
      expect.any(Object)
    );
  });

  it("maps serving nutrition into an editable food draft", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: "Protein bar",
            brands: "Test Foods, Another Brand",
            serving_size: "45 g",
            nutriments: {
              "energy-kcal_serving": 210,
              proteins_serving: 20,
              carbohydrates_serving: 23,
              fat_serving: 7
            }
          }
        })
      })
    );

    await expect(lookupBarcode("123456")).resolves.toMatchObject({
      name: "Protein bar",
      brand: "Test Foods",
      servingSize: "45 g",
      calories: 210,
      protein: 20,
      carbs: 23,
      fat: 7,
      barcode: "123456"
    });
  });

  it("reports missing products clearly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 0 })
      })
    );

    await expect(lookupBarcode("missing")).rejects.toThrow("couldn't find");
  });
});
