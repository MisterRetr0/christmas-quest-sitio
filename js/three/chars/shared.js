// =====================================================================
// Christmas Quest · módulos compartidos de personajes (F1)
// Reutilizado por el aventurero y (luego) la mamá.
// Unidad de medida: H = alto de la cabeza = 1 unidad de mundo.
// Requiere un importmap con "three" y "three/addons/" (three.js 0.160.0).
// =====================================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const H = 1;

/** Semiejes del cráneo (elipsoide) en coordenadas locales de la cabeza. v3: ancho total 1.15 H (cabezón). */
export const HEAD = { rx: 0.575, ry: 0.47, rz: 0.52 };

/** Posiciones de los rasgos (locales de la cabeza, origen = centro del cráneo). */
export const FACE = {
  eyeY: -0.05,   // ~43 % de la altura de la cabeza, desde abajo (v3)
  eyeDx: 0.19,   // separación entre centros = 0.38 H (v3)
  browY: 0.09,
  noseY: -0.12,
  mouthY: -0.22,
  cheekY: -0.165,
  cheekDx: 0.3,
};

// ---------------------------------------------------------------------
// Guía de altura (líneas horizontales cada 1 H + altura total + barbilla)
// ---------------------------------------------------------------------
export const HEIGHT_GUIDE = {
  adventurer: 2.1,
  mom: 2.0,
  /**
   * Devuelve un Group con las líneas. Se dibujan sin depth test y con renderOrder bajo,
   * así quedan "detrás" del personaje pero a escala exacta (plano z = 0).
   * group.userData.marks = [{y, label}] para que la página ponga rótulos.
   */
  build(total, { halfWidth = 1.5 } = {}) {
    const g = new THREE.Group();
    g.name = 'HeightGuide';
    const marks = [
      { y: 0, label: '0', solid: true },
      { y: 1, label: '1 H' },
      { y: 2, label: '2 H' },
      { y: total - 1.0, label: 'barbilla', faint: true },
      { y: total, label: `${total} H`, solid: true },
    ];
    for (const m of marks) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-halfWidth, m.y, 0),
        new THREE.Vector3(halfWidth, m.y, 0),
      ]);
      const mat = m.solid
        ? new THREE.LineBasicMaterial({ color: 0xb4a490, depthTest: false, depthWrite: false })
        : new THREE.LineDashedMaterial({
            color: m.faint ? 0xd3c7b6 : 0xb4a490,
            dashSize: 0.06, gapSize: 0.05, depthTest: false, depthWrite: false,
          });
      const line = new THREE.Line(geo, mat);
      if (!m.solid) line.computeLineDistances();
      if (m.label === 'barbilla') line.name = 'chin';
      line.renderOrder = -10;
      g.add(line);
    }
    g.userData.marks = marks;
    return g;
  },
};

// ---------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

let _feltMap = null;
let _feltBump = null;

/** Texturas de ruido procedural (fieltro). Mapa de color <= ~4 % de variación. */
function feltTextures() {
  if (_feltMap) return { map: _feltMap, bump: _feltBump };
  const rand = rng(1234);

  // Mapa de color: variación sutil (valores 250..255 → <= 4 %).
  const s = 128;
  const c1 = document.createElement('canvas');
  c1.width = c1.height = s;
  const x1 = c1.getContext('2d');
  const img = x1.createImageData(s, s);
  for (let i = 0; i < s * s; i++) {
    const v = 252 + Math.floor(rand() * 4); // grano <= 2 % (v3)
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x1.putImageData(img, 0, 0);
  _feltMap = new THREE.CanvasTexture(c1);
  _feltMap.colorSpace = THREE.SRGBColorSpace;

  // Bump: ruido suave (64 px escalado a 128 con interpolación).
  const small = document.createElement('canvas');
  small.width = small.height = 64;
  const xs = small.getContext('2d');
  const im2 = xs.createImageData(64, 64);
  for (let i = 0; i < 64 * 64; i++) {
    const v = Math.floor(rand() * 256);
    im2.data[i * 4] = im2.data[i * 4 + 1] = im2.data[i * 4 + 2] = v;
    im2.data[i * 4 + 3] = 255;
  }
  xs.putImageData(im2, 0, 0);
  const c2 = document.createElement('canvas');
  c2.width = c2.height = 128;
  const x2 = c2.getContext('2d');
  x2.imageSmoothingEnabled = true;
  x2.drawImage(small, 0, 0, 128, 128);
  _feltBump = new THREE.CanvasTexture(c2);

  for (const t of [_feltMap, _feltBump]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.anisotropy = 4;
  }
  return { map: _feltMap, bump: _feltBump };
}

const _cache = new Map();
const _metals = [];

/**
 * Fábrica de materiales. Todos mate (roughness 0.85–0.95, metalness 0) excepto `metal`.
 * Los materiales se cachean por clave, así que pedir dos veces el mismo hex devuelve el mismo objeto.
 */
export const materials = {
  env: null,                 // textura PMREM (la fija setupScene)
  ENV_INTENSITY: 0.3,        // envMapIntensity del metal (bible: 0.3)
  FELT_BUMP: 0.1,

  /** Fieltro / lana: color + grano sutil. */
  felt(hex, { roughness = 0.9, side = THREE.FrontSide } = {}) {
    const key = `felt|${hex}|${roughness}|${side}`;
    if (_cache.has(key)) return _cache.get(key);
    const { map, bump } = feltTextures();
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex), roughness, metalness: 0,
      map, bumpMap: bump, bumpScale: this.FELT_BUMP, side,
    });
    _cache.set(key, m);
    return m;
  },

  /** Mate liso sin grano (ojos, boca, detalles pequeños). */
  matte(hex, { roughness = 0.85, opacity = 1 } = {}) {
    const key = `matte|${hex}|${roughness}|${opacity}`;
    if (_cache.has(key)) return _cache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex), roughness, metalness: 0,
      transparent: opacity < 1, opacity,
    });
    _cache.set(key, m);
    return m;
  },

  /** Sin iluminación (rubor sobre la piel). */
  flat(hex, opacity = 1) {
    const key = `flat|${hex}|${opacity}`;
    if (_cache.has(key)) return _cache.get(key);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex), transparent: true, opacity,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    _cache.set(key, m);
    return m;
  },

  /** Metal satinado: ÚNICO material con brillo metálico (gafas). */
  metal(hex, { metalness = 0.3, roughness = 0.45 } = {}) {
    const key = `metal|${hex}|${metalness}|${roughness}`;
    if (_cache.has(key)) return _cache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex), metalness, roughness,
      envMap: this.env, envMapIntensity: this.ENV_INTENSITY,
    });
    _metals.push(m);
    _cache.set(key, m);
    return m;
  },

  /** Lente transparente (opacidad 0.14) y su canto. */
  glass(opacity = 0.14) {
    const key = `glass|${opacity}`;
    if (_cache.has(key)) return _cache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.2, metalness: 0,
      transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
    });
    _cache.set(key, m);
    return m;
  },

  /** Asigna el envMap a todos los metales (los ya creados y los futuros). */
  setEnvMap(tex) {
    this.env = tex;
    for (const m of _metals) { m.envMap = tex; m.envMapIntensity = this.ENV_INTENSITY; m.needsUpdate = true; }
  },
};

// ---------------------------------------------------------------------
// Escena: luces, entorno, suelo que recibe sombra
// ---------------------------------------------------------------------
/** Multiplicador global de las luces (ver README: ajustado para que los hex se lean tal cual). */
export const LIGHT_GAIN = 1.25;

/**
 * Configura renderer y devuelve { scene, rig, key, fill, hemi, ground }.
 * `rig` agrupa key + fill: la página lo rota al azimut de cada cámara para que
 * todas las vistas tengan la misma iluminación relativa a la cámara.
 */
export function setupScene(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // Entorno PMREM: solo se asigna a los materiales metálicos (no a scene.environment).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  materials.setEnvMap(envTex);
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0xf2e4d2, 1.1 * LIGHT_GAIN);
  scene.add(hemi);

  const rig = new THREE.Group();
  rig.name = 'LightRig';
  scene.add(rig);

  // Key: arriba-izquierda y al frente (45° azimut / 35° elevación). Cámara en +z.
  const az = THREE.MathUtils.degToRad(45), el = THREE.MathUtils.degToRad(35), R = 9;
  const key = new THREE.DirectionalLight(0xffebd6, 1.6 * LIGHT_GAIN);
  key.position.set(-Math.sin(az) * Math.cos(el) * R, 1.3 + Math.sin(el) * R, Math.cos(az) * Math.cos(el) * R);
  key.target.position.set(0, 1.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const sc = key.shadow.camera;
  sc.left = -3.2; sc.right = 3.2; sc.top = 3.6; sc.bottom = -3.2; sc.near = 1; sc.far = 24;
  rig.add(key, key.target);

  // Fill: desde la derecha, frío y suave. Sin rim.
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.35 * LIGHT_GAIN);
  fill.position.set(7, 2.5, 4);
  fill.target.position.set(0, 1.3, 0);
  rig.add(fill, fill.target);

  // Suelo que solo recibe sombra (el fondo lo pone el clear color).
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.receiveShadow = true;
  ground.name = 'ShadowCatcher';
  scene.add(ground);

  return { scene, rig, key, fill, hemi, ground };
}

// ---------------------------------------------------------------------
// Helpers de forma redondeada
// ---------------------------------------------------------------------
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Elipsoide (esfera escalada) con semiejes rx, ry, rz. */
export function ellipsoid(rx, ry, rz, mat, seg = 28) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7))), mat);
  m.scale.set(rx, ry, rz);
  return m;
}

/** Cápsula vertical: radio r, largo del tramo cilíndrico `len` (alto total = len + 2r). */
export function capsule(r, len, mat, radial = 16) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len, 0.0001), 8, radial), mat);
}

/** Cápsula cuyos DOS CENTROS de casquete están en p0 y p1 (las puntas sobresalen r). */
export function limb(p0, p1, r, mat) {
  const a = new THREE.Vector3().fromArray(Array.isArray(p0) ? p0 : p0.toArray());
  const b = new THREE.Vector3().fromArray(Array.isArray(p1) ? p1 : p1.toArray());
  const dir = b.clone().sub(a);
  const d = dir.length();
  const m = capsule(r, d, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  return m;
}

/** Caja con bordes redondeados. */
export function roundedBox(w, h, d, radius, mat, segments = 3) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, radius), mat);
}

/** Tubo que sigue una lista de puntos (Catmull-Rom). */
export function tube(points, radius, mat, { closed = false, segments, radial = 8 } = {}) {
  const pts = points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
  const seg = segments ?? Math.max(16, pts.length * 6);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, radial, closed), mat);
}

// ---------------------------------------------------------------------
// Superficie de la cabeza y cara
// ---------------------------------------------------------------------
/** z de la superficie del cráneo en (x, y) locales. */
export function headSurface(head, x, y) {
  const k = 1 - (x / head.rx) ** 2 - (y / head.ry) ** 2;
  return head.rz * Math.sqrt(Math.max(k, 0.0004));
}

/** Coloca `obj` sobre el cráneo en (x, y), con su +Z alineado a la normal, elevado `lift`. */
export function placeOnHead(obj, head, x, y, lift = 0) {
  const z = headSurface(head, x, y);
  const n = new THREE.Vector3(x / head.rx ** 2, y / head.ry ** 2, z / head.rz ** 2).normalize();
  obj.position.set(x, y, z).addScaledVector(n, lift);
  obj.quaternion.setFromUnitVectors(Z_AXIS, n);
  return obj;
}

/**
 * Cara minimalista compartida. Coordenadas locales de la cabeza (origen = centro del cráneo).
 * Ojos óvalos sin esclerótica, cejas cápsula, nariz bulto, boca línea, rubor.
 * `lash:true` (mamá) añade un trazo mínimo de pestaña en el borde exterior de cada ojo.
 * `head` permite otra elipsoide (mamá, cabeza 1.0 más ovalada).
 */
export function buildFace({ skin = '#F2CDB2', hair = '#4A3226', expression = 'neutral', lash = false, head = HEAD } = {}) {
  const happy = expression === 'happy';
  const g = new THREE.Group();
  g.name = `Face_${expression}`;
  const eyeMat = materials.matte('#3A2A22', { roughness: 0.6 });
  const sphere = new THREE.SphereGeometry(1, 20, 14);

  for (const sx of [-1, 1]) {
    // Ojo: óvalo vertical 0.08 × 0.10 H (sin brillo). Feliz: 80 % en Y.
    const eye = new THREE.Mesh(sphere, eyeMat);
    eye.scale.set(0.04, 0.05 * (happy ? 0.8 : 1), 0.018);
    placeOnHead(eye, head, sx * FACE.eyeDx, FACE.eyeY, -0.002);
    g.add(eye);

    // Ceja: cápsula fina de 0.08 H, casi horizontal (feliz: +0.01 H).
    const brow = new THREE.Group();
    const bm = capsule(0.013, 0.08 - 0.026, materials.matte(hair, { roughness: 0.9 }), 8);
    bm.rotation.z = Math.PI / 2;
    brow.add(bm);
    placeOnHead(brow, head, sx * FACE.eyeDx, FACE.browY + (happy ? 0.01 : 0), 0.009);
    brow.rotateZ(-sx * 0.06);
    g.add(brow);

    // Rubor: disco #F2A7A0 al 25 % (feliz 32 %).
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), materials.flat('#F2A7A0', happy ? 0.35 : 0.25));
    placeOnHead(blush, head, sx * FACE.cheekDx, FACE.cheekY, 0.006);
    g.add(blush);

    if (lash) {
      const l = new THREE.Group();
      l.add(capsule(0.006, 0.025 - 0.012, eyeMat, 6));
      placeOnHead(l, head, sx * (FACE.eyeDx + 0.045), FACE.eyeY + 0.03, 0.003);
      l.rotateZ(-sx * 0.6);
      g.add(l);
    }
  }

  // Nariz: esfera 0.04 H (apoyo de las gafas).
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 14), materials.felt(skin));
  placeOnHead(nose, head, 0, FACE.noseY, 0.012);
  g.add(nose);

  // Boca: línea de 0.06 H, #8A4F45. Feliz: arco suave hacia arriba, sin abrir.
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = (i / 8) * 2 - 1;
    const x = u * (happy ? 0.044 : 0.03);   // sonrisa feliz: más ancha y con más arco (legible a ~250 px)
    const y = FACE.mouthY + (happy ? 0.019 * u * u : 0);
    pts.push(new THREE.Vector3(x, y, headSurface(head, x, y) + 0.004));
  }
  g.add(tube(pts, happy ? 0.0095 : 0.0065, materials.matte('#8A4F45'), { segments: 24, radial: 6 }));

  return g;
}
