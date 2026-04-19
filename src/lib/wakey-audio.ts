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

const scheduleNextBeep = () => {
  console.log("[wakey-audio] scheduleNextBeep called", {
    hasContext: !!activeAudioContext,
    contextState: activeAudioContext?.state ?? "none",
    isLoopRunning,
  });

  if (!isLoopRunning || !activeAudioContext) return;

  // Tear down any previous oscillator before starting a new one.
  if (activeAlarmSource) {
    try { activeAlarmSource.stop(); } catch {}
    try { activeAlarmSource.disconnect(); } catch {}
    activeAlarmSource = null;
  }

  const ctx = activeAudioContext;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, ctx.currentTime);

  if (!activeGain) {
    activeGain = ctx.createGain();
    activeGain.gain.value = 0.8;
    activeGain.connect(ctx.destination);
  }

  osc.connect(activeGain);
  osc.start();
  activeAlarmSource = osc;
  logAudioState("oscillator started");

  // 0.08s ON
  beepTimeoutId = window.setTimeout(() => {
    if (activeAlarmSource) {
      try { activeAlarmSource.stop(); } catch {}
      try { activeAlarmSource.disconnect(); } catch {}
      activeAlarmSource = null;
    }
    // 0.08s OFF, then loop
    beepTimeoutId = window.setTimeout(scheduleNextBeep, 80);
  }, 80);
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
