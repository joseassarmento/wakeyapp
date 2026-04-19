import { Check, X, ArrowUp } from "lucide-react";
import Mascot from "./Mascot";
import { ProgressData, UserProfile } from "@/lib/wakey-storage";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface ProgressScreenProps {
  progress: ProgressData;
  user: UserProfile;
}

const motivational = (streak: number) => {
  if (streak >= 30) return "Unstoppable. The sun rises because of you.";
  if (streak >= 14) return "Two weeks strong — you've built the habit.";
  if (streak >= 7) return "A full week! Keep the momentum going.";
  if (streak >= 3) return "You're warming up. One day at a time.";
  return "Every morning counts. Let's go.";
};

export const ProgressScreen = ({ progress, user }: ProgressScreenProps) => {
  const greeting = `Good morning, ${user.name}!`;
  return (
    <div className="pb-32 px-5 pt-6 animate-fade-in">
      <h1 className="text-ink mb-5" style={{ fontSize: 26, fontWeight: 600 }}>
        {greeting}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <StatCard bg="bg-yellow" value={String(progress.totalMornings)} label="mornings" />
        <StatCard bg="bg-card" value={String(progress.streak)} label="streak" />
        <StatCard
          bg="bg-ink"
          value={`${progress.onTimePct}%`}
          label="on time"
          dark
        />
      </div>

      {/* Heatmap */}
      <div className="bg-card rounded-[24px] shadow-card p-5 mb-4">
        <div className="label-caps text-ink/50 mb-3">This week</div>
        <div className="flex justify-between">
          {DAYS.map((d, i) => {
            const state = progress.weekly[i];
            return (
              <div key={d} className="flex flex-col items-center gap-2">
                <div
                  className={
                    "w-9 h-9 rounded-[12px] flex items-center justify-center " +
                    (state === "done"
                      ? "bg-yellow"
                      : state === "missed"
                      ? "bg-surface"
                      : state === "today"
                      ? "bg-ink"
                      : "bg-surface")
                  }
                >
                  {state === "done" && <Check size={16} className="text-ink" strokeWidth={2.5} />}
                  {state === "missed" && <X size={14} className="text-ink/35" strokeWidth={2.5} />}
                  {state === "today" && <ArrowUp size={16} className="text-card" strokeWidth={2.5} />}
                </div>
                <span className="text-ink/55" style={{ fontSize: 11, fontWeight: 500 }}>
                  {d}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mascot card */}
      <div className="bg-card rounded-[24px] shadow-card p-4 flex items-center gap-4">
        <Mascot variant="happy" size={110} />
        <div className="flex-1">
          <div className="text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
            Keep going
          </div>
          <div className="text-soft" style={{ fontSize: 13 }}>
            {motivational(progress.streak)}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  bg,
  value,
  label,
  dark,
}: {
  bg: string;
  value: string;
  label: string;
  dark?: boolean;
}) => (
  <div className={`${bg} rounded-[24px] p-4 shadow-card`}>
    <div
      className={dark ? "text-yellow" : "text-ink"}
      style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-1px", lineHeight: 1.1 }}
    >
      {value}
    </div>
    <div
      className={dark ? "text-card/80" : "text-ink/60"}
      style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}
    >
      {label}
    </div>
  </div>
);

export default ProgressScreen;
