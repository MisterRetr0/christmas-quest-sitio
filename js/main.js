// main.js — router de capítulos, estado, guardado/restauración y API para los capítulos.
//
// API que recibe cada capítulo en mount(container, api):
//   api.setBeats(beats, startAt=0)  beats: Array<string | {text, label?, hideButton?}>
//   api.getBeat() / api.getBeatCount()
//   api.onBeat(fn(index, beat))     se llama cada vez que cambia la pantalla (beat)
//   api.onContinue(fn(ctx))         fn devuelve false para cancelar el avance por defecto
//   api.setButton({label, hidden, disabled})   cambia el botón principal (hasta el próximo beat)
//   api.next()                      avanza un beat o pasa al siguiente capítulo
//   api.goChapter(i, beat=0)
//   api.showSkip(handler) / api.hideSkip()
//   api.addPandoras(n) / api.setPandoras(n) / api.getPandoras() / api.showPandoras()
//   api.getFarm() / api.setFarm(obj)   estado de la granja persistente
//   api.audio, api.fx                  módulos de audio y efectos
import * as audio from './audio.js';
import * as fx from './fx.js';
import * as ui from './ui.js';
import * as c1 from './chapters/c1-door.js';
import * as c2 from './chapters/c2-letter.js';
import * as c3 from './chapters/c3-dossier.js';
import * as c4 from './chapters/c4-farm.js';
import * as c5 from './chapters/c5-legendary.js';
import * as c6 from './chapters/c6-request.js';

const CHAPTERS = [c1, c2, c3, c4, c5, c6];
const SAVE_KEY = 'cq.save.v1';
const $ = (id) => document.getElementById(id);
const el = { stage: $('stage'), scenes: $('scenes'), next: $('next-btn'), back: $('back-btn'), skip: $('skip-btn') };

// ---------- Estado y guardado ----------
const fresh = () => ({ chapter: 0, beat: 0, pandoras: 0, pandorasShown: false, farm: {}, visited: [] });
let state = fresh();
let cur = null;      // sesión del capítulo activo
let busy = false;    // true durante la transición de página

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && Number.isInteger(s.chapter) && s.chapter >= 0 && s.chapter < CHAPTERS.length) return { ...fresh(), ...s };
  } catch (e) { /* sin almacenamiento o JSON dañado */ }
  return null;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ---------- Garland ----------
const garland = ui.buildGarland(CHAPTERS.map((c) => c.title), (i) => { if (!busy && i !== cur?.index) go(i, 0, i > cur.index ? 1 : -1); });

// ---------- Botón principal / beats ----------
function normBeat(b) { return typeof b === 'string' ? { text: b } : (b || { text: '' }); }

function applyButton(patch) {
  const b = { label: 'CONTINUAR', hidden: false, disabled: false };
  for (const k in patch) if (patch[k] !== undefined) b[k] = patch[k]; // ignora undefined
  el.next.textContent = b.label; el.next.hidden = !!b.hidden; el.next.disabled = !!b.disabled;
}

function renderBeat(s, i) {
  const n = Math.max(1, s.beats.length);
  s.beat = Math.min(Math.max(0, i), n - 1);
  const beat = normBeat(s.beats[s.beat]);
  ui.revealText(beat.text || '');
  applyButton({ label: beat.label, hidden: beat.hideButton });
  el.back.hidden = s.index === 0 && s.beat === 0;
  state.chapter = s.index; state.beat = s.beat; save();
  s.beatListeners.forEach((fn) => fn(s.beat, beat));
}

function advance(s) {
  if (s.beat < s.beats.length - 1) renderBeat(s, s.beat + 1);
  else if (s.index < CHAPTERS.length - 1) go(s.index + 1, 0, 1);
}
function retreat(s) {
  if (s.beat > 0) renderBeat(s, s.beat - 1);
  else if (s.index > 0) go(s.index - 1, 999, -1); // 999 = último beat (se recorta)
}

el.next.addEventListener('click', () => {
  if (busy || !cur) return;
  const s = cur;
  const ctx = { chapter: s.index, beat: s.beat, isLastBeat: s.beat >= s.beats.length - 1, isLastChapter: s.index === CHAPTERS.length - 1 };
  if (s.continueHandler && s.continueHandler(ctx) === false) return;
  advance(s);
});
el.back.addEventListener('click', () => { if (!busy && cur) retreat(cur); });
// Novela visual: tocar la caja de diálogo también avanza (igual que CONTINUAR, si está visible y habilitado)
document.getElementById('narration').addEventListener('click', () => { if (!busy && cur && !el.next.hidden && !el.next.disabled) el.next.click(); });
el.skip.addEventListener('click', () => { if (!busy && cur?.skipHandler) cur.skipHandler(); });

// ---------- API entregada a cada capítulo ----------
function makeApi(s) {
  const live = (fn) => (...a) => (cur === s ? fn(...a) : undefined); // ignora llamadas de capítulos ya desmontados
  const api = {
    audio, fx,
    // Durante mount() el router ya conoce el beat inicial (restaurado o 0); después, reinicia en startAt
    setBeats: live((beats, startAt = 0) => { s.beats = beats; if (s.mounted) renderBeat(s, startAt); }),
    setSpeaker: live((name) => ui.setSpeaker(name)),   // placa de nombre sobre .dialog (null = quitar)
    getBeat: () => s.beat,
    getBeatCount: () => s.beats.length,
    onBeat: (fn) => { s.beatListeners.push(fn); },
    onContinue: (fn) => { s.continueHandler = fn; },
    setButton: live((patch) => applyButton({ label: el.next.textContent, hidden: el.next.hidden, disabled: el.next.disabled, ...patch })),
    next: live(() => advance(s)),
    goChapter: live((i, beat = 0) => go(i, beat, i >= s.index ? 1 : -1)),
    showSkip: live((handler) => { s.skipHandler = handler; el.skip.hidden = false; }),
    hideSkip: live(() => { s.skipHandler = null; el.skip.hidden = true; }),
    showPandoras: live(() => { state.pandorasShown = true; ui.setPandorasHud(state.pandoras); save(); }),
    getPandoras: () => state.pandoras,
    setPandoras: live((n) => { state.pandoras = Math.max(0, n | 0); state.pandorasShown = true; ui.setPandorasHud(state.pandoras); save(); }),
    addPandoras: live((n = 1) => {
      state.pandoras += n; state.pandorasShown = true;
      ui.setPandorasHud(state.pandoras, { bounce: true }); audio.play('coin'); save();
    }),
    getFarm: () => state.farm,
    setFarm: live((obj) => { state.farm = obj || {}; save(); }),
  };
  return api;
}

// ---------- Transición "pasar la página" ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function transition(oldPage, newPage, dir) {
  if (fx.reducedMotion()) {                       // crossfade simple
    oldPage.classList.add('fade-out'); newPage.classList.add('fade-in');
    await wait(300);
  } else {
    audio.play('page');
    const shade = $('sheet-shadow'); shade.classList.remove('on'); void shade.offsetWidth; shade.classList.add('on');
    if (dir >= 0) oldPage.classList.add('turn-out');   // la hoja vieja se pasa hacia la izquierda
    else newPage.classList.add('turn-in');             // al volver, la hoja nueva cae encima
    await wait(620);
  }
  newPage.classList.remove('fade-in', 'turn-in');
}

async function go(index, beat = 0, dir = 1) {
  if (busy) return;
  busy = true;
  const old = cur;
  const mod = CHAPTERS[index];
  const page = document.createElement('section');
  page.className = 'page'; page.dataset.chapter = String(index + 1);
  page.setAttribute('aria-label', `Capítulo ${index + 1}: ${mod.title}`);
  const s = { index, mod, page, beats: [], beat: 0, startAt: beat, mounted: false, beatListeners: [], continueHandler: null, skipHandler: null };
  s.api = makeApi(s);

  if (old) old.dead = true;
  cur = s;
  el.skip.hidden = true; applyButton({});
  el.scenes.appendChild(page);
  try { mod.mount(page, s.api); } catch (e) { console.error(`Capítulo ${mod.id} falló al montar`, e); }
  s.mounted = true;
  renderBeat(s, s.startAt);

  if (!state.visited.includes(index)) state.visited.push(index);
  garland.update(state.visited, index);
  save();

  if (old) {
    await transition(old.page, page, dir);
    try { old.mod.unmount(); } catch (e) { console.error(`Capítulo ${old.mod.id} falló al desmontar`, e); }
    old.page.remove();
  } else {
    page.classList.add('enter');
    await wait(fx.reducedMotion() ? 50 : 400);
    page.classList.remove('enter');
  }
  busy = false;
}

// ---------- Personajes (.chibi): tinte de luz del capítulo recortado con la silueta del PNG ----------
// Cada <img class="chibi"> recibe un hermano .chibi-tint (multiply al 18 %, máscara = el propio PNG) alineado con la imagen.
function wireChibi(img) {
  if (img.dataset.tint) return;
  img.dataset.tint = '1';
  const t = document.createElement('div');
  t.className = 'chibi-tint'; t.setAttribute('aria-hidden', 'true');
  img.after(t);
  const sync = () => {
    if (!img.isConnected) return;
    t.style.left = img.offsetLeft + 'px'; t.style.top = img.offsetTop + 'px';
    t.style.width = img.offsetWidth + 'px'; t.style.height = img.offsetHeight + 'px';
    const src = img.currentSrc || img.src;
    if (src) { const u = `url("${src}")`; t.style.webkitMaskImage = u; t.style.maskImage = u; }
    const op = getComputedStyle(img).objectPosition; if (op) { t.style.webkitMaskPosition = op; t.style.maskPosition = op; }
  };
  img.addEventListener('load', sync); img.addEventListener('error', () => t.remove());
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(img);
  sync();
}
new MutationObserver((muts) => {
  muts.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.matches?.('img.chibi')) wireChibi(n);
    n.querySelectorAll?.('img.chibi').forEach(wireChibi);
  }));
}).observe(document.getElementById('scenes'), { childList: true, subtree: true });

// ---------- Arranque ----------
function restoreHud() {
  if (state.pandorasShown) ui.setPandorasHud(state.pandoras);
}

async function start() {
  fx.initSnow($('snow'));
  fx.initParallax(el.stage);
  ui.initSoundButton(audio);

  // Primer gesto del usuario: desbloquea WebAudio y arranca la música ambiental
  const firstGesture = () => { if (audio.unlock()) audio.startMusic(); };
  document.addEventListener('pointerdown', firstGesture, { once: true });
  document.addEventListener('keydown', firstGesture, { once: true });

  const saved = load();
  const hasProgress = saved && (saved.chapter > 0 || saved.beat > 0 || saved.pandoras > 0 || saved.visited.length > 1);
  if (hasProgress) {
    garland.update(saved.visited, -1);
    const choice = await ui.paperDialog('¿Seguimos donde quedamos?', [
      { id: 'resume', label: 'Continuar', primary: true },
      { id: 'restart', label: 'Empezar de nuevo' },
    ], `Capítulo ${saved.chapter + 1}: ${CHAPTERS[saved.chapter].title}`);
    if (choice === 'resume') { state = saved; restoreHud(); await go(state.chapter, state.beat, 1); return; }
    clearSave();
  }
  state = fresh();
  await go(0, 0, 1);
}

start();
