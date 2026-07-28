import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Download, Home, Phone, Loader2, Clock, Star, Search } from 'lucide-react';
import { generateReceiptPDF } from '@/lib/orderUtils';
import { useCart } from '@/contexts/CartContext';
import { t } from '@/lib/translations';
import jsPDF from 'jspdf';
import { CelebrationOverlay as NewCelebrationOverlay } from '@/components/CelebrationOverlay';

/* ---------- date helper ---------- */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${mon} ${year}  ${hours}:${mins} ${ampm}`;
}

/* ---------- draw receipt texture for WebGL ---------- */
function drawReceiptTexture(canvas: HTMLCanvasElement, orderData: any, language: string) {
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  const W = 512, H = 1024;

  ctx.fillStyle = '#f0ede6';
  ctx.fillRect(0, 0, W, H);

  const BAND_H = 120;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, BAND_H);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JAGDAMBA PARCEL', W / 2, BAND_H / 2);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '19px monospace';
  ctx.fillText('Pure Vegetarian Parcel Service', W / 2, BAND_H + 40);
  ctx.fillText('Masur\u2013Shamgaon Road, Masur', W / 2, BAND_H + 72);
  ctx.fillText('Tel: 8380809079 / 9860403842', W / 2, BAND_H + 104);
  ctx.fillText('- - - - - - - - - - - - - - - - - -', W / 2, BAND_H + 150);

  ctx.textAlign = 'left';
  ctx.font = '20px monospace';
  const metaY = BAND_H + 200;
  ctx.fillText('Date : ' + formatDate(orderData.created_at), 40, metaY);
  ctx.fillText('Order: ' + orderData.order_number, 40, metaY + 42);
  ctx.fillText('Name : ' + orderData.customer_name, 40, metaY + 84);
  ctx.fillText('Phone: ' + orderData.customer_phone, 40, metaY + 126);
  ctx.fillText('Type : ' + (orderData.delivery_method === 'pickup' ? 'PICKUP' : 'DELIVERY'), 40, metaY + 168);
  ctx.fillText('Pay  : ' + (orderData.payment_method === 'cash' ? 'CASH' : 'ONLINE'), 40, metaY + 210);

  ctx.textAlign = 'center';
  ctx.fillText('- - - - - - - - - - - - - - - - - -', W / 2, metaY + 260);

  const startY = metaY + 310;
  const lineH = 46;
  orderData.items.forEach((item: any, i: number) => {
    const name = language === 'en' ? item.item_name_en : item.item_name_mr;
    ctx.textAlign = 'left';
    ctx.font = '20px monospace';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(name + ' \u00d7 ' + item.quantity, 40, startY + lineH * i);
    ctx.textAlign = 'right';
    ctx.fillText('\u20b9' + parseFloat(item.subtotal).toFixed(2), W - 40, startY + lineH * i);
  });

  const divY = startY + lineH * orderData.items.length + 20;
  ctx.textAlign = 'center';
  ctx.fillText('- - - - - - - - - - - - - - - - - -', W / 2, divY);

  ctx.fillRect(40, divY + 40, W - 80, 4);

  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL', 40, divY + 90);
  ctx.textAlign = 'right';
  ctx.fillText('\u20b9' + parseFloat(orderData.total).toFixed(2), W - 40, divY + 90);

  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('Thank you! Visit again. \ud83d\ude4f', W / 2, divY + 165);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('Hotel Jagdamba - Since Day One', W / 2, divY + 202);
}

/* ---------- math helpers ---------- */
function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0, 0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}
function lookAt(eye: number[], center: number[], up: number[]) {
  const zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz);
  const zxn = zx * len, zyn = zy * len, zzn = zz * len;
  const xx = up[1] * zzn - up[2] * zyn, xy = up[2] * zxn - up[0] * zzn, xz = up[0] * zyn - up[1] * zxn;
  len = Math.sqrt(xx * xx + xy * xy + xz * xz);
  const xxn = xx / len, xyn = xy / len, xzn = xz / len;
  const yx = zyn * xzn - zzn * xyn, yy = zzn * xxn - zxn * xzn, yz = zxn * xyn - zyn * xxn;
  return new Float32Array([
    xxn, yx, zxn, 0, xyn, yy, zyn, 0, xzn, yz, zzn, 0,
    -(xxn * eye[0] + xyn * eye[1] + xzn * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zxn * eye[0] + zyn * eye[1] + zzn * eye[2]), 1,
  ]);
}

const VS = `attribute vec3 a_pos;attribute vec3 a_norm;attribute vec2 a_uv;uniform mat4 u_proj;uniform mat4 u_view;varying vec3 v_norm;varying vec2 v_uv;void main(){v_norm=a_norm;v_uv=a_uv;gl_Position=u_proj*u_view*vec4(a_pos,1.0);}`;
const FS = `precision mediump float;varying vec3 v_norm;varying vec2 v_uv;uniform sampler2D u_tex;void main(){vec3 norm=normalize(v_norm);if(!gl_FrontFacing)norm=-norm;vec3 l1=normalize(vec3(0.4,0.8,0.6));vec3 l2=normalize(vec3(-0.5,-0.2,0.8));float d1=max(dot(norm,l1),0.0);float d2=max(dot(norm,l2),0.0);float ambient=0.55;vec4 tc=texture2D(u_tex,v_uv);vec3 fc=tc.rgb*(ambient+d1*0.4+d2*0.2);gl_FragColor=vec4(fc,tc.a);}`;

/* ---------- Confetti ---------- */
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#E879F9', '#34D399'];
function generateConfettiDots(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 60 + Math.random() * 140;
    const shapes = ['circle', 'rect', 'star'] as const;
    return {
      tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist,
      size: 5 + Math.random() * 7, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 300, rotation: Math.random() * 720 - 360,
      shape: shapes[i % shapes.length],
    };
  });
}
function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count;
    const dist = 30 + Math.random() * 200;
    return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, delay: 100 + Math.random() * 600, duration: 600 + Math.random() * 400, size: 2 + Math.random() * 3 };
  });
}

/* ---------- Celebration Overlay ---------- */
function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const dots = useRef(generateConfettiDots(30)).current;
  const sparkles = useRef(generateSparkles(16)).current;

  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, dur: number, vol: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start); osc.stop(audioCtx.currentTime + start + dur);
      };
      playTone(523.25, 0, 0.3, 0.15); playTone(659.25, 0.12, 0.3, 0.15);
      playTone(783.99, 0.24, 0.3, 0.15); playTone(1046.5, 0.36, 0.5, 0.2);
      playTone(1318.5, 0.5, 0.6, 0.08); playTone(1568.0, 0.6, 0.5, 0.06);
    } catch {}
    const t1 = setTimeout(() => setFadeOut(true), 2400);
    const t2 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'radial-gradient(ellipse at 50% 40%, #1f1a2e 0%, #0d0a14 60%, #000000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1, transition: 'opacity 400ms ease-out', overflow: 'hidden',
    }}>
      {[0, 200, 500].map((delay, i) => (
        <div key={`ring-${i}`} style={{
          position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, borderRadius: '50%',
          border: `2px solid ${['#FFD700', '#FF6B6B', '#4ECDC4'][i]}`, opacity: 0,
          transform: 'translate(-50%, -50%)',
          animation: `celebrationRing 1200ms ease-out ${delay}ms forwards`,
        } as React.CSSProperties} />
      ))}
      {sparkles.map((s, i) => (
        <div key={`sparkle-${i}`} style={{
          position: 'absolute', left: '50%', top: '50%', width: s.size, height: s.size,
          background: '#fff', borderRadius: '50%', boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
          animation: `sparkleFloat ${s.duration}ms ease-out ${s.delay}ms forwards`,
          '--tx': `${s.tx}px`, '--ty': `${s.ty}px`, opacity: 0,
        } as React.CSSProperties} />
      ))}
      {dots.map((dot, i) => (
        <div key={`confetti-${i}`} style={{
          position: 'absolute', width: dot.size,
          height: dot.shape === 'rect' ? dot.size * 1.8 : dot.size,
          borderRadius: dot.shape === 'circle' ? '50%' : '1px',
          background: dot.color, left: '50%', top: '50%',
          animation: `confettiBurst 1400ms ease-out ${dot.delay}ms forwards`,
          '--tx': `${dot.tx}px`, '--ty': `${dot.ty}px`, opacity: 0,
          boxShadow: `0 0 8px ${dot.color}80`,
        } as React.CSSProperties} />
      ))}
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
        animation: 'glowPulse 1600ms ease-in-out infinite',
      }} />
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginBottom: 8 }}>
        {['✨', '🎉', '✨'].map((emoji, i) => (
          <div key={`emoji-${i}`} style={{
            fontSize: i === 1 ? 80 : 40,
            animation: `popIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 120}ms forwards`,
            transform: 'scale(0)',
            filter: i === 1 ? 'drop-shadow(0 0 20px rgba(255,215,0,0.6))' : 'none',
          }}>{emoji}</div>
        ))}
      </div>
      <h1 style={{
        color: '#fff', fontWeight: 'bold', fontSize: 30, marginTop: 12,
        animation: 'slideUpFade 600ms ease-out 300ms forwards', opacity: 0,
        textShadow: '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2)',
      }}>Order Confirmed!</h1>
      <p style={{ color: '#bbb', fontSize: 16, marginTop: 8, animation: 'slideUpFade 600ms ease-out 500ms forwards', opacity: 0 }}>
        Your parcel is being prepared 🍱
      </p>
      <div style={{
        marginTop: 20, padding: '6px 20px', borderRadius: 20,
        border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.08)',
        color: '#FFD700', fontSize: 14, fontFamily: 'monospace',
        animation: 'slideUpFade 600ms ease-out 700ms forwards', opacity: 0,
      }}>🧾 Receipt generating...</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #FFD700, #FF6B6B, #4ECDC4, #FFD700)',
          backgroundSize: '200% 100%',
          animation: 'fillBar 2600ms linear forwards, shimmer 1s linear infinite', width: 0,
        }} />
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { language } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) { navigate('/'); return; }
    fetchOrderDetails();
  }, [orderId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const navState = (window.history.state?.usr ?? {}) as { phone?: string };
      const phone =
        navState.phone ||
        sessionStorage.getItem(`order_phone_${orderId}`) ||
        '';
      if (!phone) throw new Error('Missing phone for order verification');

      const { data, error } = await (supabase as any).rpc(
        'get_order_for_success',
        { _order_id: orderId, _phone: phone }
      );
      if (error) throw error;
      if (!data) throw new Error('Order not found');
      const order = (data as any).order;
      const items = (data as any).items ?? [];
      setOrderData({ ...order, items });
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // WebGL cloth simulation
  useEffect(() => {
    if (!orderData || !canvasRef.current || showCelebration) return;

    const glCanvas = canvasRef.current;
    const gl = glCanvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) { setWebglFailed(true); return; }

    const texCanvas = document.createElement('canvas');
    drawReceiptTexture(texCanvas, orderData, language);

    const resize = () => {
      glCanvas.width = window.innerWidth * devicePixelRatio;
      glCanvas.height = window.innerHeight * devicePixelRatio;
      glCanvas.style.width = window.innerWidth + 'px';
      glCanvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    function compileShader(src: string, type: number) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src); gl!.compileShader(s); return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(VS, gl.VERTEX_SHADER));
    gl.attachShader(prog, compileShader(FS, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    const aNorm = gl.getAttribLocation(prog, 'a_norm');
    const aUV = gl.getAttribLocation(prog, 'a_uv');
    const uProj = gl.getUniformLocation(prog, 'u_proj');
    const uView = gl.getUniformLocation(prog, 'u_view');

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const numX = 25, numY = 50;
    const clothW = 3.0, clothH = 6.0;
    const total = numX * numY;

    const pos = new Float32Array(total * 3);
    const prev = new Float32Array(total * 3);
    const pinned = new Uint8Array(total);
    const uvs = new Float32Array(total * 2);

    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        const idx = y * numX + x;
        const px = (x / (numX - 1) - 0.5) * clothW;
        const py = -(y / (numY - 1)) * clothH;
        pos[idx * 3] = px; pos[idx * 3 + 1] = py; pos[idx * 3 + 2] = 0;
        prev[idx * 3] = px; prev[idx * 3 + 1] = py; prev[idx * 3 + 2] = 0;
        uvs[idx * 2] = x / (numX - 1); uvs[idx * 2 + 1] = y / (numY - 1);
        if (y === 0) pinned[idx] = 1;
      }
    }

    type Constraint = [number, number, number];
    const constraints: Constraint[] = [];
    function addC(a: number, b: number) {
      const dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1], dz = pos[a * 3 + 2] - pos[b * 3 + 2];
      constraints.push([a, b, Math.sqrt(dx * dx + dy * dy + dz * dz)]);
    }
    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        const i = y * numX + x;
        if (x < numX - 1) addC(i, i + 1);
        if (y < numY - 1) addC(i, i + numX);
        if (x < numX - 1 && y < numY - 1) { addC(i, i + numX + 1); addC(i + 1, i + numX); }
        if (x < numX - 2) addC(i, i + 2);
        if (y < numY - 2) addC(i, i + numX * 2);
      }
    }

    const idxArr: number[] = [];
    for (let y = 0; y < numY - 1; y++) {
      for (let x = 0; x < numX - 1; x++) {
        const tl = y * numX + x, tr = tl + 1, bl = tl + numX, br = bl + 1;
        idxArr.push(tl, bl, tr, tr, bl, br);
      }
    }
    const indices = new Uint16Array(idxArr);

    const posBuf = gl.createBuffer()!;
    const normBuf = gl.createBuffer()!;
    const uvBuf = gl.createBuffer()!;
    const idxBuf = gl.createBuffer()!;

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const normals = new Float32Array(total * 3);
    let grabbed = -1;
    let grabDepth = 0;
    const camPos = [0, -3.0, 9.0];

    function unproject(px: number, py: number, depth: number): [number, number, number] {
      const aspect = glCanvas.width / glCanvas.height;
      const fov = 45 * Math.PI / 180;
      const tanHalf = Math.tan(fov / 2);
      const ndcX = (px / window.innerWidth) * 2 - 1;
      const ndcY = 1 - (py / window.innerHeight) * 2;
      const dirX = ndcX * tanHalf * aspect;
      const dirY = ndcY * tanHalf;
      const dirZ = -1;
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      const tt = depth / len;
      return [camPos[0] + dirX * tt, camPos[1] + dirY * tt, camPos[2] + dirZ * tt];
    }

    function findNearest(wx: number, wy: number, wz: number, any: boolean = false): number {
      let best = -1, bestD = any ? Infinity : 1.0;
      for (let i = 0; i < total; i++) {
        const dx = pos[i * 3] - wx, dy = pos[i * 3 + 1] - wy, dz = pos[i * 3 + 2] - wz;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }

    // Touch ripple spawner
    function spawnRipple(x: number, y: number) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0;border-radius:50%;border:2px solid rgba(255,165,0,0.7);pointer-events:none;z-index:11;transform:translate(-50%,-50%);`;
      document.getElementById('touch-fx-layer')?.appendChild(ripple);
      ripple.animate([
        { width: '0px', height: '0px', opacity: 0.8, borderWidth: '2px' },
        { width: '80px', height: '80px', opacity: 0, borderWidth: '0.5px' },
      ], { duration: 500, easing: 'ease-out' });
      setTimeout(() => ripple.remove(), 500);
    }

    // Trail dot spawner
    function spawnTrail(x: number, y: number) {
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,rgba(255,165,0,0.6),transparent);pointer-events:none;z-index:11;transform:translate(-50%,-50%);`;
      document.getElementById('touch-fx-layer')?.appendChild(dot);
      dot.animate([
        { opacity: 0.8, transform: 'translate(-50%,-50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%,-50%) scale(0.2)' },
      ], { duration: 400, easing: 'ease-out' });
      setTimeout(() => dot.remove(), 400);
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      try { glCanvas.setPointerCapture(e.pointerId); } catch {}
      const [wx, wy, wz] = unproject(e.clientX, e.clientY, Math.sqrt(camPos[2] * camPos[2]));
      let nearest = findNearest(wx, wy, wz);
      // Fallback: if nothing close, grab nearest particle anyway so a tap always engages
      if (nearest < 0) nearest = findNearest(wx, wy, wz, true);
      if (nearest >= 0 && !pinned[nearest]) {
        grabbed = nearest;
        grabDepth = camPos[2] - pos[nearest * 3 + 2];
        if (navigator.vibrate) navigator.vibrate(15);
        spawnRipple(e.clientX, e.clientY);
        if (indicatorRef.current) {
          indicatorRef.current.style.display = 'block';
          indicatorRef.current.style.left = e.clientX + 'px';
          indicatorRef.current.style.top = e.clientY + 'px';
          indicatorRef.current.style.transform = 'translate(-50%,-50%) scale(1.3)';
          setTimeout(() => {
            if (indicatorRef.current) indicatorRef.current.style.transform = 'translate(-50%,-50%) scale(1)';
          }, 150);
        }
      }
    };
    let trailFrame = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (grabbed < 0) return;
      const [wx, wy, wz] = unproject(e.clientX, e.clientY, grabDepth);
      pos[grabbed * 3] = wx; pos[grabbed * 3 + 1] = wy; pos[grabbed * 3 + 2] = wz;
      prev[grabbed * 3] = wx; prev[grabbed * 3 + 1] = wy; prev[grabbed * 3 + 2] = wz;
      if (indicatorRef.current) {
        indicatorRef.current.style.left = e.clientX + 'px';
        indicatorRef.current.style.top = e.clientY + 'px';
      }
      // Trail dots every 3 frames
      trailFrame++;
      if (trailFrame % 3 === 0) spawnTrail(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      if (grabbed >= 0 && navigator.vibrate) navigator.vibrate(8);
      grabbed = -1;
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = 'translate(-50%,-50%) scale(0.5)';
        setTimeout(() => {
          if (indicatorRef.current) {
            indicatorRef.current.style.display = 'none';
            indicatorRef.current.style.transform = 'translate(-50%,-50%) scale(1)';
          }
        }, 150);
      }
    };

    glCanvas.addEventListener('pointerdown', onPointerDown);
    glCanvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.04, 0.04, 0.04, 1.0);

    let time = 0;
    let rafId = 0;

    function render() {
      rafId = requestAnimationFrame(render);
      time += 0.016;
      const gravity = -0.007;
      const windX = Math.sin(time * 1.5) * 0.0015;
      const windZ = Math.cos(time * 1.1) * 0.0015;

      for (let i = 0; i < total; i++) {
        if (pinned[i] || i === grabbed) continue;
        const ix = i * 3, iy = ix + 1, iz = ix + 2;
        const vx = (pos[ix] - prev[ix]) * 0.985;
        const vy = (pos[iy] - prev[iy]) * 0.985;
        const vz = (pos[iz] - prev[iz]) * 0.985;
        const vertFactor = (i / numX | 0) / numY;
        prev[ix] = pos[ix]; prev[iy] = pos[iy]; prev[iz] = pos[iz];
        pos[ix] += vx + windX * vertFactor;
        pos[iy] += vy + gravity;
        pos[iz] += vz + windZ * vertFactor;
      }

      for (let iter = 0; iter < 15; iter++) {
        for (let c = 0; c < constraints.length; c++) {
          const [a, b, rest] = constraints[c];
          const ax = a * 3, ay = ax + 1, az = ax + 2;
          const bx = b * 3, by = bx + 1, bz = bx + 2;
          let dx = pos[bx] - pos[ax], dy = pos[by] - pos[ay], dz = pos[bz] - pos[az];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 0.0001) continue;
          const diff = (dist - rest) / dist * 0.5;
          dx *= diff; dy *= diff; dz *= diff;
          const pa = pinned[a] || a === grabbed;
          const pb = pinned[b] || b === grabbed;
          if (!pa && !pb) {
            pos[ax] += dx; pos[ay] += dy; pos[az] += dz;
            pos[bx] -= dx; pos[by] -= dy; pos[bz] -= dz;
          } else if (!pa) {
            pos[ax] += dx * 2; pos[ay] += dy * 2; pos[az] += dz * 2;
          } else if (!pb) {
            pos[bx] -= dx * 2; pos[by] -= dy * 2; pos[bz] -= dz * 2;
          }
        }
      }

      normals.fill(0);
      for (let i = 0; i < indices.length; i += 3) {
        const ia = indices[i], ib = indices[i + 1], ic = indices[i + 2];
        const iax = pos[ia * 3], iay = pos[ia * 3 + 1], iaz = pos[ia * 3 + 2];
        const e1x = pos[ib * 3] - iax, e1y = pos[ib * 3 + 1] - iay, e1z = pos[ib * 3 + 2] - iaz;
        const e2x = pos[ic * 3] - iax, e2y = pos[ic * 3 + 1] - iay, e2z = pos[ic * 3 + 2] - iaz;
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        for (const vi of [ia, ib, ic]) {
          normals[vi * 3] += nx; normals[vi * 3 + 1] += ny; normals[vi * 3 + 2] += nz;
        }
      }

      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      const aspect = glCanvas.width / glCanvas.height;
      const projMat = perspective(45 * Math.PI / 180, aspect, 0.1, 100);
      const viewMat = lookAt(camPos, [0, -3.0, 0], [0, 1, 0]);
      gl!.uniformMatrix4fv(uProj, false, projMat);
      gl!.uniformMatrix4fv(uView, false, viewMat);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, pos, gl!.DYNAMIC_DRAW);
      gl!.enableVertexAttribArray(aPos);
      gl!.vertexAttribPointer(aPos, 3, gl!.FLOAT, false, 0, 0);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, normBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, normals, gl!.DYNAMIC_DRAW);
      gl!.enableVertexAttribArray(aNorm);
      gl!.vertexAttribPointer(aNorm, 3, gl!.FLOAT, false, 0, 0);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, uvBuf);
      gl!.enableVertexAttribArray(aUV);
      gl!.vertexAttribPointer(aUV, 2, gl!.FLOAT, false, 0, 0);

      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl!.drawElements(gl!.TRIANGLES, indices.length, gl!.UNSIGNED_SHORT, 0);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      glCanvas.removeEventListener('pointerdown', onPointerDown);
      glCanvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [orderData, showCelebration, language]);

  const handleDownloadPDF = () => {
    if (!orderData) return;
    const pdf = generateReceiptPDF({
      orderNumber: orderData.order_number,
      customerName: orderData.customer_name,
      customerPhone: orderData.customer_phone,
      deliveryMethod: orderData.delivery_method,
      paymentMethod: orderData.payment_method,
      items: orderData.items.map((item: any) => ({
        nameEn: item.item_name_en, nameMr: item.item_name_mr,
        quantity: item.quantity, price: parseFloat(item.price), subtotal: parseFloat(item.subtotal)
      })),
      total: parseFloat(orderData.total),
      createdAt: orderData.created_at
    });
    pdf.save(`receipt-${orderData.order_number}.pdf`);
  };

  const handleWhatsApp = () => {
    if (!orderData) return;
    const items = orderData.items.map((i: any) =>
      `• ${language === 'en' ? i.item_name_en : i.item_name_mr} × ${i.quantity} — ₹${parseFloat(i.subtotal).toFixed(2)}`
    ).join('\n');
    const msg = `🧾 *JAGDAMBA PARCEL*\n\n✅ *Order Confirmed!*\n\n📋 *Order:* ${orderData.order_number}\n👤 *Name:* ${orderData.customer_name}\n📞 *Phone:* ${orderData.customer_phone}\n\n🍽️ *Items:*\n${items}\n\n💵 *TOTAL: ₹${parseFloat(orderData.total).toFixed(2)}*\n\nThank you! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderData) return null;

  const btnBase: React.CSSProperties = {
    borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, fontFamily: 'sans-serif', border: 'none', flex: '1 1 0',
    minWidth: 0, whiteSpace: 'nowrap',
  };

  // WebGL mode - full screen cloth simulation
  if (!webglFailed) {
    return (
      <div style={{ margin: 0, padding: 0, background: '#0a0a0a', overflow: 'hidden', touchAction: 'none', width: '100vw', height: '100vh', position: 'relative' }}>
        {showCelebration && <CelebrationOverlay onDone={() => setShowCelebration(false)} />}

        {!showCelebration && (
          <>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, cursor: 'grab', touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} />
            <div id="touch-fx-layer" style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none', overflow: 'hidden' }} />
            <div ref={indicatorRef} style={{ position: 'absolute', width: 36, height: 36, background: 'radial-gradient(circle, rgba(255,165,0,0.25), transparent)', border: '2px solid rgba(255,165,0,0.5)', borderRadius: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', display: 'none', zIndex: 12, transition: 'transform 150ms ease-out', boxShadow: '0 0 15px rgba(255,165,0,0.3), 0 0 30px rgba(255,165,0,0.1)' }} />

            <div style={{ position: 'absolute', bottom: 130, width: '100%', textAlign: 'center', zIndex: 2, pointerEvents: 'none', userSelect: 'none' }}>
              <p style={{ margin: 0, color: '#666', fontSize: 17, fontWeight: 500, letterSpacing: 0.5 }}>Grab and drag the receipt</p>
            </div>

            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 3, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, maxWidth: 480, width: '100%' }}>
                <button onClick={handleWhatsApp} style={{ ...btnBase, background: '#25D366', color: '#fff' }}>📲 WhatsApp</button>
                <button onClick={handleDownloadPDF} style={{ ...btnBase, background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>⬇️ PDF</button>
                <a href="tel:8380809079" style={{ ...btnBase, background: '#FF6B35', color: '#fff', textDecoration: 'none' }}>📞 Call</a>
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 480, width: '100%' }}>
                <button onClick={() => navigate(`/track-order?order=${orderData.order_number}`)} style={{ ...btnBase, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>🔍 Track</button>
                <button onClick={() => navigate('/')} style={{ ...btnBase, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>🏠 Order Again</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Fallback - thermal receipt style (no WebGL)
  const isDelivery = orderData.delivery_method !== 'pickup';
  const pointsEarned = Math.floor(parseFloat(orderData.total) / 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-primary">{t('orderSuccess', language)}</h1>
            <p className="text-muted-foreground text-lg">{t('thankYou', language)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-card border-border p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">{t('estimatedTime', language)}</p>
                <p className="text-sm text-primary font-semibold">
                  {isDelivery ? t('deliveryTime', language) : t('prepTime', language)}
                </p>
              </div>
            </Card>
            <Card className="bg-card border-border p-4 flex items-center gap-3">
              <Star className="h-8 w-8 text-primary fill-primary" />
              <div>
                <p className="font-bold text-foreground">{t('pointsEarned', language)}</p>
                <p className="text-sm text-primary font-semibold">+{pointsEarned} {t('loyaltyPoints', language)}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleDownloadPDF} variant="outline" size="lg" className="w-full border-primary hover:bg-primary/10">
              <Download className="mr-2 h-5 w-5" /> {t('downloadReceipt', language)}
            </Button>
            <Button onClick={() => navigate(`/track-order?order=${orderData.order_number}`)} variant="outline" size="lg" className="w-full border-primary hover:bg-primary/10">
              <Search className="mr-2 h-5 w-5" /> Track Order
            </Button>
            <Button onClick={() => navigate('/')} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Home className="mr-2 h-5 w-5" /> {t('placeAnotherOrder', language)}
            </Button>
            <Button onClick={() => window.location.href = 'tel:+918380809079'} variant="outline" size="lg" className="w-full border-primary hover:bg-primary/10">
              <Phone className="mr-2 h-5 w-5" /> {t('callHotel', language)}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
