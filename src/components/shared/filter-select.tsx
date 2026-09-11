import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectProps extends React.ComponentProps<"select"> {
  name: string;
  label?: string;
  placeholder?: string;
  options: FilterOption[];
  defaultValue?: string;
  hideLabel?: boolean;
}

export function FilterSelect({
  name,
  label,
  placeholder,
  options,
  defaultValue = "",
  hideLabel = true,
  className,
  id,
  ...props
}: FilterSelectProps) {
  const selectId = id || `filter-${name}`;
  const displayLabel = label || placeholder || name;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
      {displayLabel && (
        <label
          htmlFor={selectId}
          className={cn(
            "text-xs font-medium text-muted-foreground",
            hideLabel && "sr-only",
          )}
        >
          {displayLabel}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        defaultValue={defaultValue}
        aria-label={displayLabel}
        className={cn(
          "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface FilterSubmitProps extends React.ComponentProps<typeof Button> {
  text?: string;
}

export function FilterSubmit({
  text = "Filter",
  className,
  size = "sm",
  ...props
}: FilterSubmitProps) {
  return (
    <Button
      type="submit"
      size={size}
      className={cn("h-9 font-medium shadow-xs", className)}
      {...props}
    >
      {text}
    </Button>
  );
}
