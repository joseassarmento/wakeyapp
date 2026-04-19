// Loud, attention-grabbing Web Audio alarm loop.
// Module-level refs so stopAlarmSound() can always tear down cleanly,
// even when called from a different code path (e.g. ?stopped=true redirect).

let activeAudioContext: AudioContext | null = null;
let activeAlarmSource: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let beepTimeoutId: number | null = null;
let isLoopRunning = false;

export const primeAudio = () => {
  if (!activeAudioContext) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (AC) activeAudioContext = new AC();
  }
  if (activeAudioContext && activeAudioContext.state === "suspended") {
    activeAudioContext.resume();
  }
};

const scheduleNextBeep = () => {
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
  primeAudio();
  if (!activeAudioContext) return;
  stopAlarmSound();
  isLoopRunning = true;
  scheduleNextBeep();
};

export const stopAlarmSound = () => {
  isLoopRunning = false;
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
};
