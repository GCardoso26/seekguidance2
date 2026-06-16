"use client";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  maxDate?: string;
  className?: string;
};

export function DatePicker({ value, onChange, maxDate, className }: Props) {
  const max = maxDate ?? new Date().toISOString().slice(0, 10);
  return (
    <input
      type="date"
      value={value ?? ""}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "luxury-input"}
    />
  );
}
