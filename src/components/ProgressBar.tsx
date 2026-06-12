interface ProgressBarProps {
  value: number;
  goal: number;
  color: string;
  label?: string;
}

export function ProgressBar({ value, goal, color, label }: ProgressBarProps) {
  const percent = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.round(value)}
    >
      <span className="progress-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
    </div>
  );
}
