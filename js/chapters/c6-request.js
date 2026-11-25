// c6-request.js — Capítulo 6: La Petición Oficial (A1 v2 "linograbado entintado").
// La MISMA casa del capítulo 1, ahora cálida: ventanas amarillas, guirnalda de luces, nieve de círculos de papel, mesita con CARNE CON PIÑA.
// Paleta #2A1B3D #9C1F2B #F2C230 #E8E2D0 (+ #E07B1A), tinta #1B1420, sin degradados. Personajes con .chibi + .chibi-shadow.
// Beats 1–3: la carta sobre un pergamino de borde rasgado. Beat 4: elección (botones .btn del capítulo reemplazan a CONTINUAR).
//   NECESITO MÁS ARGUMENTOS → carpeta enorme con 2 anexos (uno por toque) → vuelve a la elección. Desde la 2.ª vuelta: LO PENSARÉ.
//   LO PENSARÉ → final cálido.  ACEPTAR → confeti Oro/Baya/Ámbar + «Solicitud aprobada…» + VALE NAVIDEÑO (pergamino + sello de cera, canvas → PNG).
// Todo final cierra con «Gracias por ser la mejor jugadora de esta aventura.». El final alcanzado se guarda en localStorage.
import { INK, PAL1, curlyTree, snowCircles, house, leafInner } from './art-house.js';
import { makeVN } from './vn-bridge.js';

export const id = 'c6-request';
export const title = 'La Petición Oficial';

const ENDING_KEY = 'cq.ending.v1';
const THANKS = 'Gracias por ser la mejor jugadora de esta aventura.';
const LETTERS = [
  'Querido Niño Dios: hice mis tareas, aprobé el último semestre y he trabajado duro. Creo que merezco una Nintendo Switch 2.',
  'Además, mi niño interior está seguro de que le encantaría. Sin embargo, existe una autoridad superior que debe aprobar esta operación…',
  'Por eso, mamá, te presento esta humilde propuesta navideña. Las Pandoras son de broma: aquí nadie compra nada, solo pedimos con cariño.',
  'Gracias por cada Navidad, por cada abrazo y por jugar esta aventura conmigo.',
];
const P6 = { c1: '#2A1B3D', c2: '#9C1F2B', c3: '#F2C230', c4: '#E8E2D0', c5: '#E07B1A', wall: '#3A2A52' };

let timers = [];
let couponEl = null;   // capa del vale (vive fuera de la página; se quita al desmontar)
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const loadEnding = () => { try { return localStorage.getItem(ENDING_KEY); } catch (e) { return null; } };
const saveEnding = (v) => { try { v ? localStorage.setItem(ENDING_KEY, v) : localStorage.removeItem(ENDING_KEY); } catch (e) {} };

// ---------- Fondo: la casa del capítulo 1 en versión cálida ----------
const stars = [[40, 70], [96, 120], [150, 50], [206, 90], [320, 44], [24, 180], [130, 160], [340, 180]]
  .map(([x, y]) => `<path d="M${x} ${y - 4}V${y + 4}M${x - 4} ${y}H${x + 4}" stroke="${P6.c4}" stroke-width="1.8" stroke-linecap="round"/>`).join('');
const ART_SVG = `
<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="360" height="640" fill="${P6.c1}"/>
  <g class="layer" style="--d:2">${stars}</g>
  <g class="layer" style="--d:3" filter="url(#inkWobble)"><circle cx="296" cy="96" r="38" fill="${P6.c4}" stroke="${INK}" stroke-width="3"/><path d="M296 58A38 38 0 0 1 296 134A24 38 0 0 0 296 58Z" fill="url(#hatch45Light)" stroke="none"/></g>
  <g class="layer" style="--d:8" filter="url(#inkWobble)">${curlyTree(344, 456, 150, P6.wall, -1)}</g>
  <!-- la casa de siempre, a la izquierda y cálida: ventanas amarillas y guirnalda de luces -->
  <g filter="url(#inkWobble)"><g transform="translate(100 462) scale(.62) translate(-186 -440)">
    ${house({ wall: P6.wall, roof: P6.c2, win: P6.c3, snow: P6.c4, smoke: P6.c4, stripeA: P6.c4, stripeB: PAL1.c1 }, { lights: true })}
    <svg x="156" y="270" width="60" height="170" viewBox="0 0 60 170" preserveAspectRatio="none">${leafInner(PAL1)}</svg>
  </g></g>
  <g class="layer" style="--d:12" filter="url(#inkWobble)"><rect x="-30" y="480" width="420" height="200" fill="${P6.c4}"/>${snowCircles(474, P6.c4, 5, 360, .62)}</g>
  <g class="layer" style="--d:22" filter="url(#inkWobble)">${snowCircles(566, P6.c4, 9, 360, .62)}<rect x="-30" y="590" width="420" height="120" fill="${P6.c4}"/></g>
</svg>`;

// Mesita con mantel y plato de CARNE CON PIÑA (carne glaseada roja, aros de piña, cebollín). Se dibuja en primer plano.
const ink = (extra = '') => `stroke="${INK}" stroke-width="3" stroke-linejoin="round" ${extra}`;
const TABLE_SVG = `
<svg class="c6-table" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g filter="url(#inkWobble)"><g transform="translate(98 448) scale(.85) translate(-107 -400)">
    <path d="M70 410 L62 470 M146 410 L154 470" ${ink('stroke-linecap="round"')} stroke-width="8"/><path d="M70 410 L62 470 M146 410 L154 470" stroke="#3A2A52" stroke-width="3" stroke-linecap="round"/>
    <!-- mantel con volante de papel -->
    <path d="M50 402 H164 Q170 436 160 452 Q150 444 142 454 Q132 444 122 454 Q112 444 102 454 Q92 444 82 454 Q72 444 64 452 Q50 436 50 402Z" fill="${P6.c2}" ${ink()}/>
    <path d="M52 412 H162" stroke="${P6.c4}" stroke-width="2.5" stroke-dasharray="7 5"/>
    <path d="M118 402 H164 Q170 436 160 452 Q150 444 142 454 Q132 444 122 454Z" fill="url(#hatch45)" stroke="none" opacity=".75"/>
    <ellipse cx="107" cy="402" rx="58" ry="10" fill="${P6.c4}" ${ink()}/>
    <!-- plato -->
    <ellipse cx="107" cy="398" rx="46" ry="9" fill="${P6.c4}" ${ink()}/><ellipse cx="107" cy="397" rx="36" ry="6" fill="none" stroke="${INK}" stroke-width="1.5"/>
    <!-- carne glaseada -->
    <g ${ink()} stroke-width="2.5">
      <ellipse cx="86" cy="392" rx="13" ry="8" fill="${P6.c2}"/><ellipse cx="128" cy="392" rx="12" ry="8" fill="${P6.c2}"/><ellipse cx="108" cy="389" rx="14" ry="9" fill="${P6.c2}"/>
      <ellipse cx="97" cy="384" rx="12" ry="8" fill="${P6.c2}"/><ellipse cx="119" cy="384" rx="12" ry="8" fill="${P6.c2}"/>
    </g>
    <g fill="${P6.c4}" opacity=".85"><ellipse cx="82" cy="389" rx="5" ry="1.8"/><ellipse cx="104" cy="385" rx="6" ry="2"/><ellipse cx="125" cy="389" rx="4" ry="1.6"/></g>
    <path d="M100 392 L128 396 L136 392 L102 398Z" fill="url(#hatch45)" stroke="none" opacity=".7"/>
    <!-- aros de piña -->
    <g ${ink()} stroke-width="2.5">
      <g transform="rotate(-8 88 381)"><ellipse cx="88" cy="381" rx="15" ry="8.5" fill="${P6.c3}"/><ellipse cx="88" cy="381" rx="5.2" ry="3" fill="${P6.c2}"/></g>
      <g transform="rotate(6 126 382)"><ellipse cx="126" cy="382" rx="15" ry="8.5" fill="${P6.c3}"/><ellipse cx="126" cy="382" rx="5.2" ry="3" fill="${P6.c2}"/></g>
      <g transform="rotate(-3 107 372)"><ellipse cx="107" cy="372" rx="16" ry="9" fill="${P6.c3}"/><ellipse cx="107" cy="372" rx="5.4" ry="3.1" fill="${P6.c2}"/></g>
    </g>
    <path d="M96 373 L99 369M115 372 L118 369M80 382 L83 379M120 383 L124 380" stroke="${INK}" stroke-width="1.5" fill="none" opacity=".7"/>
    <g fill="${P6.c5}" stroke="${INK}" stroke-width="1.5"><rect x="98" y="364" width="9" height="3" rx="1.5" transform="rotate(-20 98 364)"/><rect x="112" y="365" width="9" height="3" rx="1.5" transform="rotate(25 112 365)"/><rect x="74" y="388" width="8" height="3" rx="1.5" transform="rotate(15 74 388)"/></g>
    <!-- vapor -->
    <g class="steam" fill="none" stroke-linecap="round"><path d="M92 360 Q86 350 94 342 T92 326" stroke="${INK}" stroke-width="6"/><path d="M110 356 Q104 346 112 338 T110 322" stroke="${INK}" stroke-width="6"/><path d="M92 360 Q86 350 94 342 T92 326" stroke="${P6.c4}" stroke-width="3"/><path d="M110 356 Q104 346 112 338 T110 322" stroke="${P6.c4}" stroke-width="3"/></g>
  </g></g>
</svg>`;

// Carpeta gigante de papel manila (tinta + color plano)
const FOLDER_SVG = `
<svg viewBox="0 0 300 220" aria-hidden="true">
  <path d="M10 40 Q10 28 22 28 H100 L116 44 H278 Q290 44 290 56 V200 Q290 212 278 212 H22 Q10 212 10 200Z" fill="#B58A3C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10 62 Q10 54 22 54 H278 Q290 54 290 62 V200 Q290 212 278 212 H22 Q10 212 10 200Z" fill="${P6.c3}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M150 54 H290 V200 Q290 212 278 212 H190Z" fill="url(#hatch45Light)" stroke="none"/>
  <rect x="62" y="96" width="176" height="60" fill="${P6.c4}" stroke="${INK}" stroke-width="3"/>
  <text x="150" y="122" text-anchor="middle" font-family="Pirata One, serif" font-size="22" fill="${INK}">ARGUMENTOS</text>
  <text x="150" y="146" text-anchor="middle" font-family="Pirata One, serif" font-size="22" fill="${P6.c2}">ADICIONALES</text>
</svg>`;

const CHICK = `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true"><ellipse cx="40" cy="72" rx="22" ry="4" fill="url(#hatch45)"/><circle cx="40" cy="44" r="26" fill="${P6.c3}" stroke="${INK}" stroke-width="3"/><path d="M16 46 Q8 40 14 34 Q20 40 22 44Z M64 46 Q72 40 66 34 Q60 40 58 44Z" fill="${P6.c3}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="31" cy="40" r="3.4" fill="${INK}"/><circle cx="49" cy="40" r="3.4" fill="${INK}"/><path d="M33 48 L40 55 L47 48 Q40 44 33 48Z" fill="${P6.c5}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 18 Q36 8 42 6 M40 18 Q46 10 50 12" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M34 70 V76 M46 70 V76" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`;

// Silueta de respaldo si falta both-34.png
const FALLBACK_SVG = `
<svg class="c6-fallback" viewBox="0 0 240 200" aria-hidden="true">
  <path d="M28 198 C20 150 38 120 70 118 C102 120 120 150 112 198Z" fill="${P6.c5}" stroke="${INK}" stroke-width="3"/><circle cx="70" cy="86" r="30" fill="${P6.c4}" stroke="${INK}" stroke-width="3"/>
  <path d="M130 198 C126 130 144 96 178 94 C212 96 230 130 226 198Z" fill="${P6.c2}" stroke="${INK}" stroke-width="3"/><circle cx="178" cy="64" r="28" fill="${P6.c4}" stroke="${INK}" stroke-width="3"/>
  <circle cx="60" cy="92" r="3" fill="${INK}"/><circle cx="82" cy="92" r="3" fill="${INK}"/><circle cx="169" cy="68" r="3" fill="${INK}"/><circle cx="189" cy="68" r="3" fill="${INK}"/>
</svg>`;

// ======================================================================
// VALE NAVIDEÑO: pergamino de borde rasgado + sello de cera (no un cupón de puntos). Se dibuja SOLO en un canvas
// (sirve para mostrarlo y para descargar el PNG, sin librerías).
// ======================================================================
const VW = 800, VH = 1100;
const F_TITLE = `'Pirata One', 'IM Fell English', Georgia, serif`;
const F_BODY = `'IM Fell English', Georgia, 'Times New Roman', serif`;
const F_UI = `'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
const C = { ink: '#1B1420', paper: '#E8E2D0', red: '#9C1F2B', gold: '#F2C230', orange: '#E07B1A' };

/** Borde rasgado determinista alrededor de un rectángulo. */
function tornPath(ctx, x, y, w, h, j = 9, seed = 5) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pts = [];
  for (let i = 0; i <= 34; i++) pts.push([x + w * i / 34, y + r() * j]);
  for (let i = 1; i <= 46; i++) pts.push([x + w - r() * j, y + h * i / 46]);
  for (let i = 34; i >= 0; i--) pts.push([x + w * i / 34, y + h - r() * j]);
  for (let i = 45; i >= 1; i--) pts.push([x + r() * j, y + h * i / 46]);
  ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
}
function hatch(ctx, x, y, w, h, alpha = .5) {                     // trama a 45° (paso 6, trazo 1.5), recortada al rectángulo
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = C.ink; ctx.globalAlpha = alpha; ctx.lineWidth = 1.5;
  for (let k = -h; k < w; k += 6) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); ctx.stroke(); } ctx.restore();
}
function wax(ctx, cx, cy, r) {                                    // sello de cera irregular con anillo y estrella
  ctx.save(); ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = r * (1 + .07 * Math.sin(a * 5 + 1) + .04 * Math.sin(a * 9)); ctx.lineTo(cx + rr * Math.cos(a) + 4, cy + rr * Math.sin(a) + 5); }
  ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill();                                     // sombra dura
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = r * (1 + .07 * Math.sin(a * 5 + 1) + .04 * Math.sin(a * 9)); ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * .68, 0, 6.283); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(232,226,208,.55)'; ctx.stroke();
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .2 : r * .46; ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = 'rgba(232,226,208,.9)'; ctx.fill(); ctx.restore();
}
function lockIcon(ctx, x, y, s) {
  ctx.save(); ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - s * .25, s * .3, Math.PI, 0); ctx.stroke(); ctx.fillRect(x - s * .5, y - s * .25, s, s * .7); ctx.restore();
}
function wrapText(ctx, text, maxW) {            // parte un texto en líneas que caben en maxW
  const lines = []; let line = '';
  text.split(' ').forEach((w) => { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
function drawCoupon(canvas, pandoras) {
  const ctx = canvas.getContext('2d'); canvas.width = VW; canvas.height = VH; ctx.clearRect(0, 0, VW, VH);
  const center = (t, y, font, color, stroke) => { ctx.font = font; ctx.textAlign = 'center'; if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.strokeText(t, VW / 2, y); } ctx.fillStyle = color; ctx.fillText(t, VW / 2, y); };
  // pergamino rasgado: sombra dura, contorno de tinta, papel con motitas y trama en el borde
  tornPath(ctx, 40, 30, VW - 70, VH - 56, 12, 5); ctx.save(); ctx.translate(12, 12); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
  tornPath(ctx, 34, 24, VW - 70, VH - 56, 12, 5); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.save(); tornPath(ctx, 34, 24, VW - 70, VH - 56, 12, 5); ctx.clip();
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 520; i++) { ctx.fillStyle = `rgba(122,82,48,${.05 + rnd() * .08})`; ctx.beginPath(); ctx.arc(30 + rnd() * (VW - 60), 24 + rnd() * (VH - 60), .8 + rnd() * 2, 0, 6.283); ctx.fill(); }
  hatch(ctx, 34, VH - 130, VW - 70, 106, .12); hatch(ctx, VW - 80, 24, 46, VH - 56, .12);
  ctx.restore();
  // cabecera con capitular
  ctx.textAlign = 'center'; ctx.font = `italic 400 26px ${F_BODY}`; ctx.fillStyle = C.ink;
  ctx.fillText('Solicitud aprobada por la Autoridad Superior', VW / 2, 92);
  center('Vale Navideño', 190, `400 112px ${F_TITLE}`, C.red, 6);
  ctx.beginPath(); ctx.moveTo(150, 226); ctx.lineTo(650, 226); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
  [[150, 226], [400, 226], [650, 226]].forEach(([x, y]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = C.gold; ctx.fillRect(-7, -7, 14, 14); ctx.lineWidth = 3; ctx.strokeRect(-7, -7, 14, 14); ctx.restore(); });
  ctx.font = `italic 400 32px ${F_BODY}`; ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('Para la mejor jugadora de esta aventura', VW / 2, 282);
  // Pandoras ganadas: dije con tinta + número
  ctx.save(); ctx.translate(220, 366); ctx.beginPath(); ctx.arc(0, 0, 48, 0, 6.283); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 33, 0, 6.283); ctx.lineWidth = 3; ctx.stroke(); ctx.strokeRect(-17, -2, 34, 24); ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(18, -22); ctx.stroke(); ctx.restore();
  ctx.textAlign = 'left'; ctx.font = `400 74px ${F_TITLE}`; ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.strokeText(`${pandoras} Pandoras`, 290, 392); ctx.fillStyle = C.paper; ctx.fillText(`${pandoras} Pandoras`, 290, 392);
  ctx.font = `400 30px ${F_BODY}`; ctx.fillStyle = C.ink; ctx.fillText('ganadas en la granja de mamá', 292, 430);
  // ilustración de concepto entintada: UNA pulsera de cadena plateada con DOS dijes enfatizados (una mini consola y Pollito)
  const cx = 400, cy = 548, rx = 230, ry = 62;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(cx + 7, cy + 7, rx, ry, 0, 0, 6.283); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();      // sombra dura
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.stroke();               // contorno
  ctx.setLineDash([16, 6]); ctx.lineWidth = 9; ctx.strokeStyle = '#D5D9E1'; ctx.stroke(); ctx.setLineDash([]);                       // eslabones plateados
  // cuentas espaciadas a lo largo de la cadena (oro, baya y papel), como en una pulsera de dijes
  const bead = (x, y, col) => { ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.283); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.beginPath(); ctx.arc(x - 3.5, y - 3.5, 2.6, 0, 6.283); ctx.fillStyle = 'rgba(232,226,208,.9)'; ctx.fill(); };
  for (let k = 0; k < 14; k++) { const t = (k / 14) * 6.283 + .2; bead(cx + rx * Math.cos(t), cy + ry * Math.sin(t), [C.gold, C.red, C.paper][k % 3]); }
  // dijecitos menores colgando entre los dos grandes
  const mini = (t, kind) => {
    const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t) + 11;
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke(); ctx.translate(0, 10);
    ctx.beginPath();
    if (kind === 'heart') { ctx.moveTo(0, 16); ctx.bezierCurveTo(-18, 2, -10, -10, 0, -2); ctx.bezierCurveTo(10, -10, 18, 2, 0, 16); }
    else { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; ctx.lineTo(Math.cos(a) * r, 8 + Math.sin(a) * r); } ctx.closePath(); }
    ctx.fillStyle = kind === 'heart' ? C.red : C.gold; ctx.fill(); ctx.stroke(); ctx.restore();
  };
  mini(.45, 'star'); mini(2.7, 'heart'); mini(.95, 'heart'); mini(2.2, 'star');
  ctx.fillStyle = '#D5D9E1'; ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.rect(cx - 22, cy - ry - 16, 44, 28); ctx.fill(); ctx.stroke();   // broche
  ctx.beginPath(); ctx.arc(cx, cy - ry - 2, 6, 0, 6.283); ctx.fillStyle = C.ink; ctx.fill();
  ctx.restore();
  const ring = (x, y) => { ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#D5D9E1'; ctx.stroke(); ctx.restore(); };
  const sparks = (x, y, r) => { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; [-2.4, -1.57, -0.74].forEach((a) => { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16)); ctx.stroke(); }); ctx.restore(); };
  // dije 1: mini consola portátil, grande y reconocible: pantalla central y dos mandos laterales (rojo y azul)
  ring(298, cy + ry + 12);
  ctx.save(); ctx.translate(298, cy + ry + 74); ctx.scale(1.45, 1.45); ctx.lineWidth = 3.6; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
  ctx.fillStyle = C.ink; ctx.fillRect(-50, -20, 112, 62);                                  // sombra dura
  ctx.fillStyle = C.red; ctx.fillRect(-56, -26, 20, 62); ctx.strokeRect(-56, -26, 20, 62); // mando izquierdo (rojo)
  ctx.fillStyle = '#2E6DB4'; ctx.fillRect(36, -26, 20, 62); ctx.strokeRect(36, -26, 20, 62); // mando derecho (azul)
  ctx.fillStyle = '#14101F'; ctx.fillRect(-36, -26, 72, 62); ctx.strokeRect(-36, -26, 72, 62);
  ctx.fillStyle = C.paper; ctx.fillRect(-30, -20, 60, 50); ctx.strokeRect(-30, -20, 60, 50);                    // pantalla encendida
  ctx.fillStyle = C.gold; ctx.fillRect(-14, -4, 28, 18); ctx.lineWidth = 2.4; ctx.strokeRect(-14, -4, 28, 18); ctx.lineWidth = 3.6;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-46, -8, 4, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(-46, 12, 4, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(46, 0, 4, 0, 6.283); ctx.fill();
  ctx.restore(); sparks(298, cy + ry + 74, 82);
  // dije 2: Pollito, amarillo, con alita, pico y patitas
  ring(500, cy + ry + 12);
  ctx.save(); ctx.translate(500, cy + ry + 66); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(7, 7, 42, 0, 6.283); ctx.fillStyle = C.ink; ctx.fill();         // sombra dura
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, 6.283); ctx.fillStyle = C.gold; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -42); ctx.quadraticCurveTo(-14, -62, 2, -64); ctx.moveTo(4, -42); ctx.quadraticCurveTo(18, -58, 30, -52); ctx.lineWidth = 4; ctx.stroke(); ctx.lineWidth = 5; // plumitas
  ctx.beginPath(); ctx.moveTo(-42, 6); ctx.quadraticCurveTo(-62, -6, -52, -22); ctx.quadraticCurveTo(-40, -12, -38, -4); ctx.fillStyle = C.gold; ctx.fill(); ctx.stroke();     // alita
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(-14, -8, 5, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(16, -8, 5, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(0, 22); ctx.lineTo(9, 8); ctx.closePath(); ctx.fillStyle = C.orange; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, 42); ctx.lineTo(-12, 54); ctx.moveTo(12, 42); ctx.lineTo(12, 54); ctx.stroke();
  ctx.restore(); sparks(500, cy + ry + 66, 50);
  // recuadro del kit (etiqueta de inventario) con letra pequeña
  ctx.save(); ctx.fillStyle = C.ink; ctx.fillRect(76, 770, VW - 152, 176); ctx.fillStyle = C.gold; ctx.fillRect(70, 764, VW - 152, 176); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.strokeRect(70, 764, VW - 152, 176); ctx.restore();
  center('Premio navideño', 822, `400 54px ${F_TITLE}`, C.red, 0);
  center('1 Pandora + 2 charms', 866, `400 40px ${F_BODY}`, C.ink);
  ctx.font = `italic 400 22px ${F_BODY}`; ctx.fillStyle = C.ink; ctx.textAlign = 'center';
  wrapText(ctx, 'Las Pandoras de este juego son de broma: no compran nada, solo sonrisas. No reembolsable en abrazos.', 600).forEach((l, i) => ctx.fillText(l, VW / 2, 906 + i * 26));
  // despedida + sello de cera
  ctx.textAlign = 'left'; ctx.font = `italic 400 38px ${F_BODY}`; ctx.fillStyle = C.red; ctx.fillText('Con amor, tu pollito', 100, 1040);
  wax(ctx, 640, 1010, 56);
}

export function mount(container, api) {
  container.classList.add('c6');
  container.style.setProperty('--tint', P6.c1);
  container.innerHTML = `
    <div class="c6-art">${ART_SVG}
      ${TABLE_SVG}
    </div>
    <div class="c6-letter parchment" role="group" aria-label="Petición oficial">
      <div class="c6-text" aria-live="polite"></div>
    </div>
    <div class="c6-folder" aria-hidden="true">${FOLDER_SVG}</div>
    <button type="button" class="c6-card parchment" hidden></button>
    <div class="c6-choice">
      <button type="button" class="btn" data-act="accept">ACEPTAR LA PETICIÓN</button>
      <button type="button" class="btn btn--ghost" data-act="more">NECESITO MÁS ARGUMENTOS</button>
    </div>
    <div class="c6-after">
      <button type="button" class="btn" data-act="vale">VER MI VALE NAVIDEÑO</button>
      <button type="button" class="btn btn--ghost" data-act="change">Cambiar mi respuesta</button>
    </div>
    <div class="c6-confetti" aria-hidden="true"></div>`;

  const $ = (s) => container.querySelector(s);
  const text = $('.c6-text'), card = $('.c6-card');
  // El vale es una capa modal a pantalla completa colgada de #stage (por encima de la barra superior y del dock)
  const coupon = document.createElement('div');
  coupon.className = 'c6-coupon'; coupon.hidden = true; coupon.setAttribute('role', 'dialog'); coupon.setAttribute('aria-label', 'Vale navideño');
  coupon.innerHTML = `<canvas class="c6-canvas" role="img" aria-label="Vale navideño: Premio navideño, 1 Pandora más 2 charms: una mini consola y Pollito"></canvas>
    <div class="c6-coupon-btns"><button type="button" class="btn" data-act="save">GUARDAR VALE</button><button type="button" class="btn btn--ghost" data-act="close">VOLVER</button></div>`;
  document.getElementById('stage').appendChild(coupon);
  const canvas = coupon.querySelector('.c6-canvas');
  const reduced = () => api.fx.reducedMotion();
  const stageRect = () => document.getElementById('stage').getBoundingClientRect();
  let visits = 0;          // veces que se abrió la carpeta de argumentos
  let anexo = 0;           // anexo actual dentro de la carpeta
  let cardOk = false;

  const vn = makeVN(container, api);   // sprites VN + CGs (js/vn/vn.js); sin el motor, solo texto y fondo
  const SIDES = [['adventurer', 'tender', 'left'], ['mom', 'neutral', 'right']];

  const setMode = (m) => { container.dataset.mode = m; };
  const setText = (html) => { container.classList.add('has-text'); text.classList.remove('in'); void text.offsetWidth; text.innerHTML = html; text.classList.add('in'); };
  const altBtn = $('.c6-choice [data-act="more"]');
  const refreshChoice = () => { altBtn.textContent = visits >= 2 ? 'LO PENSARÉ' : 'NECESITO MÁS ARGUMENTOS'; altBtn.dataset.act = visits >= 2 ? 'think' : 'more'; };

  // Beats VN (A2 §3, cap. 6): ambos en escena; él tierno lee la petición, ella emocionada con la mano en el pecho.
  api.setBeats([
    { text: '', show: SIDES, expr: { adventurer: 'tender', mom: 'neutral' }, focus: 'adventurer', cg: null },
    { text: '', show: SIDES, expr: { adventurer: 'nervous', mom: 'moved' }, focus: 'mom', emote: ['mom', 'hearts'] },
    { text: '', show: SIDES, expr: { adventurer: 'proud', mom: 'smile' }, focus: 'adventurer', emote: ['adventurer', 'sparkle'] },
    { text: '', hideButton: true, show: SIDES, expr: { adventurer: 'tender', mom: 'moved' }, focus: null, emote: ['mom', 'hearts'] },
  ]);

  // ---------- confeti suave (solo Oro, Baya y Ámbar) ----------
  function confetti() {
    if (reduced()) return;
    const box = $('.c6-confetti'); box.textContent = '';
    const cols = ['#F2C230', '#9C1F2B', '#E07B1A'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('span');
      p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 3]};--dx:${(Math.random() - .5) * 90}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * .9}s;animation-duration:${2.6 + Math.random() * 1.6}s;width:${8 + Math.random() * 6}px;height:${10 + Math.random() * 8}px`;
      box.appendChild(p);
    }
    later(() => { box.textContent = ''; }, 5200);
  }

  // ---------- finales ----------
  function showChoice() {
    setMode('choice'); refreshChoice(); setText(`<p>${LETTERS[3]}</p>`);
    container.classList.remove('c6-cg'); vn.say('', '');
    vn.apply({ cg: null, show: SIDES, expr: { adventurer: 'tender', mom: 'moved' }, focus: null, emote: ['mom', 'hearts'] });
  }
  function showThinking(fresh) {
    setMode('thinking');
    setText(`<p>La Autoridad Superior se toma su tiempo. Gracias por jugar esta aventura conmigo.</p><p class="thanks">${THANKS}</p>`);
    if (fresh) { api.audio.play('chime'); const r = stageRect(); api.fx.sparkle(r.width / 2, r.height * .55, 14); }
    // CG 2: los dos sentados a la mesa con la carne con piña, riendo. Línea final del aventurero, tierno.
    if (vn.has()) {
      container.classList.add('c6-cg');
      vn.apply({ hide: ['adventurer', 'mom'], cg: 'table' });
      vn.say('La Autoridad Superior se toma su tiempo. Gracias por jugar esta aventura conmigo.', 'Narrador');
      later(() => vn.say('Gracias por cada Navidad, mamá. ' + THANKS, 'Aventurero'), fresh ? 4200 : 600);
    }
    $('.c6-after [data-act="vale"]').hidden = true;
    $('.c6-after [data-act="change"]').hidden = false;
  }
  function showAccepted(fresh) {
    setMode('accepted');
    setText(`<p class="approved">Solicitud aprobada por la Autoridad Superior</p><p class="thanks">${THANKS}</p>`);
    const valeBtn = $('.c6-after [data-act="vale"]');
    valeBtn.hidden = vn.has();                     // con CG: el botón aparece tras ≥ 2,5 s de verlo
    if (vn.has()) later(() => { valeBtn.hidden = false; }, fresh ? 2600 : 600);
    $('.c6-after [data-act="change"]').hidden = true;
    // CG 1: el abrazo bajo la nieve frente a la casa cálida; luego el vale
    if (vn.has()) {
      container.classList.add('c6-cg');
      vn.apply({ hide: ['adventurer', 'mom'], cg: 'hug' });
      vn.say('Solicitud aprobada por la Autoridad Superior.', 'Narrador');
      later(() => vn.say(THANKS, 'Aventurero'), fresh ? 2600 : 0);
    }
    if (fresh) {
      api.audio.play('chime'); later(() => api.audio.play('coin'), 350);
      const r = stageRect(); api.fx.sparkle(r.width / 2, r.height * .5, 18); api.fx.vibrate(25);
      confetti();
    }
  }

  // ---------- carpeta de argumentos extra (un anexo por toque) ----------
  const bars = [14, 24, 36, 56, 78, 100].map((h, i) => `<span style="--h:${h}%;--i:${i}"></span>`).join('');
  const ANEXOS = [
    { t: 'Anexo A', h: 'Felicidad proyectada del futuro graduado', body: `<div class="c6-chart" aria-label="Gráfica de barras que sube sin parar">${bars}</div><small>Hoy → Graduación → Navidad → Siempre (datos 100 % fiables)</small>` },
    { t: 'Anexo B', h: 'Testimonio', body: `<div class="c6-chick">${CHICK}<p>Testimonio de Pollito: “pío”.</p></div>` },
  ];
  function showAnexo(i) {
    const a = ANEXOS[i];
    card.innerHTML = `<span class="c6-num">${a.t} · ${i + 1} de ${ANEXOS.length}</span><span class="c6-ttl">${a.h}</span><span class="c6-body">${a.body}</span><span class="c6-hint">${i < ANEXOS.length - 1 ? 'Toca para seguir' : 'Toca para cerrar la carpeta'}</span>`;
    card.hidden = false; card.classList.remove('out'); void card.offsetWidth; card.classList.add('in');
    api.audio.play(i === 0 ? 'pop' : 'tap');
    cardOk = false; later(() => { cardOk = true; }, 450);
  }
  function openFolder() { setMode('folder'); anexo = 0; vn.apply({ expr: { adventurer: 'nervous', mom: 'smile' }, emote: ['adventurer', 'sweat'] }); api.audio.play('pop'); later(() => showAnexo(0), reduced() ? 100 : 900); }
  card.addEventListener('click', () => {
    if (!cardOk) return;
    cardOk = false;
    if (anexo < ANEXOS.length - 1) { anexo += 1; showAnexo(anexo); return; }
    card.classList.remove('in'); card.classList.add('out'); later(() => { card.hidden = true; }, 250);
    visits += 1; api.audio.play('chime');
    later(showChoice, 350);                         // la carpeta se guarda y vuelve la elección
  });

  // ---------- vale ----------
  async function openCoupon() {
    try { await Promise.all([document.fonts.load(`400 40px 'Pirata One'`), document.fonts.load(`400 30px 'IM Fell English'`), document.fonts.load(`italic 400 30px 'IM Fell English'`)]); } catch (e) {}
    drawCoupon(canvas, api.getPandoras());
    coupon.hidden = false; coupon.classList.remove('in'); void coupon.offsetWidth; coupon.classList.add('in');
    api.audio.play('pop');
  }
  function saveCoupon() {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'vale-navideno.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
    api.audio.play('coin');
  }

  const onAct = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    switch (b.dataset.act) {
      case 'accept': saveEnding('accepted'); showAccepted(true); break;
      case 'more': openFolder(); break;
      case 'think': saveEnding('thinking'); showThinking(true); break;
      case 'vale': openCoupon(); break;
      case 'save': saveCoupon(); break;
      case 'close': coupon.hidden = true; break;
      case 'change': saveEnding(null); visits = 0; showChoice(); break;      // sin presión: se puede elegir de nuevo
    }
  };
  container.addEventListener('click', onAct); coupon.addEventListener('click', onAct);
  couponEl = coupon;

  api.onBeat((i, beat) => {
    clearTimers(); card.hidden = true; coupon.hidden = true; $('.c6-confetti').textContent = '';
    container.dataset.beat = String(i);
    container.classList.remove('c6-cg');
    if (i < 3) { setMode('letter'); setText(`<p>${LETTERS[i]}</p>`); vn.apply(beat); return; }
    vn.apply(beat);
    const end = loadEnding();                      // si ya se llegó a un final, se muestra de nuevo
    if (end === 'accepted') showAccepted(false);
    else if (end === 'thinking') showThinking(false);
    else showChoice();
  });
}

export function unmount() { clearTimers(); if (couponEl) { couponEl.remove(); couponEl = null; } }
