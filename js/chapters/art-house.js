// art-house.js — piezas de arte compartidas por los capítulos 1, 2 y 6 (A1 v2 "linograbado entintado").
// Todo es SVG plano: tinta #1B1420 (3 px formas, 1.5 px detalles), colores planos, sombras con trama a 45° (#hatch45), SIN degradados.
// La casa del capítulo 1 es LA MISMA del capítulo 6, pero cálida (ventanas amarillas, guirnaldas, nieve de círculos de papel).
// Evoca (casa torcida, colina en espiral, árboles retorcidos, verja de lanzas) sin copiar ningún personaje ni lugar.

export const INK = '#1B1420';
export const PAL1 = { c1: '#14101F', c2: '#3A2A52', c3: '#E8E2D0', c4: '#E07B1A', c5: '#9C1F2B' };

/** Camino en espiral (polilínea suave) alrededor de (cx,cy). */
export function spiralPath(cx, cy, r0, r1, turns, steps = 56, phase = 0) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = phase + t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d;
}

/** Trazo con contorno de tinta: línea gruesa de tinta debajo y color encima. */
const inked = (d, color, w = 5, extra = '') => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round" ${extra}/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/** Árbol pelado con ramas que terminan en espirales. (x,y) = base del tronco, h = altura, dir = 1|-1 lado hacia el que se curva. */
export function curlyTree(x, y, h, color, dir = 1) {
  const top = y - h;
  const trunk = `M${x - 9 * dir} ${y} C${x - 4 * dir} ${y - h * .4} ${x + 8 * dir} ${y - h * .6} ${x + 2 * dir} ${top}`;
  const br = (ox, oy, dx, dy, r) => {                    // rama que sale del tronco y acaba en espiral
    const sx = x + ox * dir, sy = y - oy, ex = sx + dx * dir, ey = sy - dy;
    const curl = spiralPath(ex, ey - r * .2, r, 1.5, 1.8, 26, dir > 0 ? 3.9 : -0.8);
    return inked(`M${sx} ${sy} Q${(sx + ex) / 2} ${sy - dy * .9} ${ex} ${ey}`, color, 4) + inked(curl, color, 3);
  };
  return inked(trunk, color, 11) + br(2, h * .55, 46, 28, 9) + br(0, h * .4, -40, 22, 8) + br(4, h * .8, 34, 26, 8) + br(2, h * .95, -26, 18, 6)
    + inked(spiralPath(x + 2 * dir, top - 8, 7, 1.5, 1.8, 24, 1), color, 3);
}

/** Verja de hierro con lanzas. x0..x1 en el suelo y (base). */
export function fence(x0, x1, y, h = 52) {
  let s = `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">`;
  s += `<rect x="${x0}" y="${y - h * .78}" width="${x1 - x0}" height="5" fill="${INK}"/><rect x="${x0}" y="${y - h * .3}" width="${x1 - x0}" height="5" fill="${INK}"/>`;
  for (let x = x0 + 4; x < x1; x += 15) {
    s += `<rect x="${x}" y="${y - h}" width="6" height="${h}" fill="#3A2A52"/><path d="M${x - 3} ${y - h + 4} L${x + 3} ${y - h - 13} L${x + 9} ${y - h + 4}Z" fill="#E8E2D0"/>`;
  }
  s += '</g>';
  return s;
}

/** Farol colgado de un gancho de hierro con voluta. (x,y) = punta del brazo. `warm` cambia el color del cristal. */
export function lantern(x, y, rot, glass = '#E07B1A', cls = '') {
  const arm = `M${x < 180 ? x - 38 : x + 38} ${y} L${x} ${y}`;
  const curl = spiralPath(x, y + 7, 7, 2, 1.7, 22, -1.6);
  return `<g class="lantern ${cls}">
    ${inked(arm, '#3A2A52', 4)}${inked(curl, '#3A2A52', 3)}
    <g transform="rotate(${rot} ${x} ${y + 12})">
      <path d="M${x} ${y + 12}V${y + 22}" stroke="${INK}" stroke-width="2.5"/>
      <g class="glow" stroke="${glass}" stroke-width="2.5" stroke-linecap="round"><path d="M${x - 24} ${y + 46}l-9 0M${x + 24} ${y + 46}l9 0M${x - 20} ${y + 32}l-7 -6M${x + 20} ${y + 32}l7 -6M${x - 20} ${y + 60}l-7 6M${x + 20} ${y + 60}l7 6"/></g>
      <path d="M${x - 14} ${y + 24}L${x} ${y + 15}L${x + 14} ${y + 24}Z" fill="#14101F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M${x - 15} ${y + 23}Q${x} ${y + 14} ${x + 15} ${y + 23}" fill="none" stroke="#E8E2D0" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="${x - 13}" y="${y + 24}" width="26" height="40" rx="3" fill="${glass}" stroke="${INK}" stroke-width="3"/>
      <path d="M${x} ${y + 24}V${y + 64}" stroke="${INK}" stroke-width="1.5"/>
      <path class="flame" d="M${x} ${y + 36}c-6 6 -6 13 0 19c6 -6 6 -13 0 -19z" fill="#E8E2D0" stroke="${INK}" stroke-width="1.5"/>
      <rect x="${x - 15}" y="${y + 64}" width="30" height="6" rx="2" fill="#14101F" stroke="${INK}" stroke-width="3"/>
    </g></g>`;
}

/** Nieve como círculos de papel apilados (contorno de tinta + sombra con trama). */
export function snowCircles(y, color, seed = 1, w = 360, size = 1) {
  let s = '', r = seed * 17;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let x = -20; x < w + 30; x += (44 + rnd() * 20) * size) {
    const rad = (34 + rnd() * 26) * size, cy = y + rnd() * 10;
    s += `<circle cx="${x.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="${color}" stroke="${INK}" stroke-width="3"/>`
      + `<path d="M${(x - rad * .8).toFixed(0)} ${(cy + rad * .55).toFixed(0)} A${rad.toFixed(0)} ${rad.toFixed(0)} 0 0 0 ${(x + rad * .75).toFixed(0)} ${(cy + rad * .6).toFixed(0)} L${(x + rad * .5).toFixed(0)} ${(cy + rad * .95).toFixed(0)} L${(x - rad * .5).toFixed(0)} ${(cy + rad * .95).toFixed(0)}Z" fill="url(#hatch45Light)" stroke="none"/>`;
  }
  return s;
}

/** Colina en espiral con un camino que sube girando. base=(x, y) del pie, ancho w, altura h. */
export function spiralHill(x, y, w, h, fill = '#3A2A52') {
  const cx = x + w / 2;
  let road = '';
  for (let i = 0; i <= 60; i++) {
    const t = i / 60, a = t * 2.4 * Math.PI * 2, R = (w / 2) * (1 - t * .96);
    road += `${i ? 'L' : 'M'}${(cx + R * Math.cos(a)).toFixed(1)} ${(y - h * t + R * .16 * Math.sin(a)).toFixed(1)} `;
  }
  return `<path d="M${x} ${y}C${x + w * .16} ${y - h * .2} ${cx - w * .12} ${y - h * .7} ${cx} ${y - h}C${cx + w * .12} ${y - h * .7} ${x + w * .84} ${y - h * .2} ${x + w} ${y}Z" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M${cx} ${y - h}C${cx + w * .12} ${y - h * .7} ${x + w * .84} ${y - h * .2} ${x + w} ${y}L${x + w * .66} ${y}C${cx + w * .1} ${y - h * .4} ${cx + w * .05} ${y - h * .7} ${cx} ${y - h}Z" fill="url(#hatch45)" stroke="none"/>`
    + inked(road, '#E8E2D0', 3.5);
}

/**
 * La casa alta y torcida (misma en cap. 1 y 6). Coordenadas base 360x640; la puerta queda en x 158..214, y 276..440.
 * pal: {wall, roof, win, snow, smoke, stripeA, stripeB}. lights: guirnalda de bombillas bajo el alero (cap. 6).
 */
export function house(pal, { lights = false, bulbs = ['#F2C230', '#9C1F2B', '#E8E2D0', '#E07B1A'] } = {}) {
  const s = [];
  // sombra proyectada (segundo plano desplazado 4 px con trama)
  s.push(`<path d="M96 444 L102 174 L272 154 L280 444Z" transform="translate(5 4)" fill="url(#hatch45)" stroke="none"/>`);
  // cuerpo: alto y ladeado
  s.push(`<path d="M92 440 L98 170 L268 150 L276 440Z" fill="${pal.wall}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  s.push(`<path d="M104 436 L108 182M126 436 L128 178M148 436 L148 175M222 436 L222 160M244 436 L246 157M262 436 L266 154" stroke="${INK}" stroke-width="1.5" opacity=".75"/>`);   // tablones
  s.push(`<path d="M244 154 L268 150 L276 440 L248 440Z" fill="url(#hatch45Light)" stroke="none"/>`);
  // tejado inclinado 6°
  s.push(`<g transform="rotate(6 186 160)">
    <path d="M60 176 L182 28 L316 170Z" fill="${pal.roof}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M182 28 L316 170 L286 172 L190 70Z" fill="url(#hatch45)" stroke="none"/>
    <path d="M60 176 Q120 186 182 176 T316 170" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M62 174 Q74 192 88 176 Q100 194 114 178 Q128 196 142 178 Q156 196 170 178 Q184 196 200 178 Q214 194 230 176 Q246 194 262 174 Q276 190 290 172 Q302 186 314 170" fill="${pal.snow}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M110 150 Q146 82 182 28 Q194 52 206 76" fill="none" stroke="${pal.snow}" stroke-width="5" stroke-linecap="round" stroke-dasharray="26 9"/>
  </g>`);
  // chimenea torcida a rayas
  s.push(`<g transform="rotate(-9 262 112)">
    <rect x="248" y="60" width="30" height="76" fill="${pal.stripeA}" stroke="${INK}" stroke-width="3"/>
    <path d="M248 78H278M248 100H278M248 122H278" stroke="${INK}" stroke-width="9" opacity=".95"/><path d="M248 78H278M248 100H278M248 122H278" stroke="${pal.stripeB}" stroke-width="1" opacity="0"/>
    <rect x="244" y="52" width="38" height="12" fill="${pal.snow}" stroke="${INK}" stroke-width="3"/>
  </g>`);
  // humo en espiral
  s.push(`<g class="smoke">${inked(spiralPath(272, 34, 3, 17, 2.4, 50, 2.2), pal.smoke, 4)}</g>`);
  // ventanas altas con punta, ático ojo
  const win = (x, y, w, h) => `<path d="M${x} ${y + h}V${y + w / 2}Q${x} ${y} ${x + w / 2} ${y - 6}Q${x + w} ${y} ${x + w} ${y + w / 2}V${y + h}Z" fill="${pal.win}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${x + w / 2} ${y - 4}V${y + h}M${x} ${y + h * .45}H${x + w}" stroke="${INK}" stroke-width="2"/><path d="M${x - 4} ${y + h + 4}H${x + w + 4}" stroke="${pal.snow}" stroke-width="5" stroke-linecap="round"/>`;
  s.push(`<g class="windows">${win(116, 232, 28, 56)}${win(228, 214, 28, 56)}${win(116, 330, 24, 44)}${win(232, 316, 24, 44)}</g>`);
  s.push(`<g class="windows"><circle cx="186" cy="118" r="16" fill="${pal.win}" stroke="${INK}" stroke-width="3"/><path d="M170 118H202M186 102V134" stroke="${INK}" stroke-width="2"/></g>`);
  // marco de la puerta (arco de piedra de papel) + escalones
  s.push(`<path d="M148 440 V292 Q148 260 186 258 Q224 260 224 292 V440Z" fill="${pal.snow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  s.push(`<path d="M148 292 Q148 260 186 258 Q224 260 224 292 L214 292 Q212 270 186 268 Q160 270 158 292Z" fill="url(#hatch45Light)" stroke="none"/>`);
  s.push(`<path d="M136 440 H236 V452 H136Z M126 452 H246 V464 H126Z" fill="${pal.snow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  if (lights) {                                  // guirnalda cálida bajo el alero (cap. 6)
    s.push(`<path d="M86 182 Q140 214 190 190 T286 178" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
    [[100, 192], [128, 205], [160, 207], [192, 196], [224, 186], [258, 184]].forEach(([x, y], i) => s.push(`<g class="bulb" style="--i:${i}"><circle cx="${x}" cy="${y + 4}" r="5" fill="${bulbs[i % bulbs.length]}" stroke="${INK}" stroke-width="2"/></g>`));
  }
  return s.join('');
}

/** Corona de espinas (huesos de papel con púas) centrada en (cx,cy). */
function thorns(cx, cy, r, pal) {
  let s = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), tx = cx + (r + 8) * Math.cos(a + .18), ty = cy + (r + 8) * Math.sin(a + .18);
    const bx = cx + (r - 1) * Math.cos(a + .36), by = cy + (r - 1) * Math.sin(a + .36);
    s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}Z" fill="${pal.c3}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  return s;
}
/** Contenido de la hoja de la puerta (viewBox 0 0 60 170): tablones, corona de espinas con lazo rojo y aldaba. */
export function leafInner(pal) {
  return `<path d="M1 169 V52 Q1 6 30 3 Q59 6 59 52 V169Z" fill="${pal.c1}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M20 8 V169M40 8 V169" stroke="${pal.c3}" stroke-width="1.5" opacity=".45"/>
  <path d="M42 150 H59 V169 H42Z" fill="url(#hatch45)" stroke="none" opacity=".6"/>
  <g>${thorns(30, 50, 15, pal)}<circle cx="30" cy="50" r="15" fill="none" stroke="${INK}" stroke-width="6.5"/><circle cx="30" cy="50" r="15" fill="none" stroke="${pal.c3}" stroke-width="3.5" stroke-dasharray="9 2.5"/></g>
  <g stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><path d="M30 66 L16 58 Q12 68 18 74 Z" fill="${pal.c5}"/><path d="M30 66 L44 58 Q48 68 42 74 Z" fill="${pal.c5}"/><path d="M28 68 L22 90 L30 84 L36 92 L33 68Z" fill="${pal.c5}"/><circle cx="30" cy="66" r="4.5" fill="${pal.c5}"/></g>
  <circle cx="30" cy="112" r="6.5" fill="${pal.c3}" stroke="${INK}" stroke-width="2.5"/><circle cx="30" cy="124" r="9" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="30" cy="124" r="9" fill="none" stroke="${pal.c3}" stroke-width="3"/>
  <path d="M6 150 H54" stroke="${INK}" stroke-width="1.5" opacity=".6"/>`;
}
