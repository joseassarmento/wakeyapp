import { cn } from "@/lib/utils";

type Variant = "happy" | "sleepy" | "walking";

interface MascotProps {
  variant?: Variant;
  size?: number;
  className?: string;
}

export const Mascot = ({ variant = "happy", size = 180, className }: MascotProps) => {
  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {variant === "sleepy" && (
        <div className="absolute inset-x-0 -top-6 flex justify-center gap-1 pointer-events-none">
          <span
            className="text-ink/80 animate-zzz"
            style={{ fontSize: size * 0.13, fontWeight: 600 }}
          >
            z
          </span>
          <span
            className="text-ink/80 animate-zzz"
            style={{ fontSize: size * 0.16, fontWeight: 600, animationDelay: "0.6s" }}
          >
            z
          </span>
          <span
            className="text-ink/80 animate-zzz"
            style={{ fontSize: size * 0.2, fontWeight: 600, animationDelay: "1.2s" }}
          >
            Z
          </span>
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rays */}
        <g fill="#FF8F00">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <polygon
                key={i}
                points="100,10 95,38 105,38"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* Sun body */}
        <circle cx="100" cy="100" r="55" fill="#FFCA28" />

        {/* Eyes */}
        {variant === "sleepy" ? (
          <g stroke="#1C1C1E" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 78 96 Q 84 100 90 96" />
            <path d="M 110 96 Q 116 100 122 96" />
          </g>
        ) : (
          <g fill="#1C1C1E">
            <circle cx="84" cy="92" r="5" />
            <circle cx="116" cy="92" r="5" />
            {/* white highlights */}
            <circle cx="86" cy="90" r="1.6" fill="#FFFFFF" />
            <circle cx="118" cy="90" r="1.6" fill="#FFFFFF" />
          </g>
        )}

        {/* Mouth */}
        {variant === "happy" || variant === "walking" ? (
          <path
            d="M 80 115 Q 100 132 120 115"
            stroke="#1C1C1E"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 88 120 Q 100 114 112 120"
            stroke="#1C1C1E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Cheeks for walking/happy */}
        {(variant === "happy" || variant === "walking") && (
          <g fill="#FF8F00" opacity="0.35">
            <circle cx="74" cy="112" r="5" />
            <circle cx="126" cy="112" r="5" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Mascot;
