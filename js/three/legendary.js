// legendary.js — escena 3D del capítulo 5 (El Objeto Legendario). Se importa solo al montar el capítulo 5.
// Requiere el importmap de index.html ("three" y "three/addons/", three.js 0.160.0 desde jsDelivr).
// Estilo "linograbado": sombreado toon de 3 tonos (MeshToonMaterial) + contorno de casco invertido en tinta #1B1420.
// Paleta: #0E1A14 #1F4D3A #C9A227 #F4E7B0. Cofre de madera oscura con herrajes dorados sobre un pedestal de piedra.
// El objeto y los rayos son DOM (ver c5-legendary.js); aquí solo vive el cofre, el pedestal y las chispas.
//
// API del controlador devuelto por createScene():
//   project('chest') -> {x, y, bottom}  px relativos a host (y = boca del cofre)
//   setGround(y, x)  desplaza la vista para que la base del cofre quede en y px y su centro en x px
//   pulse()          destello breve del cofre (cada Pandora que llega)
//   open()           bisagras en 3 pasos + chispas
//   final()          estado final directo (se pinta ya, sin esperar frames)
//   dispose()        libera geometrías, texturas y renderer
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const INK = 0x1B1420, GOLD = 0xC9A227, CREAM = 0xF4E7B0;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  lin: (t) => t,
};
// Bisagra "de papel": 3 chasquidos con rebote
function stepped(t, n = 3) {
  const k = Math.min(n - 1, Math.floor(t * n));
  const m = clamp((t * n - k) / 0.35, 0, 1);
  return (k + ease.back(m)) / n;
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// Tablones: color plano con vetas de tinta (sin degradados)
function woodTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#4a3320'; g.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 128; y += 32) {
    g.fillStyle = (y / 32) % 2 ? '#43301e' : '#523824'; g.fillRect(0, y, 256, 32);
    g.fillStyle = '#1B1420'; g.fillRect(0, y, 256, 3);
  }
  g.strokeStyle = 'rgba(27,20,32,.45)'; g.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const y = (i * 37) % 128, x = (i * 91) % 200; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 30 + (i % 5) * 8, y + 5); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function stoneTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#34493d'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#1B1420'; g.lineWidth = 3;
  for (let y = 0; y < 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); const o = (y / 32) % 2 ? 32 : 0; for (let x = o; x < 128; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
  g.strokeStyle = 'rgba(27,20,32,.4)'; g.lineWidth = 1.5;
  for (let i = -4; i < 12; i++) { g.beginPath(); g.moveTo(i * 12, 0); g.lineTo(i * 12 + 40, 40); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Contorno de casco invertido: grosor constante en espacio de vista (independiente de la escala)
const OUTLINE_VS = `uniform float uW; void main(){ vec3 n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); mv.xyz += n * uW; gl_Position = projectionMatrix * mv; }`;
const OUTLINE_FS = `void main(){ gl_FragColor = vec4(0.106, 0.078, 0.125, 1.0); }`;

export async function createScene(host, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'c5-gl'; canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation';
  host.appendChild(canvas);

  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 9 / 16, 0.1, 60);
  const CAM_Y = 3.3, TARGET_Y = 1.38;
  let shiftPx = 0, shiftX = 0;
  function placeCamera() {
    camera.position.set(0, CAM_Y, camera.aspect > 0.5625 ? 10 / Math.sqrt(0.5625 / camera.aspect) : 10);
    camera.lookAt(0, TARGET_Y, 0);
  }
  function applyShift(w, h) {
    if (shiftPx || shiftX) camera.setViewOffset(w, h, shiftX, shiftPx, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  // ---------- Luces: planas y claras para el toon ----------
  scene.add(new THREE.HemisphereLight(0xcfe3c8, 0x2a2018, 1.05));
  const key = new THREE.DirectionalLight(0xfff0c8, 1.6);
  key.position.set(-3.5, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -4, near: 1, far: 18 });
  key.shadow.bias = -0.0008;
  scene.add(key);
  const inner = new THREE.PointLight(0xffe08a, 0, 8, 1.4); inner.position.set(0, 0.95, 0.2); scene.add(inner);

  // ---------- Materiales toon (3 tonos) ----------
  const ramp = track(new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat));
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (opts) => track(new THREE.MeshToonMaterial({ gradientMap: ramp, ...opts }));
  const wood = track(woodTex()), stone = track(stoneTex());
  const mWood = toon({ map: wood, side: THREE.DoubleSide });
  const mGold = toon({ color: GOLD });
  const mDark = toon({ color: INK });
  const mStone = toon({ map: stone });
  const outlineMat = track(new THREE.ShaderMaterial({ vertexShader: OUTLINE_VS, fragmentShader: OUTLINE_FS, uniforms: { uW: { value: 0.03 } }, side: THREE.BackSide }));

  const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => {
    const m = new THREE.Mesh(track(geo), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
    if (outline) { const o = new THREE.Mesh(geo, outlineMat); m.add(o); }
    return m;
  };

  // ---------- Pedestal de piedra ----------
  const ped = new THREE.Group(); scene.add(ped);
  add(ped, new RoundedBoxGeometry(2.7, 0.32, 1.9, 2, 0.04), mStone, 0, -0.16, 0);
  add(ped, new RoundedBoxGeometry(3.1, 0.34, 2.2, 2, 0.04), mStone, 0, -0.49, 0);
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14)), track(new THREE.ShadowMaterial({ opacity: 0.4 })));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.66; ground.receiveShadow = true; scene.add(ground);

  // ---------- Cofre (madera + herrajes dorados) ----------
  const CHEST_S = 0.7;
  const chest = new THREE.Group(); chest.rotation.y = -0.2; chest.scale.setScalar(CHEST_S); scene.add(chest);
  add(chest, new RoundedBoxGeometry(1.7, 0.9, 1.1, 3, 0.07), mWood, 0, 0.45, 0);
  for (const x of [-0.5, 0.5]) add(chest, new RoundedBoxGeometry(0.17, 0.94, 1.14, 2, 0.04), mGold, x, 0.45, 0);
  add(chest, new RoundedBoxGeometry(1.76, 0.1, 1.15, 2, 0.04), mGold, 0, 0.07, 0);
  add(chest, new RoundedBoxGeometry(1.76, 0.08, 1.15, 2, 0.04), mGold, 0, 0.87, 0);
  for (const x of [-0.82, 0.82]) for (const z of [-0.52, 0.52]) add(chest, new THREE.SphereGeometry(0.07, 8, 6), mGold, x, 0.07, z, false); // remaches
  // interior: plano claro plano (se ve al abrir)
  const discMat = track(new THREE.MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0 }));
  const disc = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 0.9)), discMat);
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.93; chest.add(disc);
  // tapa (media caña) con bisagra trasera
  const lid = new THREE.Group(); lid.position.set(0, 0.9, -0.55); chest.add(lid);
  const half = (len) => { const g = new THREE.CylinderGeometry(1, 1, len, 24, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; };
  const lidMesh = add(lid, half(1.7), mWood, 0, 0, 0.56); lidMesh.scale.set(1, 0.38, 0.56);
  for (const x of [-0.5, 0.5]) { const b = add(lid, half(0.17), mGold, x, 0, 0.56, false); b.scale.set(1, 0.4, 0.585); }
  add(lid, new RoundedBoxGeometry(0.28, 0.3, 0.1, 2, 0.03), mGold, 0, 0.02, 1.13);
  add(lid, new THREE.CircleGeometry(0.035, 12), mDark, 0, 0.0, 1.185, false);

  // ---------- Chispas cuadradas (pocas, sin brillo suave) ----------
  const N = 120;
  const pPos = new Float32Array(N * 3), pVel = new Float32Array(N * 3), pAge = new Float32Array(N), pLife = new Float32Array(N);
  const pGeo = track(new THREE.BufferGeometry()); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = track(new THREE.PointsMaterial({ size: 0.1, color: CREAM, transparent: true, opacity: 1, depthWrite: false }));
  const points = new THREE.Points(pGeo, pMat); points.frustumCulled = false; points.visible = false; scene.add(points);
  const respawn = (i) => {
    const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 0.4;
    pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = 0.66; pPos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    pVel[i * 3] = Math.cos(a) * 0.12; pVel[i * 3 + 1] = 0.6 + Math.random() * 1.2; pVel[i * 3 + 2] = 0;
    pAge[i] = 0; pLife[i] = 1.6 + Math.random() * 1.6;
  };
  for (let i = 0; i < N; i++) { pAge[i] = 9; pLife[i] = 0; pPos[i * 3 + 1] = -99; }

  // ---------- Estado y tweens (tiempo absoluto) ----------
  const S = { lidT: 0, glow: 0.18, emit: 0, pulse: 0, t: 0 };
  const tw = [];
  const tween = (k, to, dur, delay = 0, e = ease.inOut) => {
    for (let i = tw.length - 1; i >= 0; i--) if (tw[i].k === k) tw.splice(i, 1);
    tw.push({ k, from: S[k], to, dur: Math.max(dur, 0.001), delay, e, at: performance.now() / 1000 });
  };
  const quick = reduced ? 0.15 : 1;

  function resize() {
    const w = host.clientWidth || 360, h = host.clientHeight || 640;
    renderer.setSize(w, h, false); camera.aspect = w / h; placeCamera(); applyShift(w, h);
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  let raf = 0, last = performance.now(), running = true;
  function frame(now) { if (!running) return; raf = requestAnimationFrame(frame); render(now); }
  function render(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; S.t = now / 1000;
    for (let i = tw.length - 1; i >= 0; i--) {
      const a = tw[i]; const el = S.t - a.at; if (el < a.delay) continue;
      const p = clamp((el - a.delay) / a.dur, 0, 1); S[a.k] = lerp(a.from, a.to, a.e(p));
      if (p >= 1) tw.splice(i, 1);
    }
    S.pulse = Math.max(0, S.pulse - dt * 2.2);
    const idle = S.lidT === 0 && !reduced ? 0.12 * (0.5 + 0.5 * Math.sin(S.t * 2.4)) : 0;
    const g = clamp(S.glow + S.pulse * 0.7 + idle, 0, 1.3);
    chest.scale.setScalar(CHEST_S * (1 + S.pulse * 0.035));
    lid.rotation.x = -THREE.MathUtils.degToRad(112) * stepped(clamp(S.lidT, 0, 1));
    inner.intensity = g * 6;
    discMat.opacity = clamp(S.lidT * 1.4, 0, 1) * clamp(g, 0, 1);
    if (S.emit > 0 || points.visible) {
      let alive = 0;
      for (let i = 0; i < N; i++) {
        pAge[i] += dt;
        if (pAge[i] >= pLife[i]) {
          if (S.emit > 0 && Math.random() < S.emit * 0.1) respawn(i); else { pPos[i * 3 + 1] = -99; continue; }
        }
        alive++;
        pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pVel[i * 3 + 1] *= 0.995;
      }
      pGeo.attributes.position.needsUpdate = true; points.visible = alive > 0 || S.emit > 0;
    }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const pt = (v) => { v.project(camera); return { x: (v.x * 0.5 + 0.5) * host.clientWidth, y: (-v.y * 0.5 + 0.5) * host.clientHeight }; };
  const project = () => {
    camera.updateMatrixWorld(true);
    const c = pt(new THREE.Vector3(0, 0.66, 0)), b = pt(new THREE.Vector3(0, 0, 0.45));
    return { x: c.x, y: c.y, bottom: b.y };
  };
  return {
    project,
    setGround(y, x) {
      shiftPx = 0; shiftX = 0; applyShift(host.clientWidth, host.clientHeight);
      shiftPx = Math.round(project().bottom - y); if (x != null) shiftX = Math.round(project().x - x); applyShift(host.clientWidth, host.clientHeight);
    },
    pulse() { S.pulse = 1; S.glow = Math.min(0.7, S.glow + 0.06); },
    open() { tween('glow', 1, 1.0 * quick); tween('lidT', 1, 1.8 * quick, 0.15 * quick, ease.lin); tween('emit', 1, 0.5, 1.0 * quick, ease.lin); },
    final() { tw.length = 0; Object.assign(S, { lidT: 1, glow: 0.7, emit: reduced ? 0.2 : 0.4 }); render(performance.now()); },
    dispose() {
      running = false; cancelAnimationFrame(raf); ro.disconnect();
      disposables.forEach((d) => { try { d.dispose(); } catch (e) { /* ya liberado */ } });
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* sin extensión */ }
      canvas.remove();
    },
  };
}
