// vn.js — motor de novela visual (contrato A2 §4, puesta en escena A3 §5).
// Sprites SVG entintados incrustados INLINE (para que usen #inkWobble / #hatch45 de index.html), con caché.
//   stage(container) · show(char, expr, side, {enter:'slide'|'fade'}) · expr(char, expr) · emote(char, tipo)
//   hop(char) · shake(char) · focus(char) · hide(char) · cg(name) · clearCg()   (+ extras: zoom(on), preload(), reset())
// Personajes: 'adventurer' (siempre a la izquierda) y 'mom' (siempre a la derecha). Emotes: sweat ! ? hearts sparkle anger notes.
// Todas las llamadas son seguras antes de que carguen los SVG: se encadenan en orden.

const BASE = new URL('../../assets/vn/', import.meta.url);
const SVGNS = 'http://www.w3.org/2000/svg';

/** Datos de cada personaje (coordenadas en el viewBox 600×900 del sprite). */
const CHARS = {
  adventurer: {
    file: 'adventurer.svg', side: 'left',
    exprs: ['neutral', 'happy', 'nervous', 'embarrassed', 'proud', 'tender'],
    alias: { smile: 'happy', laughing: 'happy', moved: 'tender', suspicious: 'nervous' },
    // esquina superior del pelo (con el pollito encima): [izquierda, derecha]
    anchor: { left: [190, 70], right: [410, -40] },
    pose: { happy: { head: 'translate(0 -4)', body: 'translate(0 -4)' }, proud: { head: 'translate(0 -6)' } },
  },
  mom: {
    file: 'mom.svg', side: 'right',
    exprs: ['neutral', 'smile', 'suspicious', 'laughing', 'moved', 'proud'],
    alias: { happy: 'smile', embarrassed: 'smile', tender: 'moved', nervous: 'suspicious' },
    anchor: { left: [178, 186], right: [424, 186] },
    pose: { laughing: { head: 'rotate(-5 300 480)' } },
  },
};
const POS = { left: 27, center: 50, right: 73 };
const T = { enter: 320, exit: 220, cg: 600, hop: 260, shake: 300, emoteIn: 180, emoteLive: 900, zoom: 400 };
const EASE = 'cubic-bezier(.2,.8,.2,1)';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const cache = new Map();          // url → Promise<string>
const fetchText = (name) => {
  const url = new URL(name, BASE).href;
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.text(); }).catch((e) => { cache.delete(url); throw e; }));
  return cache.get(url);
};

let root = null, spritesEl = null, cgEl = null, container = null;
const actors = new Map();         // char → { el, bob, svg, side, expr, emoteEl, emoteT }
let chain = Promise.resolve();
let instance = 0, cgToken = 0, hushT = 0;
const enqueue = (fn) => { chain = chain.then(fn).catch((e) => console.warn('[vn]', e)); return chain; };

// ---------------------------------------------------------------- estilos y defs
function injectStyles() {
  if (document.getElementById('vn-styles')) return;
  const s = document.createElement('style');
  s.id = 'vn-styles';
  s.textContent = `
.vn-stage{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;transform-origin:50% 62%;transition:transform ${T.zoom}ms ${EASE}}
.vn-stage.is-zoom{transform:scale(1.05)}
.vn-sprite{position:absolute;bottom:var(--vn-base,calc(env(safe-area-inset-bottom,0px) + 168px));height:var(--vn-h,60%);aspect-ratio:600/900;left:var(--x,50%);
  transform:translateX(-50%) scale(var(--s,1));transform-origin:50% 100%;transition:filter 260ms ease,transform 260ms ease;}
.vn-sprite.is-dim{filter:brightness(.74) saturate(.7);--s:.97}
/* dos personajes en un móvil estrecho: un poco más pequeños para que no se coman la escena (especificidad baja: los capítulos mandan) */
:where(.vn-stage:has(.vn-sprite[data-char="mom"]):has(.vn-sprite[data-char="adventurer"])) .vn-sprite{--vn-h:55%}
.vn-sprite:not(.is-dim){z-index:3!important}
.vn-sprite[data-char="mom"]{z-index:1}.vn-sprite[data-char="adventurer"]{z-index:2}
.vn-bob{position:absolute;inset:0}
.vn-bob>svg{display:block;width:100%;height:100%;overflow:visible}
.vn-emote{position:absolute;width:clamp(42px,14%,72px);aspect-ratio:1;transform-origin:50% 100%;z-index:3}
.vn-emote>svg{display:block;width:100%;height:100%;overflow:visible}
.vn-emote .vn-e-heart{animation:vnHeart 900ms ease-out both;animation-delay:calc(var(--i)*140ms);transform-box:fill-box}
@keyframes vnHeart{0%{opacity:0}30%{opacity:1}100%{opacity:1}}
.vn-cg{position:absolute;inset:0;z-index:8;pointer-events:none;opacity:0;transition:opacity ${T.cg}ms ease;background:#14101F}
.vn-cg.is-on{opacity:1}
.vn-cg>svg{display:block;width:100%;height:100%}
#stage.vn-hush #narration{opacity:0;transition:none}
#stage #narration{transition:opacity 500ms ease}
.vn-on .c6-chars{visibility:hidden}
/* cap. 2: mientras se lee la carta (pergamino arriba), el sprite baja y encoge para no quedar «sin cabeza» */
.vn-on.c2:not(.c2-dlg)>.vn-stage{z-index:4}.vn-on.c2:not(.c2-dlg) .vn-sprite{--vn-base:calc(var(--safe-b,0px) + 128px);--vn-h:clamp(150px,calc(100cqh - var(--safe-t,0px) - 80px - clamp(236px,37cqh,300px) - var(--safe-b,0px) - 128px - 44px),40%)}
/* cap. 5: el cofre tiene que verse junto al aventurero (pollito incluido dentro del arco) */
.vn-on.c5 .vn-sprite{--vn-h:50%;--x:26%!important}
/* cap. 6: la carta ocupa el tercio superior; los dos caben debajo */
.vn-on.c6 .vn-sprite{--vn-h:46%}
@container (max-height:700px){.vn-on.c6 .vn-sprite{--vn-h:31%}}
@media (prefers-reduced-motion: reduce){.vn-stage,.vn-sprite,.vn-cg{transition-duration:120ms}.vn-emote .vn-e-heart{animation:none}}
`;
  document.head.appendChild(s);
}
/** Si la página no trae los defs globales (A1 §5b), los crea (p. ej. en herramientas sueltas). */
function ensureDefs() {
  if (document.getElementById('inkWobble') && document.getElementById('hatch45Light')) return;
  const d = document.createElement('div');
  d.innerHTML = `<svg class="svg-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0"><defs>
<filter id="inkWobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<pattern id="hatch45" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#1B1420" stroke-width="1.5"/></pattern>
<pattern id="hatch45Light" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#1B1420" stroke-width="1.5" opacity=".5"/></pattern>
</defs></svg>`;
  document.body.prepend(d.firstElementChild);
}

/** Texto SVG → elemento, sin defs sueltos y con ids únicos por instancia (los clipPath no chocan entre copias). */
function inflate(text) {
  const n = ++instance;
  let t = text.replace(/<defs class="vn-standalone">[\s\S]*?<\/defs>/, '');
  const ids = new Set();
  t.replace(/\sid="([^"]+)"/g, (_, id) => { ids.add(id); return _; });
  ids.forEach((id) => {
    const esc = id.replace(/[-]/g, '\\-');
    t = t.replace(new RegExp(`id="${esc}"`, 'g'), `id="${id}__${n}"`).replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#${id}__${n})`);
  });
  const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}

const anim = (el, frames, opts) => { try { return el.animate(frames, opts); } catch (e) { return null; } };
const resolveExpr = (char, e) => { const c = CHARS[char]; if (!e) return 'neutral'; if (c.exprs.includes(e)) return e; return c.alias[e] || 'neutral'; };

/** Muestra la cara, brazos y pollito de una expresión dentro del SVG. */
function applyExpr(svg, char, e) {
  svg.querySelectorAll('[data-face]').forEach((g) => { g.style.display = g.dataset.face === e ? '' : 'none'; });
  svg.querySelectorAll('[data-for]').forEach((g) => { g.style.display = g.dataset.for.split(/\s+/).includes(e) ? '' : 'none'; });
  const pose = CHARS[char].pose[e] || {};
  ['head', 'body'].forEach((p) => { const g = svg.querySelector(`[data-part="${p}"]`); if (g) { if (pose[p]) g.setAttribute('transform', pose[p]); else g.removeAttribute('transform'); } });
  const front = svg.querySelector('[data-part="front"]');
  if (front) { if (pose.front) front.setAttribute('transform', pose.front); else front.removeAttribute('transform'); }
}

// ---------------------------------------------------------------- API
/** Crea las capas del escenario (sprites left/center/right + capa CG) dentro de `el`. */
export function stage(el) {
  injectStyles(); ensureDefs();
  if (root && root.isConnected && container === el) return root;
  actors.clear(); chain = Promise.resolve(); cgToken++;
  container = el;
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  root = document.createElement('div');
  root.className = 'vn-stage'; root.setAttribute('aria-hidden', 'true');
  spritesEl = root;
  ['left', 'center', 'right'].forEach((side) => { const l = document.createElement('div'); l.className = `vn-layer vn-${side}`; l.dataset.side = side; root.appendChild(l); });
  cgEl = document.createElement('div'); cgEl.className = 'vn-cg'; cgEl.setAttribute('aria-hidden', 'true');
  el.appendChild(root); el.appendChild(cgEl);
  el.classList.add('vn-on');
  preload();
  return root;
}

/** Precarga sprites y emotes (no bloquea). */
export function preload(names = ['adventurer.svg', 'mom.svg', 'emotes.svg']) { names.forEach((n) => fetchText(n).catch(() => {})); }

function needStage() { if (!root || !root.isConnected) { const host = document.querySelector('#scenes section.page:last-child') || document.body; stage(host); } }

/** Entra un personaje (o, si ya está en escena en ese lado, solo cambia la expresión). */
export function show(char, e = 'neutral', side, opts = {}) {
  if (!CHARS[char]) return Promise.resolve();
  needStage();
  return enqueue(async () => {
    const want = side || CHARS[char].side;
    const cur = actors.get(char);
    if (cur && !cur.leaving) {
      if (cur.side !== want) { cur.side = want; cur.el.style.setProperty('--x', POS[want] + '%'); cur.el.dataset.side = want; root.querySelector(`.vn-${want}`).appendChild(cur.el); }
      setExpr(char, e); return;
    }
    if (cur && cur.leaving) { cur.el.remove(); actors.delete(char); }
    const text = await fetchText(CHARS[char].file);
    if (!root) return;
    const svg = inflate(text);
    const el = document.createElement('div');
    el.className = 'vn-sprite'; el.dataset.char = char; el.dataset.side = want;
    el.style.setProperty('--x', POS[want] + '%');
    const bob = document.createElement('div'); bob.className = 'vn-bob';
    bob.appendChild(svg); el.appendChild(bob);
    const ex = resolveExpr(char, e);
    applyExpr(svg, char, ex);
    root.querySelector(`.vn-${want}`).appendChild(el);
    const a = { el, bob, svg, side: want, expr: ex, emoteEl: null, emoteT: 0, leaving: false };
    actors.set(char, a);
    const rm = reduced();
    const dir = want === 'right' ? 1 : want === 'left' ? -1 : 0;
    if (rm || opts.enter === 'fade' || !dir) anim(bob, [{ opacity: 0 }, { opacity: 1 }], { duration: rm ? 150 : T.enter, easing: 'ease-out' });
    else anim(bob, [{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: 'none' }], { duration: T.enter, easing: EASE });
  });
}

function setExpr(char, e) {
  const a = actors.get(char); if (!a) return;
  const ex = resolveExpr(char, e);
  if (ex === a.expr) return;
  a.expr = ex; applyExpr(a.svg, char, ex);
  if (!reduced()) anim(a.bob, [{ transform: 'none' }, { transform: 'translateY(-8px)' }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });   // corte + hop de 8 px
}
/** Cambia la expresión (corte seco + pequeño salto de 8 px). */
export function expr(char, e) { return enqueue(() => setExpr(char, e)); }

/** Emote sobre la cabeza, del lado exterior. Uno a la vez por personaje. */
export function emote(char, type) {
  return enqueue(async () => {
    const a = actors.get(char); if (!a || a.leaving) return;
    let text; try { text = await fetchText('emotes.svg'); } catch (e) { return; }
    const src = new DOMParser().parseFromString(text.replace(/<defs class="vn-standalone">[\s\S]*?<\/defs>/, ''), 'image/svg+xml');
    const g = src.querySelector(`[data-emote="${CSS.escape(type)}"]`); if (!g) return;
    if (a.emoteEl) { a.emoteEl.remove(); clearTimeout(a.emoteT); }
    const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100');
    svg.appendChild(document.importNode(g, true));
    const box = document.createElement('div'); box.className = 'vn-emote'; box.dataset.emote = type; box.appendChild(svg);
    const outer = a.side === 'left' ? 'left' : 'right';
    const [ax, ay] = CHARS[char].anchor[outer];
    box.style.left = `calc(${(ax / 600) * 100}% - ${outer === 'left' ? 'clamp(42px,14%,72px)' : '0px'})`;
    box.style.top = `calc(${(ay / 900) * 100}% - clamp(42px,14%,72px) * .9 - 10px)`;
    a.bob.appendChild(box); a.emoteEl = box;
    // que nunca se salga del escenario (los personajes van al 27 % / 73 %)
    const rb = box.getBoundingClientRect(), rr = root.getBoundingClientRect(), pad = 6;
    const dx = rb.right > rr.right - pad ? rr.right - pad - rb.right : rb.left < rr.left + pad ? rr.left + pad - rb.left : 0;
    const dy = rb.top < rr.top + pad ? rr.top + pad - rb.top : 0;
    if (dx || dy) { box.style.left = `calc(${box.style.left} + ${dx}px)`; box.style.top = `calc(${box.style.top} + ${dy}px)`; }
    const rm = reduced();
    if (!rm) anim(box, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: .7 }, { transform: 'scale(1)' }], { duration: T.emoteIn, easing: 'ease-out' });
    a.emoteT = setTimeout(() => {
      const out = anim(box, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
      const done = () => { box.remove(); if (a.emoteEl === box) a.emoteEl = null; };
      if (out) { out.onfinish = done; setTimeout(done, 400); } else done();
    }, T.emoteIn + T.emoteLive);
  });
}

/** Salto (−14 px, 260 ms). Pensado para happy / proud / laughing. */
export function hop(char) {
  return enqueue(() => { const a = actors.get(char); if (!a || reduced()) return; anim(a.bob, [{ transform: 'none' }, { transform: 'translateY(-14px)', offset: .4 }, { transform: 'none' }], { duration: T.hop, easing: 'ease-out' }); });
}
/** Temblor (±3 px, 4 ciclos, 300 ms). Pensado para nervous y el lapsus. */
export function shake(char) {
  return enqueue(() => {
    const a = actors.get(char); if (!a) return;
    if (reduced()) { anim(a.bob, [{ opacity: 1 }, { opacity: .75 }, { opacity: 1 }], { duration: 200 }); return; }
    const k = []; for (let i = 0; i < 4; i++) k.push({ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' });
    anim(a.bob, [{ transform: 'none' }, ...k, { transform: 'none' }], { duration: T.shake, easing: 'linear' });
  });
}
/** Resalta a quien habla; los demás al 70 % y escala .97. focus(null) los iguala. */
export function focus(char) {
  return enqueue(() => { actors.forEach((a, c) => a.el.classList.toggle('is-dim', !!char && c !== char && actors.has(char))); });
}
/** Sale del escenario hacia su lado (220 ms). */
export function hide(char) {
  return enqueue(() => {
    const a = actors.get(char); if (!a || a.leaving) return;
    a.leaving = true;
    const dir = a.side === 'right' ? 1 : a.side === 'left' ? -1 : 0;
    const out = anim(a.bob, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${reduced() ? 0 : dir * 40}px)` }], { duration: reduced() ? 120 : T.exit, easing: 'ease-in', fill: 'forwards' });
    let fin = false;
    const done = () => { if (fin) return; fin = true; if (actors.get(char) === a) actors.delete(char); a.el.remove(); actors.forEach((o) => o.el.classList.remove('is-dim')); };
    if (out) { out.onfinish = done; setTimeout(done, (reduced() ? 120 : T.exit) + 200); } else done();
  });
}
/** Zoom ×1.05 del escenario (solo: lapsus, respiración antes del cofre, lectura de la petición). */
export function zoom(on = true) { needStage(); root.classList.toggle('is-zoom', !!on && !reduced()); }

/** Ilustración CG a pantalla completa con fundido (600 ms). Los primeros 2.5 s sin texto encima. */
export function cg(name) {
  needStage();
  const token = ++cgToken;
  return fetchText(`cg-${name}.svg`).then((text) => {
    if (token !== cgToken || !cgEl) return;
    const svg = inflate(text);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    cgEl.replaceChildren(svg);
    cgEl.dataset.cg = name;
    void cgEl.offsetWidth; cgEl.classList.add('is-on');
    const st = document.getElementById('stage');
    if (st) { st.classList.add('vn-hush'); clearTimeout(hushT); hushT = setTimeout(() => st.classList.remove('vn-hush'), 2500); }
  }).catch((e) => console.warn('[vn] cg', e));
}
/** Retira el CG con fundido. */
export function clearCg() {
  ++cgToken;
  const el = cgEl; if (!el) return;
  clearTimeout(hushT); const st = document.getElementById('stage'); if (st) st.classList.remove('vn-hush');
  if (!el.classList.contains('is-on')) { el.replaceChildren(); return; }
  el.classList.remove('is-on');
  const token = cgToken;
  setTimeout(() => { if (token === cgToken) { el.replaceChildren(); delete el.dataset.cg; } }, reduced() ? 150 : T.cg);
}
/** Devuelve un <svg> suelto del personaje con la expresión dada (hojas de personaje, pruebas). */
export async function sprite(char, e = 'neutral') { injectStyles(); ensureDefs(); const svg = inflate(await fetchText(CHARS[char].file)); applyExpr(svg, char, resolveExpr(char, e)); return svg; }
/** Devuelve un <svg> suelto con un CG o un emote (pruebas). */
export async function art(kind, name) {
  ensureDefs();
  if (kind === 'cg') { const s = inflate(await fetchText(`cg-${name}.svg`)); s.setAttribute('preserveAspectRatio', 'xMidYMid slice'); return s; }
  const src = new DOMParser().parseFromString((await fetchText('emotes.svg')).replace(/<defs class="vn-standalone">[\s\S]*?<\/defs>/, ''), 'image/svg+xml');
  const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.appendChild(document.importNode(src.querySelector(`[data-emote="${CSS.escape(name)}"]`), true)); return svg;
}
/** Quita todo (sprites y CG) sin animación. */
export function reset() { cgToken++; actors.forEach((a) => a.el.remove()); actors.clear(); if (cgEl) { cgEl.classList.remove('is-on'); cgEl.replaceChildren(); } if (root) root.classList.remove('is-zoom'); }

export const vn = { stage, show, expr, emote, hop, shake, focus, hide, cg, clearCg, zoom, preload, reset, sprite, art, CHARS };
export default vn;
