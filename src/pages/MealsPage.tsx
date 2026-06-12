import { ChefHat, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { sumNutrition } from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import type { MealType } from "../types";

interface MealsPageProps {
  onCreateRecipe: () => void;
}

export function MealsPage({ onCreateRecipe }: MealsPageProps) {
  const { state, logRecipe, deleteRecipe, selectedDate } = useApp();
  const [mealChoices, setMealChoices] = useState<Record<string, MealType>>({});

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cook once, log easily</p>
          <h1>Meals & recipes</h1>
          <p>Bundle ingredients into reusable meals with nutrition per serving.</p>
        </div>
        <button className="button button--primary" type="button" onClick={onCreateRecipe}>
          <Plus size={17} /> New meal
        </button>
      </header>

      {state.recipes.length ? (
        <div className="recipe-grid">
          {state.recipes.map((recipe) => {
            const total = sumNutrition(recipe.items);
            const perServing = {
              calories: total.calories / recipe.servings,
              protein: total.protein / recipe.servings,
              carbs: total.carbs / recipe.servings,
              fat: total.fat / recipe.servings
            };
            return (
              <article className="recipe-card" key={recipe.id}>
                <header>
                  <span><ChefHat size={22} /></span>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => deleteRecipe(recipe.id)}
                    aria-label={`Delete ${recipe.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </header>
                <h2>{recipe.name}</h2>
                <p>{recipe.description || `${recipe.items.length} ingredients`}</p>
                <div className="recipe-nutrition">
                  <span><strong>{Math.round(perServing.calories)}</strong><small>kcal</small></span>
                  <span><strong>{perServing.protein.toFixed(1)}g</strong><small>protein</small></span>
                  <span><strong>{perServing.carbs.toFixed(1)}g</strong><small>carbs</small></span>
                  <span><strong>{perServing.fat.toFixed(1)}g</strong><small>fat</small></span>
                </div>
                <div className="recipe-log-row">
                  <select
                    value={mealChoices[recipe.id] ?? "dinner"}
                    onChange={(event) =>
                      setMealChoices((current) => ({
                        ...current,
                        [recipe.id]: event.target.value as MealType
                      }))
                    }
                    aria-label={`Meal for ${recipe.name}`}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snacks">Snacks</option>
                  </select>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => logRecipe(recipe, mealChoices[recipe.id] ?? "dinner", selectedDate)}
                  >
                    <Plus size={16} /> Log serving
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state empty-state--large">
          <span><UtensilsCrossed size={30} /></span>
          <h2>Your repeat meals, made simple</h2>
          <p>Create a recipe, add its ingredients, and log one serving without doing the math again.</p>
          <button className="button button--primary" type="button" onClick={onCreateRecipe}>
            <Plus size={17} /> Create your first meal
          </button>
        </div>
      )}
    </div>
  );
}
