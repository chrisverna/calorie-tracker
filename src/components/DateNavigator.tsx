import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, isToday, parseISO } from "date-fns";

interface DateNavigatorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateNavigator({ value, onChange }: DateNavigatorProps) {
  const date = parseISO(value);
  const move = (amount: number) => onChange(format(addDays(date, amount), "yyyy-MM-dd"));

  return (
    <div className="date-navigator">
      <button className="icon-button icon-button--soft" onClick={() => move(-1)} aria-label="Previous day">
        <ChevronLeft size={19} />
      </button>
      <label className="date-display">
        <span>{isToday(date) ? "Today" : format(date, "EEEE")}</span>
        <strong>{format(date, "MMMM d")}</strong>
        <input
          type="date"
          value={value}
          onChange={(event) => event.target.value && onChange(event.target.value)}
          aria-label="Choose date"
        />
      </label>
      <button className="icon-button icon-button--soft" onClick={() => move(1)} aria-label="Next day">
        <ChevronRight size={19} />
      </button>
    </div>
  );
}
