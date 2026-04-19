import { useState } from "react";
import { cn } from "@/lib/utils";

type TabId = "global" | "friends";

interface Player {
  id: number;
  name: string;
  mornings: number;
}

const GLOBAL: Player[] = [
  { id: 1, name: "Aiko Tanaka", mornings: 412 },
  { id: 2, name: "Marco Reyes", mornings: 388 },
  { id: 3, name: "Lena Park", mornings: 356 },
  { id: 4, name: "Pablo G.", mornings: 47 },
  { id: 5, name: "Sara Ali", mornings: 41 },
  { id: 6, name: "Theo N.", mornings: 33 },
  { id: 7, name: "Mei Lin", mornings: 28 },
];

const FRIENDS: Player[] = [
  { id: 1, name: "Pablo G.", mornings: 47 },
  { id: 2, name: "Sara Ali", mornings: 41 },
  { id: 3, name: "Theo N.", mornings: 33 },
  { id: 4, name: "Jamie K.", mornings: 19 },
];

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const RankScreen = () => {
  const [tab, setTab] = useState<TabId>("global");
  const list = tab === "global" ? GLOBAL : FRIENDS;
  const total = list.reduce((s, p) => s + p.mornings, 0);

  return (
    <div className="pb-32 px-5 pt-6 animate-fade-in">
      <h1 className="text-ink mb-5" style={{ fontSize: 26, fontWeight: 600 }}>
        Rank
      </h1>

      {/* Tab pills */}
      <div className="bg-surface rounded-pill p-1 flex mb-5">
        {(["global", "friends"] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "press flex-1 py-2.5 rounded-pill capitalize transition-colors",
              tab === t ? "bg-ink text-card" : "text-ink/60"
            )}
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "global" && (
        <div className="bg-yellow rounded-[24px] p-5 mb-5 text-center">
          <div className="label-caps text-ink/70 mb-1">Total mornings saved</div>
          <div className="text-ink" style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-1px" }}>
            {total.toLocaleString()}
          </div>
        </div>
      )}

      <ul className="space-y-2.5">
        {list.map((p, i) => {
          const rank = i + 1;
          const isFirst = rank === 1;
          return (
            <li
              key={p.id}
              className={cn(
                "rounded-[16px] shadow-card flex items-center gap-3 px-4 py-3",
                isFirst ? "bg-yellow" : "bg-card"
              )}
            >
              <div
                className="w-7 text-center text-ink/70"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                {rank}
              </div>
              <div className="flex-1 text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
                {p.name}
              </div>
              <div className="text-ink/70" style={{ fontSize: 14 }}>
                {p.mornings}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RankScreen;
