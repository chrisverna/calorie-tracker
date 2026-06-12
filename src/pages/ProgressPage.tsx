import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useState } from "react";
import { MACRO_COLORS } from "../constants";
import { getRollingTrend, getWeekTrend } from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import { TrendChart } from "../components/TrendChart";

export function ProgressPage() {
  const { state, selectedDate } = useApp();
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const trend = range === 7 ? getWeekTrend(state.entries, selectedDate) : getRollingTrend(state.entries, selectedDate, range);
  const loggedDays = trend.filter((day) => day.nutrition.calories > 0);
  const average = (key: "calories" | "protein" | "carbs" | "fat") =>
    loggedDays.length
      ? loggedDays.reduce((sum, day) => sum + day.nutrition[key], 0) / loggedDays.length
      : 0;
  const calorieAverage = Math.round(average("calories"));
  const difference = calorieAverage - state.goals.calories;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Patterns over perfection</p>
          <h1>Progress</h1>
          <p>Use the trend, not a single day, to understand how things are going.</p>
        </div>
        <div className="segmented-control">
          {([7, 14, 30] as const).map((days) => (
            <button key={days} className={range === days ? "active" : ""} onClick={() => setRange(days)}>
              {days} days
            </button>
          ))}
        </div>
      </header>

      <div className="progress-stat-grid">
        <article>
          <span className="stat-icon"><Activity size={20} /></span>
          <small>Daily average</small>
          <strong>{calorieAverage.toLocaleString()} <em>kcal</em></strong>
          <p className={difference > 0 ? "negative" : difference < 0 ? "positive" : ""}>
            {difference > 0 ? <ArrowUpRight size={15} /> : difference < 0 ? <ArrowDownRight size={15} /> : <Minus size={15} />}
            {Math.abs(difference)} from goal
          </p>
        </article>
        {(["protein", "carbs", "fat"] as const).map((macro) => (
          <article key={macro}>
            <span className={`macro-dot macro-dot--${macro}`} />
            <small>Average {macro}</small>
            <strong>{Math.round(average(macro))}<em>g</em></strong>
            <p>{Math.round((average(macro) / state.goals[macro]) * 100 || 0)}% of goal</p>
          </article>
        ))}
      </div>

      <section className="chart-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Energy</p>
            <h2>Calorie trend</h2>
          </div>
          <span className="chart-key"><i /> Daily intake <b /> Goal</span>
        </div>
        <TrendChart data={trend} goal={state.goals.calories} />
      </section>

      <section className="macro-trend-grid">
        {(["protein", "carbs", "fat"] as const).map((macro) => (
          <article className="chart-card chart-card--small" key={macro}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Daily grams</p>
                <h2>{macro[0].toUpperCase() + macro.slice(1)}</h2>
              </div>
              <strong style={{ color: MACRO_COLORS[macro] }}>{Math.round(average(macro))}g avg</strong>
            </div>
            <TrendChart
              data={trend}
              goal={state.goals[macro]}
              metric={macro}
              color={MACRO_COLORS[macro]}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
