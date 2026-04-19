import { cn } from "@/lib/utils";
import happy from "@/assets/wakey-mascot.png";
import sleepy from "@/assets/wakey-sleepy.png";
import sparkle from "@/assets/wakey-sparkle.png";
import relaxed from "@/assets/wakey-relaxed.png";

type Variant = "happy" | "sleepy" | "walking" | "relaxed";

interface MascotProps {
  variant?: Variant;
  size?: number;
  className?: string;
}

const SRC: Record<Variant, string> = {
  happy,
  sleepy,
  walking: sparkle,
  relaxed,
};

const ALT: Record<Variant, string> = {
  happy: "Wakey the cheerful sun mascot",
  sleepy: "Sleepy Wakey mascot with Zzz",
  walking: "Wakey mascot celebrating with sparkles",
  relaxed: "Relaxed Wakey mascot",
};

export const Mascot = ({ variant = "happy", size = 180, className }: MascotProps) => {
  return (
    <div
      className={cn("relative inline-block select-none", className)}
      style={{ width: size, height: size }}
    >
      {variant === "sleepy" && (
        <div className="absolute -top-2 right-2 flex flex-col items-end pointer-events-none z-10">
          <span
            className="text-ink/80 leading-none animate-zzz"
            style={{ fontSize: size * 0.22, fontWeight: 600, animationDelay: "1.2s" }}
          >
            Z
          </span>
          <span
            className="text-ink/80 leading-none animate-zzz"
            style={{ fontSize: size * 0.16, fontWeight: 600, animationDelay: "0.6s" }}
          >
            z
          </span>
          <span
            className="text-ink/80 leading-none animate-zzz"
            style={{ fontSize: size * 0.12, fontWeight: 600 }}
          >
            z
          </span>
        </div>
      )}

      <img
        src={SRC[variant]}
        alt={ALT[variant]}
        width={size}
        height={size}
        draggable={false}
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export default Mascot;
