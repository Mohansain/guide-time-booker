import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "size-3.5", md: "size-4.5", lg: "size-7" } as const;

export function StarRating({ value, onChange, size = "md", className }: StarRatingProps) {
  const interactive = !!onChange;

  return (
    <div className={cn("flex items-center gap-1", className)} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Star
            className={cn(
              sizes[size],
              "transition-colors",
              filled ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            className="cursor-pointer rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        );
      })}
    </div>
  );
}
