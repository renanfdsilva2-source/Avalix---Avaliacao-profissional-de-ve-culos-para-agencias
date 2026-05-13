import { Minus, Plus } from "lucide-react";

interface CounterProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export const Counter = ({ label, hint, value, onChange, min = 0, max = 99 }: CounterProps) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <div className="font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-9 w-9 rounded-lg bg-secondary hover:bg-secondary/70 text-foreground flex items-center justify-center transition-smooth disabled:opacity-40"
          disabled={value <= min}
          aria-label="Diminuir"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow flex items-center justify-center transition-smooth shadow-glow"
          aria-label="Aumentar"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
