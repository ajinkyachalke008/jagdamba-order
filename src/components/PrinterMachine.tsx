import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, CheckCircle2, Volume2, VolumeX, Scissors } from 'lucide-react';
import {
  unlockPrinterAudio, setPrinterMuted, playTick, playChime, playCut, playCrinkle,
  startMotor, stopMotor, vibrate,
} from '@/lib/printerSound';

/* ---------- tunables ---------- */
const PAPER_W = 250;
const TEX_SCALE = 3;
const STEP_INTERVAL = 130;
const STEP_TRANSITION = 110;
const WINDOW_H = 300;

type Stage = 'processing' | 'printing' | 'cutting' | 'complete';

const STATUS_COPY: Record<Stage, string> = {
  processing: 'Processing order',
  printing: 'Printing receipt',
  cutting: 'Cutting paper',
  complete: 'Receipt ready',
};

function buildZigzagClipPath(teeth: number, depthPercent: number) {
  const points = ['0% 0%', '100% 0%'];
  for (let i = 0; i <= teeth; i++) {
    const x = 100 - (i * 100) / teeth;
    const y = i % 2 === 0 ? '100%' : `${100 - depthPercent}%`;
    points.push(`${x}% ${y}`);
  }
  return `polygon(${points.join(', ')})`;
}
const CUTTER_CLIP = buildZigzagClipPath(18, 55);

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}  ${hours}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

/* ---------- paper texture ---------- */
function drawPaper(canvas: HTMLCanvasElement, order: any, language: string) {
  const items: any[] = Array.isArray(order?.items) ? order.items : [];
  const h = 246 + items.length * 16;
  canvas.width = PAPER_W * TEX_SCALE;
  canvas.height = h * TEX_SCALE;
  canvas.style.width = `${PAPER_W}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(TEX_SCALE, TEX_SCALE);
  const w = PAPER_W;

  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.035)';
  for (let gx = 0; gx < w; gx += 3) {
    for (let gy = 0; gy < h; gy += 3) if ((gx + gy) % 9 === 0) ctx.fillRect(gx, gy, 1, 1);
  }

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = "bold 13px ui-monospace, Menlo, monospace";
  ctx.textAlign = 'center';
  ctx.fillText('JAGDAMBA PARCEL', w / 2, 21);

  ctx.fillStyle = '#1c1c1c';
  ctx.font = "9px ui-monospace, Menlo, monospace";
  ctx.fillText('Masur\u2013Shamgaon Road, Masur', w / 2, 47);
  ctx.fillText('8380809079 / 9860403842', w / 2, 59);

  const dashed = (yy: number) => {
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.moveTo(12, yy); ctx.lineTo(w - 12, yy); ctx.stroke();
    ctx.setLineDash([]);
  };

  let y = 72;
  dashed(y);
  y += 14;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1c1c1c';
  ctx.font = "9px ui-monospace, Menlo, monospace";
  ctx.fillText(`Order #${order?.order_number ?? ''}`, 12, y); y += 12;
  ctx.fillText(`Date: ${order?.created_at ? formatDate(order.created_at) : ''}`, 12, y); y += 12;
  ctx.fillText(`Name: ${order?.customer_name ?? ''}`, 12, y); y += 12;
  ctx.fillText(`Type: ${order?.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}`, 12, y); y += 10;
  dashed(y);
  y += 16;

  ctx.font = "9px ui-monospace, Menlo, monospace";
  items.forEach((item) => {
    const name = (language === 'en' ? item.item_name_en : item.item_name_mr) || item.item_name_en || '';
    ctx.textAlign = 'left';
    ctx.fillText(`${name} \u00d7 ${item.quantity}`, 12, y);
    ctx.textAlign = 'right';
    ctx.fillText(`\u20b9${parseFloat(item.subtotal ?? 0).toFixed(0)}`, w - 12, y);
    y += 16;
  });

  y += 2;
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(w - 12, y); ctx.stroke();
  y += 18;
  ctx.font = "bold 13px ui-monospace, Menlo, monospace";
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL', 12, y);
  ctx.textAlign = 'right';
  ctx.fillText(`\u20b9${parseFloat(order?.total ?? 0).toFixed(2)}`, w - 12, y);

  y += 28;
  ctx.font = "9px ui-monospace, Menlo, monospace";
  ctx.textAlign = 'center';
  ctx.fillText('Thank you! Visit again \uD83D\uDE4F', w / 2, y);

  y += 16;
  const bars = [2,1,1,3,1,2,1,1,3,2,1,2,1,3,1,1,2,3,1,2,1,1,3,2,1,2];
  const totalBar = bars.reduce((a, b) => a + b, 0);
  let bx = w / 2 - totalBar / 2;
  ctx.fillStyle = '#111';
  bars.forEach((bw, i) => { if (i % 2 === 0) ctx.fillRect(bx, y, bw, 18); bx += bw; });
  y += 28;
  ctx.font = "7px ui-monospace, Menlo, monospace";
  ctx.fillStyle = '#333';
  ctx.fillText(`*${String(order?.order_number ?? '').replace(/[^A-Z0-9]/gi, '')}*`, w / 2, y);
}

function LedDot({ color, on, pulse }: { color: string; on: boolean; pulse?: boolean }) {
  return (
    <span
      className={pulse && on ? 'animate-pulse' : ''}
      style={{
        width: 6, height: 6, borderRadius: 9999, display: 'inline-block',
        backgroundColor: on ? color : '#3f3f46',
        boxShadow: on ? `0 0 6px ${color}` : 'none',
      }}
    />
  );
}

export function PrinterMachine({
  order, language = 'en', onDone,
}: { order: any; language?: string; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('processing');
  const [step, setStep] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeouts = useRef<number[]>([]);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    []
  );

  const itemCount = Array.isArray(order?.items) ? order.items.length : 0;
  const paperH = 246 + itemCount * 16;
  const steps = Math.max(6, Math.min(14, Math.round(paperH / 26)));

  useEffect(() => {
    if (canvasRef.current) drawPaper(canvasRef.current, order, language);
  }, [order, language]);

  useEffect(() => { setPrinterMuted(muted); }, [muted]);

  useEffect(() => {
    void unlockPrinterAudio();
    const push = (fn: () => void, ms: number) => timeouts.current.push(window.setTimeout(fn, ms));

    vibrate(6);
    push(() => {
      setStage('printing');
      if (!muted) startMotor();
      setShake(!reducedMotion);

      if (reducedMotion) {
        setStep(steps - 1);
        push(() => { stopMotor(); setStage('complete'); playChime(); vibrate([14, 40, 14]); }, 260);
        push(onDone, 1400);
        return;
      }

      for (let i = 0; i < steps; i++) {
        push(() => { setStep(i); playTick(); vibrate(7); }, i * STEP_INTERVAL);
      }
      const printMs = steps * STEP_INTERVAL + 180;
      push(() => {
        stopMotor();
        setShake(false);
        setStage('cutting');
        playCut();
        vibrate([25, 30, 18]);
      }, printMs);
      push(() => {
        setStage('complete');
        playChime();
        playCrinkle();
        vibrate([12, 45, 12]);
      }, printMs + 420);
      push(onDone, printMs + 1500);
    }, 700);

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
      stopMotor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feedPct = step < 0 ? -100 : -100 + ((step + 1) / steps) * 100;
  const progressPct = Math.round(((step + 1) / steps) * 100);

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: 'radial-gradient(ellipse at 50% 18%, #1a1a1d 0%, #0a0a0b 65%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px', overflow: 'hidden',
      }}
    >
      <style>{`
        .jd-paper-transition { transition: transform ${STEP_TRANSITION}ms cubic-bezier(0.4,0,0.2,1); }
        @keyframes jd-printer-shake {
          0%,100% { transform: translate3d(0,0,0); }
          25% { transform: translate3d(-0.7px,0.4px,0); }
          50% { transform: translate3d(0.6px,-0.5px,0); }
          75% { transform: translate3d(-0.4px,-0.3px,0); }
        }
        .jd-shake { animation: jd-printer-shake 90ms linear infinite; }
      `}</style>

      <div className={shake ? 'jd-shake' : ''} style={{ position: 'relative' }}>
        <div
          style={{
            width: 290, padding: 14, borderRadius: 24, border: '1px solid #262629',
            background: 'linear-gradient(180deg, #3a3a3d 0%, #202022 55%, #18181a 100%)',
            boxShadow: '0 30px 60px -25px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
            position: 'relative',
          }}
        >
          {/* lid */}
          <div
            style={{
              height: 32, margin: '-14px -14px 10px',
              background: 'linear-gradient(180deg, #4a4a4e, #333336)',
              clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)',
              position: 'relative', boxShadow: 'inset 0 -3px 5px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{
              position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)',
              width: 126, height: 14, borderRadius: 9999,
              background: 'linear-gradient(180deg, #efe9d8, #cfc7ae)',
              boxShadow: 'inset 0 3px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.35)',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 6, height: 6, borderRadius: 9999, background: '#8a8272',
              }} />
            </div>
          </div>

          {/* control panel */}
          <div style={{
            borderRadius: 16, padding: '10px 10px 12px', marginBottom: 12,
            background: 'linear-gradient(180deg, #29292c, #1e1e20)',
            border: '1px solid #141416',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}>
            <div style={{ textAlign: 'center', color: '#8b8b8f', fontSize: 9, letterSpacing: '0.14em', marginBottom: 6 }}>
              JAGDAMBA PRINT SYSTEM · TM-200
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
              <LedDot color="#22c55e" on />
              <LedDot color="#f59e0b" on={stage === 'processing'} pulse />
              <LedDot color="#38bdf8" on={stage === 'printing' || stage === 'cutting'} pulse />
              <button
                onClick={() => setMuted((m) => !m)}
                style={{ marginLeft: 4, color: '#8b8b8f', background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}
                aria-label={muted ? 'Unmute printer' : 'Mute printer'}
              >
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            </div>

            {/* LCD */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px solid #262629', background: '#04120a', padding: '10px 12px' }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 3px)',
              }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                {stage === 'complete'
                  ? <CheckCircle2 size={14} style={{ color: '#5eead4' }} />
                  : stage === 'cutting'
                    ? <Scissors size={14} style={{ color: '#5eead4' }} />
                    : <Loader2 size={14} className="animate-spin" style={{ color: '#5eead4' }} />}
                <span style={{
                  color: '#5eead4', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11,
                  letterSpacing: '0.08em', textShadow: '0 0 6px rgba(94,234,212,0.65)',
                }}>
                  {STATUS_COPY[stage].toUpperCase()}<span className="animate-pulse">_</span>
                </span>
              </div>
              <div style={{ position: 'relative', marginTop: 4, color: '#3f8f7c', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.06em' }}>
                {order?.order_number ? `ORDER #${order.order_number}` : 'HJ-PRINTER · STANDBY'}
              </div>
              {stage === 'printing' && (
                <div style={{ position: 'relative', marginTop: 8, height: 4, borderRadius: 9999, background: 'rgba(94,234,212,0.15)' }}>
                  <div className="jd-paper-transition" style={{
                    height: 4, borderRadius: 9999, width: `${progressPct}%`,
                    background: '#5eead4', boxShadow: '0 0 6px rgba(94,234,212,0.8)',
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* cutter + slot */}
          <div style={{ margin: '0 20px' }}>
            <div style={{ height: 5, clipPath: CUTTER_CLIP, background: 'linear-gradient(180deg, #d4d4d8, #71717a)' }} />
            <div style={{ height: 6, marginTop: 2, borderRadius: 9999, background: '#050505', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)' }} />
          </div>

          {/* paper window */}
          <div style={{ position: 'relative', marginTop: 10, height: Math.min(WINDOW_H, paperH + 10), overflow: 'hidden' }}>
            <div className="jd-paper-transition" style={{ transform: `translateY(${feedPct}%)` }}>
              <canvas
                ref={canvasRef}
                style={{
                  display: 'block', margin: '0 auto',
                  filter: stage === 'complete' ? 'none' : 'brightness(0.98)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.45)',
                }}
              />
            </div>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 14, pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)',
            }} />
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, color: '#57575c', fontSize: 7, letterSpacing: '0.08em' }}>
            MODEL TM-200 · 220–240V · MADE FOR JAGDAMBA PARCEL
          </div>
        </div>

        <span style={{ position: 'absolute', bottom: -5, left: 26, width: 16, height: 6, borderRadius: 9999, background: '#0c0c0d' }} />
        <span style={{ position: 'absolute', bottom: -5, right: 26, width: 16, height: 6, borderRadius: 9999, background: '#0c0c0d' }} />
      </div>

      <p style={{ marginTop: 18, color: '#6b6b70', fontSize: 12, textAlign: 'center' }}>
        {stage === 'complete' ? 'Receipt printed — tearing it off…' : 'Printing your receipt…'}
      </p>
      <button
        onClick={onDone}
        style={{
          marginTop: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)',
          color: '#9a9aa0', borderRadius: 8, padding: '6px 14px', fontSize: 11, cursor: 'pointer',
        }}
      >
        Skip
      </button>
    </div>
  );
}

export default PrinterMachine;
