import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  containerClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, containerClassName, className, id, ...props }, ref) => {
    const inputId = id || `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div className={cn("space-y-2", containerClassName)}>
        <label htmlFor={inputId} className="field-label block">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-12 rounded-xl bg-input/70 border border-border px-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-smooth",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Field.displayName = "Field";
