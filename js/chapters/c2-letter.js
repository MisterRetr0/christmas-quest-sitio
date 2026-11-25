// c2-letter.js — Capítulo 2: La Carta (A1 v2: pergamino de borde rasgado, sello de cera, capitular entintada, vela con llama recortada).
// Paleta del capítulo 1 (#14101F #3A2A52 #E8E2D0 #E07B1A #9C1F2B), tinta y colores planos, sin degradados.
// El texto de la carta vive SOBRE el pergamino (beats con text:'' para no duplicarlo en la caja de diálogo).
// Beat 2: tras ~1 s "mamá" se tacha con dos trazos finos Baya, el aventurero salta y se estampa «¡DIGO! ¡AL NIÑO DIOS!».
import { INK, PAL1, spiralPath } from './art-house.js';
import { makeVN } from './vn-bridge.js';

export const id = 'c2-letter';
export const title = 'La Carta';

const LETTER_1 = 'Querido Niño Dios: este año hice mis tareas, aprobé otro semestre (¡el último!) y ya casi me gradúo.';
const LETTER_2 = 'Por eso, quisiera hacer una petición muy especial a mi querida <span class="mama">mamá<svg class="scribble" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 25 L97 7 M6 8 L94 27"/></svg></span>…';
/** Capitular entintada: la primera letra grande en Pirata One. */
const dropcap = (t) => `<span class="dropcap" aria-hidden="false">${t[0]}</span>${t.slice(1)}`;

let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

// ---------- Fondo: salita gótica a la luz de una vela ----------
const bow = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><path d="M0 0L-13 -7Q-17 3 -11 9Z" fill="${PAL1.c5}"/><path d="M0 0L13 -7Q17 3 11 9Z" fill="${PAL1.c5}"/><path d="M-2 2L-8 22L0 17L6 24L3 2Z" fill="${PAL1.c5}"/><circle r="4.5" fill="${PAL1.c5}"/></g>`;
const BG_SVG = `
<svg class="bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <pattern id="c2wp" width="46" height="46" patternUnits="userSpaceOnUse"><path d="${spiralPath(23, 23, 2, 11, 1.7, 30)}" fill="none" stroke="${PAL1.c1}" stroke-width="2" opacity=".55"/></pattern>
  </defs>
  <rect width="360" height="640" fill="${PAL1.c2}"/><rect width="360" height="470" fill="url(#c2wp)"/>
  <!-- guirnalda de espinas con lazos (arriba) -->
  <g class="layer" style="--d:3" filter="url(#inkWobble)">
    <path d="M-10 30 Q60 76 130 44 T270 50 T380 36" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-10 30 Q60 76 130 44 T270 50 T380 36" fill="none" stroke="${PAL1.c3}" stroke-width="4" stroke-linecap="round" stroke-dasharray="11 3"/>
    ${bow(62, 60, .9)}${bow(190, 52, .9)}${bow(318, 48, .9)}
  </g>
  <!-- ventana en arco con luna y colina en espiral -->
  <g class="layer" style="--d:5" filter="url(#inkWobble)"><g transform="translate(26 0)">
    <path d="M44 462V386Q44 336 82 328Q120 336 120 386V462Z" fill="${INK}" stroke="${INK}" stroke-width="3"/>
    <path d="M52 458V388Q52 344 82 336Q112 344 112 388V458Z" fill="${PAL1.c1}"/>
    <circle cx="94" cy="372" r="15" fill="${PAL1.c3}" stroke="${INK}" stroke-width="2"/>
    <path d="M52 458Q70 420 96 458Z" fill="${PAL1.c2}" stroke="${INK}" stroke-width="2"/>
    <path d="M82 336V458M52 400H112" stroke="${INK}" stroke-width="3"/>
    <path d="M38 464H126V474H38Z" fill="${PAL1.c3}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 340 Q60 396 40 466 L56 466 Q70 400 62 332Z" fill="${PAL1.c5}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  </g></g>
  <!-- escritorio con vela, tintero y pluma -->
  <g class="layer" style="--d:7" filter="url(#inkWobble)">
    <path d="M214 420H336V432H214Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M222 432V476M328 432V476" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M222 432V476M328 432V476" stroke="${PAL1.c2}" stroke-width="3" stroke-linecap="round"/>
    <path d="M214 420H336V426H214Z" fill="url(#hatch45Light)" stroke="none"/>
    <!-- candelero y vela -->
    <path d="M276 420 L272 405 H294 L290 420Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="276" y="368" width="14" height="38" fill="${PAL1.c3}" stroke="${INK}" stroke-width="3"/><path d="M286 368V406H290V368Z" fill="url(#hatch45)" stroke="none"/>
    <path d="M276 372 Q280 380 282 372 Q286 386 290 372" fill="${PAL1.c3}" stroke="${INK}" stroke-width="2"/>
    <g class="candle"><path d="M283 366 C272 354 276 340 283 328 C290 340 294 354 283 366Z" fill="${PAL1.c4}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M283 362 C278 356 279 349 283 342 C287 349 288 356 283 362Z" fill="${PAL1.c3}" stroke="${INK}" stroke-width="1.5"/></g>
    <!-- tintero y pluma -->
    <path d="M232 420 L235 402 H251 L254 420Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M243 402 Q252 380 262 362 Q250 372 246 386 Q244 380 247 372 Q238 380 243 402Z" fill="${PAL1.c3}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M314 420 L318 408 L332 410 L330 420Z" fill="${PAL1.c3}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  </g>
  <!-- cono de luz de vela: plano plano al 22 % (sin degradado) -->
  <path class="lightcone" d="M283 340 L-10 130 L-10 470 L214 450Z" fill="${PAL1.c4}" opacity=".16"/>
  <!-- suelo de tablones -->
  <g class="layer" style="--d:11" filter="url(#inkWobble)">
    <path d="M-20 474H380V700H-20Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="3"/>
    <path d="M-20 474H380V484H-20Z" fill="${PAL1.c3}" stroke="${INK}" stroke-width="3"/>
    <path d="M-20 520H380M-20 568H380M-20 620H380M80 484V520M250 520V568M40 568V620M310 568V620" stroke="${PAL1.c3}" stroke-width="1.5" opacity=".35"/>
    <path d="M-20 484H380V508H-20Z" fill="url(#hatch45Light)" stroke="none"/>
  </g>
</svg>`;

export function mount(container, api) {
  container.classList.add('c2');
  container.innerHTML = `
    ${BG_SVG}
    <div class="c2-letter parchment" role="group" aria-label="Carta al Niño Dios">
      <p class="c2-text" aria-live="polite"></p>
      <span class="seal c2-seal" aria-hidden="true"></span>
      <div class="c2-stamp" aria-hidden="true">¡DIGO!<br>¡AL NIÑO DIOS!</div>
    </div>
    `;

  const $ = (s) => container.querySelector(s);
  const text = $('.c2-text');
  const reduced = () => api.fx.reducedMotion();

  const vn = makeVN(container, api);   // sprites de novela visual (js/vn/vn.js); sin el motor, solo texto

  const setText = (html) => { text.classList.remove('in'); void text.offsetWidth; text.innerHTML = html; text.classList.add('in'); };
  const resetGag = () => { clearTimers(); container.classList.remove('gag-scribble', 'gag-jump', 'gag-stamp'); };

  // Beats (A2 §3): el aventurero nervioso escribe a la luz de la vela y lee orgulloso; el desliz «mamá… ¡DIGO!»;
  // mamá se asoma con la ceja levantada y un «?», y se va.
  api.setBeats([
    { text: '', label: 'CONTINUAR', hide: 'mom', show: [['adventurer', 'nervous', 'left']] },
    { text: '', label: 'CONTINUAR', hide: 'mom' },
    { text: '¿Perdón? ¿Me llamaste, hijo?', speaker: 'Mamá', show: [['mom', 'suspicious', 'right', { enter: 'slide' }]], emote: ['mom', '?'], focus: 'mom' },
    { text: '¡N-no, nadie! Estaba hablando con el Niño Dios. Todo bien por aquí.', speaker: 'Aventurero', hide: 'mom', expr: { adventurer: 'embarrassed' }, emote: ['adventurer', 'sweat'], focus: 'adventurer' },
  ]);

  api.onBeat((i, beat) => {
    resetGag();
    container.classList.toggle('c2-beat2', i === 1);
    container.classList.toggle('c2-dlg', i >= 2);            // las líneas de diálogo reemplazan a la carta
    vn.apply(beat);
    if (i === 0) {
      later(() => setText(dropcap(LETTER_1)), container.classList.contains('c2-ready') ? 0 : 1300);
      later(() => vn.call('expr', 'adventurer', 'proud'), 2600);   // lee la carta, orgulloso
      container.classList.add('c2-ready');
    } else if (i === 1) {
      setText(dropcap(LETTER_2));
      api.setButton({ disabled: true });                // se habilita al terminar el gag
      const fast = reduced();
      later(() => { container.classList.add('gag-scribble'); api.audio.play('tap'); vn.call('expr', 'adventurer', 'embarrassed'); vn.call('emote', 'adventurer', '!'); }, fast ? 300 : 1000);
      later(() => { vn.call('hop', 'adventurer'); }, fast ? 400 : 1650);
      later(() => { container.classList.add('gag-stamp'); api.audio.play('chime'); api.fx.vibrate(20); }, fast ? 500 : 1900);
      later(() => api.setButton({ disabled: false }), fast ? 700 : 3000);
    }
  });
}

export function unmount() { clearTimers(); }
