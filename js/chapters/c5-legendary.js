// c5-legendary.js — Capítulo 5: El Objeto Legendario. Paleta: #0E1A14 #1F4D3A #C9A227 #F4E7B0 + tinta #1B1420.
// Cámara del templo oscuro: pedestal de piedra con el cofre (3D toon con contorno de tinta; sin WebGL, versión 2D).
// Secuencia (~8 s, se toca el cofre para empezar; ⏭ saltar disponible):
//   0 s     toque → las Pandoras de mamá vuelan del contador al cofre (audio 'reveal' en crescendo)
//   2,9 s   el cofre abre la tapa en 3 pasos, chispas, vibración
//   5,6 s   destello blanco de 200 ms → el aventurero (chibi) aparece y levanta el objeto sobre su cabeza
//           (marco de inventario .inv-frame con la foto de la consola, rayos planos girando detrás)
//   8,4 s   beat 1: cuadro de diálogo RPG «¡Obtuviste la Nintendo Switch 2 · Edición Zelda!» + rareza ★★★★★ y CONTINUAR
// Beats: 0 = pre-escena VN (aventurero nervioso, emote «!»), 1 = secuencia (botón oculto), 2 = estado final. Restaurado en el beat 2 → estado final directo.
// La escena 3D (js/three/legendary.js) se importa solo aquí; sin WebGL (o con ?nowebgl) se usa una versión CSS/2D.
// Usa los componentes globales: .inv-frame, .chibi/.chibi-shadow, api.fx.whiteFlash, #inkWobble/#hatch45 si existen.

export const id = 'c5-legendary';
export const title = 'El Objeto Legendario';

const IMG = {
  console: 'assets/console/switch2-zelda-console-cut.png',
  joycons: 'assets/console/joycons-cut.png',
  adv: 'assets/chars/adventurer-happy-34.png',
};
const DIALOG = '¡Encontraste la Nintendo Switch 2 · Edición Zelda! (Las Pandoras solo vinieron a mirar.) Rareza: ★★★★★';

// ---------- Fondo: cámara del templo (piedra, arco, pilares con tallas originales, brasas) ----------
function templeSvg(wobble) {
  const f = wobble ? ' filter="url(#inkWobble)"' : '';
  let blocks = '';
  for (let r = 0; r < 12; r++) {
    const y = r * 37, off = r % 2 ? -30 : 0;
    for (let x = off; x < 360; x += 60) blocks += `<rect x="${x}" y="${y}" width="60" height="37" fill="${(r + x / 60) % 2 ? '#13241b' : '#102019'}"/>`;
  }
  const floorV = [-120, -30, 60, 150, 210, 270, 360, 450, 540].map((x) => `M${180 + (x - 180) * 0.28} 446 L${x} 650`).join(' ');
  const carving = (x) => `<g fill="none" stroke="#C9A227" stroke-width="2" stroke-linejoin="round" opacity=".85">
      <path d="M${x} 150 l12 16 l-12 16 l-12 -16Z"/><path d="M${x} 196 l12 16 l-12 16 l-12 -16Z"/>
      <path d="M${x} 262 m-9 0 a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5"/><path d="M${x} 318 m-9 0 a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5"/></g>`;
  const pillar = (x) => `<g stroke="#1B1420" stroke-width="3" stroke-linejoin="round">
      <rect x="${x}" y="86" width="46" height="356" fill="#1F4D3A"/>
      <rect x="${x - 7}" y="66" width="60" height="22" fill="#2a6249"/><rect x="${x - 7}" y="436" width="60" height="16" fill="#2a6249"/>
      <path d="M${x + 12} 90 V436 M${x + 34} 90 V436" stroke-width="1.5" opacity=".6"/></g>${carving(x + 23)}
      <path d="M${x + 4} 90 L${x + 4} 200 M${x + 42} 100 L${x + 42} 360" stroke="#4F7F3A" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <g class="c5-flame" transform="translate(${x + 23} 56)" stroke="#1B1420" stroke-width="2.5" stroke-linejoin="round">
        <path d="M-14 8 H14 L10 20 H-10Z" fill="#2b2430"/><path d="M0 -26 C10 -14 14 -6 8 6 H-8 C-14 -6 -8 -14 0 -26Z" fill="#C9A227"/><path d="M0 -12 C5 -6 6 -1 3 6 H-3 C-6 -1 -3 -6 0 -12Z" fill="#F4E7B0" stroke-width="1.5"/></g>`;
  return `
<svg class="bg c5-bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="360" height="640" fill="#0E1A14"/>
  <g${f}>
    <g stroke="#1B1420" stroke-width="1.6" opacity=".9">${blocks}</g>
    <g stroke="#1B1420" stroke-width="3" stroke-linejoin="round">
      <path d="M72 446 V206 Q72 92 180 92 Q288 92 288 206 V446Z" fill="#1F4D3A"/>
      <path d="M92 446 V210 Q92 112 180 112 Q268 112 268 210 V446Z" fill="#070e0a"/>
      <path d="M164 80 H196 L192 112 H168Z" fill="#C9A227"/>
    </g>
    <g stroke="#1B1420" stroke-width="1.6" fill="none"><path d="M180 92 V112 M130 100 L138 118 M230 100 L222 118 M96 150 L112 158 M264 150 L248 158 M82 210 H92 M268 210 H278"/></g>
    ${pillar(14)}${pillar(300)}
    <g fill="none" stroke="#4F7F3A" stroke-width="3" stroke-linecap="round" opacity=".85">
      <path d="M72 100 q-6 60 4 110 M90 96 q10 30 2 60 M270 96 q-8 40 0 84 M288 100 q8 70 -2 130"/></g>
    <g stroke="#1B1420" stroke-width="3" stroke-linejoin="round">
      <path d="M-20 446 H380 V660 H-20Z" fill="#17301f"/>
      <path d="M-20 446 H380" stroke-width="4"/>
    </g>
    <g stroke="#1B1420" stroke-width="2" fill="none" opacity=".85"><path d="${floorV}"/><path d="M-20 480 H380 M-20 524 H380 M-20 580 H380"/></g>
    <path d="M92 446 H268 L300 470 H60Z" fill="url(#hatch45)" opacity=".7"/>
  </g>
  <g class="c5-embers" fill="#F4E7B0"><rect x="36" y="260" width="3" height="3"/><rect x="322" y="230" width="3" height="3"/><rect x="62" y="330" width="3" height="3"/><rect x="298" y="300" width="3" height="3"/><rect x="180" y="150" width="3" height="3"/></g>
</svg>`;
}

const CHARM_SVG = `<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><circle cx="16" cy="17" r="12.5" fill="#C9A227" stroke="#1B1420" stroke-width="2.4"/><circle cx="16" cy="17" r="9" fill="none" stroke="#1B1420" stroke-width="1.2" opacity=".7"/><path d="M16 1.5a3.2 3.2 0 0 1 3.2 3.2v1.6h-6.4V4.7A3.2 3.2 0 0 1 16 1.5z" fill="none" stroke="#1B1420" stroke-width="2.2"/><rect x="10.5" y="17" width="11" height="6.6" rx="1" fill="#F4E7B0" stroke="#1B1420" stroke-width="1.5"/></svg>`;

// Rayos planos que giran detrás del objeto (12 cuñas)
const RAYS_SVG = `<svg class="c5-rays" viewBox="-100 -100 200 200" aria-hidden="true"><g>${Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${(Math.cos((i * 30 - 7) * Math.PI / 180) * 100).toFixed(1)} ${(Math.sin((i * 30 - 7) * Math.PI / 180) * 100).toFixed(1)} L${(Math.cos((i * 30 + 7) * Math.PI / 180) * 100).toFixed(1)} ${(Math.sin((i * 30 + 7) * Math.PI / 180) * 100).toFixed(1)}Z" fill="#F4E7B0"/>`).join('')}</g></svg>`;

// ---------- Versión 2D (sin WebGL): mismo controlador que la escena 3D ----------
const FB_CHEST = `
<svg class="c5-fb-chest" viewBox="0 0 220 170" aria-hidden="true">
  <g stroke="#1B1420" stroke-width="3.5" stroke-linejoin="round">
  <g class="lid-open"><path d="M30 78 L38 14 Q110 -6 182 14 L190 78Z" fill="#43301e"/><path d="M60 74 L66 20 M154 74 L148 20" stroke="#C9A227" stroke-width="14"/></g>
  <rect x="22" y="70" width="176" height="86" rx="6" fill="#523824"/>
  <path d="M22 98 H198 M22 126 H198" stroke-width="2"/>
  <rect x="48" y="68" width="18" height="90" fill="#C9A227"/><rect x="154" y="68" width="18" height="90" fill="#C9A227"/>
  <rect x="20" y="148" width="180" height="10" rx="3" fill="#C9A227"/>
  <g class="lid-mid"><path d="M24 72 L36 34 Q110 20 184 34 L196 72Z" fill="#523824"/><rect x="48" y="38" width="18" height="34" fill="#C9A227"/><rect x="154" y="38" width="18" height="34" fill="#C9A227"/></g>
  <g class="lid-shut"><path d="M22 76 Q22 44 110 42 Q198 44 198 76Z" fill="#523824"/><rect x="48" y="46" width="18" height="30" fill="#C9A227"/><rect x="154" y="46" width="18" height="30" fill="#C9A227"/></g>
  <rect x="98" y="62" width="24" height="28" rx="4" fill="#C9A227"/><circle cx="110" cy="75" r="3.2" fill="#1B1420"/></g>
</svg>`;

function createFallback(host, reduced) {
  host.insertAdjacentHTML('beforeend', `
    <div class="c5-fb" aria-hidden="true">
      <div class="c5-fb-ped"></div>
      <div class="c5-fb-light"></div>
      ${FB_CHEST}
      <div class="c5-fb-sparks">${Array.from({ length: 16 }, (_, i) => `<b style="--x:${38 + (i * 37) % 24}%;--d:${(i % 7) * 0.45}s"></b>`).join('')}</div>
    </div>`);
  const root = host.querySelector('.c5-fb'), chest = root.querySelector('.c5-fb-chest');
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const q = reduced ? 0.1 : 1;
  const mouth = () => {
    const r = chest.getBoundingClientRect(), h = host.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height * 0.32, bottom: r.bottom - h.top };
  };
  return {
    project: mouth,
    setGround(y, x) { root.style.setProperty('--g', `${y}px`); if (x != null) root.style.setProperty('--gx', `${x}px`); },
    pulse() { chest.classList.remove('pulse'); void chest.getBoundingClientRect(); chest.classList.add('pulse'); },
    open() {
      root.classList.add('lit');
      later(() => { chest.dataset.step = '1'; }, 150 * q); later(() => { chest.dataset.step = '2'; }, 750 * q); later(() => { chest.dataset.step = '3'; }, 1350 * q);
    },
    final() { timers.forEach(clearTimeout); chest.dataset.step = '3'; root.classList.add('lit', 'instant'); },
    dispose() { timers.forEach(clearTimeout); root.remove(); },
  };
}

// ---------- Capítulo ----------
let S = null; // sesión activa

export function mount(container, api) {
  const s = S = { dead: false, timers: [], api, scene: null, mode: '', started: false, running: false, done: false, finalShown: false, tapReady: false, ro: null };
  const reduced = () => api.fx.reducedMotion();
  const later = (fn, ms) => { const t = setTimeout(() => { if (!s.dead) fn(); }, ms); s.timers.push(t); return t; };

  container.style.setProperty('--tint', '#0E1A14');
  container.classList.add('c5');
  const wobble = !!document.getElementById('inkWobble');
  container.innerHTML = `
    ${templeSvg(wobble)}
    <div class="c5-host"></div>
    <div class="c5-rays-wrap">${RAYS_SVG}</div>
    <div class="c5-actor">
      <div class="chibi-shadow c5-adv-shadow"></div>
      <img class="chibi c5-adv" src="${IMG.adv}" alt="El aventurero levanta el objeto sobre su cabeza" draggable="false">
    </div>
    <button class="c5-frame inv-frame" type="button" aria-label="Nintendo Switch 2, Edición Zelda. Toca para ver los Joy-Con">
      <img src="${IMG.console}" alt="" draggable="false">
    </button>
    <div class="c5-charms" aria-hidden="true"></div>
    <button class="c5-tap" type="button" aria-label="Tocar el cofre para abrirlo" hidden></button>
    <p class="c5-hint" hidden>Toca el cofre</p>
    <div class="c5-flash" aria-hidden="true"></div>`;
  const $ = (q) => container.querySelector(q);
  const host = $('.c5-host'), hint = $('.c5-hint'), tap = $('.c5-tap'), frame = $('.c5-frame'), adv = $('.c5-adv'), flash = $('.c5-flash');
  const frameImg = frame.querySelector('img');
  adv.addEventListener('error', () => adv.remove());

  // Beats: 0 = pre-escena de novela visual (aventurero conteniendo el aliento), 1 = secuencia (botón oculto), 2 = estado final
  api.setBeats([
    { text: 'Aquí está… el objeto legendario.', speaker: 'Aventurero', label: 'CONTINUAR' },
    { text: '', hideButton: true },
    { text: DIALOG, speaker: 'Narrador', label: 'CONTINUAR' },
  ]);
  // Sprite VN (js/vn/vn.js): protegido, sin vn.js la pre-escena es solo el cuadro de diálogo
  const vnP = import('../vn/vn.js').then((m) => m.default || m).catch(() => null);
  let vnReady = false;
  const V = (fn) => vnP.then((vn) => { if (!vn || s.dead) return; try { fn(vn); } catch (e) { console.warn('c5: vn', e); } });
  const speaker = (n) => { try { api.setSpeaker && api.setSpeaker(n); } catch (e) { /* aún no existe */ } };
  const preScene = () => {
    speaker('Aventurero');
    V((vn) => {
      if (!vnReady) { vn.stage(container); vnReady = true; }
      vn.show('adventurer', 'nervous', 'left', { enter: 'slide' });
      vn.emote('adventurer', '!'); vn.shake('adventurer');
    });
    // contiene el aliento: gota de sudor + zoom ×1.05 (A2 §3.5)
    later(() => V((vn) => { if (api.getBeat() !== 0 || s.started) return; vn.emote("adventurer", "sweat"); vn.zoom(true); }), 1700);
  };
  const hideSprite = () => V((vn) => { vn.zoom(false); vn.hide('adventurer'); });

  // ----- escena (3D con respaldo 2D) -----
  s.ready = (async () => {
    const force2d = /[?&]nowebgl\b/.test(location.search);
    if (!force2d) {
      try {
        const m = await import('../three/legendary.js');
        if (s.dead) return;
        if (m.hasWebGL()) { s.scene = await m.createScene(host, { reduced: reduced() }); s.mode = '3d'; return; }
      } catch (e) {
        console.warn('c5: escena 3D no disponible, uso la versión 2D.', e);
        host.querySelectorAll('canvas').forEach((c) => c.remove());
      }
    }
    if (s.dead) return;
    s.scene = createFallback(host, reduced()); s.mode = '2d';
  })().then(() => { if (!s.dead) { container.dataset.mode = s.mode; layout(); } });

  // Composición vertical según lo que queda libre sobre el cuadro de diálogo
  function layout() {
    const H = container.clientHeight, W = container.clientWidth;
    if (!H || !W) return;
    const dock = document.getElementById('dock');
    const cTop = container.getBoundingClientRect().top;
    let D = dock ? dock.getBoundingClientRect().top - cTop : H * 0.66;
    if (!s.finalShown) D = Math.max(D, H * 0.66);          // durante la secuencia el dock es pequeño: reserva el hueco del diálogo
    D = clamp(D, H * 0.5, H * 0.74);
    const ground = D - 34;
    const cxChest = W * 0.7, cxAdv = W * 0.5;
    if (s.scene) s.scene.setGround(ground, cxChest);
    const c = s.scene ? s.scene.project('chest') : { x: cxChest, y: ground - 70, bottom: ground };
    const Ha = Math.min(H * 0.25, 210), advTop = D - 12 - Ha;
    const F = Math.min(W * 0.5, advTop - 104, 200);
    const fy = advTop - 2 - F;
    container.style.setProperty('--c5-cx', `${cxAdv}px`);
    container.style.setProperty('--c5-adv-h', `${Ha}px`);
    container.style.setProperty('--c5-adv-top', `${advTop}px`);
    container.style.setProperty('--c5-feet', `${D - 12}px`);
    container.style.setProperty('--c5-frame', `${F}px`);
    container.style.setProperty('--c5-frame-top', `${fy}px`);
    container.style.setProperty('--c5-ray', `${F * 2.4}px`);
    Object.assign(tap.style, { left: `${c.x}px`, top: `${c.y + 18}px` });
    Object.assign(hint.style, { left: `${c.x}px`, top: `${c.bottom + 22}px` });
  }
  const ro = new ResizeObserver(() => layout()); ro.observe(container); s.ro = ro;
  const dockEl = document.getElementById('dock'); if (dockEl) ro.observe(dockEl);

  // ----- secuencia -----
  function intro() {
    api.showSkip(skip);
    s.ready.then(() => {
      if (s.dead || s.done || s.running) return;
      api.audio.stopMusic();                       // silencio de 1,5 s
      container.classList.add('dim-in');
      later(() => {
        if (s.running || s.done) return;
        s.tapReady = true; tap.hidden = false; hint.hidden = false;
      }, 1500);
    });
  }

  function flyCharms() {
    const layer = $('.c5-charms');
    const hud = document.getElementById('hud-pandoras');
    const cr = container.getBoundingClientRect();
    const hr = hud && !hud.hidden ? hud.getBoundingClientRect() : { left: cr.left + 20, top: cr.top + 80, width: 40, height: 30 };
    const x0 = hr.left - cr.left + 22, y0 = hr.top - cr.top + hr.height / 2;
    const t = s.scene.project('chest');
    const n = Math.min(12, api.getPandoras() > 0 ? api.getPandoras() : 6);
    const gap = Math.min(150, 1300 / n);
    for (let i = 0; i < n; i++) {
      later(() => {
        const el = document.createElement('span'); el.className = 'c5-charm'; el.innerHTML = CHARM_SVG; layer.appendChild(el);
        const ex = t.x + (i % 3 - 1) * 8, ey = t.y;
        const cx = (x0 + ex) / 2 + (i % 2 ? 60 : -40), cy = Math.min(y0, ey) - 60 - (i % 4) * 14;
        const pts = Array.from({ length: 9 }, (_, k) => {
          const u = k / 8, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
          return { transform: `translate(${a * x0 + b * cx + c * ex - 16}px, ${a * y0 + b * cy + c * ey - 16}px) scale(${1 - u * 0.5}) rotate(${u * 300}deg)`, opacity: u > 0.9 ? 0.2 : 1, offset: u };
        });
        el.animate(pts, { duration: 1000, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = () => {
          el.remove(); if (s.dead) return;
          s.scene.pulse(); api.fx.sparkle(ex, ey, 3);
          if (i % 4 === 0) api.audio.play('coin');
        };
      }, i * gap);
    }
  }

  const doFlash = () => {
    if (typeof api.fx.whiteFlash === 'function') api.fx.whiteFlash(200);
    else { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }
  };
  const lift = () => {          // tras el destello: el aventurero levanta el objeto
    container.classList.add('item-on', 'adv-on');
    adv.classList.add('hop');
    api.audio.play('coin');
  };

  function startSequence() {
    if (s.running || s.done || !s.scene) return;
    s.running = true; s.tapReady = false;
    tap.hidden = true; hint.hidden = true;
    api.audio.stopMusic();
    api.audio.play('reveal');
    if (reduced()) {
      container.classList.add('lit');
      later(() => { s.scene.open(); api.fx.vibrate(30); }, 300);
      later(lift, 1000);
      later(finish, 2200);
      return;
    }
    flyCharms();
    later(() => { s.scene.open(); api.fx.vibrate(30); container.classList.add('lit'); }, 2900);
    later(doFlash, 5600);
    later(lift, 5700);
    later(() => api.fx.vibrate(30), 5800);
    later(finish, 8400);
  }

  function finish() {
    if (s.done) return;
    s.done = true; s.running = false;
    api.hideSkip();
    api.next(); // beat 1 → enterFinal
  }
  function skip() { enterFinal(true); api.hideSkip(); api.next(); }

  // Estado final directo (completado, saltado, restaurado o al volver con ‹ atrás): se calcula, no depende de frames
  function enterFinal(instant) {
    s.timers.forEach(clearTimeout); s.timers = [];
    s.running = false; s.tapReady = false;
    container.querySelectorAll('.c5-charm').forEach((c) => c.remove());
    tap.hidden = true; hint.hidden = true;
    const apply = () => {
      if (s.dead) return;
      if (instant || !s.done) { s.scene && s.scene.final(); container.classList.add('instant'); }
      s.done = true; s.finalShown = true;
      container.classList.add('lit', 'item-on', 'adv-on', 'dim-in');
      adv.classList.remove('hop');
      layout();
      requestAnimationFrame(layout); later(layout, 450); // el dock cambia de alto al mostrar el diálogo
      api.hideSkip();
      api.audio.startMusic();
    };
    if (s.scene) apply(); else s.ready.then(apply);
  }

  // Tocar el marco alterna consola ↔ Joy-Con
  let showJc = false;
  frame.addEventListener('click', () => {
    showJc = !showJc; frameImg.src = showJc ? IMG.joycons : IMG.console; api.audio.play('tap');
  });
  tap.addEventListener('click', startSequence);

  api.onBeat((i) => {
    if (i === 0 && !s.done) { preScene(); return; }
    if (i === 1 && !s.done && !s.started) { s.started = true; hideSprite(); speaker('Narrador'); intro(); return; }
    if (i === 2 || s.done) {
      hideSprite(); speaker('Narrador');
      if (!s.finalShown) enterFinal(false);
      if (i < 2) api.setButton({ hidden: false, label: 'CONTINUAR' }); // volviendo con ‹ atrás
    }
  });
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function unmount() {
  const s = S; S = null;
  if (!s) return;
  s.dead = true;
  s.timers.forEach(clearTimeout);
  try { s.ro && s.ro.disconnect(); } catch (e) { /* nada */ }
  try { s.scene && s.scene.dispose(); } catch (e) { console.warn('c5: dispose', e); }
  try { s.api.audio.startMusic(); } catch (e) { /* audio no desbloqueado */ }
}
