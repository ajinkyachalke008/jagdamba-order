// Thermal-printer sound effects (WebAudio, no assets).
// Motor hum, line-feed ticks, paper crinkle and a finish chime.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setPrinterMuted(value: boolean) {
  muted = value;
  if (value) stopMotor();
}

export function isPrinterMuted() {
  return muted;
}

export async function unlockPrinterAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') await c.resume();
}

export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* noop */ }
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Short dry click — one line of paper feeding out. */
export function playTick(gainValue = 0.13) {
  const c = getCtx();
  if (!c || muted) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.05);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2200;
  filter.Q.value = 1.4;
  const gain = c.createGain();
  gain.gain.setValueAtTime(gainValue, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.08);
}

/** Soft pink-noise rustle — paper being touched / cut. */
export function playCrinkle(gainValue = 0.1) {
  const c = getCtx();
  if (!c || muted) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.2);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1400;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(gainValue, c.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.24);
}

/** Two-note "receipt ready" chime. */
export function playChime() {
  const c = getCtx();
  if (!c || muted) return;
  [[1046.5, 0], [1318.5, 0.12]].forEach(([freq, at]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime + at);
    gain.gain.linearRampToValueAtTime(0.16, c.currentTime + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + 0.45);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + at);
    osc.stop(c.currentTime + at + 0.5);
  });
}

/** Cutter blade sweep at the end of the print. */
export function playCut() {
  const c = getCtx();
  if (!c || muted) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.28);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(5200, c.currentTime + 0.22);
  filter.Q.value = 3;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.14, c.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.3);
}

let motor: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; noise: AudioBufferSourceNode } | null = null;

/** Low sawtooth + filtered noise = stepper-motor hum while printing. */
export function startMotor() {
  const c = getCtx();
  if (!c || muted || motor) return;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.15);
  gain.connect(c.destination);

  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 58;
  const osc2 = c.createOscillator();
  osc2.type = 'square';
  osc2.frequency.value = 117;
  const oscGain = c.createGain();
  oscGain.gain.value = 0.35;
  osc2.connect(oscGain).connect(gain);
  osc.connect(gain);

  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer(c, 1.5);
  noise.loop = true;
  const nf = c.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 1200;
  const ng = c.createGain();
  ng.gain.value = 0.25;
  noise.connect(nf).connect(ng).connect(gain);

  osc.start();
  osc2.start();
  noise.start();
  motor = { osc, osc2, gain, noise };
}

export function stopMotor() {
  const c = ctx;
  if (!c || !motor) return;
  const { osc, osc2, gain, noise } = motor;
  motor = null;
  try {
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
    osc.stop(c.currentTime + 0.22);
    osc2.stop(c.currentTime + 0.22);
    noise.stop(c.currentTime + 0.22);
  } catch { /* noop */ }
}
