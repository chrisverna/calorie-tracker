import { MACRO_COLORS } from "../constants";
import type { Nutrition } from "../types";

interface MacroDonutProps {
  totals: Nutrition;
}

export function MacroDonut({ totals }: MacroDonutProps) {
  const values = [
    { key: "protein", value: totals.protein * 4, color: MACRO_COLORS.protein },
    { key: "carbs", value: totals.carbs * 4, color: MACRO_COLORS.carbs },
    { key: "fat", value: totals.fat * 9, color: MACRO_COLORS.fat }
  ];
  const actualTotal = values.reduce((sum, item) => sum + item.value, 0);
  const total = actualTotal || 1;
  let offset = 0;

  return (
    <div className="macro-donut">
      <svg viewBox="0 0 42 42" aria-label="Macro calorie split">
        <circle className="donut-track" cx="21" cy="21" r="15.9" />
        {values.map((item) => {
          const portion = (item.value / total) * 100;
          const circle = (
            <circle
              key={item.key}
              className="donut-segment"
              cx="21"
              cy="21"
              r="15.9"
              stroke={item.color}
              strokeDasharray={`${portion} ${100 - portion}`}
              strokeDashoffset={-offset}
            />
          );
          offset += portion;
          return circle;
        })}
      </svg>
      <div>
        <strong>{Math.round(actualTotal)}</strong>
        <span>macro kcal</span>
      </div>
    </div>
  );
}
