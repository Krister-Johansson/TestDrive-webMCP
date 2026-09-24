import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";
import { carName } from "@/lib/format";
import { placeholderPalette } from "@/lib/placeholder";
import { cn } from "@/lib/utils";

const PATHS = {
  suv: "M14 62 L22 40 Q26 30 40 28 L74 22 Q92 20 104 30 L122 42 L152 46 Q166 48 168 58 L170 64 Q170 70 164 70 L18 70 Q12 70 12 64 Z",
  sedan: "M10 64 L20 48 Q26 40 42 38 L68 26 Q82 22 98 26 L124 38 L150 44 Q166 46 170 56 L172 64 Q172 70 166 70 L16 70 Q10 70 10 64 Z",
  wagon: "M12 64 L18 44 Q22 36 34 34 L62 26 Q72 24 82 26 L118 28 Q134 30 146 40 L156 46 L168 50 Q172 54 172 62 L172 66 Q172 70 166 70 L16 70 Q12 70 12 64 Z",
  hatchback: "M14 64 L22 44 Q26 36 38 34 L64 24 Q78 20 92 24 L120 34 L142 42 Q160 46 164 56 L166 64 Q166 70 160 70 L18 70 Q12 70 12 64 Z",
  coupe: "M10 64 L22 52 Q28 44 46 40 L70 26 Q86 20 104 26 L128 40 L154 46 Q170 50 172 60 L172 64 Q172 70 166 70 L16 70 Q10 70 10 64 Z",
} as const;

/**
 * The generated stand-in for cars without photos: a color derived from the car id,
 * the brand and model as type, the body type, and a faint silhouette. Pure SVG, no assets.
 */
export function CarPlaceholder({ car, className }: { car: Car; className?: string }) {
  const palette = placeholderPalette(car.id);
  const gradientId = `ph-${car.id}`;
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label={carName(car)}
      data-placeholder
      className={cn("block h-full w-full", className)}
      style={{ background: palette.background }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.background} />
          <stop offset="1" stopColor={palette.accent} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${gradientId})`} />
      <g transform="translate(150 96) scale(0.95)" fill={palette.text} opacity="0.16">
        <path d={PATHS[car.bodyType]} />
        <circle cx="48" cy="68" r="10" />
        <circle cx="136" cy="68" r="10" />
      </g>
      <text x="22" y="44" fill={palette.text} fontSize="13" fontWeight="600" letterSpacing="2" opacity="0.8">
        {car.brand.toUpperCase()}
      </text>
      <text x="22" y="82" fill={palette.text} fontSize="36" fontWeight="700" letterSpacing="-1">
        {car.model}
      </text>
      <text x="22" y="176" fill={palette.text} fontSize="12" fontWeight="500" opacity="0.8">
        {ENUM_LABELS.bodyType[car.bodyType]} · {car.color}
      </text>
    </svg>
  );
}
