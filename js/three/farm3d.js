// farm3d.js — Capítulo 4 en 3D real (three.js 0.160, importmap de index.html). Se importa solo al jugar la granja.
// Rincón de granja cálido y de juguete (fieltro/vinilo mate, mismos materiales y luces que los chibis) con la mamá 3D real.
// Cámara 3/4 en perspectiva con balanceo lento. Hasta 200 copos de nieve. pixelRatio ≤ 1.5, sombra 1024, todo se libera en dispose().
//
// API del controlador (createFarm3D):
//   setMode('land'|'port')  recoloca la granja y reencuadra la cámara
//   resize()                ajusta el lienzo al contenedor
//   setActive(bool)         pausa/reanuda el renderizado (VN, compuerta, pestaña oculta)
//   screen(key, i)          {x,y} en px relativos al contenedor del punto del objeto (para fx DOM)
//   hit(clientX, clientY)   → {key,i} | null (raycaster sobre volúmenes de toque generosos)
//   sync(S, {cooking})      estado estático (restaurar partida); setNext([...]) anillos ámbar
//   harvest(i) peck() layEgg() takeEgg() setCooking(b) popPlate() takePlate() load() takeoff() wiggle(key,i)
//   momLook(key,i) momHop() chickHop() burst(key,i,kind)   onLost(cb)   dispose()
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { materials, setupScene, ellipsoid, capsule, roundedBox, tube } from './chars/shared.js';
import { buildMom } from './chars/mom.js';

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const E = {
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  lin: (t) => t,
};
const RED = '#D9472B', REDD = '#B63420', YEL = '#F2C230', WOOD = '#B97F44', WOODD = '#8A5A2B', STONE = '#B9B2A3', WHITE = '#FFFFFF', CREAM = '#FFF8EA';

// Posiciones [x, z, giroY] de cada pieza según la orientación
const LAY = {
  land: {
    plot0: [-7.3, 1.5], plot1: [-5.0, 1.5], plot2: [-2.7, 1.5],
    mom: [0.3, 3.7, 0.35], hen: [1.8, 0.5, 0.5], coop: [3.6, -1.8, -0.3],
    stove: [3.7, 3.0, -0.35], sleigh: [6.7, 3.0, -0.35],
    sign: [-4.0, -1.1, 0.12], pots: [-5.6, -1.0, 0], barn: [-6.9, -3.9, 0.12], pond: [-1.6, -4.1, 0],
    pine: [8.6, -2.9, 0], tree1: [-10.2, -0.4], tree2: [-9.6, 3.2], tree3: [10.4, 1.4], snowman: [-9.2, 1.5, 0.5],
    fenceA: [0.4, -3.5, 0], fenceB: [5.2, -3.5, 0], crates: [-9.0, -3.6, 0.2],
  },
  port: {
    plot0: [-2.6, 0.2], plot1: [0, 0.2], plot2: [2.6, 0.2],
    mom: [-0.4, 2.9, 0.35], hen: [2.0, -2.6, 0.5], coop: [3.6, -4.6, -0.3],
    stove: [3.0, 4.6, -0.45], sleigh: [-2.4, 5.6, -0.1],
    sign: [-3.6, -4.7, 0.12], pots: [-4.5, -3.6, 0], barn: [-2.4, -7.6, 0.1], pond: [3.4, -7.0, 0],
    pine: [4.4, -6.0, 0], tree1: [-5.4, -7.2], tree2: [-5.0, 2.8], tree3: [5.4, 3.0], snowman: [-4.8, 0.0, 0.6],
    fenceA: [-2.6, -6.8, 0], fenceB: [2.2, -1.9, 0], crates: [-5.2, -9.2, 0.2],
  },
};
const CHICK = { land: [[-3.0, -0.6], [-2.4, -1.9], [-4.7, -1.9], [-3.6, 0.0]], port: [[-2.6, -4.0], [-1.6, -5.6], [-4.0, -5.8], [-2.2, -2.6]] };
const CAMS = {
  land: { pos: [0.3, 8.4, 13.6], at: [0.3, 0.2, -0.9], fov: 38 },
  port: { pos: [0, 22, 17], at: [0, 0, 1.2], fov: 46 },
};
const KEYS = ['veg0', 'veg1', 'veg2', 'hen', 'egg', 'wok', 'plate', 'sleigh'];
const keyOf = (k, i) => (k === 'veg' ? `veg${i}` : k);

export async function createFarm3D(host, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.className = 'c4-gl'; canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation';
  host.insertBefore(canvas, host.firstChild);

  const { scene, rig, key, fill, hemi, ground: catcher } = setupScene(renderer);
  scene.remove(catcher); catcher.geometry.dispose(); catcher.material.dispose();
  const SKY = new THREE.Color('#BFE6F7');
  scene.background = SKY; scene.fog = new THREE.Fog(SKY, 34, 80);
  hemi.color.set(0xfff4e0); hemi.groundColor.set(0x9fc27a); hemi.intensity = 1.15;
  key.color.set(0xffe9cc); key.intensity = 1.9;
  key.position.set(-7, 11, 8); key.target.position.set(0, 0, 0);
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 12, bottom: -12, near: 1, far: 40 });
  key.shadow.camera.updateProjectionMatrix();
  fill.intensity = 0.3;

  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 120);
  const own = []; // texturas/materiales/geometrías propios
  const track = (o) => { own.push(o); return o; };
  const F = (hex) => materials.felt(hex);
  const basic = {};
  const B = (hex, opacity = 1) => { const k = `${hex}|${opacity}`; return basic[k] || (basic[k] = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }))); };
  const std = (hex, o = {}) => track(new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.9, metalness: 0, ...o }));
  const shadow = (g, cast = true, recv = true) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = cast && !o.material.transparent; o.receiveShadow = recv; } }); return g; };
  const add = (p, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); p.add(m); return m; };
  const sph = (r, mat, seg = 14) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat);
  const lights = []; // bombillas que titilan
  const bulb = (p, x, y, z, hex, r = 0.07) => { const m = sph(r, B(hex), 8); m.position.set(x, y, z); p.add(m); lights.push({ m, ph: Math.random() * 6 }); return m; };

  // ---------- texturas propias ----------
  function grassTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#82C844'; g.fillRect(0, 0, 256, 256);
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() > 0.5 ? 'rgba(170,224,90,.28)' : 'rgba(70,150,40,.2)'; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 28, 6 + r() * 14, r() * 3, 0, 7); g.fill(); }
    const t = track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.anisotropy = 4; return t;
  }
  function signTex(text, w = 256, h = 96, size = 54) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#D9A769'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,76,36,.45)'; g.lineWidth = 3; for (const y of [h * 0.3, h * 0.7]) { g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); }
    g.fillStyle = '#4A2D12'; g.font = `800 ${size}px Nunito, "Segoe UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3, w - 24);
    const t = track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function dotTex() {
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return track(new THREE.CanvasTexture(c));
  }

  // ---------- suelo, camino y matas ----------
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(160, 160)), std('#FFFFFF', { map: grassTex(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  let pathMeshes = [];
  const PATHS = {
    land: [[-14, 4.4], [-8, 4.6], [-3, 4.6], [1.5, 4.9], [6, 4.7], [11, 5.6], [15, 6.4]],
    port: [[-9, 8.2], [-3, 7.2], [0.5, 3.0], [-0.2, -0.8], [0.8, -4.2], [3.6, -6.2]],
  };
  function buildPath(mode) {
    pathMeshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
    pathMeshes = [];
    const curve = new THREE.CatmullRomCurve3(PATHS[mode].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
    const mk = (w, y, hex) => {
      const pts = curve.getSpacedPoints(60), pos = [], idx = [];
      pts.forEach((p, i) => { const t = curve.getTangent(i / 60); const nx = -t.z, nz = t.x; pos.push(p.x + nx * w, y, p.z + nz * w, p.x - nx * w, y, p.z - nz * w); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, F(hex)); m.receiveShadow = true; scene.add(m); pathMeshes.push(m);
    };
    mk(1.05, 0.012, '#B9652F'); mk(0.82, 0.02, '#C8763E');
  }
  // matas de hierba instanciadas (una sola llamada de dibujo)
  const TUFTS = 140;
  const tuftMesh = new THREE.InstancedMesh(track(new THREE.ConeGeometry(0.07, 0.34, 4)), F('#FFFFFF'), TUFTS);
  tuftMesh.receiveShadow = false; scene.add(tuftMesh);
  const _o = new THREE.Object3D(), _c = new THREE.Color();
  function scatterTufts(mode) {
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const L = LAY[mode], solid = Object.values(L).filter((v) => v.length >= 2);
    for (let i = 0; i < TUFTS; i++) {
      let x = 0, z = 0, ok = false;
      for (let t = 0; t < 12 && !ok; t++) {
        x = (r() - 0.5) * (mode === 'land' ? 24 : 14); z = (r() - 0.5) * (mode === 'land' ? 16 : 30) - (mode === 'land' ? 0 : 3);
        ok = solid.every(([px, pz]) => Math.hypot(px - x, pz - z) > 1.7);
        if (ok) ok = PATHS[mode].every(([px, pz]) => Math.hypot(px - x, pz - z) > 1.6);
      }
      _o.position.set(x, 0.14, z); _o.rotation.set((r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4); const k = 0.7 + r() * 0.9; _o.scale.set(k, k * (0.8 + r() * 0.6), k); _o.updateMatrix();
      tuftMesh.setMatrixAt(i, _o.matrix); _c.set(['#A5D84F', '#7BC043', '#B8E060', '#69B034'][i % 4]); tuftMesh.setColorAt(i, _c);
    }
    tuftMesh.instanceMatrix.needsUpdate = true; tuftMesh.instanceColor.needsUpdate = true;
  }

  // ---------- piezas ----------
  const slots = {}; // nombre → Group posicionable
  const slot = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); slots[name] = g; return g; };
  const snowCap = (w, d, h = 0.12) => { const m = new THREE.Mesh(track(new RoundedBoxGeometry(w, h, d, 2, h * 0.45)), F(WHITE)); return m; };

  function buildBarn() {
    const g = slot('barn');
    const sh = new THREE.Shape(); sh.moveTo(-1.7, 0); sh.lineTo(1.7, 0); sh.lineTo(1.7, 1.7); sh.lineTo(0, 2.8); sh.lineTo(-1.7, 1.7); sh.closePath();
    const geo = track(new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 })); geo.translate(0, 0, -1.2);
    g.add(new THREE.Mesh(geo, F(RED)));
    const a = Math.atan2(1.1, 1.7), nrm = [Math.sin(a), Math.cos(a)];
    for (const sx of [-1, 1]) {
      const roof = new THREE.Mesh(track(new RoundedBoxGeometry(2.4, 0.18, 3.0, 2, 0.07)), F(REDD));
      roof.position.set(sx * (0.85 + nrm[0] * 0.12), 2.25 + nrm[1] * 0.12, 0); roof.rotation.z = -sx * a; g.add(roof);
      const sn = snowCap(2.2, 2.8, 0.16); sn.position.set(sx * (0.85 + nrm[0] * 0.28), 2.25 + nrm[1] * 0.28, 0); sn.rotation.z = -sx * a; g.add(sn);
    }
    add(g, snowCap(0.6, 2.9, 0.18), 0, 2.88, 0);
    const frame = add(g, new THREE.Mesh(track(new RoundedBoxGeometry(1.25, 1.3, 0.1, 2, 0.04)), F(WHITE)), 0, 0.65, 1.3);
    add(g, new THREE.Mesh(track(new RoundedBoxGeometry(1.0, 1.1, 0.08, 2, 0.03)), F('#B8452E')), 0, 0.6, 1.34);
    for (const y of [0.32, 0.6, 0.88]) add(g, new THREE.Mesh(track(new RoundedBoxGeometry(1.0, 0.05, 0.1, 1, 0.02)), F('#8F2E1C')), 0, y, 1.36);
    const win = add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20)), F(WHITE)), 0, 1.95, 1.3); win.rotation.x = Math.PI / 2;
    const glow = add(g, new THREE.Mesh(track(new THREE.CircleGeometry(0.2, 20)), B('#FFE27A')), 0, 1.95, 1.35);
    const pts = [[-1.95, 1.72], [-1.0, 2.32], [0, 3.0], [1.0, 2.32], [1.95, 1.72]].map(([x, y]) => new THREE.Vector3(x, y, 1.42));
    add(g, tube(pts, 0.02, F('#2A4A22'), { segments: 24, radial: 5 }));
    const cols = ['#FFD84D', '#FF5A4A', '#FFF3B0', '#7FE0A0'];
    const cur = new THREE.CatmullRomCurve3(pts); for (let i = 0; i <= 11; i++) { const p = cur.getPoint(i / 11); bulb(g, p.x, p.y - 0.08, p.z, cols[i % 4]); }
    for (let i = 0; i <= 5; i++) bulb(g, -1.1 + i * 0.44, 1.56 + Math.sin(i / 5 * Math.PI) * -0.06, 1.44, cols[(i + 1) % 4], 0.06);
    g.add(glow); shadow(g); return g;
  }
  function buildFence(n, step = 0.95) {
    const g = new THREE.Group();
    const post = track(new RoundedBoxGeometry(0.16, 0.85, 0.16, 2, 0.05)), rail = track(new RoundedBoxGeometry(step + 0.1, 0.1, 0.07, 1, 0.03));
    for (let i = 0; i <= n; i++) {
      const p = new THREE.Mesh(post, F(WHITE)); p.position.set(i * step, 0.42, 0); g.add(p);
      const c = snowCap(0.26, 0.26, 0.1); c.position.set(i * step, 0.88, 0); g.add(c);
      if (i < n) { for (const y of [0.3, 0.62]) { const r = new THREE.Mesh(rail, F('#F1EADB')); r.position.set((i + 0.5) * step, y, 0); g.add(r); } const rs = snowCap(step * 0.8, 0.09, 0.07); rs.position.set((i + 0.5) * step, 0.69, 0); g.add(rs); }
    }
    return shadow(g, true, true);
  }
  function buildPine(deco, sc = 1) {
    const g = new THREE.Group(); add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 8)), F('#7A4A21')), 0, 0.25, 0);
    const tiers = [[1.05, 1.1, 0.75, '#2F7A3A'], [0.85, 1.0, 1.5, '#3A8E44'], [0.62, 0.95, 2.2, '#47A04F']];
    for (const [r, h, y, c] of tiers) {
      add(g, new THREE.Mesh(track(new THREE.ConeGeometry(r, h, 12)), F(c)), 0, y + h * 0.25, 0);
      const cap = add(g, new THREE.Mesh(track(new THREE.ConeGeometry(r * 0.62, h * 0.5, 10)), F(WHITE)), 0, y + h * 0.5, 0); cap.scale.set(1.04, 1, 1.04);
    }
    if (deco) {
      const cols = ['#FF5A4A', '#FFD84D', '#7FD0F5', '#FFFFFF'];
      for (let i = 0; i < 14; i++) { const t = i / 14, y = 0.9 + t * 1.9, r = (1 - t) * 0.82 + 0.1, a = i * 2.4; bulb(g, Math.cos(a) * r, y, Math.sin(a) * r, cols[i % 4], 0.08); }
      const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 0.1 : 0.24, aa = (i / 10) * Math.PI * 2 + Math.PI / 2; (i ? st.lineTo : st.moveTo).call(st, Math.cos(aa) * rr, Math.sin(aa) * rr); } st.closePath();
      const sg = track(new THREE.ExtrudeGeometry(st, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 })); sg.translate(0, 0, -0.03);
      const star = add(g, new THREE.Mesh(sg, B('#FFD84D')), 0, 3.0, 0); lights.push({ m: star, ph: 1, star: true });
    }
    g.scale.setScalar(sc); return shadow(g);
  }
  function buildTree(sc = 1) {
    const g = new THREE.Group(); add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.17, 0.24, 1.2, 8)), F('#7A4A21')), 0, 0.6, 0);
    const b = (r, x, y, z, c) => add(g, sph(r, F(c), 16), x, y, z);
    b(0.95, -0.6, 1.7, 0, '#7FCB3E'); b(0.9, 0.6, 1.65, 0.1, '#6FBE3A'); b(1.05, 0, 2.35, 0, '#8AD247'); b(0.7, 0.1, 1.55, 0.7, '#74C43C');
    const sn = add(g, sph(0.55, F(WHITE), 12), 0.05, 3.18, 0); sn.scale.set(1, 0.35, 1); g.scale.setScalar(sc); return shadow(g);
  }
  function buildPond() {
    const g = slot('pond');
    const water = add(g, new THREE.Mesh(track(new THREE.CircleGeometry(1.7, 32)), std('#59C0EE', { roughness: 0.25, emissive: new THREE.Color('#2A7FB0'), emissiveIntensity: 0.3 })), 0, 0.06, 0); water.rotation.x = -Math.PI / 2; water.scale.set(1, 0.68, 1); water.receiveShadow = true;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const r = add(g, sph(0.34 + (i % 3) * 0.04, F(i % 2 ? STONE : '#CBC4B4'), 10), Math.cos(a) * 1.78, 0.16, Math.sin(a) * 1.22); r.scale.set(1, 0.62, 0.9); r.castShadow = true; r.receiveShadow = true; }
    for (const [x, z] of [[-0.6, 0.2], [0.7, -0.3]]) { const p = add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 12)), F('#4FA83A')), x, 0.09, z); p.receiveShadow = true; }
    for (let i = 0; i < 3; i++) { const rp = add(g, new THREE.Mesh(track(new THREE.RingGeometry(0.2, 0.26, 24)), B('#FFFFFF', 0.6)), 0.2, 0.1, 0.1); rp.rotation.x = -Math.PI / 2; rp.userData.ripple = i; ripples.push(rp); }
    const sn = add(g, snowCap(1.1, 0.7, 0.14), -1.45, 0.45, 0.5); sn.rotation.y = 0.5; return g;
  }
  const ripples = [];
  function buildPlot(i) {
    const g = slot(`plot${i}`);
    add(g, roundedBox(2.1, 0.2, 1.6, 0.06, F('#8A5A2E')), 0, 0.1, 0);
    for (const [w, d, x, z] of [[2.3, 0.14, 0, 0.82], [2.3, 0.14, 0, -0.82], [0.14, 1.78, 1.12, 0], [0.14, 1.78, -1.12, 0]]) add(g, roundedBox(w, 0.28, d, 0.05, F('#9A6A3A')), x, 0.14, z);
    for (const z of [-0.5, -0.17, 0.17, 0.5]) { const f = add(g, capsule(0.07, 1.6, F('#6E4120'), 8), 0, 0.23, z); f.rotation.z = Math.PI / 2; add(g, capsule(0.04, 1.5, F('#B07A44'), 6), 0, 0.28, z + 0.075).rotation.z = Math.PI / 2; }
    add(g, snowCap(0.5, 0.2, 0.1), 1.12, 0.3, 0.82);
    const crops = new THREE.Group(); g.add(crops); g.userData.crops = crops;
    const make = [cabbage, carrot, onion][i];
    [-0.62, 0, 0.62].forEach((x, k) => { const c = make(); c.position.set(x, 0.2, (k - 1) * 0.12); c.rotation.y = k * 1.7; crops.add(c); });
    shadow(g); return g;
  }
  function cabbage() {
    const g = new THREE.Group(); add(g, sph(0.34, F('#6CC24A'), 14), 0, 0.3, 0);
    const l = add(g, sph(0.34, F('#8FDC63'), 14), 0, 0.42, 0); l.scale.set(0.82, 0.6, 0.82);
    add(g, sph(0.24, F('#B5EC84'), 12), 0, 0.5, 0);
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; const lf = add(g, sph(0.2, F('#5CB43C'), 8), Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3); lf.scale.set(1, 0.4, 1); }
    return g;
  }
  function carrot() {
    const g = new THREE.Group(); const c = add(g, new THREE.Mesh(track(new THREE.ConeGeometry(0.2, 0.7, 10)), F('#F08A24')), 0, 0.3, 0); c.rotation.x = Math.PI; c.position.y = 0.38;
    add(g, sph(0.2, F('#F08A24'), 10), 0, 0.66, 0).scale.set(1, 0.5, 1);
    for (const [x, z, t] of [[-0.12, 0, 0.35], [0, 0.1, 0.1], [0.12, -0.04, -0.3], [0, -0.1, 0.0]]) { const lf = add(g, capsule(0.055, 0.34, F('#4FA83A'), 6), x * 1.2, 0.95, z); lf.rotation.z = t; }
    return g;
  }
  function onion() {
    const g = new THREE.Group(); add(g, sph(0.22, F(CREAM), 12), 0, 0.26, 0).scale.set(1, 0.9, 1);
    add(g, sph(0.12, F('#6CC24A'), 8), 0, 0.46, 0);
    for (let k = 0; k < 5; k++) { const lf = add(g, capsule(0.04, 0.55, F(k % 2 ? '#4FA83A' : '#7BD04F'), 6), (k - 2) * 0.08, 0.82, (k % 2) * 0.05); lf.rotation.z = (k - 2) * -0.14; }
    return g;
  }
  function buildHen() {
    const g = slot('hen'); const body = new THREE.Group(); g.add(body); g.userData.body = body;
    add(body, ellipsoid(0.42, 0.38, 0.36, F('#FFFAF0'), 16), 0, 0.52, 0);
    const tail = add(body, ellipsoid(0.1, 0.24, 0.08, F('#F1E3C4'), 10), 0, 0.78, -0.4); tail.rotation.x = -0.5;
    const head = new THREE.Group(); head.position.set(0, 0.92, 0.28); body.add(head); g.userData.head = head;
    add(head, ellipsoid(0.23, 0.22, 0.21, F('#FFFAF0'), 14));
    for (const [x, y] of [[-0.07, 0.24], [0, 0.29], [0.07, 0.24]]) add(head, sph(0.06, F('#E8503A'), 8), x, y, 0.02);
    const beak = add(head, new THREE.Mesh(track(new THREE.ConeGeometry(0.07, 0.17, 8)), F('#F2A93B')), 0, -0.02, 0.24); beak.rotation.x = Math.PI / 2;
    add(head, ellipsoid(0.04, 0.07, 0.04, F('#E8503A'), 8), 0, -0.15, 0.17);
    for (const sx of [-1, 1]) { add(head, sph(0.035, B('#2A1B12'), 8), sx * 0.12, 0.04, 0.17); add(body, ellipsoid(0.1, 0.22, 0.28, F('#F1E3C4'), 10), sx * 0.4, 0.54, 0); add(body, capsule(0.028, 0.16, F('#F2A93B'), 6), sx * 0.13, 0.14, 0.05); const ft = add(body, ellipsoid(0.1, 0.03, 0.12, F('#F2A93B'), 8), sx * 0.13, 0.03, 0.1); ft.castShadow = true; }
    shadow(g); return g;
  }
  function buildCoop() {
    const g = slot('coop');
    add(g, roundedBox(1.7, 1.0, 1.4, 0.1, F('#D9A769')), 0, 0.5, 0);
    for (const sx of [-1, 1]) { const r = add(g, roundedBox(1.15, 0.12, 1.7, 0.05, F('#C8381F')), sx * 0.46, 1.28, 0); r.rotation.z = -sx * 0.62; const s = add(g, snowCap(1.0, 1.55, 0.13), sx * 0.54, 1.38, 0); s.rotation.z = -sx * 0.62; }
    const door = add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16)), F('#2A1C14')), 0, 0.5, 0.72); door.rotation.x = Math.PI / 2;
    const ramp = add(g, roundedBox(0.4, 0.06, 0.6, 0.02, F(WOODD)), 0, 0.2, 0.98); ramp.rotation.x = 0.45;
    add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5)), F('#555')), 0.6, 1.1, 0.9).visible = false;
    shadow(g); return g;
  }
  function buildChick() {
    const g = new THREE.Group(); const b = new THREE.Group(); g.add(b); g.userData.body = b;
    add(b, ellipsoid(0.28, 0.27, 0.26, F('#FFD84A'), 16), 0, 0.32, 0);
    const beak = add(b, new THREE.Mesh(track(new THREE.ConeGeometry(0.05, 0.12, 8)), F('#F2803A')), 0, 0.33, 0.27); beak.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { add(b, sph(0.032, B('#2A1B12'), 8), sx * 0.1, 0.4, 0.22); add(b, ellipsoid(0.06, 0.12, 0.14, F('#F2C230'), 8), sx * 0.27, 0.3, 0); add(b, capsule(0.018, 0.1, F('#F2803A'), 5), sx * 0.08, 0.05, 0.02); }
    for (const x of [-0.04, 0.04]) { const t = add(b, capsule(0.015, 0.12, F('#E8B21E'), 5), x, 0.62, 0.02); t.rotation.z = x * 7; }
    const bl = add(b, sph(0.05, B('#F2A7A0', 0.5), 8), 0.14, 0.31, 0.22); bl.scale.set(1, 0.6, 0.3);
    return shadow(g);
  }
  function buildSign(text, w, h, tex) {
    const g = new THREE.Group();
    for (const x of [-w * 0.35, w * 0.35]) add(g, roundedBox(0.09, h + 0.5, 0.09, 0.03, F(WOODD)), x, (h + 0.5) / 2, 0);
    const board = new THREE.Mesh(track(new RoundedBoxGeometry(w, h, 0.09, 2, 0.04)), [F('#D9A769'), F('#D9A769'), F('#D9A769'), F('#D9A769'), track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })), F('#C99A5E')]);
    board.position.set(0, h / 2 + 0.5, 0.06); g.add(board);
    add(g, snowCap(w * 0.9, 0.15, 0.08), 0, h + 0.54, 0.06);
    return shadow(g);
  }
  function buildPots() {
    const g = slot('pots');
    [[-0.45, 0], [0.12, -0.15], [0.62, 0.05]].forEach(([x, z], i) => {
      const p = add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.16, 0.3, 12)), F('#D9663A')), x, 0.15, z); void p;
      add(g, new THREE.Mesh(track(new THREE.TorusGeometry(0.22, 0.04, 6, 14)), F('#E98254')), x, 0.3, z).rotation.x = Math.PI / 2;
      add(g, capsule(0.02, 0.28 + (i === 1 ? 0.08 : 0), F('#4FA83A'), 5), x, 0.52, z);
      const fl = new THREE.Group(); fl.position.set(x, 0.74 + (i === 1 ? 0.08 : 0), z); g.add(fl);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const pe = add(fl, sph(0.11, F('#FFD84A'), 8), Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0); pe.scale.set(1, 1, 0.5); }
      add(fl, sph(0.07, F('#D98A1E'), 8), 0, 0, 0.04); fl.rotation.set(-0.35, (i - 1) * 0.3, 0);
    });
    return shadow(g);
  }
  function buildStove() {
    const g = slot('stove');
    add(g, roundedBox(1.35, 0.8, 1.1, 0.1, F(STONE)), 0, 0.4, 0);
    add(g, roundedBox(1.45, 0.1, 1.2, 0.05, F('#8F887A')), 0, 0.84, 0);
    add(g, roundedBox(0.62, 0.42, 0.06, 0.03, F('#2A1C14')), 0, 0.34, 0.54);
    const ch = add(g, roundedBox(0.3, 0.8, 0.3, 0.06, F('#9B9484')), -0.45, 1.2, -0.3); void ch;
    add(g, snowCap(0.4, 0.4, 0.1), -0.45, 1.64, -0.3);
    const wok = new THREE.Group(); wok.position.set(0, 1.12, 0); g.add(wok); g.userData.wok = wok;
    const bowl = add(wok, new THREE.Mesh(track(new THREE.SphereGeometry(0.62, 22, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), std('#3A3F4D', { side: THREE.DoubleSide, roughness: 0.55 })), 0, 0.2, 0); bowl.scale.set(1, 0.62, 1);
    add(wok, new THREE.Mesh(track(new THREE.TorusGeometry(0.62, 0.045, 8, 28)), F('#5A6074')), 0, 0.2, 0).rotation.x = Math.PI / 2;
    const hd = add(wok, capsule(0.04, 0.5, F(WOODD), 6), 0.95, 0.27, 0); hd.rotation.z = Math.PI / 2 - 0.2;
    const food = new THREE.Group(); food.visible = false; wok.add(food); g.userData.food = food;
    add(food, ellipsoid(0.5, 0.14, 0.5, F('#F6C844'), 14), 0, 0.12, 0);
    for (let k = 0; k < 6; k++) { const a = k * 1.05; const b = add(food, sph(0.06, F(k % 2 ? '#6CC24A' : '#E8503A'), 6), Math.cos(a) * 0.28, 0.24, Math.sin(a) * 0.28); b.userData.bit = k; food.userData.bits = (food.userData.bits || []).concat(b); }
    const flames = new THREE.Group(); flames.visible = false; g.add(flames); g.userData.flames = flames;
    for (let k = 0; k < 4; k++) { const f = add(flames, new THREE.Mesh(track(new THREE.ConeGeometry(0.1, 0.34, 6)), B(k % 2 ? '#FFD84D' : '#F2503A')), (k - 1.5) * 0.14, 0.36, 0.6); f.userData.ph = k; }
    const gl = add(g, new THREE.Mesh(track(new THREE.PlaneGeometry(0.5, 0.3)), B('#FF8A3A', 0.55)), 0, 0.3, 0.58); gl.visible = false; g.userData.glow = gl;
    shadow(g); return g;
  }
  function buildPlate(parent) {
    const g = new THREE.Group(); g.position.set(1.55, 0, 0.3); g.visible = false; parent.add(g); parent.userData.plateG = g;
    add(g, roundedBox(0.85, 0.5, 0.85, 0.06, F('#C99A5E')), 0, 0.25, 0);
    add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.38, 0.32, 0.06, 20)), F(WHITE)), 0, 0.53, 0);
    add(g, ellipsoid(0.3, 0.16, 0.3, F('#F6C844'), 14), 0, 0.62, 0);
    [[-0.1, 0.2, '#6CC24A'], [0.14, 0.2, '#E8503A'], [0.02, 0.29, '#6CC24A']].forEach(([x, y, c], k) => add(g, sph(0.05, F(c), 6), x, y + 0.5, 0.1 - k * 0.08));
    for (const o of [-0.05, 0.05]) { const s = add(g, capsule(0.012, 0.5, F('#7A4A21'), 5), 0.1 + o, 0.78, 0.25); s.rotation.set(1.3, 0, 0.4); }
    shadow(g); return g;
  }
  function buildSleigh() {
    const g = slot('sleigh'); const rigG = new THREE.Group(); g.add(rigG); g.userData.rig = rigG;
    add(rigG, roundedBox(2.2, 0.45, 1.1, 0.14, F(RED)), 0, 0.55, 0);
    add(rigG, roundedBox(2.24, 0.1, 1.14, 0.04, F('#F8D56A')), 0, 0.5, 0);
    add(rigG, roundedBox(0.16, 0.75, 1.0, 0.07, F('#E8503A')), 1.12, 0.92, 0).rotation.z = -0.35;
    add(rigG, sph(0.1, F('#FFE27A'), 8), 1.3, 1.28, 0);
    add(rigG, roundedBox(0.14, 0.75, 1.0, 0.07, F('#C03C26')), -1.0, 0.98, 0);
    add(rigG, roundedBox(0.7, 0.1, 0.9, 0.04, F('#F6C844')), -0.5, 0.84, 0);
    for (const z of [-0.45, 0.45]) {
      add(rigG, tube([[-1.35, 0.1, z], [0.9, 0.1, z], [1.35, 0.24, z], [1.5, 0.55, z]], 0.06, F(WOODD), { segments: 24, radial: 6 }));
      for (const x of [-0.8, 0.3]) add(rigG, capsule(0.04, 0.2, F(WOODD), 6), x, 0.25, z);
    }
    const cargo = new THREE.Group(); cargo.visible = false; rigG.add(cargo); g.userData.cargo = cargo;
    add(cargo, roundedBox(0.7, 0.5, 0.65, 0.06, F(WOOD)), 0.1, 1.05, 0.05);
    add(cargo, roundedBox(0.74, 0.08, 0.69, 0.03, F('#8A5A2B')), 0.1, 1.3, 0.05);
    add(cargo, ellipsoid(0.3, 0.3, 0.28, F('#F6C844'), 12), 0.8, 0.95, -0.1);
    add(cargo, sph(0.12, F(RED), 8), 0.1, 1.42, 0.05);
    const sg = buildSign('Pedidos', 1.1, 0.4, signTex('Pedidos', 256, 96, 50)); sg.position.set(0.2, 0, 1.05); sg.rotation.y = 0.15; g.add(sg); g.userData.sign = sg;
    shadow(g); return g;
  }
  function buildSnowman() {
    const g = slot('snowman');
    add(g, sph(0.5, F(WHITE), 14), 0, 0.5, 0); add(g, sph(0.38, F(WHITE), 14), 0, 1.2, 0); add(g, sph(0.28, F(WHITE), 14), 0, 1.75, 0);
    const n = add(g, new THREE.Mesh(track(new THREE.ConeGeometry(0.05, 0.22, 6)), F('#F2803A')), 0, 1.75, 0.3); n.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { add(g, sph(0.03, B('#2A1B12'), 6), sx * 0.1, 1.82, 0.24); const a = add(g, capsule(0.02, 0.5, F('#7A4A21'), 5), sx * 0.45, 1.2, 0); a.rotation.z = sx * -1.0; }
    add(g, new THREE.Mesh(track(new THREE.TorusGeometry(0.27, 0.07, 8, 16)), F(RED)), 0, 1.5, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 12)), F('#2B2B3A')), 0, 2.08, 0); add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 12)), F('#2B2B3A')), 0, 1.94, 0);
    return shadow(g);
  }
  function buildCrates() {
    const g = slot('crates');
    add(g, roundedBox(0.9, 0.7, 0.9, 0.06, F(WOOD)), 0, 0.35, 0); add(g, roundedBox(0.7, 0.55, 0.7, 0.06, F('#C99A5E')), 0.9, 0.28, 0.3).rotation.y = 0.4;
    add(g, new THREE.Mesh(track(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 14)), F('#A9743C')), -0.9, 0.45, 0.2);
    add(g, snowCap(0.95, 0.95, 0.1), 0, 0.74, 0); const hb = add(g, ellipsoid(0.55, 0.3, 0.4, F('#E8C25A'), 10), 0.2, 0.3, -0.9); hb.castShadow = true;
    const gift = (x, z, c, r) => { const b = add(g, roundedBox(0.4, 0.34, 0.4, 0.04, F(c)), x, 0.17, z); b.rotation.y = r; add(g, roundedBox(0.43, 0.06, 0.1, 0.02, F('#FFD84D')), x, 0.37, z).rotation.y = r; };
    gift(1.7, -0.4, '#7FD0F5', 0.3); gift(-1.8, -0.5, '#FF8A9B', -0.3);
    return shadow(g);
  }
  function buildRing(sx, sz) {
    const o = new THREE.Group(); o.visible = false; o.position.y = 0.06;
    const t = new THREE.Mesh(track(new THREE.TorusGeometry(1, 0.045, 8, 48)), B('#FFC94D', 0.95)); t.rotation.x = -Math.PI / 2; o.add(t);
    const d = new THREE.Mesh(track(new THREE.CircleGeometry(1, 40)), B('#FFC94D', 0.2)); d.rotation.x = -Math.PI / 2; d.position.y = 0.01; o.add(d);
    o.userData.base = [sx, sz]; o.scale.set(sx, 1, sz); scene.add(o); return o;
  }

  // ---------- ensamblar ----------
  buildPath('land');
  buildBarn();
  const penceA = buildFence(5), penceB = buildFence(5); const fA = slot('fenceA'); fA.add(penceA); const fB = slot('fenceB'); fB.add(penceB);
  slot('pine').add(buildPine(true, 1.15));
  for (const [n, s] of [['tree1', 1.0], ['tree2', 0.8], ['tree3', 1.1]]) slot(n).add(buildTree(s));
  buildPond(); buildPots(); buildSnowman(); buildCrates(); buildCoop();
  for (let i = 0; i < 3; i++) buildPlot(i);
  const hen = buildHen(); const stove = buildStove(); const plateG = buildPlate(stove); const sleigh = buildSleigh();
  const signG = slot('sign'); signG.add(buildSign('Pollito', 1.3, 0.5, signTex('Pollito', 256, 96, 56)));
  const chick = buildChick(); scene.add(chick);
  // huevo (hijo de la gallina) con nido de paja
  const egg = new THREE.Group(); egg.position.set(0.95, 0, 0.45); egg.visible = false; hen.add(egg);
  add(egg, new THREE.Mesh(track(new THREE.TorusGeometry(0.26, 0.09, 8, 16)), F('#E8B64A')), 0, 0.1, 0).rotation.x = Math.PI / 2;
  const eggM = add(egg, ellipsoid(0.17, 0.22, 0.17, F('#FFF8EA'), 14), 0, 0.28, 0); eggM.castShadow = true;
  // mamá
  const momRoot = new THREE.Group(); scene.add(momRoot);
  const mom = buildMom({ expression: 'happy', apron: true }); mom.scale.setScalar(1.2); momRoot.add(mom);
  // anillos ámbar y volúmenes de toque
  const RING = { veg0: [1.35, 1.05], veg1: [1.35, 1.05], veg2: [1.35, 1.05], hen: [1.0, 0.95], egg: [0.55, 0.55], wok: [1.15, 1.0], plate: [0.85, 0.85], sleigh: [2.0, 1.2] };
  const rings = {}; KEYS.forEach((k) => { rings[k] = buildRing(...RING[k]); });
  const ownerOf = { veg0: slots.plot0, veg1: slots.plot1, veg2: slots.plot2, hen, egg, wok: stove, plate: plateG, sleigh };
  const HITS = { veg0: [2.3, 1.3, 1.8], veg1: [2.3, 1.3, 1.8], veg2: [2.3, 1.3, 1.8], hen: [1.3, 1.3, 1.3], egg: [0.7, 0.7, 0.7], wok: [1.7, 1.6, 1.4], plate: [1.0, 1.0, 1.0], sleigh: [2.8, 1.6, 1.8] };
  const HIT_OFF = { veg0: [0, 0.5, 0], veg1: [0, 0.5, 0], veg2: [0, 0.5, 0], hen: [0, 0.6, 0], egg: [0, 0.3, 0], wok: [0, 0.9, 0.1], plate: [0, 0.5, 0], sleigh: [0.2, 0.8, 0] };
  const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const hitMeshes = KEYS.map((k) => { const m = new THREE.Mesh(track(new THREE.BoxGeometry(1, 1, 1)), hitMat); m.position.set(...HIT_OFF[k]); m.userData.key = k; m.userData.base = HITS[k]; m.scale.set(...HITS[k]); ownerOf[k].add(m); return m; });
  // anclas para puntos en pantalla (partículas DOM / vuelos)
  const ANCH = { veg0: [0, 0.6, 0], veg1: [0, 0.6, 0], veg2: [0, 0.6, 0], hen: [0, 0.8, 0], egg: [0, 0.35, 0], wok: [0, 1.4, 0], plate: [0, 0.7, 0], sleigh: [0.2, 1.0, 0] };
  const _v = new THREE.Vector3(), _rv = new THREE.Vector3();
  const worldOf = (k) => { const o = ownerOf[k]; _v.set(...ANCH[k]); return o.localToWorld(_v); };

  // ---------- nieve (≤ 200 copos) ----------
  const NS = 180, sPos = new Float32Array(NS * 3), sSpd = new Float32Array(NS);
  const SNOWBOX = { land: [26, 10, 18], port: [16, 10, 34] };
  for (let i = 0; i < NS; i++) { sPos[i * 3] = (Math.random() - 0.5) * 26; sPos[i * 3 + 1] = Math.random() * 10; sPos[i * 3 + 2] = (Math.random() - 0.5) * 18; sSpd[i] = 0.35 + Math.random() * 0.5; }
  const sGeo = track(new THREE.BufferGeometry()); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const snow = new THREE.Points(sGeo, track(new THREE.PointsMaterial({ size: 0.16, map: dotTex(), color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })));
  snow.frustumCulled = false; scene.add(snow);

  // ---------- vapor y partículas ----------
  const steamMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
  const steamPool = []; const stGeo = track(new THREE.SphereGeometry(0.14, 8, 6));
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(stGeo, steamMat.clone()); track(m.material); m.visible = false; scene.add(m); steamPool.push({ m, age: 9, life: 1.4, x: 0, y: 0, z: 0 }); }
  let steamSrc = []; // [{get:()=>Vector3, on:()=>bool}]
  const burstGeo = track(new THREE.BoxGeometry(0.13, 0.13, 0.04)), puffs = [];
  for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(burstGeo, track(new THREE.MeshBasicMaterial({ color: 0x6cc24a, transparent: true }))); m.visible = false; scene.add(m); puffs.push({ m, v: new THREE.Vector3(), life: 0, age: 9, spin: 0 }); }
  function burstAt(p, colors, n, spread = 1.6) {
    if (reduced) n = Math.min(n, 3);
    for (let k = 0; k < n; k++) {
      const q = puffs.find((x) => x.age >= x.life); if (!q) break;
      q.m.position.copy(p); q.m.material.color.set(colors[k % colors.length]); q.m.material.opacity = 1; q.m.visible = true;
      const a = Math.random() * 6.283; q.v.set(Math.cos(a) * spread * (0.4 + Math.random() * 0.6), 2.4 + Math.random() * 1.6, Math.sin(a) * spread * (0.4 + Math.random() * 0.6));
      q.age = 0; q.life = 0.8 + Math.random() * 0.4; q.spin = (Math.random() - 0.5) * 12; q.m.scale.setScalar(0.7 + Math.random() * 0.8);
    }
  }

  // ---------- tweens ----------
  const tw = [];
  const tween = (dur, fn, { delay = 0, ease = E.out, done } = {}) => { tw.push({ t: -delay, dur: Math.max(dur, 0.001), fn, ease, done }); };
  const dur = (d) => (reduced ? Math.min(d, 0.12) : d);
  const popIn = (o, d = 0.45) => { o.visible = true; o.scale.setScalar(0.01); tween(dur(d), (k) => o.scale.setScalar(Math.max(0.01, k)), { ease: E.back }); };

  // ---------- modo, cámara, resize ----------
  let mode = 'land', active = true, W = 2, Hh = 1, T = 0, camBase = new THREE.Vector3(), camAt = new THREE.Vector3(), chickIdx = 0;
  function place() {
    const L = LAY[mode];
    for (const [name, g] of Object.entries(slots)) { const p = L[name]; if (p) { g.position.set(p[0], 0, p[1]); g.rotation.y = p[2] || 0; } }
    momRoot.position.set(L.mom[0], 0, L.mom[1]); momBase = L.mom[2]; momRoot.rotation.y = momTurn.cur = momTurn.to = momBase;
    const c = CHICK[mode][chickIdx % 4]; chick.position.set(c[0], 0, c[1]);
    buildPath(mode); scatterTufts(mode);
    const b = SNOWBOX[mode]; for (let i = 0; i < NS; i++) { sPos[i * 3] = (Math.random() - 0.5) * b[0]; sPos[i * 3 + 2] = (Math.random() - 0.5) * b[2]; }
    key.shadow.camera.left = -13; key.shadow.camera.right = 13; key.shadow.camera.top = mode === 'land' ? 12 : 17; key.shadow.camera.bottom = mode === 'land' ? -12 : -17; key.shadow.camera.updateProjectionMatrix();
  }
  let momBase = 0; const momTurn = { cur: 0, to: 0 };
  function frameCamera() {
    const c = CAMS[mode]; const aspect = W / Hh;
    camera.fov = c.fov; camera.aspect = aspect;
    let k = 1; if (mode === 'land') k = Math.max(1, 2.1 / aspect); else k = Math.max(0.85, 0.46 / aspect) * 1;
    camAt.set(...c.at); camBase.set(c.pos[0], c.at[1] + (c.pos[1] - c.at[1]) * k, c.at[2] + (c.pos[2] - c.at[2]) * k);
    camera.position.copy(camBase); camera.lookAt(camAt); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // volúmenes de toque ≥ 72 px en pantalla
    for (const m of hitMeshes) {
      const wp = m.getWorldPosition(new THREE.Vector3()); const d = wp.distanceTo(camera.position);
      const pxPerUnit = Hh / (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const kk = Math.max(1, 72 / (Math.min(m.userData.base[0], m.userData.base[1] * 1.2) * pxPerUnit));
      m.scale.set(m.userData.base[0] * kk, m.userData.base[1] * Math.min(kk, 1.8), m.userData.base[2] * kk);
    }
  }
  function resize() {
    W = host.clientWidth || 600; Hh = host.clientHeight || 300;
    renderer.setSize(W, Hh, false); frameCamera();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);
  function setMode(m) { if (m !== mode) { mode = m; place(); } resize(); }

  // ---------- bucle ----------
  let raf = 0, last = performance.now(), running = false, lost = null;
  const loopOn = () => active && !document.hidden && !disposed;
  function start() { if (!running && loopOn()) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (loopOn() ? start() : stop());
  document.addEventListener('visibilitychange', onVis);
  const onLost = (e) => { e.preventDefault(); stop(); lost && lost(); };
  canvas.addEventListener('webglcontextlost', onLost);
  let disposed = false, cookOn = false, nextSet = new Set(), fc = 0;

  function frame(now) {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; T += dt; update(dt); renderer.render(scene, camera);
    if (api.onFrame && ++fc % 3 === 0) api.onFrame();
  }
  function update(dt) {
    for (let i = tw.length - 1; i >= 0; i--) { const a = tw[i]; a.t += dt; if (a.t < 0) continue; const k = Math.min(1, a.t / a.dur); a.fn(a.ease(k), k); if (k >= 1) { tw.splice(i, 1); a.done && a.done(); } }
    if (!reduced) { // balanceo lento de cámara
      camera.position.set(camBase.x + Math.sin(T * 0.27) * 0.45, camBase.y + Math.sin(T * 0.19) * 0.1, camBase.z); camera.lookAt(camAt.x + Math.sin(T * 0.27) * 0.15, camAt.y, camAt.z);
    }
    // nieve
    const b = SNOWBOX[mode];
    for (let i = 0; i < NS; i++) {
      if (!reduced) { sPos[i * 3 + 1] -= sSpd[i] * dt; sPos[i * 3] += Math.sin(T * 0.8 + i) * dt * 0.25; }
      if (sPos[i * 3 + 1] < 0) { sPos[i * 3 + 1] = b[1]; sPos[i * 3] = (Math.random() - 0.5) * b[0]; sPos[i * 3 + 2] = (Math.random() - 0.5) * b[2] - (mode === 'port' ? 3 : 0); }
    }
    sGeo.attributes.position.needsUpdate = true;
    // luces titilantes
    for (const l of lights) { const s = 1 + 0.22 * Math.sin(T * 2.6 + l.ph * 3); if (l.star) l.m.scale.setScalar(s * 1.05); else l.m.scale.setScalar(s); }
    // gallina, pollito y mamá en reposo
    hen.userData.body.position.y = Math.max(0, Math.sin(T * 2.1)) * 0.03;
    chick.userData.body.position.y = Math.max(0, Math.sin(T * 3.1 + 1)) * 0.07;
    mom.scale.y = 1.2 * (1 + Math.sin(T * 2) * 0.01);
    momTurn.cur += (momTurn.to - momTurn.cur) * Math.min(1, dt * 7); momRoot.rotation.y = momTurn.cur;
    // anillos
    const pulse = 0.97 + 0.1 * Math.sin(T * 5.2);
    for (const k of KEYS) { const r = rings[k]; if (!r.visible) continue; const ow = ownerOf[k]; ow.getWorldPosition(_rv); r.position.set(_rv.x, 0.06, _rv.z); r.rotation.y = ow.parent === scene ? ow.rotation.y : (ow.parent.rotation.y || 0); r.scale.set(r.userData.base[0] * pulse, 1, r.userData.base[1] * pulse); }
    // charca
    for (const rp of ripples) { const ph = (T * 0.5 + rp.userData.ripple / 3) % 1; rp.scale.set(1 + ph * 4, 1, 1 + ph * 3); rp.material.opacity = 0.45 * (1 - ph); }
    // llamas, vapor y fideos
    const fl = stove.userData.flames; if (fl.visible) fl.children.forEach((f) => { const s = 0.8 + 0.5 * Math.abs(Math.sin(T * 11 + f.userData.ph * 2)); f.scale.set(1, s, 1); f.position.y = 0.3 + 0.1 * s; });
    const bits = stove.userData.food.userData.bits || []; if (cookOn) bits.forEach((bt, k) => { bt.position.y = 0.26 + Math.max(0, Math.sin(T * 9 + k * 1.3)) * 0.22; });
    for (const sp of steamPool) {
      sp.age += dt;
      if (sp.age >= sp.life) {
        sp.m.visible = false;
        const src = steamSrc.find((s) => s.on()); if (src && Math.random() < dt * 6) { const p = src.get(); sp.x = p.x + (Math.random() - 0.5) * 0.3; sp.y = p.y; sp.z = p.z + (Math.random() - 0.5) * 0.3; sp.age = 0; sp.life = 1.0 + Math.random() * 0.6; sp.m.visible = true; }
        continue;
      }
      const k = sp.age / sp.life; sp.m.position.set(sp.x, sp.y + k * 1.1, sp.z); sp.m.scale.setScalar(0.5 + k * 1.6); sp.m.material.opacity = 0.65 * (1 - k);
    }
    for (const q of puffs) { if (q.age >= q.life) { q.m.visible = false; continue; } q.age += dt; q.v.y -= 7 * dt; q.m.position.addScaledVector(q.v, dt); q.m.rotation.z += q.spin * dt; q.m.material.opacity = Math.max(0, 1 - Math.pow(q.age / q.life, 2)); }
  }
  steamSrc = [
    { on: () => cookOn, get: () => stove.localToWorld(new THREE.Vector3(0, 1.45, 0)) },
    { on: () => plateG.visible, get: () => plateG.localToWorld(new THREE.Vector3(0, 0.9, 0)) },
  ];

  // ---------- acciones ----------
  const keyW = (k) => worldOf(k).clone();
  const api = {
    canvas,
    setMode, resize,
    setActive(b) { active = !!b; canvas.style.visibility = active ? 'visible' : 'hidden'; if (loopOn()) { resize(); start(); } else stop(); },
    onLost(cb) { lost = cb; },
    screen(k, i = 0) { camera.updateMatrixWorld(); const p = worldOf(keyOf(k, i)).clone().project(camera); return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * Hh }; },
    screenOfMom() { camera.updateMatrixWorld(); const p = momRoot.localToWorld(new THREE.Vector3(0, 1.9, 0)).project(camera); return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * Hh }; },
    hit(cx, cy) {
      const r = canvas.getBoundingClientRect(); if (!r.width) return null;
      const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, camera);
      camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
      const hits = rc.intersectObjects(hitMeshes.filter((m) => { let o = m.parent; while (o) { if (o.visible === false) return false; o = o.parent; } return true; }), false);
      if (!hits.length) return null;
      const pick = hits.find((h) => nextSet.has(h.object.userData.key)) || hits[0];
      const k = pick.object.userData.key; return k.startsWith('veg') ? { key: 'veg', i: +k.slice(3) } : { key: k, i: 0 };
    },
    setNext(list) { nextSet = new Set(list); for (const k of KEYS) rings[k].visible = nextSet.has(k); },
    sync(S, { cooking = false } = {}) {
      for (let i = 0; i < 3; i++) slots[`plot${i}`].userData.crops.visible = !S.veg[i];
      egg.visible = S.egg === 1; plateG.visible = !!(S.cooked && !S.plated);
      sleigh.userData.cargo.visible = !!S.loaded; sleigh.visible = !S.done;
      this.setCooking(cooking);
    },
    harvest(i) {
      const crops = slots[`plot${i}`].userData.crops; const list = crops.children.slice();
      list.forEach((c, k) => {
        tween(dur(0.7), (e, t) => {
          const sq = t < 0.3 ? 1 + 0.25 * (t / 0.3) : t < 0.65 ? 1.25 - 0.37 * ((t - 0.3) / 0.35) : 0.88 - 0.88 * ((t - 0.65) / 0.35);
          const st = t < 0.3 ? 0.78 : t < 0.65 ? 0.78 + 0.5 * ((t - 0.3) / 0.35) : 1.28 - 1.2 * ((t - 0.65) / 0.35);
          c.scale.set(Math.max(0.01, sq), Math.max(0.01, st), Math.max(0.01, sq)); c.position.y = 0.2 + (t > 0.3 ? Math.sin(((t - 0.3) / 0.7) * Math.PI) * 0.5 : 0);
        }, { ease: E.lin, delay: k * 0.07, done: () => { c.visible = false; burstAt(c.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.5, 0)), ['#6CC24A', '#8FDC63', '#4FA83A', i === 1 ? '#F08A24' : '#B5EC84'], 7); } });
        c.userData.t = 0;
      });
      tween(dur(0.9), () => {}, { done: () => { crops.visible = false; list.forEach((c) => { c.visible = true; c.scale.setScalar(1); c.position.y = 0.2; }); } });
      const g = slots[`plot${i}`]; tween(dur(0.4), (e, t) => { g.position.y = Math.sin(t * Math.PI) * 0.1; });
    },
    peck() { const h = hen.userData.head; tween(dur(0.9), (e, t) => { h.rotation.x = (t < 0.9 ? Math.max(0, Math.sin(t * Math.PI * 3.2)) : 0) * 0.55; hen.userData.body.rotation.x = Math.max(0, Math.sin(t * Math.PI * 3.2)) * 0.18; }, { ease: E.lin }); burstAt(keyW('hen').add(new THREE.Vector3(0.35, 0.2, 0.5)), ['#F2C230', '#FFE27A'], 6, 0.8); },
    layEgg() { popIn(egg, 0.5); },
    takeEgg() { tween(dur(0.25), (e) => egg.scale.setScalar(1 - e), { done: () => { egg.visible = false; egg.scale.setScalar(1); } }); },
    setCooking(b) {
      cookOn = !!b; stove.userData.flames.visible = cookOn; stove.userData.food.visible = cookOn; stove.userData.glow.visible = cookOn;
    },
    popPlate() { plateG.visible = true; popIn(plateG, 0.5); },
    takePlate() { tween(dur(0.25), (e) => plateG.scale.setScalar(1 - e), { done: () => { plateG.visible = false; plateG.scale.setScalar(1); } }); },
    load() { const c = sleigh.userData.cargo; popIn(c, 0.45); const r = sleigh.userData.rig; tween(dur(0.5), (e, t) => { r.position.y = Math.sin(t * Math.PI) * 0.12; }); },
    takeoff(cb) {
      const r = sleigh.userData.rig, s0 = r.position.clone();
      tween(dur(1.5), (e, t) => {
        const lift = t < 0.18 ? -0.05 * (t / 0.18) : 0; const u = Math.max(0, (t - 0.18) / 0.82), ue = u * u;
        r.position.set(s0.x + ue * 9, s0.y + lift + ue * 7, s0.z - ue * 3); r.rotation.z = u * 0.35; r.scale.setScalar(1 - ue * 0.55);
      }, { ease: E.lin, done: () => { sleigh.visible = false; r.position.copy(s0); r.rotation.z = 0; r.scale.setScalar(1); cb && cb(); } });
    },
    wiggle(k, i = 0) { const o = ownerOf[keyOf(k, i)]; tween(dur(0.45), (e, t) => { o.rotation.z = Math.sin(t * Math.PI * 3) * 0.09 * (1 - t); }, { ease: E.lin, done: () => { o.rotation.z = 0; } }); },
    momLook(k, i = 0) {
      const w = keyW(keyOf(k, i)), p = momRoot.position; const a = Math.atan2(w.x - p.x, w.z - p.z);
      let d = (a * 0.8 + momBase * 0.2) - momTurn.to; d = Math.atan2(Math.sin(d), Math.cos(d)); momTurn.to += d;
    },
    momHop() { tween(dur(0.55), (e, t) => { const sq = t < 0.25 ? 1 - 0.07 * (t / 0.25) : 1; momRoot.position.y = Math.sin(clamp((t - 0.15) / 0.85, 0, 1) * Math.PI) * 0.45; momRoot.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); }, { ease: E.lin, done: () => { momRoot.position.y = 0; momRoot.scale.set(1, 1, 1); } }); },
    chickHop() {
      chickIdx = (chickIdx + 1) % 4; const to = CHICK[mode][chickIdx], from = chick.position.clone();
      tween(dur(0.6), (e, t) => { chick.position.set(from.x + (to[0] - from.x) * e, Math.sin(t * Math.PI) * 0.6, from.z + (to[1] - from.z) * e); chick.rotation.y = Math.atan2(to[0] - from.x, to[1] - from.z) * 0.5; }, { ease: E.lin, done: () => { chick.position.y = 0; } });
    },
    burst(k, i = 0, kind = 'sparkle') { burstAt(keyW(keyOf(k, i)), kind === 'sparkle' ? ['#FFD84A', '#FFF3B0'] : ['#6CC24A'], 6); },
    dispose() {
      disposed = true; stop(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
      own.forEach((o) => { try { o.dispose(); } catch (e) { /* ya liberado */ } });
      tuftMesh.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* sin extensión */ }
      canvas.remove();
    },
  };
  place(); resize();
  active = false; // el capítulo lo activa con setActive(true) cuando se entra en la granja
  renderer.render(scene, camera);
  return api;
}
