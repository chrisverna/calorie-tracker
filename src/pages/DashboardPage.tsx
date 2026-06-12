import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Plus,
  ScanLine,
  Sparkles
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Link } from "react-router-dom";
import { MACRO_COLORS, MEALS } from "../constants";
import {
  entriesForDate,
  goalTone,
  remaining,
  totalsForDate
} from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import type { FoodEntry, MealType } from "../types";
import { CalorieRing } from "../components/CalorieRing";
import { DateNavigator } from "../components/DateNavigator";
import { EntryRow } from "../components/EntryRow";
import { MacroDonut } from "../components/MacroDonut";
import { ProgressBar } from "../components/ProgressBar";

const MACRO_PERCENT_KEYS = {
  protein: "proteinPercent",
  carbs: "carbsPercent",
  fat: "fatPercent"
} as const;

interface DashboardPageProps {
  onAddFood: (meal?: MealType) => void;
  onEditFood: (entry: FoodEntry) => void;
  onScan: () => void;
}

export function DashboardPage({ onAddFood, onEditFood, onScan }: DashboardPageProps) {
  const { state, selectedDate, setSelectedDate, deleteEntry, copyDay } = useApp();
  const entries = entriesForDate(state.entries, selectedDate);
  const totals = totalsForDate(state.entries, selectedDate);
  const left = remaining(totals, state.goals);
  const tone = goalTone(totals.calories, state.goals.calories);
  const previousDate = format(subDays(new Date(`${selectedDate}T12:00:00`), 1), "yyyy-MM-dd");
  const previousCount = entriesForDate(state.entries, previousDate).length;

  return (
    <div className="page dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Your daily rhythm</p>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}.</h1>
          <p>Small choices add up. Here is where today stands.</p>
        </div>
        <DateNavigator value={selectedDate} onChange={setSelectedDate} />
      </header>

      <section className={`daily-summary daily-summary--${tone}`}>
        <div className="summary-intro">
          <span className="summary-kicker">
            {tone === "over" ? "A little over" : tone === "near" ? "Right on track" : "Room to fuel"}
          </span>
          <h2>Daily energy</h2>
          <p>
            {tone === "over"
              ? "No judgment, just useful information for the next choice."
              : tone === "near"
                ? "You are landing close to today’s energy target."
                : "A balanced day is taking shape. Keep listening to what you need."}
          </p>
          <div className="summary-actions">
            <button className="button button--light" type="button" onClick={() => onAddFood()}>
              <Plus size={17} /> Add food
            </button>
            <button className="button button--quiet-light" type="button" onClick={onScan}>
              <ScanLine size={17} /> Scan
            </button>
          </div>
        </div>
        <CalorieRing consumed={totals.calories} goal={state.goals.calories} />
        <div className="summary-equation">
          <span><strong>{state.goals.calories.toLocaleString()}</strong><small>goal</small></span>
          <b>−</b>
          <span><strong>{totals.calories.toLocaleString()}</strong><small>eaten</small></span>
          <b>=</b>
          <span><strong>{left.calories.toLocaleString()}</strong><small>left</small></span>
        </div>
      </section>

      <section className="macro-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The building blocks</p>
            <h2>Macros</h2>
          </div>
          <span className="gentle-badge"><Sparkles size={14} /> Based on today</span>
        </div>
        <div className="macro-layout">
          <div className="macro-cards">
            {(["protein", "carbs", "fat"] as const).map((macro) => (
              <article className="macro-card" key={macro}>
                <div className="macro-card-heading">
                  <span className={`macro-dot macro-dot--${macro}`} />
                  <strong>{macro[0].toUpperCase() + macro.slice(1)}</strong>
                  <span>
                    {Math.round(totals[macro])}{" "}
                    <small>
                      / {state.goals[macro]}g · {state.goals[MACRO_PERCENT_KEYS[macro]]}%
                    </small>
                  </span>
                </div>
                <ProgressBar
                  value={totals[macro]}
                  goal={state.goals[macro]}
                  color={MACRO_COLORS[macro]}
                  label={`${macro} progress`}
                />
                <p>
                  {left[macro] > 0
                    ? `${Math.round(left[macro])}g left for today`
                    : `${Math.abs(Math.round(left[macro]))}g over today`}
                </p>
              </article>
            ))}
          </div>
          <div className="macro-split-card">
            <MacroDonut totals={totals} />
            <div className="macro-legend">
              <strong>Today’s split</strong>
              <p>Calories estimated from logged protein, carbs, and fat.</p>
              <span><i className="legend-protein" /> Protein</span>
              <span><i className="legend-carbs" /> Carbs</span>
              <span><i className="legend-fat" /> Fat</span>
            </div>
          </div>
        </div>
      </section>

      <section className="meals-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your plate, organized</p>
            <h2>Meals</h2>
          </div>
          {previousCount > 0 && (
            <button
              className="button button--ghost"
              type="button"
              onClick={() => copyDay(previousDate)}
            >
              <ClipboardCopy size={16} /> Copy yesterday
            </button>
          )}
        </div>

        <div className="meal-list">
          {MEALS.map((meal) => {
            const mealEntries = entries.filter((entry) => entry.meal === meal.id);
            const mealCalories = mealEntries.reduce(
              (sum, entry) => sum + entry.calories * entry.servings,
              0
            );
            return (
              <article className="meal-card" key={meal.id}>
                <header>
                  <div className={`meal-icon meal-icon--${meal.id}`}>
                    {meal.label.slice(0, 1)}
                  </div>
                  <div>
                    <h3>{meal.label}</h3>
                    <p>{mealEntries.length ? `${Math.round(mealCalories)} kcal` : meal.hint}</p>
                  </div>
                  <button
                    className="button button--small"
                    type="button"
                    onClick={() => onAddFood(meal.id)}
                  >
                    <Plus size={15} /> Add
                  </button>
                </header>
                {mealEntries.length > 0 ? (
                  <div className="meal-entries">
                    {mealEntries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={onEditFood}
                        onDelete={deleteEntry}
                      />
                    ))}
                  </div>
                ) : (
                  <button className="empty-meal" type="button" onClick={() => onAddFood(meal.id)}>
                    <span>Nothing logged yet</span>
                    <span>Add your first item <ChevronRight size={15} /></span>
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {entries.length > 0 && tone !== "over" && (
        <div className="day-note">
          <CheckCircle2 size={20} />
          <div>
            <strong>Your log is taking shape.</strong>
            <p>Keep it honest, keep it useful, and let perfection sit this one out.</p>
          </div>
          <Link to="/progress">See the trend <ArrowRight size={15} /></Link>
        </div>
      )}
    </div>
  );
}
