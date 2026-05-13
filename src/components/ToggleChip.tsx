import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToggleChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  children: ReactNode;
}

export const ToggleChip = ({ active, children, className, ...props }: ToggleChipProps) => (
  <button
    type="button"
    className={cn(
      "h-12 rounded-xl px-4 font-semibold text-sm transition-smooth border",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-glow"
        : "bg-secondary/60 text-foreground border-border hover:bg-secondary",
      className
    )}
    {...props}
  >
    {children}
  </button>
);
