import React from "react";

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: "sm" | "md" | "lg";
}

export function MetricDisplay({ label, value, unit, size = "md" }: MetricDisplayProps) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`${sizes[size]} font-bold tabular-nums`}>
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}
