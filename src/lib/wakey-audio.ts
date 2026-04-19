// Simple Web Audio looping beep alarm. Must be started after a user gesture.

let ctx: AudioContext | null = null;
let intervalId: number | null = null;

export const primeAudio = () => {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
};

const beep = () => {
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
};

export const startAlarmSound = () => {
  primeAudio();
  if (!ctx) return;
  stopAlarmSound();
  beep();
  intervalId = window.setInterval(() => {
    beep();
    setTimeout(beep, 450);
  }, 1100);
};

export const stopAlarmSound = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
