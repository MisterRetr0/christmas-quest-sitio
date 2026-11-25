// fx.js — nieve (1 canvas, <= 40 copos), parallax por toque/puntero, chispas.

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Nieve ----------
const MAX_FLAKES = 36; // <= 40
let canvas, g, flakes = [], raf = 0, running = false, w = 0, h = 0, last = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  w = canvas.clientWidth; h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function makeFlake(top) {
  return { x: Math.random() * w, y: top ? -10 : Math.random() * h, r: 1.2 + Math.random() * 2.6,
           v: 18 + Math.random() * 30, ph: Math.random() * 6.28, sw: 8 + Math.random() * 14 };
}
function frame(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,248,238,.85)';
  for (const f of flakes) {
    f.y += f.v * dt; f.ph += dt;
    if (f.y > h + 6) Object.assign(f, makeFlake(true));
    const x = f.x + Math.sin(f.ph) * f.sw;
    g.beginPath(); g.arc(x, f.y, f.r, 0, 6.283); g.fill();
  }
  raf = requestAnimationFrame(frame);
}
export function startSnow() {
  if (!canvas || running || reducedMotion() || document.hidden) return;
  running = true; last = performance.now(); raf = requestAnimationFrame(frame);
}
export function stopSnow() { running = false; cancelAnimationFrame(raf); if (g) g.clearRect(0, 0, w, h); }

export function initSnow(el) {
  canvas = el; g = canvas.getContext('2d');
  resize(); flakes = Array.from({ length: MAX_FLAKES }, () => makeFlake(false));
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? stopSnow() : startSnow())); // pausa si la pestaña está oculta
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => (reducedMotion() ? stopSnow() : startSnow()));
  startSnow();
}

// ---------- Parallax solo por toque/puntero (sin giroscopio) ----------
export function initParallax(stage) {
  if (reducedMotion()) return;
  let held = false;
  const set = (e) => {
    const r = stage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    stage.style.setProperty('--px', x.toFixed(3));
    stage.style.setProperty('--py', y.toFixed(3));
  };
  const reset = () => { held = false; stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); };
  stage.addEventListener('pointerdown', (e) => { held = true; set(e); });
  stage.addEventListener('pointermove', (e) => { if (held || e.pointerType === 'mouse') set(e); });
  stage.addEventListener('pointerup', reset);
  stage.addEventListener('pointercancel', reset);
  stage.addEventListener('pointerleave', reset);
}

// ---------- Chispas (solo Oro, Baya, Ámbar) ----------
const SPARK_COLORS = ['#E8C25A', '#9C1F2B', '#E07B1A'];
/** Lanza chispas en coordenadas relativas al escenario. */
export function sparkle(x, y, n = 10) {
  if (reducedMotion()) return;
  const layer = document.getElementById('fxlayer');
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const a = Math.random() * 6.283, d = 30 + Math.random() * 50;
    s.style.cssText = `left:${x}px;top:${y}px;background:${SPARK_COLORS[i % 3]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    layer.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}
export function vibrate(ms = 30) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

// ---------- FX de plataformas (A1 §5b): coinArc / blockBounce / whiteFlash ----------
const stageEl = () => document.getElementById('stage');
/** Convierte un elemento o {x,y} (coordenadas del escenario) en un punto relativo al escenario. */
function toStagePoint(p) {
  if (p && typeof p.getBoundingClientRect === 'function') {
    const r = p.getBoundingClientRect(), sr = stageEl().getBoundingClientRect();
    return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
  }
  return { x: p.x, y: p.y };
}
/**
 * Pandoras (dijes) saltando en arco parabólico de `from` a `to`, cada una con un "+1" pixelado.
 * from/to: elemento o {x,y} relativo al escenario. Devuelve una promesa que se resuelve al llegar la última.
 */
export function coinArc(from, to, n = 1) {
  const a = toStagePoint(from), b = toStagePoint(to), layer = document.getElementById('fxlayer');
  const dur = reducedMotion() ? 1 : 750, lift = Math.max(70, Math.abs(b.y - a.y) * .4 + 90);
  const anims = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'fx-coin'; c.innerHTML = '<i></i><b>+1</b>'; c.style.left = '0'; c.style.top = '0';
    layer.appendChild(c);
    const frames = [];
    for (let k = 0; k <= 14; k++) {                         // parábola: y = lerp − 4·lift·t(1−t)
      const t = k / 14, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t - 4 * lift * t * (1 - t);
      frames.push({ transform: `translate(${x - 11}px, ${y - 11}px) scale(${1 - t * .3})`, opacity: t > .92 ? 0 : 1, offset: t });
    }
    const an = c.animate(frames, { duration: dur, delay: i * 130, easing: 'linear', fill: 'both' });
    anims.push(an.finished.then(() => c.remove(), () => c.remove()));
  }
  return Promise.all(anims);
}
/** Bloque que rebota estilo plataformas: translateY(-10px), 120 ms, steps(3). */
export function blockBounce(el) {
  if (!el || reducedMotion()) return Promise.resolve();
  return el.animate([{ translate: '0 0' }, { translate: '0 -10px' }, { translate: '0 0' }], { duration: 120, easing: 'steps(3)' }).finished.catch(() => {});
}
/** Destello blanco de pantalla completa de `ms` ms (sube y baja). */
export function whiteFlash(ms = 200) {
  const f = document.createElement('div');
  f.className = 'fx-flash'; stageEl().appendChild(f);
  const an = f.animate([{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 0 }], { duration: reducedMotion() ? 1 : ms, easing: 'linear' });
  return an.finished.then(() => f.remove(), () => f.remove());
}
