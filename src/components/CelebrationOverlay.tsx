import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import * as Tone from 'tone';

interface Props {
  orderNumber?: string;
  onDone?: () => void;
  duration?: number; // total ms before onDone
}

/**
 * Full-screen "Order Confirmed!" celebration overlay.
 * Choreographed: stamp drop -> impact (shake, rings, confetti, sound) -> checkmark
 * -> chime + confetti rain -> heading letters -> subtext -> order # scramble
 * -> pill -> bottom toast with gradient progress bar.
 */
export function CelebrationOverlay({ orderNumber = 'ORD-8472', onDone, duration = 7800 }: Props) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'drop' | 'impact' | 'settle'>('drop');
  const [shake, setShake] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showBurstLines, setShowBurstLines] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showBalloons, setShowBalloons] = useState(false);
  const [showEmojiRain, setShowEmojiRain] = useState(false);
  const rainStopRef = useRef<(() => void) | null>(null);
  const fireworksStopRef = useRef<(() => void) | null>(null);

  // ---------- SOUND (Tone.js) ----------
  const playImpactSound = async () => {
    try {
      await Tone.start();
      const thud = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
      }).toDestination();
      thud.volume.value = -4;
      thud.triggerAttackRelease('C1', '8n');
      const noise = new Tone.NoiseSynth({
        noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
      }).toDestination();
      noise.volume.value = -14;
      noise.triggerAttackRelease('16n');
      setTimeout(() => { thud.dispose(); noise.dispose(); }, 1200);
    } catch {}
  };

  const playCelebrationChime = async () => {
    try {
      await Tone.start();
      const now = Tone.now();
      // pink noise whoosh
      const whoosh = new Tone.NoiseSynth({
        noise: { type: 'pink' }, envelope: { attack: 0.15, decay: 0.4, sustain: 0 },
      }).toDestination();
      whoosh.volume.value = -20;
      whoosh.triggerAttackRelease('4n', now);

      // ascending arpeggio
      const poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.4 },
      }).toDestination();
      poly.volume.value = -8;
      const notes = ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'];
      notes.forEach((n, i) => poly.triggerAttackRelease(n, '16n', now + i * 0.075));

      // plucked bell
      const pluck = new Tone.PluckSynth({ attackNoise: 1, dampening: 4000, resonance: 0.9 }).toDestination();
      pluck.volume.value = -6;
      pluck.triggerAttack('A5', now + 0.55);

      // sustained pad
      const pad = new Tone.AMSynth({
        harmonicity: 1.5,
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 2.5 },
        modulationEnvelope: { attack: 1.2, decay: 0.3, sustain: 0.5, release: 2 },
      }).toDestination();
      pad.volume.value = -18;
      pad.triggerAttackRelease('C4', '2n', now);

      setTimeout(() => { whoosh.dispose(); poly.dispose(); pluck.dispose(); pad.dispose(); }, 4000);
    } catch {}
  };

  // ---------- CONFETTI ----------
  const CONFETTI_COLORS = ['#facc15', '#f97316', '#ec4899', '#38bdf8', '#a855f7', '#4ade80'];
  const METALLIC = ['#eab308', '#e5e7eb'];

  const fireImpactConfetti = () => {
    if (reduce) return;
    // center burst
    confetti({
      particleCount: 40,
      spread: 360,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.5 },
      colors: [...CONFETTI_COLORS, ...METALLIC],
      scalar: 1.1,
      ticks: 220,
      shapes: ['square', 'circle'],
    });
    // side cannons
    const end = Date.now() + 900;
    const cannons = () => {
      confetti({
        particleCount: 6, angle: 60, spread: 55,
        origin: { x: 0, y: 1 }, colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 6, angle: 120, spread: 55,
        origin: { x: 1, y: 1 }, colors: CONFETTI_COLORS,
      });
      if (Date.now() < end) setTimeout(cannons, 60);
    };
    cannons();
  };

  const startConfettiRain = () => {
    if (reduce) return;
    let raf = 0; let stopped = false;
    const tick = () => {
      if (stopped) return;
      confetti({
        particleCount: 3,
        angle: 270,
        spread: 90,
        startVelocity: 20,
        gravity: 0.6,
        drift: (Math.random() - 0.5) * 1.5,
        origin: { x: Math.random(), y: -0.05 },
        colors: [...CONFETTI_COLORS, ...METALLIC],
        scalar: 0.9,
        ticks: 300,
      });
      raf = window.setTimeout(tick, 120) as unknown as number;
    };
    tick();
    rainStopRef.current = () => { stopped = true; clearTimeout(raf); };
  };

  // ---------- TIMELINE ----------
  useEffect(() => {
    if (reduce) {
      setPhase('settle');
      setShowCheck(true); setShowHeading(true); setShowSub(true);
      setShowOrder(true); setShowPill(true); setShowToast(true);
      const t = setTimeout(() => onDone?.(), duration);
      return () => clearTimeout(t);
    }

    const timers: number[] = [];
    // impact at 520ms
    timers.push(window.setTimeout(() => {
      setPhase('impact');
      setShake(true);
      fireImpactConfetti();
      playImpactSound();
      window.setTimeout(() => setShake(false), 320);
    }, 520));
    // spring back at 560ms
    timers.push(window.setTimeout(() => setPhase('settle'), 560));
    // checkmark + chime + rain at 620ms
    timers.push(window.setTimeout(() => {
      setShowCheck(true);
      playCelebrationChime();
      startConfettiRain();
    }, 620));
    // heading at 800ms
    timers.push(window.setTimeout(() => setShowHeading(true), 800));
    // subtext 1020ms
    timers.push(window.setTimeout(() => setShowSub(true), 1020));
    // order 1220ms
    timers.push(window.setTimeout(() => setShowOrder(true), 1220));
    // pill 1500ms
    timers.push(window.setTimeout(() => setShowPill(true), 1500));
    // toast 1700ms
    timers.push(window.setTimeout(() => setShowToast(true), 1700));
    // done
    timers.push(window.setTimeout(() => { rainStopRef.current?.(); onDone?.(); }, duration));

    return () => {
      timers.forEach(clearTimeout);
      rainStopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-live="polite"
      aria-label="Order confirmed"
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 36%, #1a1330 0%, #0b0b14 55%, #050508 100%)',
      }}
      initial={{ opacity: reduce ? 0 : 1 }}
      animate={
        reduce
          ? { opacity: 1 }
          : shake
          ? { x: [0, -5, 5, -4, 4, -3, 3, -2, 2, 0], y: [0, 2, -2, 2, -1, 1, 0] }
          : { x: 0, y: 0, opacity: 1 }
      }
      transition={reduce ? { duration: 0.4 } : { duration: 0.32 }}
    >
      {/* ambient sparkles */}
      {!reduce && <SparkleLayer />}

      {/* impact flash */}
      <AnimatePresence>
        {phase !== 'drop' && (
          <motion.div
            key="flash"
            className="pointer-events-none absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.4, 1.8] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              width: 520, height: 520, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(250,204,21,0.35) 0%, transparent 65%)',
              filter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* expanding rings */}
      {!reduce && phase !== 'drop' && (
        <>
          <Ring color="rgba(250,204,21,0.6)" delay={0} />
          <Ring color="rgba(236,72,153,0.5)" delay={0.15} />
        </>
      )}

      {/* Center content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        {/* Stamp */}
        <StampSeal phase={phase} showCheck={showCheck} reduce={!!reduce} />

        {/* Heading */}
        <div className="mt-8 min-h-[48px]">
          {showHeading && <LetterHeading text="Order Confirmed!" reduce={!!reduce} />}
        </div>

        {/* Subtext */}
        <div className="mt-3 min-h-[28px]">
          {showSub && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-base md:text-lg text-slate-400"
            >
              Your parcel is being prepared 📦
            </motion.p>
          )}
        </div>

        {/* Order number scramble */}
        <div className="mt-4 min-h-[28px]">
          {showOrder && <OrderNumber value={`Order #${orderNumber}`} reduce={!!reduce} />}
        </div>

        {/* Pill */}
        <div className="mt-6 min-h-[40px]">
          {showPill && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-200"
            >
              <span>📄 Receipt generating</span>
              <DotPulse />
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute bottom-6 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-xl bg-white/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span className="text-sm font-medium text-slate-900">Order placed successfully!</span>
            </div>
            <div className="h-1 w-full bg-slate-200/70">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.8, ease: 'linear' }}
                className="h-full"
                style={{ background: 'linear-gradient(90deg,#facc15,#f97316,#ec4899)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- Sub components ---------- */

function StampSeal({ phase, showCheck, reduce }: { phase: 'drop' | 'impact' | 'settle'; showCheck: boolean; reduce: boolean }) {
  // choose transform per phase
  let animate: any;
  let transition: any;
  if (reduce) {
    animate = { y: 0, scaleX: 1, scaleY: 1, opacity: 1 };
    transition = { duration: 0.4 };
  } else if (phase === 'drop') {
    animate = { y: 0, scaleX: 1, scaleY: 1 };
    transition = { duration: 0.42, ease: [0.55, 0.06, 0.68, 0.19] };
  } else if (phase === 'impact') {
    animate = { y: 0, scaleX: 1.16, scaleY: 0.68 };
    transition = { duration: 0 };
  } else {
    animate = { y: 0, scaleX: 1, scaleY: 1 };
    transition = { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] };
  }

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { y: -260, scaleX: 1, scaleY: 1 }}
      animate={animate}
      transition={transition}
      className="relative"
      style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(145deg,#fde68a,#f59e0b)',
        boxShadow: '0 18px 40px -8px rgba(245,158,11,0.55), 0 0 0 4px rgba(255,255,255,0.05) inset',
      }}
    >
      {/* checkmark */}
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
        <motion.path
          d="M18 33 L27 42 L46 21"
          fill="none"
          stroke="#7c2d12"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: showCheck ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

function Ring({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: 120, height: 120, border: `2px solid ${color}` }}
      initial={{ scale: 0.25, opacity: 0.9 }}
      animate={{ scale: 3.4, opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut', delay }}
    />
  );
}

function LetterHeading({ text, reduce }: { text: string; reduce: boolean }) {
  const chars = text.split('');
  return (
    <h1
      className="text-3xl md:text-5xl font-bold text-white"
      style={{ textShadow: '0 0 24px rgba(250,204,21,0.35)' }}
    >
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0.3 } : { type: 'spring', stiffness: 500, damping: 18, delay: i * 0.026 }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {c}
        </motion.span>
      ))}
    </h1>
  );
}

function OrderNumber({ value, reduce }: { value: string; reduce: boolean }) {
  // find digits and scramble them
  const parts = useMemo(() => value.split('').map((c) => ({ c, digit: /\d/.test(c) })), [value]);
  const [display, setDisplay] = useState(() =>
    parts.map((p) => (p.digit ? String(Math.floor(Math.random() * 10)) : p.c))
  );

  useEffect(() => {
    if (reduce) { setDisplay(parts.map((p) => p.c)); return; }
    let raf = 0;
    const locked = new Array(parts.length).fill(false);
    // lock digits left-to-right ~55ms apart
    const digitIdxs = parts.map((p, i) => (p.digit ? i : -1)).filter((i) => i >= 0);
    const lockTimers = digitIdxs.map((idx, k) => window.setTimeout(() => { locked[idx] = true; }, 200 + k * 55));

    const tick = () => {
      setDisplay(parts.map((p, i) => {
        if (!p.digit) return p.c;
        if (locked[i]) return p.c;
        return String(Math.floor(Math.random() * 10));
      }));
      raf = window.setTimeout(tick, 45) as unknown as number;
    };
    tick();
    const stop = window.setTimeout(() => {
      clearTimeout(raf);
      setDisplay(parts.map((p) => p.c));
    }, 200 + digitIdxs.length * 55 + 80);
    return () => { clearTimeout(raf); clearTimeout(stop); lockTimers.forEach(clearTimeout); };
  }, [parts, reduce]);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="font-mono text-amber-300/90 tracking-wider"
    >
      {display.join('')}
    </motion.p>
  );
}

function DotPulse() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

function SparkleLayer() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 60,
        size: 2 + Math.random() * 2.5,
        delay: Math.random() * 3,
        duration: 1.5 + Math.random() * 2,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0">
      {sparkles.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.7)',
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default CelebrationOverlay;
