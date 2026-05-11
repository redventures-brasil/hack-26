"use client";

type Props = {
  value: number | null;
  onChange?: (v: number) => void;
  size?: "md" | "lg";
  readOnly?: boolean;
  label?: string;
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
  label,
}: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div
      className={`star-rating ${size} ${readOnly ? "ro" : ""}`}
      role={readOnly ? undefined : "radiogroup"}
      aria-label={label ?? "Avaliação de 1 a 5 estrelas"}
    >
      {stars.map((n) => {
        const filled = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            className={`star ${filled ? "on" : ""}`}
            onClick={() => onChange?.(n)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            aria-pressed={filled}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.95 6.55 7.05.75-5.3 4.95 1.55 7-6.25-3.7-6.25 3.7 1.55-7L2 9.8l7.05-.75L12 2.5z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
