// Simple WebAudio-based "new order" alert chime for the admin dashboard.
// No external assets required — synthesised on the fly.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Must be called from a user gesture to unlock audio on mobile browsers. */
export async function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') await c.resume();
}

function beep(c: AudioContext, freq: number, start: number, duration: number, gainValue = 0.22) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainValue, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

/** Bright three-note chime, repeated twice so staff can't miss it. */
export function playNewOrderAlert(repeats = 2) {
  const c = getCtx();
  if (!c) return;
  const pattern = [880, 1174.66, 1567.98];
  for (let r = 0; r < repeats; r++) {
    const base = r * 0.85;
    pattern.forEach((f, i) => beep(c, f, base + i * 0.16, 0.45));
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([180, 90, 180, 90, 260]);
  }
}
