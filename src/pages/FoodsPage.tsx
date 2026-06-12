import {
  AlertCircle,
  Bookmark,
  Clock3,
  Database,
  LoaderCircle,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FoodSearchResultCard } from "../components/FoodSearchResultCard";
import { searchFoods } from "../services/foodSearch";
import { isUsdaConfigured } from "../services/usdaFoodData";
import { useApp } from "../state/AppContext";
import type {
  FoodDraft,
  FoodEntry,
  FoodSearchResult,
  MealType,
  SavedFood
} from "../types";

interface FoodsPageProps {
  onAddFood: () => void;
  onLogFood: (food: FoodDraft, meal?: MealType) => void;
}

type FoodTab = "search" | "recent" | "saved";
type ReusableFood = FoodEntry | SavedFood;

const EXAMPLE_SEARCHES = ["banana", "chobani yogurt", "fairlife protein shake"];

function reusableKey(food: ReusableFood): string {
  return (
    food.externalId ||
    `${food.name}|${food.brand ?? ""}|${food.servingSize}`
  ).toLocaleLowerCase();
}

function toDraft(food: ReusableFood): FoodDraft {
  return {
    name: food.name,
    brand: food.brand,
    servingSize: food.servingSize,
    servings: 1,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    barcode: food.barcode,
    source: food.source,
    databaseSource: food.databaseSource,
    externalId: food.externalId
  };
}

function resultToDraft(result: FoodSearchResult): FoodDraft {
  return {
    name: result.name,
    brand: result.brand ?? undefined,
    servingSize: result.servingSize || "1 serving",
    servings: 1,
    calories: result.calories ?? 0,
    protein: result.protein ?? 0,
    carbs: result.carbs ?? 0,
    fat: result.fat ?? 0,
    source: "search",
    databaseSource: result.source,
    externalId: result.id
  };
}

export function FoodsPage({ onAddFood, onLogFood }: FoodsPageProps) {
  const { state, deleteSavedFood } = useApp();
  const [tab, setTab] = useState<FoodTab>("search");
  const [query, setQuery] = useState("");
  const [localFilter, setLocalFilter] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    []
  );

  const recent = useMemo(() => {
    const seen = new Set<string>();
    return [...state.entries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((entry) => {
        const key = reusableKey(entry);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 30);
  }, [state.entries]);

  const localFoods = tab === "saved" ? state.savedFoods : recent;
  const filteredLocalFoods = localFoods.filter((food) =>
    `${food.name} ${food.brand ?? ""}`
      .toLocaleLowerCase()
      .includes(localFilter.toLocaleLowerCase())
  );

  const runSearch = async (searchQuery: string) => {
    const cleanQuery = searchQuery.trim();
    if (cleanQuery.length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setTab("search");
    setQuery(cleanQuery);
    setLoading(true);
    setError("");
    setWarnings([]);
    setHasSearched(true);

    try {
      const response = await searchFoods(cleanQuery, controller.signal);
      setResults(response.results);
      setWarnings(response.warnings);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setResults([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Food search failed. You can still add food manually."
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const selectResult = (result: FoodSearchResult) => {
    onLogFood(resultToDraft(result));
  };

  return (
    <div className="page foods-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">USDA + Open Food Facts</p>
          <h1>Find food</h1>
          <p>Search products and everyday foods, review the nutrition, then add them to your log.</p>
        </div>
        <button className="button button--primary" type="button" onClick={onAddFood}>
          <Plus size={17} /> Manual entry
        </button>
      </header>

      <section className="food-search-panel">
        <form
          className="food-database-search"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch(query);
          }}
        >
          <label>
            <Search size={21} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a food, product, or brand"
              aria-label="Search food database"
            />
          </label>
          <button className="button button--primary" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />}
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <div className="food-search-examples">
          <span>Try:</span>
          {EXAMPLE_SEARCHES.map((example) => (
            <button type="button" key={example} onClick={() => void runSearch(example)}>
              {example}
            </button>
          ))}
        </div>
        {!isUsdaConfigured && (
          <div className="search-config-note">
            <AlertCircle size={17} />
            <span>
              USDA search needs <code>VITE_USDA_API_KEY</code>. Open Food Facts results will still
              be searched.
            </span>
          </div>
        )}
      </section>

      <div className="library-toolbar">
        <div className="segmented-control">
          <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
            <Database size={16} /> Results
          </button>
          <button className={tab === "recent" ? "active" : ""} onClick={() => setTab("recent")}>
            <Clock3 size={16} /> Recent
          </button>
          <button className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>
            <Bookmark size={16} /> Saved
          </button>
        </div>
        {tab !== "search" && (
          <label className="search-field">
            <Search size={18} />
            <input
              value={localFilter}
              onChange={(event) => setLocalFilter(event.target.value)}
              placeholder={`Filter ${tab} foods`}
            />
          </label>
        )}
      </div>

      {tab === "search" ? (
        <section aria-live="polite">
          {warnings.map((warning) => (
            <div className="inline-alert search-warning" key={warning}>
              <AlertCircle size={18} />
              <span>{warning}</span>
            </div>
          ))}
          {error && (
            <div className="search-error-state">
              <span><AlertCircle size={28} /></span>
              <h2>Search could not finish</h2>
              <p>{error}</p>
              <button className="button button--primary" type="button" onClick={onAddFood}>
                <Plus size={17} /> Add manually
              </button>
            </div>
          )}
          {loading && (
            <div className="search-loading">
              <LoaderCircle className="spin" size={28} />
              <strong>Searching nutrition databases</strong>
              <p>Checking USDA first, then Open Food Facts.</p>
            </div>
          )}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="search-results-heading">
                <div>
                  <p className="eyebrow">Search results</p>
                  <h2>{results.length} foods for “{query}”</h2>
                </div>
                <small>Select a food to review and edit it.</small>
              </div>
              <div className="food-search-results">
                {results.map((result) => (
                  <FoodSearchResultCard
                    key={result.id}
                    result={result}
                    onSelect={selectResult}
                  />
                ))}
              </div>
            </>
          )}
          {!loading && !error && hasSearched && !results.length && (
            <div className="empty-state">
              <span><Search size={28} /></span>
              <h2>No results found</h2>
              <p>Try fewer words, check the spelling, or add the nutrition manually.</p>
              <button className="button button--primary" type="button" onClick={onAddFood}>
                <Plus size={17} /> Add manually
              </button>
            </div>
          )}
          {!loading && !error && !hasSearched && (
            <div className="search-welcome">
              <span><Database size={30} /></span>
              <h2>Search thousands of foods</h2>
              <p>
                Use a product name, brand, or everyday food. Every result can be corrected before
                it reaches your log.
              </p>
            </div>
          )}
        </section>
      ) : filteredLocalFoods.length ? (
        <div className="food-library-grid">
          {filteredLocalFoods.map((food) => (
            <article className="library-card" key={food.id}>
              <div className="library-card-top">
                <span className="food-avatar">{food.name.slice(0, 2).toUpperCase()}</span>
                {tab === "saved" && (
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => deleteSavedFood(food.id)}
                    aria-label={`Delete ${food.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {tab === "recent" && food.databaseSource && (
                  <i className={`source-badge source-badge--${food.databaseSource === "USDA" ? "usda" : "off"}`}>
                    {food.databaseSource}
                  </i>
                )}
              </div>
              <h3>{food.name}</h3>
              <p>{food.brand || "Custom food"} · {food.servingSize}</p>
              <div className="library-macros">
                <strong>{Math.round(food.calories)} kcal</strong>
                <span>{food.protein}P</span>
                <span>{food.carbs}C</span>
                <span>{food.fat}F</span>
              </div>
              <button
                className="button button--secondary button--full"
                type="button"
                onClick={() => onLogFood(toDraft(food))}
              >
                <Plus size={16} /> Add to today
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>{tab === "saved" ? <Bookmark size={28} /> : <Clock3 size={28} />}</span>
          <h2>
            {localFilter
              ? "No matching foods"
              : tab === "saved"
                ? "Save your first food"
                : "No recent foods yet"}
          </h2>
          <p>
            {localFilter
              ? "Try a different filter."
              : "Foods you log will show up here without endless duplicates."}
          </p>
          {!localFilter && (
            <button className="button button--primary" type="button" onClick={onAddFood}>
              <Plus size={17} /> Add a food
            </button>
          )}
        </div>
      )}
    </div>
  );
}
