import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createId } from "../lib/id";
import { sumNutrition } from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import type { RecipeItem } from "../types";
import { Modal } from "./Modal";

const EMPTY_ITEM: RecipeItem = {
  id: "",
  name: "",
  servingSize: "1 serving",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

interface RecipeFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function RecipeFormModal({ open, onClose }: RecipeFormModalProps) {
  const { addRecipe } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(4);
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [item, setItem] = useState<RecipeItem>(EMPTY_ITEM);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setServings(4);
    setItems([]);
    setItem(EMPTY_ITEM);
  }, [open]);

  const setItemNumber = (key: "calories" | "protein" | "carbs" | "fat", value: string) => {
    setItem((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  };

  const addItem = () => {
    if (!item.name.trim()) return;
    setItems((current) => [...current, { ...item, id: createId(), name: item.name.trim() }]);
    setItem(EMPTY_ITEM);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !items.length) return;
    addRecipe({ name: name.trim(), description: description.trim(), servings, items });
    onClose();
  };

  const total = sumNutrition(items);

  return (
    <Modal open={open} title="Create a meal" eyebrow="Reusable recipe" wide onClose={onClose}>
      <form className="recipe-form" onSubmit={handleSubmit}>
        <div className="field-grid field-grid--2">
          <label className="field">
            <span>Meal name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weeknight turkey chili"
              required
            />
          </label>
          <label className="field">
            <span>Recipe servings</span>
            <input
              type="number"
              min="1"
              step="1"
              value={servings}
              onChange={(event) => setServings(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>
          <label className="field field--span">
            <span>Description <small>optional</small></span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A note that helps you recognize it"
            />
          </label>
        </div>

        <div className="recipe-builder">
          <div className="recipe-builder-heading">
            <div>
              <p className="eyebrow">Ingredients</p>
              <h3>Add each food</h3>
            </div>
            <span>{items.length} items</span>
          </div>

          <div className="ingredient-grid">
            <label className="field ingredient-name">
              <span>Food</span>
              <input
                value={item.name}
                onChange={(event) => setItem((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ingredient name"
              />
            </label>
            <label className="field">
              <span>Amount</span>
              <input
                value={item.servingSize}
                onChange={(event) =>
                  setItem((current) => ({ ...current, servingSize: event.target.value }))
                }
                placeholder="1 cup"
              />
            </label>
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <label className="field" key={key}>
                <span>{key === "calories" ? "Kcal" : key[0].toUpperCase()}</span>
                <input
                  type="number"
                  min="0"
                  step={key === "calories" ? "1" : "0.1"}
                  value={item[key]}
                  onChange={(event) => setItemNumber(key, event.target.value)}
                />
              </label>
            ))}
            <button className="button button--secondary ingredient-add" type="button" onClick={addItem}>
              <Plus size={17} /> Add
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="ingredient-list">
            {items.map((ingredient) => (
              <div key={ingredient.id}>
                <span>
                  <strong>{ingredient.name}</strong>
                  <small>{ingredient.servingSize}</small>
                </span>
                <span className="ingredient-values">
                  <strong>{ingredient.calories} kcal</strong>
                  <small>{ingredient.protein}P · {ingredient.carbs}C · {ingredient.fat}F</small>
                </span>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() =>
                    setItems((current) => current.filter((entry) => entry.id !== ingredient.id))
                  }
                  aria-label={`Remove ${ingredient.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="recipe-total">
          <span>
            <small>Per serving</small>
            <strong>{Math.round(total.calories / servings)} kcal</strong>
          </span>
          <span>{(total.protein / servings).toFixed(1)}g protein</span>
          <span>{(total.carbs / servings).toFixed(1)}g carbs</span>
          <span>{(total.fat / servings).toFixed(1)}g fat</span>
        </div>

        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={!name || !items.length}>
            <Save size={17} /> Save meal
          </button>
        </div>
      </form>
    </Modal>
  );
}
