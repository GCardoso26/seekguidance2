"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CardSearchInput({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar carta…"
        data-testid="search-card"
        className="min-w-[200px] flex-1 surface-card rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
