// c3-dossier.js — Capítulo 3: El Expediente del Aventurero. Bosque heroico en linograbado (A1 v2 §3): troncos gruesos con raíces,
// copas masivas, haces de luz planos, ruina con musgo y pedestal con tallas originales, hierba y hadas luciérnaga.
// Cuatro arcones pequeños de madera y hierro CUELGAN de lianas.
// Se tocan en orden: el cofre se suelta, cae con rebote, se abre, aparece la tarjeta del argumento y un dije dorado sale volando
// (solo teaser: el HUD de Pandoras empieza en el capítulo 4, así que NO se suma nada aquí).
// Beat 1 (final): el expediente completo con el sello «Aprobado por: ~~Mamá~~ Niño Dios» y un mapa con «Objeto legendario: ???».

import { revealText } from '../ui.js';

export const id = 'c3-dossier';
export const title = 'El Expediente del Aventurero';

// Los 3 argumentos confirmados (P0 §8)
const CARDS = [
  { t: 'Trasnochadas legendarias', l: 'Noches enteras haciendo tareas hasta que cantaba el gallo. El café y yo ya somos familia.' },
  { t: 'Trabajo sin descanso', l: 'He trabajado hasta que el cuerpo aguante… y un poquito más.' },
  { t: 'Investigación avanzada', l: 'Horas dedicadas a la investigación. Algunos lo llaman «vagancia»; yo lo llamo recargar energía.' },
  { t: 'Jugando jueguitos', l: '«Jugando jueguitos», dirán algunos. Yo digo: entrenamiento de reflejos para la vida adulta.' },
];
// Posición de cada cofre: x (% del lienzo), y de la rama (cqh), largo del listón (px), colores caja / cinta
const GIFTS = [
  { x: 20, top: 18.2, len: 74, box: '#C23B33', rib: '#FFF8EE' },
  { x: 40, top: 17.4, len: 50, box: '#4E6B4F', rib: '#E8C25A' },
  { x: 60, top: 17.0, len: 66, box: '#D9A93C', rib: '#C23B33' },
  { x: 80, top: 16.5, len: 44, box: '#3A2A52', rib: '#E8C25A' },
];
const N = CARDS.length;

let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

// ---------- Bosque heroico "linograbado": troncos gruesos con raíces, copas, ruina con musgo, hierba ----------
// Paleta plana: #1F3B2D #4F7F3A #A9C46C #E9D9A0 #C9A227 + tinta #1B1420. Sin degradados; #inkWobble y #hatch45 son globales.
const INK = '#1B1420', D = '#1F3B2D', M = '#4F7F3A', L = '#A9C46C', C = '#E9D9A0', G = '#C9A227';

// Mata de hierba: 3 hojas con tinta
const tuft = (x, y, s = 1) => `<path d="M${x} ${y} q${-3 * s} ${-9 * s} ${-9 * s} ${-14 * s} q${7 * s} ${1 * s} ${9 * s} ${9 * s} q${1 * s} ${-12 * s} ${2 * s} ${-18 * s} q${6 * s} ${6 * s} ${4 * s} ${18 * s} q${4 * s} ${-8 * s} ${10 * s} ${-10 * s} q${-3 * s} ${6 * s} ${-8 * s} ${15 * s}Z" fill="${L}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
// Copa: borde festoneado (hojas masivas) a lo ancho
function canopy(y, bump, fill) {
  let d = `M-12 -12 H372 V${y}`;
  for (let x = 372; x > -12; x -= 46) d += ` Q${x - 23} ${y + bump} ${x - 46} ${y}`;
  return `<path d="${d}Z" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
}
// Mechones de hojas claras sobre la copa
const leafClump = (x, y) => `<g fill="${L}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><path d="M${x} ${y} q8 -16 20 -6 q-4 14 -20 6Z"/><path d="M${x + 14} ${y + 6} q10 -14 22 -2 q-6 14 -22 2Z"/><path d="M${x - 12} ${y + 4} q2 -14 14 -10 q0 12 -14 10Z"/></g>`;
// Tallas originales (rombos y espirales) en dorado
const diamond = (x, y, w, h) => `<path d="M${x} ${y - h} L${x + w} ${y} L${x} ${y + h} L${x - w} ${y}Z" fill="none" stroke="${G}" stroke-width="2.4" stroke-linejoin="round"/>`;
const spiral = (x, y, r) => `<path d="M${x} ${y} m${-r} 0 a${r} ${r} 0 1 1 ${r} ${r} a${r * 0.55} ${r * 0.55} 0 1 1 ${-r * 0.5} ${-r * 0.5} a${r * 0.22} ${r * 0.22} 0 1 1 ${r * 0.25} ${r * 0.1}" fill="none" stroke="${G}" stroke-width="2.4" stroke-linecap="round"/>`;
// Tronco grueso con raíces (dir = 1 izquierda, -1 derecha)
function trunk(dir) {
  const X = (x) => (dir === 1 ? x : 360 - x);
  const d = `M${X(-14)} -12 H${X(48)} Q${X(46)} 110 ${X(36)} 250 Q${X(32)} 380 ${X(52)} 470 Q${X(84)} 520 ${X(138)} 548 Q${X(92)} 548 ${X(60)} 536 Q${X(66)} 590 ${X(104)} 652 H${X(-14)}Z`;
  const bark = `M${X(14)} 40 Q${X(20)} 120 ${X(12)} 220 M${X(30)} 60 Q${X(34)} 190 ${X(28)} 330 M${X(8)} 300 Q${X(16)} 420 ${X(6)} 520 M${X(38)} 380 Q${X(44)} 450 ${X(34)} 540`;
  return `<g stroke="${INK}" stroke-linejoin="round"><path d="${d}" fill="${D}" stroke-width="3.2"/>
    <path d="M${X(40)} -8 Q${X(40)} 120 ${X(28)} 260 Q${X(24)} 380 ${X(44)} 470" fill="none" stroke="${M}" stroke-width="6" stroke-linecap="round" opacity=".9"/>
    <path d="${bark}" fill="none" stroke-width="1.8" opacity=".75"/>
    <path d="M${X(44)} 300 q${dir * 22} -10 ${dir * 30} 8 q${dir * -18} 6 ${dir * -30} -8Z M${X(18)} 160 q${dir * 16} -8 ${dir * 22} 6 q${dir * -14} 4 ${dir * -22} -6Z" fill="${M}" stroke-width="1.8"/></g>`;
}
const stoneLines = (x, y, w, h, rows) => Array.from({ length: rows }, (_, i) => `M${x} ${y + (h / rows) * (i + 1)} H${x + w}`).join(' ');

const FOREST_SVG = `
<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="360" height="640" fill="${L}"/>
  <ellipse cx="190" cy="300" rx="190" ry="250" fill="${C}" opacity=".45"/>
  <!-- haces de luz: cuñas planas al 30 % -->
  <g class="shafts">
    <path class="shaft" d="M236 -10 L318 -10 L190 520 L70 520Z" fill="${C}" opacity=".5"/>
    <path class="shaft s2" d="M312 -10 L372 -10 L330 520 L226 520Z" fill="${C}" opacity=".5"/>
    <path class="shaft s3" d="M150 -10 L196 -10 L60 520 L-6 520Z" fill="${C}" opacity=".5"/>
  </g>
  <g filter="url(#inkWobble)">
    <!-- troncos lejanos -->
    <g class="layer" style="--d:5" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" fill="${M}">
      <path d="M88 60 H112 L108 440 H92Z"/><path d="M226 40 H252 L246 440 H232Z"/><path d="M312 70 H332 L328 440 H316Z"/>
    </g>
    <!-- ruina con musgo: arco, pilares y pedestal con tallas originales -->
    <g class="layer" style="--d:8">
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        <path d="M96 436 V270 Q96 196 180 196 Q264 196 264 270 V436Z" fill="${C}"/>
        <path d="M128 436 V276 Q128 232 180 232 Q232 232 232 276 V436Z" fill="${D}"/>
        <path d="M128 436 V276 Q128 232 180 232 Q232 232 232 276 V436Z" fill="url(#hatch45)" stroke="none" opacity=".8"/>
        <path d="M168 190 H192 L188 234 H172Z" fill="${C}"/>
      </g>
      <g stroke="${INK}" stroke-width="1.6" fill="none" opacity=".85"><path d="${stoneLines(96, 270, 32, 166, 5)} ${stoneLines(232, 270, 32, 166, 5)} M112 270 V300 M248 300 V340 M112 340 V380 M248 380 V420 M104 238 L120 252 M256 238 L240 252 M140 210 L148 226 M220 210 L212 226"/></g>
      <g>${diamond(112, 330, 8, 12)}${diamond(248, 330, 8, 12)}${diamond(180, 212, 7, 10)}${spiral(112, 390, 8)}${spiral(248, 390, 8)}</g>
      <!-- musgo y lianas -->
      <g fill="${M}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round">
        <path d="M96 436 q4 -22 16 -18 q8 -16 18 0 q6 8 -2 18Z M230 436 q4 -22 16 -18 q8 -16 18 0 q6 8 -2 18Z"/>
      </g>
      <path d="M94 274 Q94 194 180 194 Q266 194 266 274" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round" stroke-dasharray="30 14"/>
      <path d="M94 274 Q94 194 180 194 Q266 194 266 274" fill="none" stroke="${M}" stroke-width="10" stroke-linecap="round" stroke-dasharray="30 14"/>
      <g fill="none" stroke="${M}" stroke-width="4" stroke-linecap="round"><path d="M104 270 q-8 40 2 86 M254 268 q8 36 -2 80"/></g>
      <!-- pedestal -->
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        <rect x="146" y="408" width="68" height="26" fill="${C}"/><rect x="158" y="372" width="44" height="38" fill="${C}"/><rect x="150" y="360" width="60" height="14" fill="${C}"/>
      </g>
      <g>${diamond(180, 392, 9, 13)}${spiral(180, 421, 6)}</g>
      <path d="M150 360 q6 -10 14 -4 q8 -8 14 0 q8 -8 16 2 q8 -2 12 6Z" fill="${M}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <!-- suelo del claro: hierba, bordes dentados -->
    <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
      <path d="M-12 452 L14 440 L34 452 L62 438 L90 452 L120 440 L150 452 L180 440 L210 452 L240 438 L270 452 L300 440 L330 452 L350 440 L372 450 V660 H-12Z" fill="${M}"/>
      <path d="M-12 540 Q60 520 130 540 T262 536 T372 540 V660 H-12Z" fill="${D}" opacity=".55" stroke="none"/>
      <path d="M96 452 H264 L292 480 H70Z" fill="url(#hatch45)" stroke="none" opacity=".7"/>
      <path d="M40 510 q30 -14 60 0 q-30 10 -60 0Z M250 560 q30 -14 60 0 q-30 10 -60 0Z M150 600 q24 -12 50 0 q-26 8 -50 0Z" fill="${L}" opacity=".9" stroke-width="2"/>
    </g>
    ${[[70, 470, 1], [118, 500, 1.1], [300, 478, 1], [250, 520, 1.2], [60, 580, 1.3], [320, 590, 1.2], [176, 560, 1], [208, 470, 0.9], [92, 620, 1.2], [276, 620, 1.3]].map(([x, y, sc]) => tuft(x, y, sc)).join('')}
    <!-- troncos gruesos con raíces + rama de la que cuelgan los cofres -->
    ${trunk(1)}${trunk(-1)}
    <path d="M30 118 Q120 100 190 108 T336 96" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
    <path d="M30 118 Q120 100 190 108 T336 96" fill="none" stroke="${M}" stroke-width="15" stroke-linecap="round"/>
    <path d="M30 112 Q120 95 190 102 T336 90" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="40 14" opacity=".9"/>
    <!-- copas masivas -->
    ${canopy(70, 30, M)}
    <path d="M-12 40 Q40 70 96 38 Q150 74 210 40 Q270 70 330 36 Q352 52 372 38 V-12 H-12Z" fill="${D}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" opacity=".92"/>
    ${leafClump(20, 78)}${leafClump(110, 96)}${leafClump(214, 92)}${leafClump(300, 82)}${leafClump(170, 72)}
  </g>
  <!-- hadas luciérnaga: punto de luz con alitas -->
  <g class="motes">
    ${Array.from({ length: 12 }, (_, i) => { const x = (i * 53 + 20) % 300 + 30, y = (i * 71 + 60) % 330 + 150; return `<g class="mote" style="--i:${i}"><ellipse cx="${x - 4}" cy="${y - 2}" rx="4" ry="2" fill="${C}" opacity=".7" transform="rotate(-25 ${x - 4} ${y - 2})"/><ellipse cx="${x + 4}" cy="${y - 2}" rx="4" ry="2" fill="${C}" opacity=".7" transform="rotate(25 ${x + 4} ${y - 2})"/><circle cx="${x}" cy="${y}" r="${2 + (i % 3) * 0.5}" fill="${C}" stroke="${INK}" stroke-width="1"/></g>`; }).join('')}
  </g>
</svg>`;

// ---------- Arcón pequeño de madera y hierro (la tapa aparte para poder abrirlo) ----------
const giftSvg = () => `
<svg viewBox="0 0 76 76" aria-hidden="true">
  <path class="burst" d="M38 4 L44 24 L64 18 L52 34 L72 42 L50 46 L56 66 L38 54 L20 66 L26 46 L4 42 L24 34 L12 18 L32 24Z" fill="${C}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <g class="body" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
    <rect x="8" y="36" width="60" height="36" rx="2" fill="#7A4A21"/>
    <path d="M8 48 H68 M8 60 H68" stroke-width="1.5" opacity=".7"/>
    <rect x="15" y="36" width="9" height="36" fill="${INK}"/><rect x="52" y="36" width="9" height="36" fill="${INK}"/>
    <circle cx="19.5" cy="42" r="1.8" fill="${G}" stroke="none"/><circle cx="19.5" cy="66" r="1.8" fill="${G}" stroke="none"/><circle cx="56.5" cy="42" r="1.8" fill="${G}" stroke="none"/><circle cx="56.5" cy="66" r="1.8" fill="${G}" stroke="none"/>
  </g>
  <g class="lid" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
    <path d="M6 38 V28 Q6 13 38 13 Q70 13 70 28 V38Z" fill="#7A4A21"/>
    <path d="M15 37 V24 Q15 16 22 15 V37Z M54 15 Q61 16 61 24 V37 H54Z" fill="${INK}" stroke="none"/>
    <rect x="31" y="31" width="14" height="13" rx="2" fill="${G}"/><circle cx="38" cy="38" r="2.2" fill="${INK}" stroke="none"/>
    <circle cx="38" cy="10" r="3.6" fill="none" stroke-width="2.6"/>
  </g>
</svg>`;

// (el dije del adelanto lo dibuja api.fx.coinArc)

// ---------- Sprite de novela visual (js/vn/vn.js, otro desarrollador). Todo está protegido: sin vn.js la escena funciona igual ----------
const SPRITE = 'adventurer';
let mountLife = null;
export function mount(container, api) {
  container.style.setProperty('--tint', '#1F3B2D');
  container.classList.add('c3');
  const gifts = GIFTS.map((g, i) => `
    <button type="button" class="c3-gift" data-i="${i}" style="--x:${g.x}%;--top:${g.top}cqh;--len:${g.len}px" aria-label="Cofre ${i + 1} de ${N}. Tócalo para abrirlo">
      <span class="sway"><span class="rope"></span><span class="holder"><span class="halo"></span>${giftSvg()}</span></span>
    </button>`).join('');
  const list = CARDS.map((c) => `<li><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 11 L8 16 L17 4" fill="none" stroke="#4F7F3A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${c.t}</li>`).join('');

  container.innerHTML = `
    <div class="c3-art">${FOREST_SVG}</div>
    <div class="c3-art c3-gifts">${gifts}</div>
    <button type="button" class="c3-card parchment" hidden>
      <span class="c3-num"></span><span class="c3-ttl"></span><span class="c3-line"></span><span class="c3-hint">Toca para seguir</span>
    </button>
    <div class="c3-final" aria-hidden="true">
      <div class="c3-dossier parchment">
        <span class="c3-kicker">Expediente</span><h2>del Aventurero</h2>
        <ul>${list}</ul>
        <div class="c3-approved"><span class="lbl">Aprobado por:</span>
          <span class="who"><span class="mama">Mamá<svg class="scribble" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 25 L97 7 M6 8 L94 27"/></svg></span> <b>Niño Dios</b></span></div>
      </div>
      <div class="c3-map parchment">
        <svg viewBox="0 0 260 64" aria-hidden="true"><path d="M14 46 C50 10 80 58 120 34 S190 14 228 34" fill="none" stroke="#1B1420" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
          <circle cx="14" cy="46" r="5" fill="#4F7F3A" stroke="#1B1420" stroke-width="2"/><path d="M220 26 L236 42 M236 26 L220 42" stroke="#9C1F2B" stroke-width="5" stroke-linecap="round"/></svg>
        <span>Objeto legendario: ???</span>
      </div>
    </div>
    <p class="sr-only">Un bosque de linograbado. Cuatro cofres cuelgan de las lianas.</p>`;

  const $ = (s) => container.querySelector(s);
  const giftEls = [...container.querySelectorAll('.c3-gift')];
  const card = $('.c3-card');
  const reduced = () => api.fx.reducedMotion();
  const stage = () => document.getElementById('stage');
  let opened = 0;       // cofres ya abiertos
  let busy = false;     // un cofre en proceso (cae → abre → tarjeta)
  let cardReady = false;

  // ----- novela visual: el aventurero es un sprite 2D (orgulloso por defecto) con reacciones por argumento -----
  const life = { dead: false }; mountLife = life;
  const vnP = import('../vn/vn.js').then((m) => m.default || m).catch(() => null);
  let vnReady = false;
  const V = (fn) => vnP.then((vn) => { if (!vn || life.dead) return; try { fn(vn); } catch (e) { console.warn('c3: vn', e); } });
  const speaker = (n) => { try { api.setSpeaker && api.setSpeaker(n); } catch (e) { /* aún no existe */ } };
  V((vn) => { if (!vnReady) { vn.stage(container); vnReady = true; } vn.show(SPRITE, 'proud', 'left', { enter: 'slide' }); });
  // reacción del aventurero al abrir cada cofre (1: contento, 2: nervioso con gota, 3: orgulloso con destellos)
  const LINES = [
    'Ni un desvelo más sin que cuente. ¡Esto vale oro!',
    'Trabajo duro, cuerpo cansado… pero aquí sigo.',
    'Eh… es investigación. Muy científica. Lo juro.',
    '¡Y el niño que llevo dentro también merece su premio!',
  ];
  const AFTER = ['Quedan tres cofres colgando.', 'Quedan dos cofres.', 'Queda un último cofre.', ''];
  const react = (i) => {
    speaker('Aventurero');
    revealText(LINES[i]);
    V((vn) => {
      if (i === 0) { vn.expr(SPRITE, 'happy'); vn.hop(SPRITE); }
      else if (i === 1) { vn.expr(SPRITE, 'proud'); vn.emote(SPRITE, 'sparkle'); }
      else if (i === 2) { vn.expr(SPRITE, 'nervous'); vn.emote(SPRITE, 'sweat'); vn.shake(SPRITE); }
      else { vn.expr(SPRITE, 'embarrassed'); vn.emote(SPRITE, 'hearts'); vn.hop(SPRITE); }
    });
  };
  const calm = () => V((vn) => vn.expr(SPRITE, 'proud'));

  // Resalta el siguiente cofre (halo ámbar 1,2 s); los demás quedan atenuados
  const refresh = () => giftEls.forEach((g, i) => {
    g.classList.toggle('next', i === opened && !busy);
    g.classList.toggle('dim', i > opened);
    g.classList.toggle('done', i < opened);
  });

  api.setBeats([
    { text: 'Cuatro cofres cuelgan de las lianas. Cada uno guarda un argumento a favor del aventurero.', hideButton: true },
    { text: 'Expediente completo, con sello y todo. Y un mapa señala algo legendario…', label: 'CONTINUAR' },
  ]);

  // El dije dorado sale volando fuera de pantalla (solo un adelanto: no suma al HUD)
  function launchCharm(box) {
    const sr = stage().getBoundingClientRect(), r = box.getBoundingClientRect();
    const x = r.left - sr.left + r.width / 2, y = r.top - sr.top + r.height / 3;
    api.fx.sparkle(x, y, 14); api.audio.play('coin');
    api.fx.coinArc({ x, y }, { x: 52, y: 96 }, 1);   // el dije salta hacia el contador (solo adelanto: aún no suma)
  }

  function openGift(i) {
    const el = giftEls[i];
    busy = true; refresh();
    api.audio.play('tap');
    el.classList.add('cut');                                        // se suelta y cae con rebote
    const fast = reduced();
    later(() => { el.classList.add('open'); api.audio.play('pop'); }, fast ? 100 : 950);   // se abre
    later(() => launchCharm(el.querySelector('.holder')), fast ? 200 : 1150);              // dije + chispas
    later(() => react(i), fast ? 250 : 1250);                                              // reacción del aventurero
    later(() => {                                                                          // tarjeta del argumento
      $('.c3-num').textContent = `Argumento ${i + 1} de ${N}`;
      $('.c3-ttl').textContent = CARDS[i].t;
      $('.c3-line').textContent = CARDS[i].l;
      card.hidden = false; card.classList.remove('out'); void card.offsetWidth; card.classList.add('in');
      cardReady = false; later(() => { cardReady = true; }, 500);
    }, fast ? 300 : 1350);
  }

  giftEls.forEach((g, i) => g.addEventListener('click', () => { if (busy || i !== opened) return; openGift(i); }));

  // Cerrar la tarjeta: el cofre vacío se desvanece; tras el tercero pasa al beat final
  card.addEventListener('click', () => {
    if (!cardReady) return;
    cardReady = false; card.classList.remove('in'); card.classList.add('out');
    giftEls[opened].classList.add('gone');
    later(() => { card.hidden = true; }, 250);
    opened += 1; busy = false; refresh(); calm(); speaker('Narrador'); if (AFTER[opened - 1]) revealText(AFTER[opened - 1]);
    if (opened === N) later(() => { if (api.getBeat() === 0) api.next(); }, 700);
  });

  const showFinal = (on) => {
    container.classList.toggle('c3-is-final', on);
    $('.c3-final').setAttribute('aria-hidden', on ? 'false' : 'true');
    container.classList.remove('f-stamp', 'f-scribble', 'f-map');
    clearTimers();
    if (on) {
      const fast = reduced();
      later(() => { container.classList.add('f-stamp'); api.audio.play('tap'); }, fast ? 100 : 700);
      later(() => { container.classList.add('f-scribble'); }, fast ? 200 : 1300);
      later(() => { container.classList.add('f-map'); api.audio.play('chime'); }, fast ? 300 : 1900);
    }
  };

  api.onBeat((i) => {
    if (i === 1 && opened < N) {                       // llegada directa (guardado): todo ya abierto
      opened = N; giftEls.forEach((g) => g.classList.add('cut', 'open', 'gone')); card.hidden = true; busy = false; refresh();
    }
    showFinal(i === 1);
    speaker(i === 1 ? 'Narrador' : 'Narrador');
    if (i === 1) V((vn) => vn.hide(SPRITE)); else V((vn) => vn.show(SPRITE, 'proud', 'left', { enter: 'fade' }));
    if (i === 0 && opened === N) api.setButton({ hidden: false, label: 'VER EL EXPEDIENTE' });  // al volver atrás
  });
  refresh();
}

export function unmount() { clearTimers(); if (mountLife) mountLife.dead = true; }  // vn.js limpia sus capas al desmontarse la página del capítulo
