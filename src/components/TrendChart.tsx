import type { DailyTrend } from "../lib/nutrition";

interface TrendChartProps {
  data: DailyTrend[];
  goal: number;
  metric?: "calories" | "protein" | "carbs" | "fat";
  color?: string;
}

export function TrendChart({
  data,
  goal,
  metric = "calories",
  color = "#153c35"
}: TrendChartProps) {
  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 18, bottom: 42, left: 18 };
  const max = Math.max(goal * 1.25, ...data.map((item) => item.nutrition[metric]), 1);
  const x = (index: number) =>
    padding.left + (index / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top + (1 - value / max) * (height - padding.top - padding.bottom);
  const line = data.map((item, index) => `${x(index)},${y(item.nutrition[metric])}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${x(data.length - 1)},${
    height - padding.bottom
  }`;

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric} trend chart`}>
        <defs>
          <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          className="chart-goal"
          x1={padding.left}
          x2={width - padding.right}
          y1={y(goal)}
          y2={y(goal)}
        />
        <text className="chart-goal-label" x={width - padding.right} y={y(goal) - 7}>
          goal
        </text>
        <polygon points={area} fill={`url(#area-${metric})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        {data.map((item, index) => (
          <g key={item.date}>
            <circle cx={x(index)} cy={y(item.nutrition[metric])} r="5" fill={color} />
            <text className="chart-axis-label" x={x(index)} y={height - 14} textAnchor="middle">
              {item.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
