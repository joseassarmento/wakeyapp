import { cn } from "@/lib/utils";
import mascot from "@/assets/wakey-mascot.png";

type Variant = "happy" | "sleepy" | "walking" | "relaxed";

interface MascotProps {
  variant?: Variant;
  size?: number;
  className?: string;
}

export const Mascot = ({ size = 180, className }: MascotProps) => {
  return (
    <div
      className={cn("relative inline-block select-none", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={mascot}
        alt="Wakey the cheerful sun mascot"
        width={size}
        height={size}
        draggable={false}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default Mascot;
