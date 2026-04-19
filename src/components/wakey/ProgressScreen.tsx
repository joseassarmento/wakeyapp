import { Check, X, ArrowUp, Lock } from "lucide-react";
import Mascot from "./Mascot";
import { ProgressData, UserProfile } from "@/lib/wakey-storage";
import { RANKS, getRank, getNextRank } from "@/lib/wakey-ranks";

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
  const greeting = `Wakey, ${user.name}`;
  return (
    <div className="pb-32 px-5 pt-6 animate-fade-in">
      <h1 className="text-ink mb-5" style={{ fontSize: 26, fontWeight: 600 }}>
        {greeting}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <StatCard bg="bg-yellow" value={String(progress.totalMornings)} label="mornings" />
        <StatCard bg="bg-card" value={String(progress.streak)} label="streak" />
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


      {/* Ranks section */}
      <RankSection mornings={progress.totalMornings} />
    </div>
  );
};

const RankSection = ({ mornings }: { mornings: number }) => {
  const current = getRank(mornings);
  const next = getNextRank(current);
  const isLegend = current.id === 8;
  const remaining = next ? Math.max(0, next.min - mornings) : 0;
  const range = current.max === Infinity ? 1 : current.max - current.min + 1;
  const progressed = Math.min(1, Math.max(0, (mornings - current.min) / range));

  return (
    <div className="mt-6">
        <div className="label-caps text-ink/45 mb-2 px-1">Your rank</div>
        <div className="bg-card rounded-[24px] shadow-card overflow-hidden">
          <div
            className="relative flex items-center justify-center"
            style={{
              height: 300,
              backgroundColor: `${current.color}26`, // 15% opacity
            }}
          >
            <span
              className="absolute top-3 left-3 rounded-pill px-2.5 py-1 text-white"
              style={{
                backgroundColor: current.color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Rank {current.id} · {current.name}
            </span>
            {current.image ? (
              <img
                src={current.image}
                alt={`${current.name} mascot`}
                className="object-contain"
                style={{ height: 280 }}
              />
            ) : (
              <Mascot size={240} />
            )}
          </div>
          <div className="p-5">
            <div className="text-ink" style={{ fontSize: 22, fontWeight: 600 }}>
              {current.name}
            </div>
            <p
              className="text-soft mt-1"
              style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.6 }}
            >
              {current.message}
            </p>

            {!isLegend && next ? (
              <>
                <div
                  className="mt-4"
                  style={{
                    color: current.color,
                    fontSize: 32,
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  {remaining}
                </div>
                <div
                  className="text-soft"
                  style={{ fontSize: 13, fontWeight: 400 }}
                >
                  mornings until {next.name}
                </div>
                <div className="mt-3 h-[6px] rounded-pill bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-pill transition-all"
                    style={{
                      width: `${progressed * 100}%`,
                      backgroundColor: current.color,
                    }}
                  />
                </div>
                <div
                  className="text-ink/45 mt-2"
                  style={{ fontSize: 11, fontWeight: 400 }}
                >
                  {mornings} / {next.min} total mornings
                </div>
              </>
            ) : (
              <p
                className="text-soft mt-4 italic"
                style={{ fontSize: 13, fontWeight: 400 }}
              >
                You have reached the highest rank.
              </p>
            )}
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
