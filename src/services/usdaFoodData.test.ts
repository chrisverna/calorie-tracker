import { describe, expect, it } from "vitest";
import { normalizeUsdaFood } from "./usdaFoodData";

describe("USDA FoodData Central mapping", () => {
  it("scales per-100g nutrients to a gram serving", () => {
    const result = normalizeUsdaFood({
      fdcId: 123,
      description: "Greek yogurt",
      brandName: "Example Dairy",
      servingSize: 170,
      servingSizeUnit: "g",
      householdServingFullText: "1 container",
      foodNutrients: [
        { nutrientId: 1008, nutrientName: "Energy", unitName: "KCAL", value: 60 },
        { nutrientId: 1003, nutrientName: "Protein", unitName: "G", value: 10 },
        { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", unitName: "G", value: 4 },
        { nutrientId: 1004, nutrientName: "Total lipid (fat)", unitName: "G", value: 0.5 }
      ]
    });

    expect(result).toMatchObject({
      id: "usda-123",
      source: "USDA",
      name: "Greek yogurt",
      brand: "Example Dairy",
      servingSize: "1 container (170 g)",
      calories: 102,
      protein: 17,
      carbs: 6.8,
      fat: 0.9
    });
  });

  it("uses a clear 100g basis when a serving cannot be safely scaled", () => {
    const result = normalizeUsdaFood({
      fdcId: 456,
      description: "Milk beverage",
      servingSize: 240,
      servingSizeUnit: "ml",
      foodNutrients: [{ nutrientId: 1008, unitName: "KCAL", value: 55 }]
    });

    expect(result.servingSize).toBe("100 g");
    expect(result.calories).toBe(55);
    expect(result.protein).toBeNull();
  });
});
