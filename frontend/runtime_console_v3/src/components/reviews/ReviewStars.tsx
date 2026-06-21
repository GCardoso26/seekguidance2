"use client";

const LABELS = ["Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
};

export function ReviewStars({ value, onChange, size = "md", readonly = false }: Props) {
  const starSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-xl";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1" role="group" aria-label="Avaliação em estrelas">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => {}}
            className={`${starSize} ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition ${
              star <= value ? "text-luxury-gold" : "text-white/20"
            }`}
            aria-label={`${star} estrelas`}
          >
            ★
          </button>
        ))}
      </div>
      {!readonly && value > 0 && (
        <span className="text-xs text-luxury-mist">{LABELS[value - 1]}</span>
      )}
    </div>
  );
}

export function ReviewStarsDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return <ReviewStars value={Math.round(rating)} readonly size={size === "md" ? "md" : "sm"} />;
}
