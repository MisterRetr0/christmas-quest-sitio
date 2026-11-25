// c1-door.js — Capítulo 1: La Puerta (A1 v2 "linograbado entintado", paleta #14101F #3A2A52 #E8E2D0 #E07B1A #9C1F2B).
// Casa alta y torcida (tejado a 6°, chimenea a rayas con humo en espiral), colina en espiral contra una luna enorme,
// árboles pelados con ramas en espiral, verja de lanzas, puerta alta y estrecha con aldaba y corona de espinas con lazo rojo,
// faroles en ganchos con voluta. Tinta + temblor (#inkWobble) + colores planos + sombras con trama. Sin degradados.
// La hoja de la puerta es un <div> con SVG para girarla con CSS 3D. Beat 1: «ABRIR LA PUERTA» → crujido, la hoja gira,
// la luz naranja inunda la pantalla, campanilla y pasa al capítulo 2. ⏭ visible durante la animación. Beat 2: solo al volver atrás.
import { makeVN } from './vn-bridge.js';
import { INK, PAL1, curlyTree, fence, lantern, snowCircles, spiralHill, house, leafInner } from './art-house.js';

export const id = 'c1-door';
export const title = 'La Puerta';

const BEAT_1 = 'Existe una petición que debe entregarse antes de Navidad…';
const BEAT_2 = 'La puerta ya está abierta. Solo falta cruzarla.';

let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

// ---------- Capa trasera: cielo, luna, colina en espiral, tejados, árboles y la casa ----------
const stars = [[30, 60], [88, 112], [140, 44], [206, 30], [330, 150], [18, 170], [122, 150], [70, 220], [330, 280]]
  .map(([x, y]) => `<path d="M${x} ${y - 4}V${y + 4}M${x - 4} ${y}H${x + 4}" stroke="#E8E2D0" stroke-width="1.8" stroke-linecap="round"/>`).join('');
const CITY = `<path d="M-20 440 V330 L2 306 L18 326 L40 288 L62 330 L84 316 V440Z" fill="${PAL1.c2}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="34" y="344" width="9" height="16" fill="${PAL1.c4}" stroke="${INK}" stroke-width="2"/>`;

const BACK_SVG = `
<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="360" height="640" fill="${PAL1.c1}"/>
  <g class="layer" style="--d:2">${stars}</g>
  <!-- luna enorme con cráteres y sombra de trama -->
  <g class="layer" style="--d:3" filter="url(#inkWobble)">
    <circle cx="252" cy="122" r="104" fill="${PAL1.c3}" stroke="${INK}" stroke-width="3"/>
    <path d="M252 18 A104 104 0 0 1 252 226 A66 104 0 0 0 252 18Z" fill="url(#hatch45Light)" stroke="none"/>
    <circle cx="222" cy="92" r="14" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="290" cy="156" r="10" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="300" cy="84" r="7" fill="none" stroke="${INK}" stroke-width="1.5"/>
  </g>
  <g class="layer" style="--d:5" filter="url(#inkWobble)">${spiralHill(196, 448, 200, 232)}</g>
  <g class="layer" style="--d:7" filter="url(#inkWobble)">${CITY}</g>
  <g class="layer" style="--d:9" filter="url(#inkWobble)">${curlyTree(24, 450, 150, PAL1.c2, 1)}</g>
  <g filter="url(#inkWobble)"><g transform="translate(150 440) scale(.8) translate(-186 -440)">${house({ wall: PAL1.c2, roof: PAL1.c5, win: PAL1.c4, snow: PAL1.c3, smoke: PAL1.c3, stripeA: PAL1.c3, stripeB: PAL1.c1 })}</g></g>
</svg>`;

// ---------- Hoja de la puerta: alta y estrecha, aldaba y corona de espinas con lazo rojo (dibujo compartido con el cap. 6) ----------
const LEAF_SVG = `<svg viewBox="0 0 60 170" preserveAspectRatio="none" aria-hidden="true">${leafInner(PAL1)}</svg>`;

// ---------- Capa delantera: verja, faroles en ganchos, nieve de círculos de papel ----------
const FRONT_SVG = `
<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g filter="url(#inkWobble)">
    ${fence(-14, 80, 466, 54)}${fence(232, 376, 466, 54)}
    <path d="M118 440 H242 V452 H118Z" fill="none"/>
  </g>
  <g filter="url(#inkWobble)">${lantern(98, 236, 6, PAL1.c4)}${lantern(202, 250, -7, PAL1.c4, 'flick')}</g>
  <g class="layer" style="--d:14" filter="url(#inkWobble)"><rect x="-30" y="486" width="420" height="200" fill="${PAL1.c3}"/>${snowCircles(480, PAL1.c3, 3, 360, .7)}</g>
  <g class="layer" style="--d:24" filter="url(#inkWobble)">${snowCircles(556, PAL1.c3, 8, 360, .7)}<rect x="-30" y="580" width="420" height="120" fill="${PAL1.c3}"/></g>
</svg>`;

export function mount(container, api) {
  container.classList.add('c1');
  container.style.setProperty('--tint', PAL1.c1);
  container.innerHTML = `
    <div class="c1-art">
      ${BACK_SVG}
      <div class="c1-doorway">
        <div class="c1-interior"><i></i><svg class="c1-sil" viewBox="0 0 40 92" aria-hidden="true"><path d="M20 30 C9 30 6 42 6 56 L6 92 H34 V56 C34 42 31 30 20 30Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="20" cy="17" r="11" fill="${PAL1.c1}" stroke="${INK}" stroke-width="2.5"/><path d="M12 9 C14 1 26 1 28 9 C24 6 16 6 12 9Z" fill="${PAL1.c1}" stroke="${INK}" stroke-width="2"/></svg></div>
        <div class="c1-leaf">${LEAF_SVG}</div>
      </div>
      ${FRONT_SVG}
      <div class="c1-beam"></div>
    </div>
    <div class="c1-flood"></div>
    <p class="sr-only">Una casa alta y torcida bajo una luna enorme. En su puerta estrecha cuelga una corona de espinas con un lazo rojo.</p>`;

  let opening = false;

  // Novela visual: aquí habla el Narrador (sin sprites; la silueta del aventurero aparece contra la luz al abrirse la puerta)
  const vn = makeVN(container, api);
  api.setBeats([
    { text: BEAT_1, label: 'ABRIR LA PUERTA', speaker: 'Narrador' },
    { text: BEAT_2, label: 'ENTRAR', speaker: 'Narrador' },
  ]);

  // Al volver atrás desde el capítulo 2 (beat 2) la puerta aparece ya abierta, sin inundar la pantalla
  api.onBeat((i, beat) => { container.classList.toggle('is-open-instant', i === 1); vn.apply(beat); });

  const finish = () => { clearTimers(); api.hideSkip(); api.goChapter(1); };

  api.onContinue(({ beat }) => {
    if (beat === 1) return true;
    if (opening) return false;
    opening = true;
    api.setButton({ disabled: true });
    api.audio.unlock(); api.audio.startMusic();
    api.audio.play('creak');
    api.showSkip(finish);
    if (api.fx.reducedMotion()) {
      container.classList.add('is-open-instant', 'flood-fade');
      later(() => api.audio.play('chime'), 250);
      later(finish, 1000);
    } else {
      container.classList.add('is-opening');
      later(() => container.classList.add('is-flooding'), 900);
      later(() => api.audio.play('chime'), 1300);
      later(finish, 1800);
    }
    return false;
  });
}

export function unmount() { clearTimers(); }
