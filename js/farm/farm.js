// farm.js — arte SVG original de la Granja de Mamá: rincón de granja ISOMÉTRICO (2:1), cálido y mullido,
// con volumen suave (degradados permitidos en este capítulo), contornos finos y suaves (#3A2A1A al 60 %),
// hierba saturada, camino de tierra terracota, vallas blancas con nieve, árboles redondos, pinos y luces de Navidad.
// Evoca el género de granjas móviles; nada copiado de ningún juego ni referencia concreta.
// Exporta: ART, buildScene(), setBackground(), puff() (partículas), defaultState()/nextStep() (máquina de pasos).

// ---------- Máquina de pasos ----------
// Estado persistente: { veg:[0|1,0|1,0|1], fed, egg(0 no|1 listo|2 recogido), cooked, plated, loaded, done }
export const defaultState = () => ({ veg: [0, 0, 0], fed: 0, egg: 0, cooked: 0, plated: 0, loaded: 0, done: 0 });
/** Devuelve el objetivo actual: 'veg' | 'hen' | 'egg' | 'wok' | 'plate' | 'sleigh' | 'deliver' | 'wait' | 'done'. */
export function nextStep(s) {
  if (s.done) return 'done';
  if (s.veg.some((v) => !v)) return 'veg';
  if (!s.fed) return 'hen';
  if (s.egg === 0) return 'wait';      // la gallina está poniendo (1,5 s)
  if (s.egg === 1) return 'egg';
  if (!s.cooked) return 'wok';
  if (!s.plated) return 'plate';
  if (!s.loaded) return 'sleigh';
  return 'deliver';
}

// ---------- Utilidades de dibujo ----------
const O = 'stroke="#3A2A1A" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"'; // contorno fino y suave
const NS = 'stroke="none"';
const WHITE = '#FFFFFF', CREAM = '#F4EEDC', RED = '#D9472B', REDD = '#B63420', YEL = '#F2C230', GREEN = '#6BAF2E', WOOD = '#B97F44', STONE = '#B9B2A3';
const pts = (a) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const poly = (a, fill, extra = O) => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
const shade = (a) => `<polygon points="${pts(a)}" fill="url(#hdV)" ${NS}/>`; // volumen suave: luz arriba, sombra abajo
const dark = (a, o = 0.14) => `<polygon points="${pts(a)}" fill="#1B2A10" opacity="${o}" ${NS}/>`;
const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];
const up = (p, d) => [p[0], p[1] - d];
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const shadowEllipse = (cx, cy, rx, ry, o = 0.28) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1B3A10" opacity="${o}" ${NS}/>`;
const spec = (cx, cy, rx, ry, rot = -30, o = 0.55) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" ${NS} transform="rotate(${rot} ${cx} ${cy})"/>`;

/**
 * Caja/casa isométrica 2:1 (cx,cy = centro de la huella en el suelo). Ejes: a = (2u,u) a la derecha-abajo, b = (-2u,u) a la izquierda-abajo.
 * r > 0 añade tejado a dos aguas (cumbrera paralela a a). Devuelve { svg, P } con los puntos calculados para decorar.
 */
function isoHouse({ cx, cy, wa, wb, h, r = 0, u = 10, wall = RED, roof = REDD, top = '#D6CDB8', trim = WHITE, snow = true }) {
  const A = [2 * u * wa, u * wa], B = [-2 * u * wb, u * wb], C = [cx, cy];
  const front = add(add(C, A, 0.5), B, 0.5), back = add(add(C, A, -0.5), B, -0.5);
  const right = add(add(C, A, 0.5), B, -0.5), left = add(add(C, A, -0.5), B, 0.5);
  const fT = up(front, h), rT = up(right, h), bT = up(back, h), lT = up(left, h);
  const rs = up(mid(bT, lT), r), re = up(mid(rT, fT), r);
  const leftFace = [left, front, fT, lT], rightFace = [front, right, rT, fT];
  let s = shadowEllipse(cx + u * 1.2, cy + u * 0.9, u * (wa + wb) * 1.2, u * (wa + wb) * 0.62, 0.26);
  s += poly(leftFace, wall) + dark(leftFace, 0.16) + shade(leftFace);
  s += poly(rightFace, wall) + shade(rightFace);
  if (r > 0) {
    const gable = [fT, rT, re];
    s += poly(gable, wall) + shade(gable);
    const slope = [lT, fT, re, rs];
    s += poly(slope, roof) + dark(slope, 0.1) + shade(slope);
    // ribete blanco del tejado
    s += `<polyline points="${pts([lT, fT, re, rT])}" fill="none" stroke="${trim}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    s += `<polyline points="${pts([lT, fT, re, rT])}" fill="none" ${O} stroke-width="1" stroke-opacity=".35" transform="translate(0 1.6)"/>`;
    if (snow) { // nieve ligera sobre la cumbrera
      const k = 0.2, sn = [rs, re, lerp(re, fT, k), lerp(rs, lT, k)];
      s += `<polygon points="${pts(sn)}" fill="#fff" stroke="#9DB6C8" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round"/>`;
      for (let i = 1; i < 4; i++) { const p = lerp(lerp(rs, lT, k), lerp(re, fT, k), i / 4); s += `<circle cx="${p[0]}" cy="${p[1] + 1.5}" r="2.6" fill="#fff" ${NS}/>`; }
    }
  } else {
    const t = [fT, rT, bT, lT];
    s += poly(t, top) + `<polygon points="${pts(t)}" fill="#fff" opacity=".22" ${NS}/>`;
  }
  return { svg: s, P: { front, back, right, left, fT, rT, bT, lT, rs, re, A, B, u } };
}
// Bombillas de luces navideñas a lo largo de una línea
function lightString(p, q, n, cols = ['#FFD84D', '#FF5A4A', '#FFF3B0', '#7FE0A0']) {
  let s = `<polyline points="${pts([p, mid(p, q).map((v, i) => v + (i ? 4 : 0)), q])}" fill="none" stroke="#2A4A22" stroke-width="1.4"/>`;
  for (let i = 0; i <= n; i++) {
    const t = i / n, b = lerp(p, q, t), y = b[1] + Math.sin(t * Math.PI) * 4 + 2;
    s += `<g class="c4-bulb"><circle cx="${b[0]}" cy="${y}" r="5" fill="${cols[i % cols.length]}" opacity=".35" ${NS}/><circle cx="${b[0]}" cy="${y}" r="2.6" fill="${cols[i % cols.length]}" ${O} stroke-width="1"/></g>`;
  }
  return s;
}

// ---------- Verduras (3/4, sin frutas) ----------
const cabbage = `<svg viewBox="0 0 80 80" aria-hidden="true">
  ${shadowEllipse(42, 72, 28, 7, 0.3)}
  <circle cx="40" cy="44" r="30" fill="#6CC24A" ${O}/>
  <path d="M14 44 Q14 18 40 16 Q66 18 66 44 Q54 34 40 36 Q26 34 14 44Z" fill="#8FDC63" ${NS}/>
  <circle cx="40" cy="46" r="20" fill="#B5EC84" ${O}/>
  <path d="M40 28 V66 M29 33 Q23 48 31 62 M51 33 Q57 48 49 62" fill="none" stroke="#4FA83A" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="40" cy="44" r="30" fill="url(#hdV)" ${NS}/>${spec(30, 32, 9, 5)}</svg>`;
const carrot = `<svg viewBox="0 0 80 80" aria-hidden="true">
  ${shadowEllipse(41, 74, 20, 5, 0.3)}
  <path d="M40 30 Q28 16 22 4 M40 30 Q40 14 40 0 M40 30 Q52 16 60 5" fill="none" stroke="#4FA83A" stroke-width="7" stroke-linecap="round"/>
  <path d="M40 30 Q28 16 22 4 M40 30 Q40 14 40 0 M40 30 Q52 16 60 5" fill="none" stroke="#7BD04F" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M20 32 Q40 22 60 32 Q56 58 41 78 Q40 79 39 78 Q24 58 20 32Z" fill="#F08A24" ${O}/>
  <path d="M27 42 H37 M43 52 H54 M30 58 H38" fill="none" stroke="#B85F12" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  <path d="M20 32 Q40 22 60 32 Q56 58 41 78 Q40 79 39 78 Q24 58 20 32Z" fill="url(#hdV)" ${NS}/>${spec(32, 38, 4, 9, 10)}</svg>`;
const onion = `<svg viewBox="0 0 80 80" aria-hidden="true">
  ${shadowEllipse(42, 74, 26, 6, 0.3)}
  <path d="M22 66 Q18 36 12 8 M32 66 Q30 34 28 2 M42 66 Q42 32 44 4 M52 66 Q54 36 60 10 M62 66 Q66 42 72 20" fill="none" stroke="#4FA83A" stroke-width="8" stroke-linecap="round"/>
  <path d="M22 66 Q18 36 12 8 M32 66 Q30 34 28 2 M42 66 Q42 32 44 4 M52 66 Q54 36 60 10 M62 66 Q66 42 72 20" fill="none" stroke="#86DC5A" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M14 50 H70 V68 Q42 80 14 68Z" fill="${CREAM}" ${O}/>
  <path d="M26 54 V72 M38 54 V76 M50 54 V76 M60 54 V72" fill="none" stroke="#C9BFA5" stroke-width="1.4"/>
  <rect x="12" y="46" width="60" height="8" rx="4" fill="#6CC24A" ${O}/>${spec(24, 60, 5, 3, 0, 0.5)}</svg>`;

// ---------- Huevo, plato, gallina, pollito ----------
const egg = `<svg viewBox="0 0 60 70" aria-hidden="true">
  ${shadowEllipse(30, 64, 24, 6, 0.28)}
  <path d="M5 58 Q30 72 55 58 L50 48 Q30 56 10 48Z" fill="#E8B64A" ${O}/>
  <path d="M30 4 C48 4 54 34 51 46 C48 59 38 63 30 63 C22 63 12 59 9 46 C6 34 12 4 30 4Z" fill="#FFF8EA" ${O}/>
  <path d="M30 4 C48 4 54 34 51 46 C48 59 38 63 30 63 C22 63 12 59 9 46 C6 34 12 4 30 4Z" fill="url(#hdV)" ${NS}/>${spec(21, 22, 4, 9, 14, 0.7)}</svg>`;
const plate = `<svg viewBox="0 0 90 70" aria-hidden="true">
  ${shadowEllipse(48, 58, 40, 9, 0.28)}
  <ellipse cx="45" cy="50" rx="42" ry="15" fill="#FFFFFF" ${O}/>
  <ellipse cx="45" cy="48" rx="30" ry="9" fill="#EEE8D8" ${NS}/>
  <path d="M13 46 Q22 16 45 14 Q68 16 77 46 Q60 58 45 56 Q30 58 13 46Z" fill="#F6C844" ${O}/>
  <path d="M13 46 Q22 16 45 14 Q68 16 77 46 Q60 58 45 56 Q30 58 13 46Z" fill="url(#hdV)" ${NS}/>
  <path d="M20 42 Q34 26 48 34 Q60 22 70 40 M24 50 Q40 38 52 48 M30 30 Q42 22 56 28" fill="none" stroke="#C98C1A" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <circle cx="34" cy="31" r="4.4" fill="#6CC24A" ${O}/><circle cx="58" cy="32" r="4" fill="#E8503A" ${O}/><circle cx="46" cy="24" r="3.6" fill="#6CC24A" ${O}/>
  <path d="M52 10 L64 40 M58 8 L72 36" fill="none" stroke="#7A4A21" stroke-width="3.6" stroke-linecap="round"/>${spec(32, 24, 8, 3, -20, 0.5)}</svg>`;
const hen = `<svg viewBox="0 0 100 100" aria-hidden="true">
  ${shadowEllipse(52, 94, 36, 7, 0.3)}
  <path d="M76 50 Q98 38 94 16 Q84 34 70 40Z" fill="#E8503A" ${O}/><path d="M76 58 Q100 54 98 34 Q86 50 72 50Z" fill="#F2C230" ${O}/>
  <path d="M50 90 Q12 88 14 58 Q18 30 52 30 Q86 32 86 60 Q86 88 50 90Z" fill="#FFFAF0" ${O}/>
  <path d="M50 90 Q12 88 14 58 Q18 30 52 30 Q86 32 86 60 Q86 88 50 90Z" fill="url(#hdV)" ${NS}/>
  <path d="M44 62 Q58 46 78 60 Q72 80 54 80 Q42 76 44 62Z" fill="#F1E3C4" ${O}/>
  <circle cx="30" cy="40" r="19" fill="#FFFAF0" ${O}/><circle cx="30" cy="40" r="19" fill="url(#hdV)" ${NS}/>
  <path d="M20 24 Q20 10 28 20 Q31 6 37 20 Q43 12 41 26Z" fill="#E8503A" ${O}/>
  <path d="M11 40 L0 45 L12 50Z" fill="#F2A93B" ${O}/><path d="M17 50 Q14 62 21 62 Q24 54 22 50Z" fill="#E8503A" ${O}/>
  <circle cx="26" cy="38" r="3.4" fill="#2A1B12"/><circle cx="25" cy="37" r="1.1" fill="#fff"/>${spec(34, 32, 6, 3, -30, 0.5)}
  <path d="M40 90 V97 M32 97 H48 M60 90 V97 M52 97 H68" fill="none" stroke="#F2A93B" stroke-width="3.4" stroke-linecap="round"/></svg>`;
const chick = `<svg viewBox="0 0 50 50" aria-hidden="true">
  ${shadowEllipse(26, 47, 16, 3.5, 0.3)}
  <ellipse cx="25" cy="30" rx="19" ry="16" fill="#FFD84A" ${O}/><ellipse cx="25" cy="30" rx="19" ry="16" fill="url(#hdV)" ${NS}/>
  <path d="M25 14 Q22 7 27 6 M29 14 Q31 7 35 9" fill="none" stroke="#E8B21E" stroke-width="2" stroke-linecap="round"/>
  <path d="M5 30 Q10 20 15 30 Q10 37 5 30Z" fill="#F2C230" ${O}/>
  <path d="M38 24 L47 27 L38 30Z" fill="#F2803A" ${O}/>
  <circle cx="32" cy="23" r="3" fill="#2A1B12"/><circle cx="33" cy="22" r=".9" fill="#fff"/>${spec(20, 22, 5, 3, -30, 0.6)}
  <path d="M20 45 V49 M15 49 H25 M31 45 V49 M26 49 H36" fill="none" stroke="#F2803A" stroke-width="2.2" stroke-linecap="round"/></svg>`;

// ---------- Parcela de cultivo: campo arado en rombo isométrico con surcos ----------
const soil = (() => {
  const T = [48, 11], R = [94, 34], Bm = [48, 57], L = [2, 34], th = 7;
  const top = [T, R, Bm, L];
  let s = shadowEllipse(52, 58, 44, 9, 0.25);
  s += poly([L, Bm, up(Bm, -th), up(L, -th)], '#6E4120') + poly([Bm, R, up(R, -th), up(Bm, -th)], '#85522A');
  s += poly(top, '#A8662F');
  s += `<polygon points="${pts(top)}" fill="url(#hdV)" ${NS}/>`;
  for (let i = 1; i <= 5; i++) { // surcos paralelos al eje a
    const t = i / 6, p = [L[0] + (T[0] - L[0]) * t, L[1] + (T[1] - L[1]) * t], q = [Bm[0] + (R[0] - Bm[0]) * t, Bm[1] + (R[1] - Bm[1]) * t];
    s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#6A3D1B" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
    s += `<line x1="${p[0]}" y1="${p[1] - 2.4}" x2="${q[0]}" y2="${q[1] - 2.4}" stroke="#C98A4C" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
  }
  s += `<polygon points="${pts(top)}" fill="none" ${O}/>`;
  return `<svg viewBox="0 0 96 66" aria-hidden="true">${s}</svg>`;
})();

// ---------- Wok sobre una estufita de piedra al aire libre ----------
const wok = (() => {
  const h = isoHouse({ cx: 52, cy: 76, wa: 2, wb: 1.4, h: 22, u: 9, wall: STONE, top: '#CFC8B8' });
  const { P } = h;
  const door = [lerp(P.front, P.right, 0.25), lerp(P.front, P.right, 0.75)];
  const dh = 15;
  const open = [door[0], door[1], up(door[1], dh), up(door[0], dh)];
  const cxm = (door[0][0] + door[1][0]) / 2, cym = (door[0][1] + door[1][1]) / 2;
  let s = h.svg + poly(open, '#2A1C14');
  s += `<g class="c4-flames"><path d="M${cxm - 9} ${cym} Q${cxm - 12} ${cym - 8} ${cxm - 4} ${cym - 13} Q${cxm - 3} ${cym - 7} ${cxm} ${cym - 7} Q${cxm + 2} ${cym - 14} ${cxm + 7} ${cym - 12} Q${cxm + 12} ${cym - 6} ${cxm + 9} ${cym}Z" fill="#F2503A" ${O} stroke-width="1"/>
    <path d="M${cxm - 4} ${cym} Q${cxm - 5} ${cym - 5} ${cxm} ${cym - 8} Q${cxm + 5} ${cym - 5} ${cxm + 4} ${cym}Z" fill="#FFD84D"/></g>`;
  // wok encima de la estufa
  const tx = (P.fT[0] + P.bT[0]) / 2 + 6, ty = (P.fT[1] + P.rT[1]) / 2 - 4;
  s += `<ellipse cx="${tx}" cy="${ty + 3}" rx="30" ry="12" fill="#1B1D26" opacity=".35" ${NS}/>`;
  s += `<path d="M${tx - 30} ${ty - 6} Q${tx} ${ty + 34} ${tx + 30} ${ty - 6}Z" fill="#3A3F4D" ${O}/><path d="M${tx - 30} ${ty - 6} Q${tx} ${ty + 34} ${tx + 30} ${ty - 6}Z" fill="url(#hdV)" ${NS}/>`;
  s += `<ellipse cx="${tx}" cy="${ty - 6}" rx="30" ry="9" fill="#5A6074" ${O}/><ellipse cx="${tx}" cy="${ty - 5}" rx="24" ry="6" fill="#1F222C"/>`;
  s += `<path d="M${tx + 28} ${ty - 6} L${tx + 54} ${ty - 16}" stroke="#7A4A21" stroke-width="6" stroke-linecap="round"/><path d="M${tx + 28} ${ty - 6} L${tx + 54} ${ty - 16}" stroke="#B97F44" stroke-width="2.4" stroke-linecap="round"/>`;
  s += spec(tx - 14, ty + 8, 7, 2.6, 25, 0.35);
  return `<svg viewBox="0 0 110 100" aria-hidden="true">${s}</svg>`;
})();
const smell = `<svg viewBox="0 0 60 60" aria-hidden="true"><g fill="none" stroke="#E9C49A" stroke-width="3.6" stroke-linecap="round" stroke-opacity=".95">
  <path d="M12 56 Q4 44 14 34 Q22 24 12 12"/><path d="M30 56 Q22 44 32 34 Q40 24 30 8"/><path d="M48 56 Q40 44 50 34 Q58 24 48 14"/></g></svg>`;

// ---------- Trineo-camión de pedidos (caja isométrica roja con patines y carga) ----------
const sleigh = (() => {
  const h = isoHouse({ cx: 112, cy: 78, wa: 3.4, wb: 1.5, h: 22, u: 9, wall: RED, top: '#C03C26' });
  const { P } = h;
  let s = '';
  // patines de madera bajo la caja
  const rl = (p, q, y) => `<path d="M${p[0] - 8} ${p[1] + y} L${q[0] + 8} ${q[1] + y}" stroke="#6B4423" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M${p[0] - 8} ${p[1] + y} L${p[0] - 16} ${p[1] + y - 8}" stroke="#6B4423" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  s += rl(P.left, P.front, 8) + rl(P.front, P.right, 8);
  s += `<path d="M${P.right[0] + 6} ${P.right[1] + 8} Q${P.right[0] + 28} ${P.right[1] + 6} ${P.right[0] + 25} ${P.right[1] - 14}" stroke="#6B4423" stroke-width="5" fill="none" stroke-linecap="round"/>`; // patín con la punta curvada hacia arriba
  s += `<g class="c4-sleigh-art">` + h.svg;
  // franja dorada en la cara frontal-derecha e izquierda
  const stripe = (a, b) => poly([lerp(a, up(a, 22), 0.5), lerp(b, up(b, 22), 0.5), lerp(b, up(b, 22), 0.7), lerp(a, up(a, 22), 0.7)], YEL, 'stroke="none"');
  s += stripe(P.left, P.front) + stripe(P.front, P.right);
  s += `<polyline points="${pts([P.lT, P.fT, P.rT, P.bT, P.lT])}" fill="none" stroke="#F8D56A" stroke-width="2.6" stroke-linejoin="round"/>`;
  // proa curva de trineo y respaldo del asiento: que se lea como trineo y no como caja
  s += `<path d="M${P.right[0] - 4} ${P.right[1] - 14} Q${P.right[0] + 26} ${P.right[1] - 16} ${P.right[0] + 20} ${P.right[1] - 44} Q${P.right[0] + 8} ${P.right[1] - 30} ${P.right[0] - 14} ${P.right[1] - 30}Z" fill="#E8503A" ${O}/><path d="M${P.right[0] - 2} ${P.right[1] - 18} Q${P.right[0] + 20} ${P.right[1] - 20} ${P.right[0] + 17} ${P.right[1] - 38}" fill="none" stroke="#F8D56A" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M${P.back[0] - 6} ${P.back[1] - 20} q-4 -22 10 -30 q14 -2 20 12 l-6 16z" fill="#C03C26" ${O}/><circle cx="${P.right[0] + 18}" cy="${P.right[1] - 44}" r="4" fill="#FFE27A" ${O}/>`;
  s += `</g>`;
  // carga: caja de madera + saco
  const cg = isoHouse({ cx: 110, cy: 64, wa: 1.2, wb: 1, h: 14, u: 8, wall: WOOD, top: '#D9A769' });
  s += `<g class="c4-cargo">` + cg.svg + `<ellipse cx="146" cy="52" rx="13" ry="10" fill="#F6C844" ${O}/><path d="M138 46 Q146 40 156 50" fill="none" stroke="#C98C1A" stroke-width="1.6"/>` + spec(142, 47, 5, 3, -20, 0.5) + `</g>`;
  return `<svg viewBox="0 0 190 120" aria-hidden="true">${s}</svg>`;
})();

// ---------- Decoración: granero, gallinero, macetas con flores amarillas, cartel «Pollito» ----------
const barn = (() => {
  const h = isoHouse({ cx: 80, cy: 112, wa: 3, wb: 2, h: 44, r: 28, u: 11, wall: RED, roof: '#C8381F' });
  const { P } = h;
  let s = h.svg;
  // puerta en la cara derecha (hastial): marco blanco, tablones horizontales (sin X)
  const p = (t, y) => up(lerp(P.front, P.right, t), y);
  const door = [p(0.25, 0), p(0.75, 0), p(0.75, 28), p(0.25, 28)];
  s += poly(door, '#FFFFFF') + poly([p(0.3, 0), p(0.7, 0), p(0.7, 25), p(0.3, 25)], '#B8452E');
  for (let i = 1; i < 4; i++) s += `<line x1="${p(0.3, i * 6)[0]}" y1="${p(0.3, i * 6)[1]}" x2="${p(0.7, i * 6)[0]}" y2="${p(0.7, i * 6)[1]}" stroke="#8F2E1C" stroke-width="1.2"/>`;
  const wx = (P.fT[0] + P.rT[0]) / 2, wy = (P.fT[1] + P.rT[1]) / 2 - 12;
  s += `<ellipse cx="${wx}" cy="${wy}" rx="6.5" ry="7" fill="#FFFFFF" ${O}/><ellipse cx="${wx}" cy="${wy}" rx="4" ry="5" fill="#F2C230"/>`;
  // ventana de la pared larga
  const q = (t, y) => up(lerp(P.left, P.front, t), y);
  s += poly([q(0.2, 12), q(0.45, 12), q(0.45, 30), q(0.2, 30)], '#FFFFFF') + poly([q(0.24, 15), q(0.41, 15), q(0.41, 27), q(0.24, 27)], '#9ADCF7', 'stroke="none"');
  // luces navideñas en el alero y el hastial
  s += lightString(up(P.lT, -2), up(P.fT, -2), 7) + lightString(P.fT, P.rT, 5);
  return `<svg viewBox="0 0 160 150" aria-hidden="true">${s}</svg>`;
})();
const coop = (() => {
  const h = isoHouse({ cx: 60, cy: 74, wa: 2, wb: 1.6, h: 26, r: 18, u: 8, wall: '#D9A769', roof: '#C8381F' });
  const { P } = h;
  let s = h.svg;
  const p = (t, y) => up(lerp(P.front, P.right, t), y);
  s += poly([p(0.3, 0), p(0.7, 0), p(0.7, 16), p(0.3, 16)], '#8A5A2B');
  s += `<ellipse cx="${(p(0.5, 0)[0])}" cy="${p(0.5, 14)[1] - 2}" rx="4.4" ry="4.4" fill="#2A1C14"/>`;
  s += `<path d="M${p(0.5, 0)[0] - 4} ${p(0.5, 0)[1] + 2} L${p(0.5, 0)[0] - 18} ${p(0.5, 0)[1] + 12}" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 120 96" aria-hidden="true">${s}</svg>`;
})();
function flower(cx, cy, r = 8) {
  const petals = [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${cx}" cy="${cy - r * 0.8}" rx="${r * 0.52}" ry="${r * 0.8}" fill="#FFD84A" ${O} stroke-width="1" transform="rotate(${a} ${cx} ${cy})"/>`).join('');
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#D98A1E" ${O} stroke-width="1"/>`;
}
const pots = `<svg viewBox="0 0 120 80" aria-hidden="true">
  ${shadowEllipse(60, 78, 52, 5, 0.25)}
  <path d="M20 40 Q18 52 24 60 M58 32 V56 M98 38 Q100 52 94 60" fill="none" stroke="#4FA83A" stroke-width="3.4" stroke-linecap="round"/>
  ${flower(20, 32, 10)}${flower(58, 20, 12)}${flower(100, 30, 10)}
  <path d="M8 58 H36 L32 78 H12Z" fill="#D9663A" ${O}/><path d="M44 56 H74 L70 78 H48Z" fill="#D9663A" ${O}/><path d="M84 58 H112 L108 78 H88Z" fill="#D9663A" ${O}/>
  <path d="M8 58 H36 L32 78 H12Z M44 56 H74 L70 78 H48Z M84 58 H112 L108 78 H88Z" fill="url(#hdV)" ${NS}/>
  <path d="M6 58 H38 M42 56 H76 M82 58 H114" fill="none" stroke="#E98254" stroke-width="5" stroke-linecap="round"/></svg>`;
const sign = `<svg viewBox="0 0 86 70" aria-hidden="true">
  ${shadowEllipse(43, 66, 18, 3, 0.25)}
  <rect x="38" y="32" width="9" height="34" rx="2" fill="#8A5A2B" ${O}/>
  <rect x="4" y="5" width="78" height="30" rx="5" fill="#D9A769" ${O}/><rect x="4" y="5" width="78" height="30" rx="5" fill="url(#hdV)" ${NS}/>
  <path d="M10 13 H78 M10 28 H78" fill="none" stroke="#A9743C" stroke-width="1.2"/>
  <text x="43" y="27" text-anchor="middle" style="font:800 17px var(--font-ui, Nunito, sans-serif)" fill="#4A2D12" stroke="none">Pollito</text></svg>`;

// ---------- Fondo isométrico ----------
const tuft = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round"><path d="M0 0 Q-2 -7 -5 -9 M0 0 Q0 -9 1 -12 M0 0 Q3 -7 6 -8" stroke="#A5D84F" stroke-width="2.2"/><path d="M0 0 Q-2 -7 -5 -9 M0 0 Q3 -7 6 -8" stroke="#4F9A24" stroke-width=".8" opacity=".6"/></g>`;
function bush(x, y, r = 22, snow = false) { // árbol redondo y frondoso (racimo de esferas)
  const ball = (cx, cy, rr, c1 = '#7FCB3E', c2 = '#4E9A24') => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${c1}" ${O}/><circle cx="${cx}" cy="${cy}" r="${rr}" fill="url(#hdV)" ${NS}/>`;
  let s = shadowEllipse(x + 6, y + r * 0.5, r * 1.2, r * 0.45, 0.28) + `<rect x="${x - 3}" y="${y - r * 0.2}" width="6" height="${r * 0.7}" rx="2" fill="#7A4A21" ${O}/>`;
  s += ball(x - r * 0.55, y - r * 0.55, r * 0.8) + ball(x + r * 0.55, y - r * 0.5, r * 0.78) + ball(x, y - r * 1.05, r * 0.95);
  s += spec(x - r * 0.3, y - r * 1.35, r * 0.3, r * 0.17, -30, 0.45);
  if (snow) s += `<ellipse cx="${x}" cy="${y - r * 1.9}" rx="${r * 0.45}" ry="${r * 0.14}" fill="#fff" ${NS}/>`;
  return s;
}
function pine(x, y, s = 1, decorated = false) { // pino oscuro por capas redondeadas
  const tier = (cy, w, h, c) => `<path d="M${x - w} ${cy} Q${x} ${cy + 7} ${x + w} ${cy} L${x} ${cy - h}Z" fill="${c}" ${O}/><path d="M${x - w} ${cy} Q${x} ${cy + 7} ${x + w} ${cy} L${x} ${cy - h}Z" fill="url(#hdV)" ${NS}/>`;
  let o = shadowEllipse(x + 6, y + 3, 22 * s, 6 * s, 0.28) + `<rect x="${x - 3}" y="${y - 6}" width="6" height="10" fill="#7A4A21" ${O}/>`;
  o += tier(y - 4, 22 * s, 26 * s, '#2F7A3A') + tier(y - 24 * s, 18 * s, 24 * s, '#3A8E44') + tier(y - 42 * s, 13 * s, 22 * s, '#47A04F');
  if (decorated) {
    const cols = ['#FF5A4A', '#FFD84D', '#7FD0F5', '#fff'];
    [[-12, -10], [10, -14], [-6, -30], [8, -34], [0, -50], [-14, -20], [14, -24]].forEach(([dx, dy], i) => { o += `<g class="c4-bulb"><circle cx="${x + dx * s}" cy="${y + dy * s}" r="${3.2 * s}" fill="${cols[i % 4]}" ${O} stroke-width="1"/></g>`; });
    o += `<path d="M${x} ${y - 66 * s} l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1z" fill="#FFD84D" ${O}/>`;
    o += `<ellipse cx="${x}" cy="${y - 36 * s}" rx="${5 * s}" ry="${2 * s}" fill="#fff" opacity=".9" ${NS}/>`;
  }
  return o;
}
function fence(x, y, n, dir = 1) { // valla blanca con nieve; dir=1 eje a (→↓), dir=-1 eje b (←↓)
  const dx = 13 * dir, dy = 6.5;
  let s = `<polyline points="${x},${y - 10} ${x + dx * n},${y - 10 + dy * n}" fill="none" stroke="#E7E0D0" stroke-width="3" ${O.replace('stroke-width="1.5"', '')}/>` +
    `<polyline points="${x},${y - 18} ${x + dx * n},${y - 18 + dy * n}" fill="none" stroke="#F5F0E4" stroke-width="3"/>`;
  for (let i = 0; i <= n; i++) {
    const px = x + dx * i, py = y + dy * i;
    s += `<path d="M${px - 3} ${py} V${py - 22} L${px} ${py - 26} L${px + 3} ${py - 22} V${py}Z" fill="#FFFFFF" ${O}/><path d="M${px - 3.4} ${py - 22.5} Q${px} ${py - 30} ${px + 3.4} ${py - 22.5} Q${px} ${py - 21} ${px - 3.4} ${py - 22.5}Z" fill="#fff" stroke="#9DB6C8" stroke-opacity=".6" stroke-width=".8"/>`;
  }
  return s;
}
const crateProp = (x, y) => { const h = isoHouse({ cx: x, cy: y, wa: 1, wb: 1, h: 12, u: 7, wall: WOOD, top: '#D9A769' }); return h.svg; };
const barrelProp = (x, y) => `${shadowEllipse(x + 4, y + 2, 12, 4, 0.28)}<path d="M${x - 9} ${y - 18} Q${x - 12} ${y - 8} ${x - 9} ${y} Q${x} ${y + 5} ${x + 9} ${y} Q${x + 12} ${y - 8} ${x + 9} ${y - 18}Z" fill="#B97F44" ${O}/><ellipse cx="${x}" cy="${y - 18}" rx="9" ry="3.6" fill="#D9A769" ${O}/><path d="M${x - 10} ${y - 12} Q${x} ${y - 8} ${x + 10} ${y - 12} M${x - 10} ${y - 5} Q${x} ${y - 1} ${x + 10} ${y - 5}" fill="none" stroke="#5E4026" stroke-width="1.6"/>`;
const pond = (x, y, rx = 46, ry = 21) => `<ellipse cx="${x}" cy="${y + 3}" rx="${rx + 4}" ry="${ry + 3}" fill="#B9B2A3" ${O}/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#59C0EE" ${O}/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#hdV)" ${NS}/><ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.3}" rx="${rx * 0.4}" ry="${ry * 0.2}" fill="#fff" opacity=".4" ${NS}/><ellipse cx="${x + rx * 0.3}" cy="${y + ry * 0.2}" rx="${rx * 0.22}" ry="${ry * 0.1}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/><ellipse cx="${x + rx * 0.5}" cy="${y - ry * 0.1}" rx="7" ry="3" fill="#6CC24A" ${O}/>`;
function grassFill(W, H) { // césped saturado con motas y matas
  let s = '';
  for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = ((i * 53) % (H - 20)) + 12; s += `<ellipse cx="${x}" cy="${y}" rx="${44 + (i % 4) * 16}" ry="${12 + (i % 3) * 6}" fill="${i % 2 ? '#A5D84F' : '#5FA528'}" opacity=".18" ${NS}/>`; }
  return s;
}
function tufts(W, H, n, seed = 3) {
  let s = '';
  for (let i = 0; i < n; i++) { const x = (i * 131 + seed * 17) % W, y = ((i * 71 + seed * 29) % (H - 30)) + 20; s += tuft(x, y, 0.8 + (i % 3) * 0.25); if (i % 5 === 0) s += `<circle cx="${x + 9}" cy="${y - 3}" r="2.3" fill="#FFD84A" ${NS}/><circle cx="${x - 8}" cy="${y - 1}" r="1.9" fill="#fff" ${NS}/>`; }
  return s;
}
const bgDefs = `<defs>
  <linearGradient id="hdV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#14240A" stop-opacity=".26"/></linearGradient>
  <linearGradient id="hdGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AD64A"/><stop offset="1" stop-color="#6BAF2E"/></linearGradient>
  <linearGradient id="hdSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3F4"/><stop offset="1" stop-color="#CDEFFB"/></linearGradient>
</defs>`;
const dirtPath = (d, w) => `<path d="${d}" fill="none" stroke="#B9652F" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="${d}" fill="none" stroke="#C8763E" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#DE9358" stroke-width="${w * 0.45}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(0 -3)"/>`;

/** Fondo del paisaje para cada orientación (se dibuja en coordenadas del "mundo": 812×375 apaisado, 375×812 vertical). */
export function backgroundSVG(mode) {
  if (mode === 'land') {
    return `<svg class="c4-bgsvg" viewBox="0 0 812 375" width="812" height="375" aria-hidden="true">${bgDefs}
      <rect width="812" height="375" fill="url(#hdSky)"/>
      <ellipse cx="120" cy="64" rx="150" ry="36" fill="#6FBE3A" ${NS}/><ellipse cx="560" cy="56" rx="200" ry="30" fill="#7DCB43" ${NS}/><ellipse cx="760" cy="64" rx="120" ry="28" fill="#6FBE3A" ${NS}/>
      <rect y="50" width="812" height="325" fill="url(#hdGrass)"/>${grassFill(812, 375)}
      ${dirtPath('M-20 262 C150 236 300 276 450 258 S690 262 840 300', 30)}
      ${dirtPath('M110 160 C150 190 160 230 200 246', 16)}
      ${tufts(812, 375, 46)}
      ${pond(318, 82)}
      ${fence(262, 126, 9, 1)}${fence(520, 118, 6, 1)}
      ${pine(448, 112, 0.9)}${pine(478, 122, 0.8)}${pine(596, 120, 1.15, true)}
      ${bush(30, 176, 24, true)}${bush(62, 206, 18)}${bush(786, 224, 24, true)}${bush(766, 252, 17)}
      ${barrelProp(240, 280)}${crateProp(264, 294)}${barrelProp(124, 278)}
    </svg>`;
  }
  return `<svg class="c4-bgsvg" viewBox="0 0 375 812" width="375" height="812" aria-hidden="true">${bgDefs}
    <rect width="375" height="812" fill="url(#hdSky)"/>
    <ellipse cx="60" cy="226" rx="140" ry="34" fill="#6FBE3A" ${NS}/><ellipse cx="320" cy="222" rx="130" ry="30" fill="#7DCB43" ${NS}/>
    <rect y="238" width="375" height="574" fill="url(#hdGrass)"/>${grassFill(375, 812)}
    ${dirtPath('M-20 580 C100 560 230 600 395 570', 30)}
    ${dirtPath('M150 640 C200 700 260 730 400 740', 22)}
    ${tufts(375, 812, 70)}
    ${fence(236, 296, 9, 1)}${pine(350, 270, 1, true)}${pine(330, 290, 0.8)}
    ${bush(20, 262, 22, true)}${bush(350, 700, 24)}${bush(30, 720, 20)}
    ${barrelProp(160, 760)}${crateProp(186, 778)}
  </svg>`;
}
export function setBackground(wrap, mode) { wrap.innerHTML = backgroundSVG(mode); }

export const ART = {
  veg: { cabbage, carrot, onion }, egg, plate, hen, chick, wok, smell, soil, sleigh, barn, coop, pots, sign,
  // Iconos para volar a la tarjeta del pedido
  icons: { cabbage, carrot, onion, egg, plate },
  leaf: `<svg viewBox="0 0 20 20"><path d="M3 17 Q2 4 17 3 Q18 16 3 17Z" fill="#6CC24A" stroke="#3A2A1A" stroke-opacity=".6" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  heart: `<svg viewBox="0 0 24 22"><path d="M12 21 C-4 9 4 -2 12 6 C20 -2 28 9 12 21Z" fill="#E8503A" stroke="#3A2A1A" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  grain: `<svg viewBox="0 0 12 12"><ellipse cx="6" cy="6" rx="3" ry="4.6" fill="#F2C230" stroke="#3A2A1A" stroke-opacity=".6" stroke-width="1.2" transform="rotate(30 6 6)"/></svg>`,
  spark: `<svg viewBox="0 0 20 20"><path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6Z" fill="#FFD84A" stroke="#3A2A1A" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round"/></svg>`,
  // Dije Pandora: redondo, dorado, con cajita entreabierta (igual que el HUD)
  charm: `<svg viewBox="0 0 32 32"><circle cx="16" cy="17" r="12.5" fill="#E8C25A" stroke="#3A2A1A" stroke-opacity=".7" stroke-width="1.6"/><circle cx="16" cy="17" r="9.6" fill="none" stroke="#B88A2C" stroke-width=".9"/>
    <path d="M16 1.5a3.2 3.2 0 0 1 3.2 3.2v1.6h-6.4V4.7A3.2 3.2 0 0 1 16 1.5z" fill="none" stroke="#3A2A1A" stroke-opacity=".7" stroke-width="1.6"/>
    <rect x="10.5" y="17" width="11" height="6.6" rx="1" fill="none" stroke="#3A2A1A" stroke-opacity=".7" stroke-width="1.3"/></svg>`,
};

const VEG = [['cabbage', 'Repollo'], ['carrot', 'Zanahoria'], ['onion', 'Cebollín']];

/**
 * Construye toda la escena dentro de `root` y devuelve referencias a los elementos.
 * Estructura: .c4-world (tamaño de diseño según orientación, escalado por JS) con fondo, decoración y la capa
 * .c4-play (todo lo tocable, objetivos ≥ 64 px). La compuerta de giro (.c4-gate) queda aparte, sobre todo.
 */
export function buildScene(root) {
  root.innerHTML = `
    <div class="c4-world">
      <div class="c4-bgwrap"></div>
      <div class="c4-deco">
        <div class="c4-barn">${ART.barn}</div>
        <div class="c4-coop">${ART.coop}</div>
        <div class="c4-pots">${ART.pots}</div>
        <div class="c4-sign">${ART.sign}</div>
        <div class="c4-chick" data-x="0">${ART.chick}</div>
      </div>
      <div class="c4-play">
        ${VEG.map(([k, n], i) => `
          <button type="button" class="c4-t c4-plot c4-plot-${i}" data-t="veg" data-i="${i}" aria-label="${n}: cosechar">
            <span class="c4-soil">${ART.soil}</span><span class="c4-veg">${ART.veg[k]}</span></button>`).join('')}
        <button type="button" class="c4-t c4-hen" data-t="hen" aria-label="Gallina: darle de comer"><span class="c4-hen-art">${ART.hen}</span></button>
        <button type="button" class="c4-t c4-egg" data-t="egg" aria-label="Huevo: recoger" hidden><span class="c4-egg-art">${ART.egg}</span></button>
        <button type="button" class="c4-t c4-wok" data-t="wok" aria-label="Wok: cocinar chow mein">
          <span class="c4-wok-art">${ART.wok}</span>
          <span class="c4-steam"><i></i><i></i><i></i></span>
          <span class="c4-smell">${ART.smell}</span>
          <span class="c4-bar" hidden><b></b></span></button>
        <button type="button" class="c4-t c4-plate" data-t="plate" aria-label="Plato de chow mein: recoger" hidden><span class="c4-plate-art">${ART.plate}</span><span class="c4-steam sm"><i></i><i></i></span></button>
        <div class="c4-mom"><div class="chibi-shadow"></div><img class="chibi c4-mom-img" src="assets/chars/mom-apron-34.png" alt="Mamá con su delantal" draggable="false"></div>
        <button type="button" class="c4-t c4-sleigh" data-t="sleigh" aria-label="Trineo de pedidos: cargar el pedido">
          <span class="c4-sleigh-art">${ART.sleigh}</span><span class="c4-sleigh-lbl">Trineo de pedidos</span></button>
        <button type="button" class="btn c4-t c4-deliver" data-t="deliver" hidden>Entregar</button>
        <div class="c4-bubble" hidden><span></span></div>
      </div>
    </div>
    <div class="c4-gate" hidden>
      <div class="c4-gate-in">
        <svg class="c4-phone" viewBox="0 0 90 120" aria-hidden="true">
          <rect x="14" y="6" width="62" height="108" rx="12" fill="#2A2420" stroke="#3A2A1A" stroke-width="3"/>
          <rect x="21" y="18" width="48" height="84" rx="4" fill="#8DC63F"/><ellipse cx="45" cy="92" rx="20" ry="7" fill="#C8763E"/>
          <path d="M28 66 L45 50 L62 66 V84 H28Z" fill="#D9472B"/><path d="M22 68 L45 46 L68 68" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="45" cy="109" r="3" fill="#6B5A4A"/></svg>
        <p class="c4-gate-t">Gira tu teléfono para entrar a la granja 🔄</p>
        <button type="button" class="c4-gate-link">Prefiero seguir en vertical</button>
      </div>
    </div>`;
  const q = (s) => root.querySelector(s);
  return {
    world: q('.c4-world'), bgwrap: q('.c4-bgwrap'), gate: q('.c4-gate'), gateLink: q('.c4-gate-link'),
    deco: q('.c4-deco'), play: q('.c4-play'), chick: q('.c4-chick'), plots: [...root.querySelectorAll('.c4-plot')],
    hen: q('.c4-hen'), egg: q('.c4-egg'), wok: q('.c4-wok'), plate: q('.c4-plate'), mom: q('.c4-mom'), momB: q('.c4-mom-img'),
    sleigh: q('.c4-sleigh'), deliver: q('.c4-deliver'), bubble: q('.c4-bubble'), bar: q('.c4-bar'), barFill: q('.c4-bar b'),
    targets: [...root.querySelectorAll('.c4-t')],
  };
}

/**
 * Partícula suelta (hoja, corazón, grano, chispa, dije…) que sale de (x,y) relativo a `root`.
 * opts: {dx, dy, rot, dur, size, fall} — con movimiento reducido no se crea nada.
 */
export function puff(root, x, y, html, { dx = 0, dy = -50, rot = 90, dur = 800, size = 18, delay = 0, grav = 40, reduced = false } = {}) {
  if (reduced) return;
  const p = document.createElement('span');
  p.className = 'c4-puff'; p.innerHTML = html;
  p.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px`;
  root.appendChild(p);
  const a = p.animate([
    { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 0 },
    { transform: `translate(${dx * 0.6}px,${dy}px) rotate(${rot * 0.5}deg) scale(1)`, opacity: 1, offset: 0.35 },
    { transform: `translate(${dx}px,${dy + grav}px) rotate(${rot}deg) scale(.8)`, opacity: 0 },
  ], { duration: dur, delay, easing: 'ease-out', fill: 'both' });
  a.onfinish = () => p.remove();
  setTimeout(() => p.remove(), dur + delay + 300); // por si la animación se cancela
}
