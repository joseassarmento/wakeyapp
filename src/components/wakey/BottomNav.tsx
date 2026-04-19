import { Bell, BarChart3, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "alarm" | "rank" | "progress" | "me";

interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
}

const tabs: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: "alarm", label: "Alarm", Icon: Bell },
  { id: "rank", label: "Rank", Icon: Trophy },
  { id: "progress", label: "Progress", Icon: BarChart3 },
  { id: "me", label: "Me", Icon: User },
];

export const BottomNav = ({ active, onChange }: BottomNavProps) => {
  return (
    <nav
      className="fixed bottom-4 inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-[400px] bg-card rounded-[26px] shadow-card px-2 py-2 flex items-center justify-between z-40 animate-slide-up"
      aria-label="Primary"
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "press flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-[18px] mx-0.5 transition-smooth",
              isActive ? "bg-yellow text-ink" : "text-ink/60"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span
              className="leading-none"
              style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
