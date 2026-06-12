import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { scaleNutrition } from "../lib/nutrition";
import type { FoodEntry } from "../types";

interface EntryRowProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const total = scaleNutrition(entry, entry.servings);
  const initials = entry.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="entry-row">
      <span className="food-avatar">{initials}</span>
      <button className="entry-main" type="button" onClick={() => onEdit(entry)}>
        <strong>{entry.name}</strong>
        <small>
          {entry.servings !== 1 ? `${entry.servings} × ` : ""}
          {entry.servingSize}
          {entry.brand ? ` · ${entry.brand}` : ""}
        </small>
      </button>
      <div className="entry-macros">
        <strong>{total.calories}</strong>
        <small>kcal</small>
      </div>
      <div className="entry-menu">
        <button
          className="icon-button"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`Actions for ${entry.name}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal size={19} />
        </button>
        {menuOpen && (
          <div className="popover-menu">
            <button type="button" onClick={() => onEdit(entry)}>
              <Pencil size={15} /> Edit
            </button>
            <button type="button" className="danger" onClick={() => onDelete(entry.id)}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
