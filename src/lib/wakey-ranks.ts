import rank1Snoozer from "@/assets/rank-1-snoozer.png";
import rank2Waker from "@/assets/rank-2-waker.png";
import rank3Riser from "@/assets/rank-3-riser.png";
import rank4EarlyBird from "@/assets/rank-4-early-bird.png";
import rank5SunChaser from "@/assets/rank-5-sun-chaser.png";
import rank6MorningHero from "@/assets/rank-6-morning-hero.png";
import rank7SunGod from "@/assets/rank-7-sun-god.png";

export interface Rank {
  id: number;
  name: string;
  min: number;
  max: number;
  color: string;
  message: string;
  unlockMessage: string;
  /** Optional custom mascot image — falls back to default Mascot if absent */
  image?: string;
}

export const RANKS: Rank[] = [
  {
    id: 1,
    name: "Snoozer",
    min: 0,
    max: 9,
    color: "#C0C0C0",
    message: "Still in bed. The pod is waiting.",
    unlockMessage: "Welcome to Wakey.",
    image: rank1Snoozer,
  },
  {
    id: 2,
    name: "Waker",
    min: 10,
    max: 24,
    color: "#FFCA28",
    message: "You got up. Most people never do.",
    unlockMessage: "You actually got up. Welcome.",
    image: rank2Waker,
  },
  {
    id: 3,
    name: "Riser",
    min: 25,
    max: 49,
    color: "#FFB300",
    message: "The alarm doesn't scare you anymore.",
    unlockMessage: "The habit is forming. Don't stop.",
    image: rank3Riser,
  },
  {
    id: 4,
    name: "Early Bird",
    min: 50,
    max: 99,
    color: "#FF9500",
    message: "50 mornings. You have a real streak now.",
    unlockMessage: "50 mornings. Seriously impressive.",
    image: rank4EarlyBird,
  },
  {
    id: 5,
    name: "Sun Chaser",
    min: 100,
    max: 199,
    color: "#FF6D00",
    message: "100 mornings. You are not the same person.",
    unlockMessage: "100 mornings. You've changed.",
    image: rank5SunChaser,
  },
  {
    id: 6,
    name: "Morning Hero",
    min: 200,
    max: 499,
    color: "#E53935",
    message: "200 mornings. This is just who you are.",
    unlockMessage: "200 mornings. Unreal.",
    image: rank6MorningHero,
  },
  {
    id: 7,
    name: "Sun God",
    min: 500,
    max: 999,
    color: "#6A1B9A",
    message: "500 mornings. Almost no one reaches this.",
    unlockMessage: "500 mornings. Almost nobody does this.",
    image: rank7SunGod,
  },
  {
    id: 8,
    name: "Legend",
    min: 1000,
    max: Infinity,
    color: "#1C1C1E",
    message: "1000 mornings. You are the alarm.",
    unlockMessage: "1000 mornings. You are the alarm.",
  },
];

export const getRank = (mornings: number): Rank =>
  RANKS.find((r) => mornings >= r.min && mornings <= r.max) ?? RANKS[0];

export const getNextRank = (rank: Rank): Rank | null =>
  RANKS.find((r) => r.id === rank.id + 1) ?? null;

const KEY_UNLOCKED = "wakey_ranks_unlocked";

export const loadUnlockedRanks = (): number[] => {
  try {
    const raw = localStorage.getItem(KEY_UNLOCKED);
    if (!raw) return [1];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as number[]) : [1];
  } catch {
    return [1];
  }
};

export const saveUnlockedRanks = (ids: number[]) =>
  localStorage.setItem(KEY_UNLOCKED, JSON.stringify(ids));

/**
 * Returns any newly unlocked rank IDs given the current mornings count
 * compared to what's already stored as unlocked.
 */
export const detectNewUnlocks = (mornings: number): Rank[] => {
  const already = loadUnlockedRanks();
  const eligible = RANKS.filter((r) => mornings >= r.min);
  const newly = eligible.filter((r) => !already.includes(r.id));
  if (newly.length > 0) {
    saveUnlockedRanks([...already, ...newly.map((r) => r.id)]);
  }
  return newly;
};
