// Loud, attention-grabbing Web Audio alarm loop.
// Module-level refs so stopAlarmSound() can always tear down cleanly,
// even when called from a different code path (e.g. ?stopped=true redirect).

let activeAudioContext: AudioContext | null = null;
let activeAlarmSource: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let beepTimeoutId: number | null = null;
let isLoopRunning = false;

const logAudioState = (label: string) => {
  console.log(`[wakey-audio] ${label}`, {
    hasContext: !!activeAudioContext,
    contextState: activeAudioContext?.state ?? "none",
    hasSource: !!activeAlarmSource,
    hasGain: !!activeGain,
    isLoopRunning,
  });
};

export const primeAudio = () => {
  if (!activeAudioContext || activeAudioContext.state === "closed") {
    const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      activeAudioContext = new AC();
      logAudioState("created AudioContext");
    }
  }

  if (activeAudioContext && activeAudioContext.state === "suspended") {
    activeAudioContext.resume().then(() => {
      logAudioState("resumed AudioContext");
    }).catch((error) => {
      console.error("[wakey-audio] failed to resume AudioContext", error);
    });
  } else {
    logAudioState("primeAudio noop / already ready");
  }
};

// Plays one soft sine "ding" with a quick attack and long decay.
const playDing = (freq: number, startOffset: number, duration: number) => {
  if (!activeAudioContext || !activeGain) return;
  const ctx = activeAudioContext;
  const start = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  noteGain.gain.setValueAtTime(0, start);
  noteGain.gain.linearRampToValueAtTime(0.9, start + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(noteGain).connect(activeGain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
};

const scheduleNextBeep = () => {
  console.log("[wakey-audio] scheduleNextBeep called", {
    hasContext: !!activeAudioContext,
    contextState: activeAudioContext?.state ?? "none",
    isLoopRunning,
  });

  if (!isLoopRunning || !activeAudioContext) return;

  if (!activeGain) {
    activeGain = activeAudioContext.createGain();
    activeGain.gain.value = 0.6;
    activeGain.connect(activeAudioContext.destination);
  }

  // Two-note chime: E6 then C6
  playDing(1318.51, 0, 0.6);
  playDing(1046.5, 0.35, 0.7);

  logAudioState("chime scheduled");

  // Repeat the chime every 1.4s
  beepTimeoutId = window.setTimeout(scheduleNextBeep, 1400);
};

export const startAlarmSound = () => {
  logAudioState("startAlarmSound before prime");
  primeAudio();
  if (!activeAudioContext) {
    console.warn("[wakey-audio] startAlarmSound aborted: no AudioContext available");
    return;
  }
  stopAlarmSound();
  primeAudio();
  if (!activeAudioContext) {
    console.warn("[wakey-audio] startAlarmSound aborted after reset: no AudioContext available");
    return;
  }
  isLoopRunning = true;
  logAudioState("startAlarmSound before first beep");
  scheduleNextBeep();
};

export const stopAlarmSound = () => {
  logAudioState("stopAlarmSound begin");
  isLoopRunning = false;

  // Broadcast to any other open tabs so they also tear down their audio.
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const ch = new BroadcastChannel("wakey_alarm");
      ch.postMessage("stop");
      ch.close();
    }
  } catch (error) {
    console.warn("[wakey-audio] BroadcastChannel post failed", error);
  }
  if (beepTimeoutId !== null) {
    clearTimeout(beepTimeoutId);
    beepTimeoutId = null;
  }
  if (activeAlarmSource) {
    try { activeAlarmSource.stop(); } catch {}
    try { activeAlarmSource.disconnect(); } catch {}
    activeAlarmSource = null;
  }
  if (activeGain) {
    try { activeGain.disconnect(); } catch {}
    activeGain = null;
  }
  if (activeAudioContext) {
    try { activeAudioContext.close(); } catch {}
    activeAudioContext = null;
  }
  logAudioState("stopAlarmSound complete");
};
