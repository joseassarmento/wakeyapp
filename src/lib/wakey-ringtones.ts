// Programmatic ringtone preview generator using Web Audio API.
// Each ringtone is a looping pattern scheduled ahead of time on a single
// AudioContext. Only one preview plays at a time.

export type RingtoneName = "Sunrise" | "Bell" | "Digital" | "Chime" | "Radar";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let schedulerId: number | null = null;
let nextNoteTime = 0;
let currentRingtone: RingtoneName | null = null;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.2; // seconds

const ensureCtx = () => {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// --- Voice helpers ---------------------------------------------------------

const playTone = (
  start: number,
  duration: number,
  freq: number | { from: number; to: number },
  type: OscillatorType,
  peak: number,
  attack = 0.02,
  release = 0.1,
) => {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  if (typeof freq === "number") {
    osc.frequency.setValueAtTime(freq, start);
  } else {
    osc.frequency.setValueAtTime(freq.from, start);
    osc.frequency.linearRampToValueAtTime(freq.to, start + duration);
  }
  const safeAttack = Math.min(attack, duration * 0.4);
  const safeRelease = Math.min(release, duration * 0.5);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + safeAttack);
  gain.gain.setValueAtTime(peak, start + duration - safeRelease);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain).connect(masterGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
};

// --- Ringtone patterns -----------------------------------------------------
// Each function schedules ONE loop iteration starting at `start` and returns
// the loop length in seconds.

const patterns: Record<RingtoneName, (start: number) => number> = {
  // Soft sine sweep 220->440 over 2s with gentle fade in/out per cycle.
  Sunrise: (start) => {
    playTone(start, 2.0, { from: 220, to: 440 }, "sine", 0.7, 0.4, 0.4);
    return 2.0;
  },
  // Short bell burst every 1.2s.
  Bell: (start) => {
    playTone(start, 0.6, 880, "sine", 0.9, 0.005, 0.55);
    // subtle harmonic for a more bell-like timbre
    playTone(start, 0.5, 1760, "sine", 0.25, 0.005, 0.45);
    return 1.2;
  },
  // Square wave 440hz: on 0.1, off 0.1, on 0.1, off 0.5
  Digital: (start) => {
    playTone(start, 0.1, 440, "square", 0.5, 0.005, 0.02);
    playTone(start + 0.2, 0.1, 440, "square", 0.5, 0.005, 0.02);
    return 0.8; // 0.1 + 0.1 + 0.1 + 0.5
  },
  // Three descending sine tones, full sequence every 2s.
  Chime: (start) => {
    playTone(start + 0.0, 0.3, 880, "sine", 0.7, 0.01, 0.25);
    playTone(start + 0.4, 0.3, 660, "sine", 0.7, 0.01, 0.25);
    playTone(start + 0.8, 0.3, 440, "sine", 0.7, 0.01, 0.25);
    return 2.0;
  },
  // Radar blip + echo every 0.8s.
  Radar: (start) => {
    playTone(start, 0.08, 660, "sine", 0.8, 0.005, 0.06);
    playTone(start + 0.1, 0.08, 660, "sine", 0.35, 0.005, 0.06);
    return 0.8;
  },
};

const scheduler = () => {
  if (!ctx || !currentRingtone) return;
  const pattern = patterns[currentRingtone];
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    const len = pattern(nextNoteTime);
    nextNoteTime += len;
  }
};

export const startRingtonePreview = (name: RingtoneName) => {
  const c = ensureCtx();
  if (!c) return;
  // Stop any in-flight preview before starting the new one.
  stopRingtonePreview();
  currentRingtone = name;
  // Tiny offset so the first cycle's attack isn't clipped.
  nextNoteTime = c.currentTime + 0.05;
  scheduler();
  schedulerId = window.setInterval(scheduler, LOOKAHEAD_MS);
};

export const stopRingtonePreview = () => {
  if (schedulerId !== null) {
    clearInterval(schedulerId);
    schedulerId = null;
  }
  currentRingtone = null;
  if (ctx && masterGain) {
    // Fast fade to avoid clicks, then disconnect+reconnect a fresh master gain
    // so any already-scheduled oscillators are silenced immediately.
    const now = ctx.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.03);
    } catch {
      /* noop */
    }
    const old = masterGain;
    window.setTimeout(() => {
      try {
        old.disconnect();
      } catch {
        /* noop */
      }
    }, 80);
    const fresh = ctx.createGain();
    fresh.gain.value = 0.25;
    fresh.connect(ctx.destination);
    masterGain = fresh;
  }
};

export const getCurrentPreview = (): RingtoneName | null => currentRingtone;
