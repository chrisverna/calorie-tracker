import { ArrowRight, Database } from "lucide-react";
import type { FoodSearchResult } from "../types";

interface FoodSearchResultCardProps {
  result: FoodSearchResult;
  onSelect: (result: FoodSearchResult) => void;
}

function nutritionValue(value: number | null, suffix: string): string {
  return value == null ? "—" : `${value}${suffix}`;
}

export function FoodSearchResultCard({
  result,
  onSelect
}: FoodSearchResultCardProps) {
  return (
    <article className="food-search-result">
      <button type="button" onClick={() => onSelect(result)}>
        <span className="search-result-avatar">
          <Database size={19} />
        </span>
        <span className="search-result-main">
          <span className="search-result-meta">
            <i className={`source-badge source-badge--${result.source === "USDA" ? "usda" : "off"}`}>
              {result.source}
            </i>
            <small>{result.servingSize || "Serving not listed"}</small>
          </span>
          <strong>{result.name}</strong>
          <small>{result.brand || "No brand listed"}</small>
        </span>
        <span className="search-result-nutrition">
          <span><strong>{nutritionValue(result.calories, "")}</strong><small>kcal</small></span>
          <span><strong>{nutritionValue(result.protein, "g")}</strong><small>protein</small></span>
          <span><strong>{nutritionValue(result.carbs, "g")}</strong><small>carbs</small></span>
          <span><strong>{nutritionValue(result.fat, "g")}</strong><small>fat</small></span>
        </span>
        <span className="search-result-action">
          Review <ArrowRight size={16} />
        </span>
      </button>
    </article>
  );
}
