import { Bookmark, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { MEALS } from "../constants";
import { useApp } from "../state/AppContext";
import type { FoodDraft, FoodEntry, MealType } from "../types";
import { Modal } from "./Modal";

const EMPTY_DRAFT: FoodDraft = {
  name: "",
  brand: "",
  servingSize: "1 serving",
  servings: 1,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  source: "manual"
};

interface FoodFormModalProps {
  open: boolean;
  initialFood?: FoodDraft | FoodEntry | null;
  initialMeal?: MealType;
  onClose: () => void;
}

export function FoodFormModal({
  open,
  initialFood,
  initialMeal = "breakfast",
  onClose
}: FoodFormModalProps) {
  const { addEntry, updateEntry, saveFood, selectedDate } = useApp();
  const [draft, setDraft] = useState<FoodDraft>(EMPTY_DRAFT);
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const editing = initialFood && "id" in initialFood ? initialFood : null;

  useEffect(() => {
    if (!open) return;
    const source = initialFood ?? EMPTY_DRAFT;
    setDraft({
      name: source.name,
      brand: source.brand ?? "",
      servingSize: source.servingSize,
      servings: source.servings,
      calories: source.calories,
      protein: source.protein,
      carbs: source.carbs,
      fat: source.fat,
      barcode: source.barcode,
      source: source.source ?? "manual",
      databaseSource: source.databaseSource,
      externalId: source.externalId
    });
    setMeal(editing?.meal ?? initialMeal);
    setSaveToLibrary(false);
  }, [editing, initialFood, initialMeal, open]);

  const setText = (key: "name" | "brand" | "servingSize", value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setNumber = (
    key: "servings" | "calories" | "protein" | "carbs" | "fat",
    value: string
  ) => {
    setDraft((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const cleanDraft = { ...draft, name: draft.name.trim(), brand: draft.brand?.trim() };
    if (editing) {
      updateEntry(editing.id, { ...cleanDraft, meal });
    } else {
      addEntry(cleanDraft, meal, selectedDate);
    }
    if (saveToLibrary) saveFood({ ...cleanDraft, servings: 1 });
    onClose();
  };

  const searchedFood = !editing && draft.source === "search";

  return (
    <Modal
      open={open}
      title={editing ? "Edit food" : searchedFood ? "Review food" : "Add food"}
      eyebrow={
        editing
          ? "Update your log"
          : searchedFood
            ? `${draft.databaseSource ?? "Food database"} result`
            : `Log for ${selectedDate}`
      }
      onClose={onClose}
    >
      <form className="food-form" onSubmit={handleSubmit}>
        <div className="field-grid field-grid--2">
          <label className="field field--span">
            <span>Food name</span>
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => setText("name", event.target.value)}
              placeholder="e.g. Greek yogurt"
              required
            />
          </label>
          <label className="field">
            <span>Brand <small>optional</small></span>
            <input
              value={draft.brand ?? ""}
              onChange={(event) => setText("brand", event.target.value)}
              placeholder="Brand or homemade"
            />
          </label>
          <label className="field">
            <span>Serving size</span>
            <input
              value={draft.servingSize}
              onChange={(event) => setText("servingSize", event.target.value)}
              placeholder="1 cup, 100 g..."
              required
            />
          </label>
          <label className="field">
            <span>Number of servings</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={draft.servings}
              onChange={(event) => setNumber("servings", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Meal</span>
            <select value={meal} onChange={(event) => setMeal(event.target.value as MealType)}>
              {MEALS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-section-heading">
          <div>
            <p className="eyebrow">Per serving</p>
            <h3>Nutrition</h3>
          </div>
          <span className="nutrition-preview">
            {Math.round(draft.calories * draft.servings)} kcal total
          </span>
        </div>

        <div className="nutrition-fields">
          <label className="field field--calories">
            <span>Calories</span>
            <input
              type="number"
              min="0"
              step="1"
              value={draft.calories}
              onChange={(event) => setNumber("calories", event.target.value)}
            />
            <small>kcal</small>
          </label>
          <label className="field field--protein">
            <span>Protein</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.protein}
              onChange={(event) => setNumber("protein", event.target.value)}
            />
            <small>grams</small>
          </label>
          <label className="field field--carbs">
            <span>Carbs</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.carbs}
              onChange={(event) => setNumber("carbs", event.target.value)}
            />
            <small>grams</small>
          </label>
          <label className="field field--fat">
            <span>Fat</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.fat}
              onChange={(event) => setNumber("fat", event.target.value)}
            />
            <small>grams</small>
          </label>
        </div>

        <div className="nutrition-total-row">
          <span><small>Total calories</small><strong>{Math.round(draft.calories * draft.servings)} kcal</strong></span>
          <span><small>Protein</small><strong>{(draft.protein * draft.servings).toFixed(1)}g</strong></span>
          <span><small>Carbs</small><strong>{(draft.carbs * draft.servings).toFixed(1)}g</strong></span>
          <span><small>Fat</small><strong>{(draft.fat * draft.servings).toFixed(1)}g</strong></span>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(event) => setSaveToLibrary(event.target.checked)}
          />
          <span className="check-icon"><Bookmark size={17} /></span>
          <span>
            <strong>Save to my foods</strong>
            <small>Make this easy to log again</small>
          </span>
        </label>

        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary">
            <Save size={17} />
            {editing ? "Save changes" : searchedFood ? "Add to today" : "Add to log"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
