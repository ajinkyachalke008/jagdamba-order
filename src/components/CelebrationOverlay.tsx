import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import * as Tone from 'tone';

interface Props {
  orderNumber?: string;
  customerName?: string;
  itemCount?: number;
  totalAmount?: number;
  onDone?: () => void;
  duration?: number; // total ms before onDone
}

/**
 * Premium, personalized "Order Confirmed" celebration.
 * Choreographed: stamp drop -> impact (shake, rings, confetti, sound) -> checkmark
 * -> chime + confetti burst -> personalized heading -> order summary -> toast.
 * Tuned to feel joyful yet refined — restrained emoji use, gold-forward palette.
 */
export function CelebrationOverlay({
  orderNumber = 'ORD-8472',
  customerName,
  itemCount,
  totalAmount,
  onDone,
  duration = 4200,
}: Props) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'drop' | 'impact' | 'settle'>('drop');
  const [shake, setShake] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showBurstLines, setShowBurstLines] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const rainStopRef = useRef<(() => void) | null>(null);

  const firstName = useMemo(() => {
    if (!customerName) return '';
    return customerName.trim().split(/\s+/)[0] || '';
  }, [customerName]);

  // ---------- SOUND (Tone.js) ----------
  const playImpactSound = async () => {
    try {
      await Tone.start();
      const thud = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
      }).toDestination();
      thud.volume.value = -6;
      thud.triggerAttackRelease('C1', '8n');
      const noise = new Tone.NoiseSynth({
        noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.06, sustain: 0 },
      }).toDestination();
      noise.volume.value = -18;
      noise.triggerAttackRelease('16n');
      setTimeout(() => { thud.dispose(); noise.dispose(); }, 1000);
    } catch {}
  };

  const playCelebrationChime = async () => {
    try {
      await Tone.start();
      const now = Tone.now();
      const poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.4 },
      }).toDestination();
      poly.volume.value = -10;
      const notes = ['C5', 'E5', 'G5', 'C6'];
      notes.forEach((n, i) => poly.triggerAttackRelease(n, '16n', now + i * 0.07));

      const pluck = new Tone.PluckSynth({ attackNoise: 1, dampening: 4000, resonance: 0.9 }).toDestination();
      pluck.volume.value = -8;
      pluck.triggerAttack('A5', now + 0.42);

      setTimeout(() => { poly.dispose(); pluck.dispose(); }, 2500);
    } catch {}
  };

  // ---------- CONFETTI (premium gold-forward palette) ----------
  const CONFETTI_COLORS = ['#facc15', '#f59e0b', '#fbbf24', '#fde68a', '#ffffff'];
  const ACCENT = ['#f97316', '#fb923c'];

  // Low-power detection: fewer particles / no rain so slower devices stay smooth.
  const lowPower = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const cores = (navigator as any).hardwareConcurrency ?? 8;
    const mem = (navigator as any).deviceMemory ?? 8;
    return cores <= 4 || mem <= 4;
  }, []);

  // Confetti fires from the actual seal centre so bursts stay aligned on every breakpoint.
  const sealAnchorRef = useRef<HTMLDivElement | null>(null);
  const sealOrigin = () => {
    const el = sealAnchorRef.current;
    if (!el) return { x: 0.5, y: 0.38 };
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    };
  };

  const fireImpactConfetti = () => {
    if (reduce) return;
    confetti({
      particleCount: lowPower ? 32 : 60,
      spread: 360,
      startVelocity: 42,
      origin: sealOrigin(),
      colors: [...CONFETTI_COLORS, ...ACCENT],
      scalar: 1.05,
      ticks: 220,
      disableForReducedMotion: true,
      shapes: ['square', 'circle'],
    });
    if (lowPower) return;
    const end = Date.now() + 520;
    const cannons = () => {
      confetti({ particleCount: 4, angle: 60, spread: 50, origin: { x: 0, y: 1 }, colors: CONFETTI_COLORS, ticks: 200 });
      confetti({ particleCount: 4, angle: 120, spread: 50, origin: { x: 1, y: 1 }, colors: CONFETTI_COLORS, ticks: 200 });
      if (Date.now() < end) setTimeout(cannons, 110);
    };
    cannons();
  };

  const startConfettiRain = () => {
    if (reduce || lowPower) return;
    let raf = 0; let stopped = false;
    const start = Date.now();
    const tick = () => {
      if (stopped) return;
      const elapsed = Date.now() - start;
      if (elapsed > 1800) return; // brief, refined rain
      confetti({
        particleCount: 2,
        angle: 270,
        spread: 90,
        startVelocity: 20,
        gravity: 0.65,
        drift: (Math.random() - 0.5) * 1.4,
        origin: { x: Math.random(), y: -0.05 },
        colors: [...CONFETTI_COLORS, ...ACCENT],
        scalar: 0.9,
        ticks: 220,
        disableForReducedMotion: true,
        shapes: ['square', 'circle'],
      });
      raf = window.setTimeout(tick, 150) as unknown as number;
    };
    tick();
    rainStopRef.current = () => { stopped = true; clearTimeout(raf); };
  };


  // ---------- TIMELINE (tightened) ----------
  useEffect(() => {
    if (reduce) {
      setPhase('settle');
      setShowCheck(true); setShowBurstLines(true); setShowHeading(true); setShowSub(true);
      setShowSummary(true); setShowOrder(true); setShowPill(true); setShowToast(true);
      const t = setTimeout(() => onDone?.(), Math.min(duration, 2200));
      return () => clearTimeout(t);
    }

    const timers: number[] = [];
    timers.push(window.setTimeout(() => {
      setPhase('impact');
      setShake(true);
      setShowBurstLines(true);
      fireImpactConfetti();
      playImpactSound();
      window.setTimeout(() => setShake(false), 260);
    }, 380));
    timers.push(window.setTimeout(() => setPhase('settle'), 420));
    timers.push(window.setTimeout(() => {
      setShowCheck(true);
      playCelebrationChime();
      startConfettiRain();
    }, 480));
    timers.push(window.setTimeout(() => setShowHeading(true), 650));
    timers.push(window.setTimeout(() => setShowSub(true), 900));
    timers.push(window.setTimeout(() => setShowSummary(true), 1150));
    timers.push(window.setTimeout(() => setShowOrder(true), 1400));
    timers.push(window.setTimeout(() => setShowPill(true), 1650));
    timers.push(window.setTimeout(() => setShowToast(true), 1850));
    timers.push(window.setTimeout(() => { rainStopRef.current?.(); onDone?.(); }, duration));

    return () => {
      timers.forEach(clearTimeout);
      rainStopRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headingText = firstName ? `Thank you, ${firstName}!` : 'Order Confirmed';

  return (
    <motion.div
      role="dialog"
      aria-live="polite"
      aria-label="Order confirmed"
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 36%, #171126 0%, #0a0a12 55%, #050508 100%)',
      }}
      initial={{ opacity: reduce ? 0 : 1 }}
      animate={
        reduce
          ? { opacity: 1 }
          : shake
          ? { x: [0, -4, 4, -3, 3, -2, 2, 0], y: [0, 2, -1, 1, 0] }
          : { x: 0, y: 0, opacity: 1 }
      }
      transition={reduce ? { duration: 0.3 } : { duration: 0.26 }}
    >
      {/* ambient sparkles — subtle */}
      {!reduce && <SparkleLayer />}

      {/* Center content */}
      <div
        className="relative z-10 mx-auto flex h-full w-full flex-col items-center justify-center px-5 text-center sm:px-8"
        style={{ ['--seal' as any]: 'clamp(76px, 18vw, 112px)' }}
      >
        <div className="flex w-full max-w-[min(92vw,34rem)] flex-col items-center gap-[clamp(0.75rem,2.2vw,1.25rem)]">
          {/* Seal + all radial FX share one perfectly centered anchor */}
          <div
            ref={sealAnchorRef}
            className="relative flex items-center justify-center"
            style={{ width: 'var(--seal)', height: 'var(--seal)', transform: 'translateZ(0)' }}
          >
            {/* impact flash */}
            <AnimatePresence>
              {phase !== 'drop' && !reduce && (
                <motion.div
                  key="flash"
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                  initial={{ opacity: 0, scale: 0.6, x: '-50%', y: '-50%' }}
                  animate={{ opacity: [0, 0.85, 0], scale: [0.6, 1.4, 1.8], x: '-50%', y: '-50%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    width: 'calc(var(--seal) * 3.6)',
                    height: 'calc(var(--seal) * 3.6)',
                    background: 'radial-gradient(circle, rgba(250,204,21,0.32) 0%, transparent 65%)',
                    filter: 'blur(8px)',
                    willChange: 'transform, opacity',
                  }}
                />
              )}
            </AnimatePresence>

            {/* radial burst lines on impact — same trigger + duration as rings */}
            {!reduce && showBurstLines && <BurstLines />}

            {/* expanding rings — concentric with the seal */}
            {!reduce && phase !== 'drop' && (
              <>
                <Ring color="rgba(250,204,21,0.65)" delay={0} />
                <Ring color="rgba(251,146,60,0.45)" delay={0.1} />
                <Ring color="rgba(255,255,255,0.25)" delay={0.2} />
              </>
            )}

            <StampSeal phase={phase} showCheck={showCheck} reduce={!!reduce} />
          </div>

          {/* Heading — personalized */}
          <div className="mt-[clamp(0.75rem,3vw,1.5rem)] flex min-h-[2.6em] w-full items-center justify-center">
            {showHeading && <LetterHeading text={headingText} reduce={!!reduce} />}
          </div>

          {/* Subtext — gold gradient, no emoji */}
          <div className="flex min-h-[1.6em] w-full items-center justify-center">
            {showSub && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="font-medium tracking-wide"
                style={{
                  fontSize: 'clamp(0.95rem, 2.6vw, 1.15rem)',
                  background: 'linear-gradient(90deg,#fde68a,#facc15,#fbbf24,#fde68a)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 4s linear infinite',
                }}
              >
                Your order is confirmed
              </motion.p>
            )}
          </div>

          {/* Order summary chips — dish count + total */}
          <div className="flex min-h-[2.4em] w-full items-center justify-center">
            {showSummary && (itemCount != null || totalAmount != null) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex w-full flex-wrap items-center justify-center gap-2"
              >
                {itemCount != null && (
                  <SummaryChip label={`${itemCount} ${itemCount === 1 ? 'dish' : 'dishes'}`} />
                )}
                {totalAmount != null && (
                  <SummaryChip label={`₹${totalAmount.toFixed(2)}`} accent />
                )}
              </motion.div>
            )}
          </div>

          {/* Order number scramble */}
          <div className="flex min-h-[1.5em] w-full items-center justify-center px-2">
            {showOrder && <OrderNumber value={`Order #${orderNumber}`} reduce={!!reduce} />}
          </div>

          {/* Pill */}
          <div className="mt-[clamp(0.25rem,1.5vw,0.75rem)] flex min-h-[2.75rem] w-full items-center justify-center">
            {showPill && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-[clamp(0.8rem,2.2vw,0.9rem)] text-amber-200"
                style={{ boxShadow: '0 0 24px rgba(250,204,21,0.3)' }}
              >
                <span className="whitespace-nowrap">Preparing your receipt</span>
                <DotPulse />
              </motion.div>
            )}
          </div>
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
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute bottom-6 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-xl bg-white/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span className="text-sm font-medium text-slate-900">
                {firstName ? `${firstName}, your order is placed!` : 'Order placed successfully!'}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-200/70">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'linear' }}
                className="h-full"
                style={{ background: 'linear-gradient(90deg,#facc15,#f59e0b,#f97316)' }}
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
  let animate: any;
  let transition: any;
  if (reduce) {
    animate = { y: 0, scaleX: 1, scaleY: 1, opacity: 1 };
    transition = { duration: 0.3 };
  } else if (phase === 'drop') {
    animate = { y: 0, scaleX: 1, scaleY: 1 };
    transition = { duration: 0.32, ease: [0.55, 0.06, 0.68, 0.19] };
  } else if (phase === 'impact') {
    animate = { y: 0, scaleX: 1.16, scaleY: 0.68 };
    transition = { duration: 0 };
  } else {
    animate = { y: 0, scaleX: 1, scaleY: 1 };
    transition = { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] };
  }

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { y: '-260%', scaleX: 1, scaleY: 1 }}
      animate={animate}
      transition={transition}
      className="relative h-full w-full"
      style={{
        borderRadius: '50%',
        background: 'linear-gradient(145deg,#fde68a,#f59e0b)',
        boxShadow: '0 18px 40px -8px rgba(245,158,11,0.55), 0 0 0 4px rgba(255,255,255,0.06) inset',
        willChange: 'transform',
      }}
    >
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
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

function Ring({ color, delay }: { color: string; delay: number }) {
  // Fills the seal anchor exactly, so scaling keeps it perfectly concentric
  // (no translate classes that framer's transform would override).
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{ border: `2px solid ${color}`, willChange: 'transform, opacity' }}
      initial={{ scale: 0.3, opacity: 0.9 }}
      animate={{ scale: 3.2, opacity: 0 }}
      transition={{ duration: 0.85, ease: 'easeOut', delay }}
    />
  );
}


function LetterHeading({ text, reduce }: { text: string; reduce: boolean }) {
  // Split into words so long names wrap cleanly instead of breaking mid-word.
  const words = text.split(' ');
  let charIndex = 0;
  return (
    <h1
      className="mx-auto w-full max-w-full text-balance font-bold leading-[1.15] tracking-tight text-white"
      style={{
        textShadow: '0 0 28px rgba(250,204,21,0.4)',
        fontSize: 'clamp(1.6rem, 6.4vw, 3rem)',
        overflowWrap: 'anywhere',
      }}
    >

      {words.map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {word.split('').map((c) => {
            const i = charIndex++;
            return (
              <motion.span
                key={i}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0.25 } : { type: 'spring', stiffness: 520, damping: 20, delay: i * 0.022 }}
                style={{ display: 'inline-block' }}
              >
                {c}
              </motion.span>
            );
          })}
          {w < words.length - 1 && <span>{'\u00A0'}</span>}
        </span>
      ))}
    </h1>
  );
}


function SummaryChip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold"
      style={
        accent
          ? {
              borderColor: 'rgba(251,146,60,0.5)',
              background: 'linear-gradient(135deg, rgba(251,146,60,0.18), rgba(250,204,21,0.15))',
              color: '#fed7aa',
              boxShadow: '0 0 20px rgba(251,146,60,0.25)',
            }
          : {
              borderColor: 'rgba(250,204,21,0.4)',
              background: 'rgba(250,204,21,0.08)',
              color: '#fde68a',
            }
      }
    >
      {label}
    </span>
  );
}

function OrderNumber({ value, reduce }: { value: string; reduce: boolean }) {
  const parts = useMemo(() => value.split('').map((c) => ({ c, digit: /\d/.test(c) })), [value]);
  const [display, setDisplay] = useState(() =>
    parts.map((p) => (p.digit ? String(Math.floor(Math.random() * 10)) : p.c))
  );

  useEffect(() => {
    if (reduce) { setDisplay(parts.map((p) => p.c)); return; }
    let raf = 0;
    const locked = new Array(parts.length).fill(false);
    const digitIdxs = parts.map((p, i) => (p.digit ? i : -1)).filter((i) => i >= 0);
    const lockTimers = digitIdxs.map((idx, k) => window.setTimeout(() => { locked[idx] = true; }, 150 + k * 40));

    const tick = () => {
      setDisplay(parts.map((p, i) => {
        if (!p.digit) return p.c;
        if (locked[i]) return p.c;
        return String(Math.floor(Math.random() * 10));
      }));
      raf = window.setTimeout(tick, 40) as unknown as number;
    };
    tick();
    const stop = window.setTimeout(() => {
      clearTimeout(raf);
      setDisplay(parts.map((p) => p.c));
    }, 150 + digitIdxs.length * 40 + 80);
    return () => { clearTimeout(raf); clearTimeout(stop); lockTimers.forEach(clearTimeout); };
  }, [parts, reduce]);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-full break-all font-mono text-[clamp(0.72rem,2.6vw,0.875rem)] tracking-wider text-amber-300/90"
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
      Array.from({ length: 18 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: 1.5 + Math.random() * 2,
        delay: Math.random() * 3,
        duration: 1.6 + Math.random() * 2,
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
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.65)',
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function BurstLines() {
  // Deterministic lengths (no re-randomising between renders) scaled to the seal size.
  const lines = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        angle: (360 / 14) * i,
        factor: i % 2 === 0 ? 1.45 : 1.1,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: 'translate(-50%, -50%)' }}>
      {lines.map((l, i) => (
        // Rotation lives on the wrapper so framer's scaleX transform can't override it.
        <div
          key={i}
          className="absolute left-0 top-0 origin-left"
          style={{ transform: `rotate(${l.angle}deg)` }}
        >
          <motion.div
            style={{
              width: `calc(var(--seal) * ${l.factor})`,
              height: 2,
              marginTop: -1,
              background: 'linear-gradient(90deg, rgba(250,204,21,0.9), transparent)',
              borderRadius: 2,
              transformOrigin: 'left center',
              willChange: 'transform, opacity',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
        </div>
      ))}
    </div>

  );

}

export default CelebrationOverlay;
