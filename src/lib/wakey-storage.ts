export interface AlarmSettings {
  hour: number; // 0-23
  minute: number;
  days: number[]; // 0=Mon..6=Sun
  ringtone: string;
  frequency: string;
  enabled: boolean;
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

const DEFAULT_ALARM: AlarmSettings = {
  hour: 7,
  minute: 0,
  days: [0, 1, 2, 3, 4],
  ringtone: "Sunrise",
  frequency: "Weekdays",
  enabled: true,
};

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

const KEY_ALARM = "wakey:alarm";
const KEY_PROGRESS = "wakey:progress";
const KEY_USER = "wakey:user";

export const loadAlarm = (): AlarmSettings => {
  try {
    const raw = localStorage.getItem(KEY_ALARM);
    return raw ? { ...DEFAULT_ALARM, ...JSON.parse(raw) } : DEFAULT_ALARM;
  } catch {
    return DEFAULT_ALARM;
  }
};
export const saveAlarm = (a: AlarmSettings) =>
  localStorage.setItem(KEY_ALARM, JSON.stringify(a));

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
