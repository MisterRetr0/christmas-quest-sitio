// =====================================================================
// Christmas Quest · Personaje 02 — Mamá (v3: chibi cabezona, pocos detalles)
// Modelo procedural three.js. Pies en y = 0. H (alto de cabeza) = 1 → alto total ≈ 2.0.
// Mira hacia +Z (su derecha = -X; pulsera en la muñeca izquierda = +X).
//
//   buildMom({ expression: 'neutral'|'happy', detail: 'full'|'body', apron: false })
//
// v3: sin broche, botones ni pliegues (campana lisa); mechones laterales cortos.
// Se queda: vestido morado, cuello crema, cinta verde con lazo, pulsera de dijes, moño con lazo, delantal.
// =====================================================================
import * as THREE from 'three';
import { materials, buildFace, ellipsoid, limb, roundedBox, tube } from './shared.js';

/** Paleta del style bible §6. */
export const MOM_PALETTE = {
  skin: '#F5D6C0', hair: '#8A5A3C', hairHi: '#A8734F',
  dress: '#8E6BAE', cream: '#EFE3CC', ribbon: '#4E6B4F',
  shoes: '#5E3F6E', silver: '#D9D9DE', gold: '#E8C25A', berry: '#C23B33', pine: '#4E6B4F',
  apron: '#4E6B4F',
};
const P = MOM_PALETTE;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const deg = THREE.MathUtils.degToRad;

/** Cráneo de la mamá: 1.10 de ancho, algo más ovalado que el del hijo. */
export const HEAD_MOM = { rx: 0.55, ry: 0.48, rz: 0.5 };

const DIM = { total: 2.0, headCenterY: 1.44 };
const ZS = 0.88; // el vestido es algo más plano que ancho

// ---------------------------------------------------------------------
// Perfil de la campana lisa (radio, y). Cintura en y = 0.80.
// ---------------------------------------------------------------------
const PROFILE_CTRL = [
  [0.47, 0.2], [0.44, 0.3], [0.40, 0.44], [0.365, 0.58], [0.345, 0.7], [0.34, 0.8],
  [0.35, 0.9], [0.36, 0.97], [0.31, 1.03], [0.2, 1.06], [0.0, 1.075],
];
const PROFILE = new THREE.SplineCurve(PROFILE_CTRL.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(100);

function rAt(y) {
  for (let i = 1; i < PROFILE.length; i++) {
    if (PROFILE[i].y >= y) {
      const a = PROFILE[i - 1], b = PROFILE[i];
      return a.x + (b.x - a.x) * ((y - a.y) / Math.max(b.y - a.y, 1e-6));
    }
  }
  return PROFILE[PROFILE.length - 1].x;
}
const frontZ = (x, y) => ZS * Math.sqrt(Math.max(rAt(y) ** 2 - x * x, 0.002));

function lathe(points, mat, { segs = 56, phiStart = 0, phiLen = Math.PI * 2 } = {}) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(points, segs, phiStart, phiLen), mat);
  m.scale.z = ZS;
  return m;
}

// =====================================================================
export function buildMom({ expression = 'neutral', detail = 'full', apron = false } = {}) {
  const g = new THREE.Group();
  g.name = `Mom_${expression}_${detail}${apron ? '_apron' : ''}`;
  g.add(buildLegsAndShoes());
  g.add(buildDress());
  g.add(buildArms());
  if (apron) g.add(buildApron());
  g.add(buildHead({ expression }));
  g.traverse((o) => {
    if (o.isMesh) { o.castShadow = !o.material.transparent; o.receiveShadow = true; }
  });
  g.userData = { height: DIM.total, expression, detail, apron };
  return g;
}

function buildLegsAndShoes() {
  const g = new THREE.Group();
  g.name = 'Legs';
  const skin = materials.felt(P.skin);
  const shoe = materials.felt(P.shoes);
  for (const sx of [-1, 1]) {
    const x = sx * 0.14;
    g.add(limb([x, 0.1, 0], [x, 0.26, 0], 0.06, skin));
    const foot = ellipsoid(0.09, 0.07, 0.14, shoe);
    foot.position.set(x, 0.07, 0.05);
    g.add(foot);
  }
  return g;
}

// ---------------------------------------------------------------------
// Vestido liso + cinta verde con lazo atrás + cuello crema
// ---------------------------------------------------------------------
function buildDress() {
  const g = new THREE.Group();
  g.name = 'Dress';
  const dress = materials.felt(P.dress, { side: THREE.DoubleSide });
  const cream = materials.felt(P.cream);
  const ribbon = materials.felt(P.ribbon);

  g.add(lathe(PROFILE, dress));

  // Dobladillo redondeado
  const hem = new THREE.Mesh(new THREE.TorusGeometry(PROFILE[0].x - 0.004, 0.025, 10, 56), materials.felt(P.dress));
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1, ZS, 1);
  hem.position.y = 0.2;
  g.add(hem);

  // Cinta de la cintura
  const band = [];
  for (let i = 0; i <= 6; i++) { const y = 0.765 + (i / 6) * 0.07; band.push(new THREE.Vector2(rAt(y) + 0.016 + Math.sin((i / 6) * Math.PI) * 0.006, y)); }
  g.add(lathe(band, materials.felt(P.ribbon, { side: THREE.DoubleSide })));
  const bow = buildBow(ribbon, 0.9);
  bow.position.set(0, 0.8, -(frontZ(0, 0.8) + 0.03));
  bow.rotation.y = Math.PI;
  g.add(bow);

  // Cuello Peter Pan crema
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.07, 12, 40), cream);
  collar.rotation.x = Math.PI / 2 - 0.06;
  collar.scale.set(1, 0.9, 0.5);
  collar.position.y = 1.0;
  g.add(collar);
  return g;
}

/** Lazo: dos lazadas + nudo + dos colas. Mira hacia +Z. `s` = escala. */
function buildBow(mat, s = 1) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const loop = ellipsoid(0.085 * s, 0.05 * s, 0.025 * s, mat, 16);
    loop.position.set(sx * 0.075 * s, 0.01 * s, 0);
    loop.rotation.z = sx * 0.3;
    g.add(loop);
    const tail = ellipsoid(0.028 * s, 0.09 * s, 0.015 * s, mat, 12);
    tail.position.set(sx * 0.035 * s, -0.09 * s, 0);
    tail.rotation.z = sx * 0.22;
    g.add(tail);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.032 * s, 14, 10), mat);
  knot.scale.z = 0.8;
  g.add(knot);
  return g;
}

// ---------------------------------------------------------------------
// Delantal de granja (opcional): liso, con bolsillo
// ---------------------------------------------------------------------
function buildApron() {
  const g = new THREE.Group();
  g.name = 'Apron';
  const pts = [];
  for (let i = 0; i <= 10; i++) { const y = 0.36 + (i / 10) * 0.46; pts.push(new THREE.Vector2(rAt(y) + 0.02, y)); }
  g.add(lathe(pts, materials.felt(P.apron, { side: THREE.DoubleSide }), { segs: 40, phiStart: -1.0, phiLen: 2.0 }));
  const edge = [];
  for (let i = 0; i <= 20; i++) {
    const a = -1.0 + (i / 20) * 2.0;
    const r = rAt(0.36) + 0.02;
    edge.push(V(Math.sin(a) * r, 0.36, Math.cos(a) * r * ZS));
  }
  g.add(tube(edge, 0.018, materials.felt(P.apron), { segments: 40, radial: 8 }));
  const pocket = roundedBox(0.18, 0.12, 0.02, 0.015, materials.felt('#5C7B5D'));
  pocket.position.set(0, 0.52, frontZ(0, 0.52) + 0.04);
  g.add(pocket);
  return g;
}

// ---------------------------------------------------------------------
// Brazos cortos: manga abullonada, puño crema, mano, pulsera
// ---------------------------------------------------------------------
function buildArms() {
  const g = new THREE.Group();
  g.name = 'Arms';
  const skin = materials.felt(P.skin);
  const dress = materials.felt(P.dress);
  const cream = materials.felt(P.cream);
  const silver = materials.matte(P.silver, { roughness: 0.4 });
  const HAND_R = 0.075;

  for (const sx of [-1, 1]) {
    const S = V(sx * 0.37, 0.93, 0.0);
    const W = V(sx * 0.41, 0.7, 0.03);
    g.add(limb(S, W, 0.07, skin));

    const puff = ellipsoid(0.16, 0.14, 0.15, dress, 24);
    puff.position.set(sx * 0.385, 0.96, 0);
    g.add(puff);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.03, 10, 24), cream);
    cuff.position.set(sx * 0.39, 0.865, 0.0);
    cuff.rotation.x = Math.PI / 2;
    cuff.rotation.z = sx * 0.1;
    g.add(cuff);

    const axis = W.clone().sub(S).normalize();
    const hand = new THREE.Mesh(new THREE.SphereGeometry(HAND_R, 18, 14), skin);
    hand.position.copy(W).addScaledVector(axis, 0.06);
    g.add(hand);

    // Pulsera de dijes en la muñeca izquierda (+X): plata + oro / baya / pino.
    if (sx > 0) {
      const C = S.clone().lerp(W, 0.84);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.011, 8, 24), silver);
      ring.position.copy(C);
      ring.quaternion.setFromUnitVectors(V(0, 0, 1), axis);
      g.add(ring);
      for (const [dx, col] of [[-0.036, P.gold], [0.0, P.berry], [0.036, P.pine]]) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), materials.matte(col, { roughness: 0.5 }));
        c.position.set(C.x + dx, C.y - 0.014 - Math.abs(dx) * 0.2, C.z + 0.082);
        g.add(c);
      }
    }
  }
  return g;
}

// ---------------------------------------------------------------------
// Cabeza, pelo, cara
// ---------------------------------------------------------------------
function buildHead({ expression }) {
  const g = new THREE.Group();
  g.name = 'Head';
  g.position.set(0, DIM.headCenterY, 0.01);
  const skin = materials.felt(P.skin);
  g.add(ellipsoid(HEAD_MOM.rx, HEAD_MOM.ry, HEAD_MOM.rz, skin, 44));
  for (const sx of [-1, 1]) {
    const ear = ellipsoid(0.045, 0.075, 0.055, skin, 14);
    ear.position.set(sx * 0.53, -0.1, -0.06);
    g.add(ear);
  }
  g.add(buildFace({ skin: P.skin, hair: P.hair, expression, lash: true, head: HEAD_MOM }));
  g.add(buildHairMom());
  return g;
}

/** Pelo suave: corona redondeada, flequillo en 3 lóbulos, 2 mechones cortos, moño bajo con lazo. */
export function buildHairMom() {
  const g = new THREE.Group();
  g.name = 'Hair';
  const base = materials.felt(P.hair, { roughness: 0.95 });
  const hi = materials.felt(P.hairHi, { roughness: 0.95 });
  const baseDS = materials.felt(P.hair, { roughness: 0.95, side: THREE.DoubleSide });
  const H = HEAD_MOM;

  const C = { x: 0, y: 0.02, z: -0.02 };
  const R = { x: 0.585, y: 0.52, z: 0.52 };
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 28, 0, Math.PI * 2, 0, 1.2), baseDS);
  shell.scale.set(R.x, R.y, R.z);
  shell.position.set(C.x, C.y, C.z);
  g.add(shell);
  // Borde redondeado en la línea de nacimiento: elimina el corte recto del casquete al girar la cabeza.
  const rim = [];
  for (let i = 0; i < 48; i++) {
    const phi = (i / 48) * Math.PI * 2, th = 1.2;
    rim.push(V(C.x - Math.cos(phi) * Math.sin(th) * R.x, C.y + Math.cos(th) * R.y, C.z + Math.sin(phi) * Math.sin(th) * R.z));
  }
  g.add(tube(rim, 0.04, base, { closed: true, segments: 140, radial: 8 }));
  // Ondas a lo largo del nacimiento del pelo: rompen la línea recta (bloques suaves de dos tonos).
  [[-62, 0.215, 0.11, base], [-40, 0.195, 0.12, hi], [-14, 0.21, 0.11, base], [14, 0.2, 0.11, hi], [40, 0.215, 0.12, base], [62, 0.205, 0.11, hi]].forEach(([az, y, w, mat]) => {
    const a = deg(az);
    const b = ellipsoid(w, 0.065, 0.09, mat, 16);
    b.position.set(Math.sin(a) * 0.93 * R.x, y, C.z + Math.cos(a) * 0.93 * R.z);
    b.rotation.set(0, -a, -a * 0.35);
    g.add(b);
  });

  const back = ellipsoid(0.56, 0.38, 0.47, base, 32);
  back.position.set(0, 0.0, -0.06);
  g.add(back);
  for (const sx of [-1, 1]) {
    const side = ellipsoid(0.11, 0.18, 0.3, base, 20);
    side.position.set(sx * 0.5, 0.1, -0.08);
    g.add(side);
  }

  // Lóbulos planos del tono claro (pocos y grandes).
  const onCap = (az, el) => {
    const a = deg(az), e = deg(el);
    const d = V(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    return { p: V(C.x + d.x * R.x, C.y + d.y * R.y, C.z + d.z * R.z), d };
  };
  for (const [az, el, w] of [[28, 66, 0.15], [150, 52, 0.17], [-150, 50, 0.16]]) {
    const { p, d } = onCap(az, el);
    const m = ellipsoid(w, w * 0.55, 0.045, hi, 18);
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(V(0, 0, 1), d);
    m.rotateZ(deg(az) * 0.5);
    g.add(m);
  }

  // Flequillo lateral barrido: 3 lóbulos suaves.
  for (const b of [
    { pos: [0.0, 0.285, 0.43], rad: [0.25, 0.1, 0.11], rot: [-0.3, 0.1, 0.3], mat: hi },
    { pos: [-0.2, 0.245, 0.42], rad: [0.18, 0.085, 0.1], rot: [-0.3, 0.2, 0.62], mat: base },
    { pos: [-0.38, 0.13, 0.32], rad: [0.1, 0.14, 0.085], rot: [-0.2, 0.5, 0.35], mat: hi },
  ]) {
    const m = ellipsoid(b.rad[0], b.rad[1], b.rad[2], b.mat, 20);
    m.position.set(...b.pos);
    m.rotation.set(...b.rot);
    g.add(m);
  }

  // Dos mechones cortos (hasta la altura de la mejilla alta).
  for (const sx of [-1, 1]) {
    const pts = [];
    const N = 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = 0.12 - t * 0.26;
      const s2 = Math.sqrt(Math.max(1 - (y / H.ry) ** 2, 0.05));
      const az = deg(80 + 3 * t);   // al costado de la cara, junto a la oreja
      pts.push(V(sx * ((H.rx + 0.03) * Math.sin(az) * s2 + 0.012 * Math.sin(t * Math.PI * 2)), y, (H.rz + 0.02) * Math.cos(az) * s2));
    }
    g.add(tube(pts, 0.03, base, { segments: 28, radial: 8 }));
  }

  // Moño bajo y mullido con lazo.
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20), base);
  bun.position.set(0, -0.2, -0.53);
  g.add(bun);
  for (const [dx, dy, dz, r] of [[0.07, 0.04, -0.07, 0.1], [-0.07, 0.03, -0.06, 0.09]]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), hi);
    l.position.set(dx, -0.2 + dy, -0.53 + dz);
    g.add(l);
  }
  const bow = buildBow(materials.felt(P.ribbon), 0.95);
  bow.position.set(0.1, -0.1, -0.65);
  bow.rotation.set(0.25, Math.PI + 0.55, 0);
  g.add(bow);
  return g;
}
