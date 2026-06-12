import { CalendarDays, Search } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { DateNavigator } from "../components/DateNavigator";
import { EntryRow } from "../components/EntryRow";
import { entriesForDate, getRollingTrend, totalsForDate } from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import type { FoodEntry } from "../types";

interface HistoryPageProps {
  onEditFood: (entry: FoodEntry) => void;
}

export function HistoryPage({ onEditFood }: HistoryPageProps) {
  const { state, selectedDate, setSelectedDate, deleteEntry } = useApp();
  const [query, setQuery] = useState("");
  const days = getRollingTrend(state.entries, selectedDate, 14).reverse();
  const entries = entriesForDate(state.entries, selectedDate).filter((entry) =>
    `${entry.name} ${entry.brand ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  const totals = totalsForDate(state.entries, selectedDate);
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        totalsForDate(
          state.entries,
          format(subDays(parseISO(selectedDate), index), "yyyy-MM-dd")
        )
      ),
    [selectedDate, state.entries]
  );
  const average = Math.round(week.reduce((sum, day) => sum + day.calories, 0) / 7);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Look back without judgment</p>
          <h1>History</h1>
          <p>Review past days, spot patterns, and make your log work for you.</p>
        </div>
        <DateNavigator value={selectedDate} onChange={setSelectedDate} />
      </header>

      <div className="history-summary">
        <div>
          <small>Selected day</small>
          <strong>{totals.calories.toLocaleString()} kcal</strong>
          <span>{Math.round(totals.protein)}P · {Math.round(totals.carbs)}C · {Math.round(totals.fat)}F</span>
        </div>
        <div>
          <small>7-day average</small>
          <strong>{average.toLocaleString()} kcal</strong>
          <span>{state.goals.calories - average >= 0 ? "Below" : "Above"} target by {Math.abs(state.goals.calories - average)} kcal</span>
        </div>
      </div>

      <section className="history-calendar">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent days</p>
            <h2>Two-week view</h2>
          </div>
          <CalendarDays size={20} />
        </div>
        <div className="day-strip">
          {days.map((day) => (
            <button
              type="button"
              key={day.date}
              className={day.date === selectedDate ? "active" : ""}
              onClick={() => setSelectedDate(day.date)}
            >
              <small>{format(parseISO(day.date), "EEE")}</small>
              <strong>{format(parseISO(day.date), "d")}</strong>
              <span className={day.nutrition.calories ? "has-data" : ""} />
            </button>
          ))}
        </div>
      </section>

      <section className="history-log">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{format(parseISO(selectedDate), "MMMM d, yyyy")}</p>
            <h2>Food log</h2>
          </div>
          <label className="search-field search-field--compact">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter entries"
            />
          </label>
        </div>
        {entries.length ? (
          <div className="history-entry-list">
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={onEditFood}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        ) : (
          <div className="empty-log">
            <p>{query ? "No entries match that search." : "No foods were logged on this day."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
