export interface Alarm {
  id: string;
  name: string;
  /** "HH:MM" 24-hour, used as the source of truth */
  time: string;
  /** Days repeated. 0=Mon..6=Sun */
  days: number[];
  ringtone: string;
  vibration: boolean;
  active: boolean;
}

export interface ProgressData {
  totalMornings: number;
  streak: number;
  onTimePct: number;
  weekly: ("done" | "missed" | "today" | "future")[]; // 7 entries Mo..Su
  lastWakeISO?: string;
  emergencyExits: number; // remaining
}

export interface UserProfile {
  name: string;
  notifications: boolean;
  darkMode: boolean;
  podPaired: boolean;
}

export const DAY_LABELS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const DAY_LABELS_LONG = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const RINGTONES = ["Sunrise", "Bell", "Digital", "Chime", "Radar"];

const DEFAULT_PROGRESS: ProgressData = {
  totalMornings: 47,
  streak: 12,
  onTimePct: 94,
  weekly: ["done", "done", "done", "done", "today", "future", "future"],
  emergencyExits: 3,
};

const DEFAULT_USER: UserProfile = {
  name: "Pablo",
  notifications: true,
  darkMode: false,
  podPaired: false,
};

const DEFAULT_ALARMS: Alarm[] = [
  {
    id: "seed-morning",
    name: "Morning class",
    time: "07:00",
    days: [0, 1, 2, 3, 4],
    ringtone: "Sunrise",
    vibration: true,
    active: true,
  },
];

const KEY_ALARMS = "wakey_alarms";
const KEY_PROGRESS = "wakey:progress";
const KEY_USER = "wakey:user";
const KEY_ALARMS_LEGACY = "wakey:alarm";

export const newAlarmId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

export const loadAlarms = (): Alarm[] => {
  try {
    const raw = localStorage.getItem(KEY_ALARMS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Alarm[];
    }
    // One-time migration from the previous single-alarm shape
    const legacy = localStorage.getItem(KEY_ALARMS_LEGACY);
    if (legacy) {
      const a = JSON.parse(legacy);
      const time = `${String(a.hour ?? 7).padStart(2, "0")}:${String(
        a.minute ?? 0
      ).padStart(2, "0")}`;
      const migrated: Alarm[] = [
        {
          id: newAlarmId(),
          name: "Morning",
          time,
          days: Array.isArray(a.days) ? a.days : [0, 1, 2, 3, 4],
          ringtone: a.ringtone ?? "Sunrise",
          vibration: true,
          active: a.enabled ?? true,
        },
      ];
      localStorage.setItem(KEY_ALARMS, JSON.stringify(migrated));
      return migrated;
    }
    localStorage.setItem(KEY_ALARMS, JSON.stringify(DEFAULT_ALARMS));
    return DEFAULT_ALARMS;
  } catch {
    return DEFAULT_ALARMS;
  }
};

export const saveAlarms = (alarms: Alarm[]) =>
  localStorage.setItem(KEY_ALARMS, JSON.stringify(alarms));

export const loadProgress = (): ProgressData => {
  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
};
export const saveProgress = (p: ProgressData) =>
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(p));

export const loadUser = (): UserProfile => {
  try {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? { ...DEFAULT_USER, ...JSON.parse(raw) } : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
};
export const saveUser = (u: UserProfile) =>
  localStorage.setItem(KEY_USER, JSON.stringify(u));

// Helpers
export const formatTime12 = (time: string) => {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h12}:${m.toString().padStart(2, "0")}`, period };
};

export const formatDays = (days: number[]) => {
  if (days.length === 0) return "Never";
  if (days.length === 7) return "Every day";
  const wd = JSON.stringify([0, 1, 2, 3, 4]);
  const we = JSON.stringify([5, 6]);
  const sorted = [...days].sort((a, b) => a - b);
  if (JSON.stringify(sorted) === wd) return "Mon — Fri";
  if (JSON.stringify(sorted) === we) return "Sat — Sun";
  return sorted.map((d) => DAY_LABELS_LONG[d]).join(", ");
};
