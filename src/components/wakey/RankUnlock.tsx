import { useEffect, useState } from "react";
import Mascot from "./Mascot";
import { Rank, getNextRank } from "@/lib/wakey-ranks";

interface RankUnlockProps {
  rank: Rank;
  onContinue: () => void;
}

export const RankUnlock = ({ rank, onContinue }: RankUnlockProps) => {
  const [showButton, setShowButton] = useState(false);
  const [scaled, setScaled] = useState(false);
  const next = getNextRank(rank);

  useEffect(() => {
    const t1 = window.setTimeout(() => setScaled(true), 50);
    const t2 = window.setTimeout(() => setShowButton(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const buttonLabel = next
    ? `Keep going — ${next.min - rank.min} mornings to ${next.name}`
    : "You've made it.";

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 animate-fade-in"
      style={{ background: rank.color }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          transform: scaled ? "scale(1)" : "scale(0.6)",
          transition: "transform 400ms ease-out",
        }}
      >
        {rank.image ? (
          <img
            src={rank.image}
            alt={`${rank.name} mascot`}
            className="object-contain"
            style={{ width: 200, height: 200 }}
          />
        ) : (
          <Mascot size={200} />
        )}
      </div>

      <div
        className="text-white/70 mt-6"
        style={{ fontSize: 14, fontWeight: 500 }}
      >
        Rank unlocked!
      </div>
      <h1
        className="text-white mt-1"
        style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.5px" }}
      >
        {rank.name}
      </h1>

      <p
        className="text-white/80 text-center mt-3"
        style={{
          fontSize: 16,
          fontWeight: 400,
          maxWidth: 280,
          lineHeight: 1.6,
        }}
      >
        {rank.unlockMessage}
      </p>

      <span
        className="mt-5 bg-white rounded-pill px-3 py-1.5"
        style={{ fontSize: 12, fontWeight: 600, color: rank.color }}
      >
        Rank {rank.id}
      </span>

      <div className="absolute left-0 right-0 bottom-10 px-6">
        {showButton && (
          <button
            onClick={onContinue}
            className="press w-full h-14 rounded-pill bg-white animate-fade-in"
            style={{ fontSize: 16, fontWeight: 600, color: rank.color }}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default RankUnlock;
