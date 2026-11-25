// c4-farm.js — Capítulo 4: La Granja de Mamá. Granja isométrica APAISADA, cálida y mullida (estilo propio de este capítulo).
// Beats del capítulo: 0-1 novela visual (vertical) · 2 GRANJA (apaisada) · 3-4 novela visual tras la entrega.
// Bucle de 9 toques (~50 s), sin recursos compartidos y sin forma de fallar:
//   3 verduras (repollo, zanahoria, cebollín) → alimentar a la gallina → huevo (1,5 s) → wok (2 s)
//   → recoger el chow mein → trineo (tocar para cargar) → "Entregar" → dijes con coinArc (+25 Pandoras).
// Orientación: apaisado por defecto. En vertical se muestra una compuerta ("Gira tu teléfono…") con la salida
// "Prefiero seguir en vertical" (diseño vertical alternativo). Se re-maqueta en vivo al girar el dispositivo.
// RENDER: la granja jugable es 3D real (js/three/farm3d.js, three.js). Si no hay WebGL o falla, se usa la granja 2D de js/farm/farm.js
// (que sigue montada y es el respaldo). Toda la mecánica, el estado y los textos son los mismos en ambos modos.
// El progreso se guarda con api.setFarm(); al recargar se retoma donde estaba. Si ya está completa,
// se muestra terminada con CONTINUAR y NO se vuelven a dar Pandoras.
import { ART, buildScene, setBackground, puff, defaultState, nextStep } from '../farm/farm.js';
import { createOrder } from '../farm/order.js';

export const id = 'c4-farm';
export const title = 'La Granja de Mamá';

// Frase de mamá cuando el trineo se lleva el pedido (ortografía confirmada por el usuario)
const MOM_CATCHPHRASE = '¡Emputa via re la ma!';
const PANDORAS_REWARD = 25;
const FARM_BEAT = 2; // índice del beat jugable

let timers = [];
let disposed = false;
let cleanups = [];
const later = (fn, ms) => { const t = setTimeout(() => { if (!disposed) fn(); }, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

// Una línea de pista por paso
const HINT = {
  veg: '¡Las verduras están listas!',
  hen: 'La gallina tiene hambre',
  wait: 'Shhh… la gallina está poniendo',
  egg: '¡Mira, un huevo calentito!',
  wok: '¡Al wok con todo!',
  plate: '¡Tu chow mein está listo!',
  sleigh: 'Todo listo: ¡al trineo!',
  deliver: 'Toca Entregar',
  done: '¡Pedido entregado!',
};

// Escenas de novela visual (js/vn/vn.js, A2 §4). Si el módulo no existe, queda el texto con el paisaje de fondo.
const VN_BEATS = {
  0: { speaker: 'Mamá', text: '¿Y yo qué tengo que ver con todo esto?', show: [['adventurer', 'neutral', 'left'], ['mom', 'suspicious', 'right']], focus: 'mom', emote: ['mom', '?'] },
  1: { speaker: 'Aventurero', text: 'Pues… la Autoridad Superior también tiene que ganarse sus Pandoras.', show: [['adventurer', 'nervous', 'left'], ['mom', 'suspicious', 'right']], focus: 'adventurer', emote: ['adventurer', 'sweat'], shake: 'adventurer' },
  3: { speaker: 'Mamá', text: MOM_CATCHPHRASE, show: [['adventurer', 'happy', 'left'], ['mom', 'laughing', 'right']], focus: 'mom', hop: 'mom', emote: ['mom', 'notes'] },
  4: { speaker: 'Mamá', text: 'Mmm… tengo que admitirlo: ese chow mein me quedó perfecto. Estoy orgullosa.', show: [['adventurer', 'happy', 'left'], ['mom', 'proud', 'right']], focus: 'mom', emote: ['mom', 'sparkle'] },
};

export function mount(container, api) {
  disposed = false; cleanups = [];
  container.style.setProperty('--tint', '#6BAF2E');
  container.classList.add('c4');
  const stageEl = document.getElementById('stage');
  const reduced = () => api.fx.reducedMotion();
  const scene = buildScene(container);
  const order = createOrder(container, { reduced });
  scene.world.appendChild(order.el); // el cartel vive en el mundo (se escala con él); los vuelos usan coordenadas del contenedor
  const { targets, plots } = scene;

  // ----- render 3D (opcional, con respaldo 2D) -----
  let v3 = null, v3Mod = null, v3Wait = null, view3 = false;
  const hasGL = () => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } };
  let glOk = hasGL();
  if (glOk) { // módulo en segundo plano; el lienzo se crea al entrar en la granja
    v3Mod = import('../three/farm3d.js').catch((e) => { console.warn('c4: farm3d no disponible, uso la granja 2D', e); return null; });
    const hits = document.createElement('div'); hits.className = 'c4-hits'; container.insertBefore(hits, scene.gate);
    [...targets, scene.bubble].forEach((el) => hits.appendChild(el));
    scene.hits = hits;
  }
  const ghost = (p) => ({ getBoundingClientRect: () => { const R = container.getBoundingClientRect(); return { left: R.left + p.x, top: R.top + p.y, width: 0, height: 0 }; } });

  // ----- estado (restaurado si existe) -----
  const saved = api.getFarm() || {};
  const S = { ...defaultState(), ...saved };
  if (!Array.isArray(S.veg) || S.veg.length !== 3) S.veg = [0, 0, 0];
  if (S.done) { S.veg = [1, 1, 1]; S.fed = 1; S.egg = 2; S.cooked = 1; S.plated = 1; S.loaded = 1; }
  const wasDone = !!S.done; // si ya estaba completa, jamás se vuelven a dar Pandoras
  let cooking = false, delivering = false, shown = S.veg.filter(Boolean).length;
  const persist = () => api.setFarm({ ...S, veg: [...S.veg] });
  const tKey = (el) => ({ t: el.dataset.t, i: +el.dataset.i || 0 });

  // ----- beats: dos de novela, uno de granja (su texto se actualiza con las pistas), dos de novela -----
  const vnBeat = (i) => ({ text: VN_BEATS[i].text, speaker: VN_BEATS[i].speaker });
  const BEATS = [vnBeat(0), vnBeat(1), { text: HINT[nextStep(S)] || HINT.veg, hideButton: nextStep(S) !== 'done' }, vnBeat(3), { ...vnBeat(4), label: 'CONTINUAR' }];
  // En el beat de granja, el texto cambia sin salir de él
  const say = (key, extra = {}) => { BEATS[FARM_BEAT] = { text: HINT[key] || key, hideButton: key !== 'done', ...extra }; api.setBeats(BEATS, FARM_BEAT); };

  // ----- utilidades -----
  const stage = () => container.getBoundingClientRect();
  const center = (el) => { const r = el.getBoundingClientRect(), R = stage(); return { x: r.left + r.width / 2 - R.left, y: r.top + r.height / 2 - R.top, w: r.width, h: r.height }; };
  const sfx = (n) => api.audio.play(n);
  const restart = (el, cls, ms = 700) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(() => el.classList.remove(cls), ms); };

  // ----- novela visual (opcional: js/vn/vn.js puede no existir todavía) -----
  let vn = null;
  const vnDo = (fn) => { try { if (vn) fn(vn); } catch (e) { /* una expresión desconocida no debe romper la granja */ } };
  import('../vn/vn.js').then((m) => { if (disposed) return; vn = m.default || m; vnDo((v) => v.stage && v.stage(container)); applyBeat(api.getBeat()); }).catch(() => { /* sin novela: solo texto */ });
  function applyBeat(i) {
    const b = VN_BEATS[i];
    if (!b) { // beat de granja: fuera los sprites
      vnDo((v) => { v.hide('adventurer'); v.hide('mom'); });
      if (api.setSpeaker) try { api.setSpeaker(''); } catch (e) {}
      return;
    }
    if (api.setSpeaker) try { api.setSpeaker(b.speaker); } catch (e) {}
    vnDo((v) => {
      b.show.forEach(([ch, ex, side]) => { v.show(ch, ex, side, { enter: 'slide' }); });
      if (b.focus) v.focus(b.focus);
      if (b.emote) v.emote(b.emote[0], b.emote[1]);
      if (b.hop) v.hop(b.hop);
      if (b.shake) v.shake(b.shake);
    });
  }

  // ----- orientación: apaisado (mundo 812×375) / vertical (375×812); compuerta de giro -----
  const DESIGN = { land: [812, 375], port: [375, 812] };
  let preferPortrait = false, mode = 'port', gated = false, gated2 = false, stayLand = false;
  // Compuerta inversa tras la entrega: las escenas de novela posteriores (y los capítulos siguientes) son verticales
  const gate2 = scene.gate.cloneNode(true);
  gate2.classList.add('c4-gate2'); gate2.hidden = true;
  gate2.querySelector('.c4-gate-t').textContent = 'Vuelve a poner el teléfono en vertical 📱';
  gate2.querySelector('.c4-gate-link').textContent = 'Seguir así';
  scene.gate.after(gate2);
  const leaveFull = async () => {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (err) { /* no disponible */ }
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (err) { /* no disponible */ }
  };
  gate2.addEventListener('click', (e) => { if (!e.target.closest('.c4-gate-link')) leaveFull(); });
  gate2.querySelector('.c4-gate-link').addEventListener('click', () => { stayLand = true; leaveFull(); layout(); });
  const CHICK = { land: [362, 384, 350, 372], port: [262, 232, 280, 246] };
  let chickI = 0;
  const placeChick = () => { scene.chick.style.left = `${CHICK[mode][chickI % CHICK[mode].length]}px`; };
  // 3D: los botones accesibles (teclado/lector) y el botón Entregar/bocadillo siguen la posición proyectada de cada objeto
  const HITSZ = { wok: [112, 84], deliver: [176, 68] };
  function placeHits() {
    if (!(v3 && view3)) return;
    const R = stage(), cl = (v, a, b) => Math.max(a, Math.min(b, v));
    targets.forEach((el) => {
      const { t, i } = tKey(el); if (t !== 'deliver' && el.hidden) return;
      const [w, h] = HITSZ[t] || [76, 76];
      let p = t === 'deliver' ? v3.screen('sleigh') : v3.screen(t, i);
      if (t === 'deliver') p = { x: p.x - 30, y: p.y + 100 };
      const x = cl(p.x, w / 2 + 6, R.width - w / 2 - 6), y = cl(p.y, h / 2 + 6, R.height - h / 2 - 6);
      el.style.width = `${w}px`; el.style.height = `${h}px`; el.style.left = `${x - w / 2}px`; el.style.top = `${y - h / 2}px`;
    });
    const m = v3.screenOfMom(), bw = Math.min(270, R.width - 16);
    scene.bubble.style.left = `${cl(m.x - 40, 8, R.width - bw - 8)}px`; scene.bubble.style.top = `${cl(m.y - 96, 8, R.height - 90)}px`;
  }
  function fallback2D() { // sin WebGL, contexto perdido o error: vuelve la granja 2D (respaldo)
    if (disposed) return;
    glOk = false; view3 = false;
    if (v3) { try { v3.dispose(); } catch (e) { /* ya liberado */ } v3 = null; }
    if (scene.hits) { scene.hits.remove(); [...targets, scene.bubble].forEach((el) => { el.removeAttribute('style'); scene.play.appendChild(el); }); scene.hits = null; }
    container.classList.remove('c4-3d'); layout(); refresh();
  }
  function ensure3d() {
    if (v3 || v3Wait || !glOk) return;
    v3Wait = v3Mod.then(async (m) => {
      if (!m || disposed || !m.hasWebGL()) throw new Error('sin WebGL');
      const v = await m.createFarm3D(container, { reduced: reduced() });
      if (disposed) { v.dispose(); return; }
      v.onLost(fallback2D); v.onFrame = placeHits;
      v3 = v; v3.sync(S, { cooking }); layout(); refresh();
    }).catch((e) => { console.warn('c4: 3D no disponible, uso la granja 2D', e); v3Wait = null; fallback2D(); });
  }
  cleanups.push(() => { if (v3) { try { v3.dispose(); } catch (e) { /* ya liberado */ } v3 = null; } });
  function layout() {
    if (disposed) return;
    const beat = api.getBeat();
    const farmView = beat === FARM_BEAT;
    const deviceLand = window.innerWidth > window.innerHeight;
    gated = farmView && !deviceLand && !preferPortrait;
    mode = farmView && deviceLand ? 'land' : 'port';
    stageEl.classList.toggle('stage--wide', farmView && deviceLand);
    gated2 = !farmView && beat > FARM_BEAT && deviceLand && !stayLand;
    stageEl.classList.toggle('c4-gating', gated || gated2);
    gate2.hidden = !gated2;
    container.classList.toggle('c4-vn', !farmView);
    container.classList.toggle('is-land', mode === 'land');
    container.classList.toggle('is-port', mode === 'port');
    scene.gate.hidden = !gated;
    if (container.dataset.bg !== mode) { setBackground(scene.bgwrap, mode); container.dataset.bg = mode; }
    const [dw, dh] = DESIGN[mode], R = stage();
    const s = Math.min(R.width / dw, R.height / dh), w = scene.world.style;
    w.setProperty('--dw', `${dw}px`); w.setProperty('--dh', `${dh}px`); w.setProperty('--s', String(s));
    w.setProperty('--ox', `${(R.width - dw * s) / 2}px`); w.setProperty('--oy', `${(R.height - dh * s) / 2}px`);
    container.style.background = mode === 'land' ? 'linear-gradient(#8FD3F4 0 14%, #6BAF2E 14%)' : 'linear-gradient(#8FD3F4 0 29%, #6BAF2E 29%)';
    placeChick();
    const show3 = glOk && farmView;
    container.classList.toggle('c4-3d', show3);
    if (show3 && !gated) ensure3d();
    view3 = !!v3 && show3 && !gated;
    if (v3) { v3.setActive(view3); if (view3) { v3.setMode(mode); placeHits(); } }
  }
  const relayout = () => { layout(); later(layout, 200); };
  window.addEventListener('resize', relayout); window.addEventListener('orientationchange', relayout);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', relayout);
  cleanups.push(() => {
    window.removeEventListener('resize', relayout); window.removeEventListener('orientationchange', relayout);
    if (screen.orientation && screen.orientation.removeEventListener) screen.orientation.removeEventListener('change', relayout);
    stageEl.classList.remove('stage--wide', 'c4-gating');
    leaveFull();
  });
  // Toque en la compuerta: intenta pantalla completa y bloquear apaisado (Android); en iOS solo espera el giro
  scene.gate.addEventListener('click', async (e) => {
    if (e.target.closest('.c4-gate-link')) return;
    try { await document.documentElement.requestFullscreen(); } catch (err) { /* no disponible */ }
    try { await screen.orientation.lock('landscape'); } catch (err) { /* iOS u otros: nada que hacer */ }
  });
  scene.gateLink.addEventListener('click', () => { preferPortrait = true; layout(); });

  // Mamá: saltito alegre + chispas (conserva el delantal) y el pollito salta a otra posición
  const happy = (k = 'hen', ki = 0) => {
    if (v3 && view3) { // 3D: mamá gira hacia el paso completado y salta; el pollito cambia de sitio
      v3.momLook(k, ki); v3.momHop(); v3.chickHop();
      const m = v3.screenOfMom(); api.fx.sparkle(m.x, m.y + 14, 8); return;
    }
    restart(scene.momB, 'c4-happy', 650);
    const c = center(scene.momB); api.fx.sparkle(c.x, c.y - c.h * 0.32, 8);
    chickI = (chickI + 1) % 4; placeChick();
    restart(scene.chick, 'c4-hop', 600);
  };

  // Atenúa lo inactivo al 50 % y pone el halo ámbar en el siguiente objetivo
  function refresh() {
    const step = nextStep(S);
    const isNext = (t, i) => !cooking && !delivering && (
      (step === 'veg' && t === 'veg' && !S.veg[i]) || step === t);
    const isDone = (t, i) => ({ veg: !!S.veg[i], hen: !!S.fed, wok: !!S.cooked || cooking, sleigh: !!S.loaded, egg: S.egg === 2, plate: !!S.plated, deliver: !!S.done })[t];
    const nextKeys = [];
    targets.forEach((el) => {
      const t = el.dataset.t, i = +el.dataset.i || 0;
      const next = isNext(t, i), dn = isDone(t, i);
      if (next && t !== 'deliver') nextKeys.push(t === 'veg' ? `veg${i}` : t);
      el.classList.toggle('is-next', next);
      el.classList.toggle('is-done', !next && !!dn);
      el.classList.toggle('is-off', !next && !dn);
      el.setAttribute('aria-disabled', next ? 'false' : 'true');
    });
    plots.forEach((p, i) => p.classList.toggle('harvested', !!S.veg[i]));
    scene.egg.hidden = S.egg !== 1;
    scene.plate.hidden = !(S.cooked && !S.plated);
    scene.deliver.hidden = !(S.loaded && !S.done && !delivering);
    scene.sleigh.classList.toggle('loaded', !!S.loaded);
    scene.sleigh.classList.toggle('gone', !!S.done);
    container.classList.toggle('c4-complete', !!S.done);
    if (v3) v3.setNext(nextKeys);
  }

  // ----- acciones -----
  function harvest(i, btn) {
    S.veg[i] = 1; persist(); sfx('pop');
    const kind = ['cabbage', 'carrot', 'onion'][i];
    if (v3 && view3) { // 3D: squash-and-stretch + hojas dentro de la escena
      v3.harvest(i);
      order.fly(ghost(v3.screen('veg', i)), kind, () => { shown++; order.setVeg(shown, true); sfx('tap'); });
    } else {
      const veg = btn.querySelector('.c4-veg'), c = center(veg);
      if (api.fx.blockBounce) api.fx.blockBounce(btn); // la parcela rebota…
      restart(btn, 'c4-pick', 450);                    // …y la planta hace squash-and-stretch
      for (let k = 0; k < 7; k++) puff(container, c.x, c.y, ART.leaf, { dx: (k - 3) * 15, dy: -30 - Math.random() * 30, rot: 160, size: 16, dur: 800, reduced: reduced() });
      order.fly(veg, kind, () => { shown++; order.setVeg(shown, true); sfx('tap'); });
    }
    happy('veg', i); refresh();
    say(S.veg.every(Boolean) ? 'hen' : '¡Muy bien! Sigue cosechando');
  }
  function feed() {
    S.fed = 1; persist(); sfx('cluck');
    if (v3 && view3) {
      const c = v3.screen('hen'); v3.peck();
      puff(container, c.x + 4, c.y - 40, ART.heart, { dx: 6, dy: -58, grav: -10, rot: 12, size: 24, dur: 1100, delay: 250, reduced: reduced() });
    } else {
      const c = center(scene.hen);
      for (let k = 0; k < 6; k++) puff(container, c.x - 20 + k * 8, c.y - 52, ART.grain, { dx: (k - 3) * 6, dy: 30, grav: 10, rot: 200, size: 12, dur: 700, delay: k * 50, reduced: reduced() });
      puff(container, c.x + 4, c.y - 30, ART.heart, { dx: 6, dy: -58, grav: -10, rot: 12, size: 24, dur: 1100, delay: 250, reduced: reduced() });
      restart(scene.hen, 'c4-peck', 900);
    }
    happy('hen'); refresh(); say('wait');
    later(layEgg, 1500);
  }
  function layEgg() {
    S.egg = 1; persist(); sfx('pop');
    scene.egg.hidden = false;
    if (v3 && view3) { v3.layEgg(); const c = v3.screen('egg'); api.fx.sparkle(c.x, c.y, 8); }
    else { restart(scene.egg, 'c4-appear', 600); const c = center(scene.egg); api.fx.sparkle(c.x, c.y, 8); }
    refresh(); say('egg');
  }
  function takeEgg() {
    S.egg = 2; persist(); sfx('pop');
    if (v3 && view3) { order.fly(ghost(v3.screen('egg')), 'egg', () => { order.setEgg(true, true); sfx('tap'); }); v3.takeEgg(); }
    else order.fly(scene.egg, 'egg', () => { order.setEgg(true, true); sfx('tap'); });
    scene.egg.hidden = true; happy('hen'); refresh(); say('wok');
  }
  function cook() {
    cooking = true; sfx('page'); refresh();
    scene.wok.classList.add('cooking'); scene.bar.hidden = false;
    if (v3 && view3) { v3.setCooking(true); v3.momLook('wok'); }
    scene.barFill.style.transition = 'none'; scene.barFill.style.width = '0%'; void scene.barFill.offsetWidth;
    scene.barFill.style.transition = 'width 2s linear'; scene.barFill.style.width = '100%';
    say('¡Qué rico huele!');
    later(() => sfx('page'), 1000);
    later(() => {
      cooking = false; S.cooked = 1; persist();
      scene.wok.classList.remove('cooking'); scene.bar.hidden = true;
      if (v3) { v3.setCooking(false); v3.popPlate(); }
      sfx('chime'); happy('wok'); refresh(); restart(scene.plate, 'c4-appear', 600); say('plate');
    }, 2000);
  }
  function takePlate() {
    S.plated = 1; persist(); sfx('pop');
    if (v3 && view3) { order.fly(ghost(v3.screen('plate')), 'plate', () => { order.setDish(true, true); sfx('chime'); }); v3.takePlate(); }
    else order.fly(scene.plate, 'plate', () => { order.setDish(true, true); sfx('chime'); });
    scene.plate.hidden = true; happy('plate'); refresh(); say('sleigh');
  }
  function load() {
    S.loaded = 1; persist(); sfx('pop');
    if (v3) v3.load();
    happy('sleigh'); refresh(); restart(scene.sleigh, 'c4-load', 600); say('deliver');
  }
  function deliver() {
    delivering = true; refresh(); sfx('page');
    say('done', { hideButton: true }); // la narración cambia en el momento de entregar; CONTINUAR llega al final
    scene.sleigh.classList.add('takeoff');
    if (v3 && view3) v3.takeoff();
    // 0,6 s: mamá reacciona. Con novela visual la frase llega en la escena posterior; sin ella, en un bocadillo.
    later(() => {
      happy('sleigh'); sfx('cluck');
      if (!vn) { scene.bubble.querySelector('span').textContent = MOM_CATCHPHRASE; scene.bubble.hidden = false; restart(scene.bubble, 'c4-say', 2600); }
    }, 600);
    // 1,5 s: lluvia de Pandoras (se otorga una sola vez y se guarda como completa)
    later(() => {
      S.done = 1; persist();
      api.showPandoras();
      if (!wasDone) api.addPandoras(PANDORAS_REWARD);
      rain();
    }, 1500);
    later(() => {
      scene.bubble.hidden = true; delivering = false; refresh();
      // Escena de novela posterior (mamá riendo con su frase y luego orgullosa); sin novela también funciona como texto
      BEATS[FARM_BEAT] = { text: HINT.done };
      api.setBeats(BEATS, 3);
    }, 4300);
  }
  // Pandoras: dijes en arco con "+1" (api.fx.coinArc, contrato global) + monedas escalonadas
  function rain() {
    for (let k = 0; k < 8; k++) later(() => sfx('coin'), k * 150);
    const hud = document.getElementById('hud-pandoras');
    if (api.fx.coinArc && hud && !reduced()) {
      const c = v3 && view3 ? v3.screen('sleigh') : center(scene.sleigh); // coinArc usa coordenadas relativas al escenario
      api.fx.coinArc({ x: c.x, y: c.y - 20 }, hud, 8);
      return;
    }
    const R = stage(), n = reduced() ? 0 : 18; // respaldo si coinArc no existe
    for (let k = 0; k < n; k++) {
      const c = document.createElement('span');
      c.className = 'c4-charm'; c.innerHTML = ART.charm;
      const x = 14 + Math.random() * (R.width - 56);
      c.style.left = `${x}px`; c.style.top = '-40px';
      container.appendChild(c);
      const dur = 1500 + Math.random() * 900, rot = (Math.random() - 0.5) * 540;
      const a = c.animate([
        { transform: 'translateY(0) rotate(0)', opacity: 0 },
        { opacity: 1, offset: 0.1 },
        { transform: `translateY(${R.height * (0.5 + Math.random() * 0.4)}px) rotate(${rot}deg)`, opacity: 1, offset: 0.8 },
        { transform: `translateY(${R.height * 0.95}px) rotate(${rot * 1.2}deg)`, opacity: 0 },
      ], { duration: dur, delay: k * 55, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'both' });
      a.onfinish = () => c.remove();
      later(() => c.remove(), dur + k * 55 + 400);
    }
  }

  // ----- toques (fuera de orden: un meneo suave y nada más) -----
  const wiggle = (el) => { sfx('tap'); if (v3 && view3) { const k = tKey(el); if (k.t !== 'deliver') { v3.wiggle(k.t, k.i); return; } } restart(el, 'c4-wig', 450); };
  // Toque sobre el lienzo 3D: raycaster contra volúmenes de toque generosos → mismo manejador que los botones (accesibles)
  const onStageClick = (e) => {
    if (!(v3 && view3) || e.target.closest('button, .c4-order, .c4-gate')) return;
    const h = v3.hit(e.clientX, e.clientY); if (!h) return;
    const el = targets.find((b) => b.dataset.t === h.key && (+b.dataset.i || 0) === h.i);
    if (el && !el.hidden) el.click();
  };
  container.addEventListener('click', onStageClick);
  cleanups.push(() => container.removeEventListener('click', onStageClick));
  targets.forEach((el) => el.addEventListener('click', () => {
    const t = el.dataset.t, i = +el.dataset.i || 0;
    if (el.getAttribute('aria-disabled') !== 'false' || el.hidden) { wiggle(el); return; }
    ({ veg: () => harvest(i, el), hen: feed, egg: takeEgg, wok: cook, plate: takePlate, sleigh: load, deliver })[t]();
  }));

  // ----- arranque / reanudación -----
  api.hideSkip();
  order.setVeg(shown); order.setEgg(S.egg === 2); order.setDish(!!S.plated);
  // Solo el beat de granja exige haber terminado; las escenas de novela avanzan con CONTINUAR
  api.onContinue((ctx) => { if (ctx.beat === FARM_BEAT && !S.done) return false; });
  api.onBeat((i) => { layout(); applyBeat(i); if (i === FARM_BEAT) refresh(); });
  if (S.done) api.showPandoras();
  refresh();
  api.setBeats(BEATS);
  layout();
  if (nextStep(S) === 'wait') later(layEgg, 1500); // recarga justo mientras la gallina ponía el huevo
}

export function unmount() {
  disposed = true; clearTimers();
  cleanups.forEach((fn) => { try { fn(); } catch (e) {} }); cleanups = [];
}
