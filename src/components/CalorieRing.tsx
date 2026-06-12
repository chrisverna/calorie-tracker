interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const percent = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const over = consumed > goal;

  return (
    <div className={`calorie-ring ${over ? "calorie-ring--over" : ""}`}>
      <svg viewBox="0 0 190 190" aria-hidden="true">
        <circle className="ring-track" cx="95" cy="95" r={radius} />
        <circle
          className="ring-value"
          cx="95"
          cy="95"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent)}
        />
      </svg>
      <div className="ring-label">
        <strong>{Math.round(over ? consumed - goal : remaining).toLocaleString()}</strong>
        <span>{over ? "over" : "remaining"}</span>
        <small>{Math.round(consumed).toLocaleString()} eaten</small>
      </div>
    </div>
  );
}
