// audio.js — WebAudio puro, sin archivos. Todo sintetizado y original.
// Se desbloquea en el primer gesto del usuario (unlock()). Volumen y silencio se guardan.

const KEY = 'cq.audio.v1';
let ctx = null, master = null, sfxBus = null, musicBus = null, reverb = null;
let volume = 0.7, muted = false;
let musicOn = false, musicTimer = null, nextBarTime = 0, barIndex = 0;

// --- persistencia (try/catch siempre) ---
try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (s) { volume = clamp(+s.volume, 0, 1); muted = !!s.muted; }
} catch (e) { /* sin almacenamiento: valores por defecto */ }
function persist() { try { localStorage.setItem(KEY, JSON.stringify({ volume, muted })); } catch (e) {} }
function clamp(v, a, b) { return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a; }

export function getVolume() { return volume; }
export function isMuted() { return muted; }
export function isUnlocked() { return !!ctx; }

function applyVolume() {
  if (!ctx) return;
  master.gain.setTargetAtTime(muted ? 0 : volume * volume, ctx.currentTime, 0.05); // curva cuadrática
}
export function setVolume(v) { volume = clamp(v, 0, 1); persist(); applyVolume(); }
export function setMuted(m) { muted = !!m; persist(); applyVolume(); }
export function toggleMute() { setMuted(!muted); return muted; }

/** Crea/reanuda el AudioContext. Llamar desde un gesto del usuario. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.35;
    sfxBus.connect(master); musicBus.connect(master);
    // sala de piedra: reverberación generada (sin archivos) → aire de aventura de fantasía
    reverb = ctx.createConvolver(); reverb.buffer = impulse(2.8, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    const mSend = ctx.createGain(); mSend.gain.value = 0.7; musicBus.connect(mSend); mSend.connect(reverb);
    const sSend = ctx.createGain(); sSend.gain.value = 0.35; sfxBus.connect(sSend); sSend.connect(reverb);
    reverb.connect(wet); wet.connect(master);
    master.connect(comp); comp.connect(ctx.destination);
    applyVolume();
    // Pausa el audio con la pestaña oculta
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

// ---------- utilidades de síntesis ----------
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Oscilador con envolvente simple. */
function tone({ f = 440, type = 'sine', t = 0, dur = 0.3, g = 0.2, a = 0.005, slideTo = null, dest = sfxBus, detune = 0 }) {
  const t0 = ctx.currentTime + t;
  const o = ctx.createOscillator(), v = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.linearRampToValueAtTime(g, t0 + a);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(v); v.connect(dest);
  o.start(t0); o.stop(t0 + dur + 0.05);
  return { o, v };
}
/** Ruido filtrado. */
function noise({ t = 0, dur = 0.2, g = 0.1, freq = 1000, q = 1, type = 'bandpass', dest = sfxBus, sweepTo = null }) {
  const t0 = ctx.currentTime + t;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t0);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const v = ctx.createGain();
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.linearRampToValueAtTime(g, t0 + dur * 0.15);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(v); v.connect(dest);
  s.start(t0); s.stop(t0 + dur + 0.05);
}
/** Campanita: fundamental + parciales inarmónicos con caída rápida. */
function bell(f, t, dur = 1.4, g = 0.18, dest = sfxBus) {
  tone({ f, t, dur, g, a: 0.004, dest });
  tone({ f: f * 2.76, t, dur: dur * 0.55, g: g * 0.35, a: 0.002, dest });
  tone({ f: f * 5.4, t, dur: dur * 0.25, g: g * 0.15, a: 0.002, dest });
}

/** Respuesta de impulso estéreo: ruido con caída exponencial. */
function impulse(sec, decay) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
/** Arpa: pulsación brillante con caída larga. */
function harp(f, t, g = 0.14, dest = sfxBus, dur = 1.8) {
  tone({ f, type: 'triangle', t, dur, g, a: 0.003, dest });
  tone({ f: f * 2, type: 'sine', t, dur: dur * 0.5, g: g * 0.35, a: 0.002, dest });
  tone({ f: f * 3, type: 'sine', t, dur: dur * 0.2, g: g * 0.12, a: 0.002, dest });
}
/** Voz de ocarina / flauta: seno con vibrato que entra tarde, armónico suave y soplo. */
function flute(f, t, dur, g = 0.12, dest = sfxBus) {
  const t0 = ctx.currentTime + t, end = t0 + Math.max(0.12, dur);
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), v = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o2.type = 'triangle'; o2.frequency.setValueAtTime(f * 2, t0);
  lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(f * 0.007, t0 + Math.min(0.35, dur * 0.6));
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  const v2 = ctx.createGain(); v2.gain.value = 0.12;
  v.gain.setValueAtTime(0.0001, t0); v.gain.linearRampToValueAtTime(g, t0 + 0.05); v.gain.setValueAtTime(g * 0.85, Math.max(t0 + 0.06, end - 0.08)); v.gain.exponentialRampToValueAtTime(0.0001, end + 0.12);
  o.connect(v); o2.connect(v2); v2.connect(v); v.connect(dest);
  [o, o2, lfo].forEach((x) => { x.start(t0); x.stop(end + 0.2); });
  noise({ t, dur: 0.09, g: g * 0.25, freq: f * 2, q: 2, dest });
}
/** Cuerdas: sierras desafinadas por un paso bajo, ataque lento. */
function strings(notes, t, dur, g = 0.05, dest = sfxBus, cutoff = 1400) {
  const t0 = ctx.currentTime + t;
  const lp = ctx.createBiquadFilter(), v = ctx.createGain();
  lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 0.5;
  v.gain.setValueAtTime(0.0001, t0); v.gain.linearRampToValueAtTime(g, t0 + Math.min(0.7, dur * 0.4)); v.gain.setValueAtTime(g, t0 + dur * 0.8); v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.6);
  lp.connect(v); v.connect(dest);
  notes.forEach((n) => [-7, 7].forEach((dt) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = dt; o.connect(lp); o.start(t0); o.stop(t0 + dur + 0.7); }));
}
/** Timbal: seno grave con caída de tono + golpe de ruido. */
function timpani(f, t, g = 0.35, dest = sfxBus) {
  tone({ f: f * 1.5, slideTo: f, type: 'sine', t, dur: 0.9, g, a: 0.002, dest });
  noise({ t, dur: 0.12, g: g * 0.4, freq: 180, type: 'lowpass', dest });
}

// ---------- efectos ----------
const SFX = {
  /** Puerta que cruje: sierra con frecuencia temblorosa a través de un paso de banda. */
  creak() {
    const dur = 1.5, t0 = ctx.currentTime;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), v = ctx.createGain();
    o.type = 'sawtooth';
    const curve = new Float32Array(24);
    for (let i = 0; i < curve.length; i++) curve[i] = 70 + Math.random() * 60 + (i / curve.length) * 40;
    o.frequency.setValueCurveAtTime(curve, t0, dur);
    f.type = 'bandpass'; f.Q.value = 9;
    f.frequency.setValueAtTime(380, t0); f.frequency.linearRampToValueAtTime(900, t0 + dur);
    v.gain.setValueAtTime(0.0001, t0);
    v.gain.linearRampToValueAtTime(0.35, t0 + 0.2);
    v.gain.linearRampToValueAtTime(0.2, t0 + dur * 0.7);
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f); f.connect(v); v.connect(sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
    noise({ t: dur - 0.1, dur: 0.25, g: 0.15, freq: 160, type: 'lowpass' }); // golpecito final
  },
  /** Descubrimiento: arpa que sube en escala lidia y un acorde de campanas que queda flotando (original). */
  chime() {
    [62, 66, 69, 73, 76, 80, 81].forEach((n, i) => harp(midi(n + 12), i * 0.055, 0.11));
    [74, 78, 81, 85].forEach((n) => bell(midi(n + 12), 0.42, 2.2, 0.05));
  },
  /** Pulsación de arpa con un toque de madera. */
  pop() {
    harp(midi(79), 0, 0.16, sfxBus, 0.9);
    noise({ dur: 0.03, g: 0.08, freq: 2400, q: 3 });
  },
  cluck() {
    [0, 0.1, 0.22].forEach((t, i) => {
      tone({ f: 700 - i * 60, slideTo: 420, t, dur: 0.07, g: 0.16, type: 'square' });
      noise({ t, dur: 0.06, g: 0.06, freq: 900, q: 4 });
    });
  },
  /** Gema / dije: dos destellos cristalinos (sexta mayor) con brillo. */
  coin() {
    tone({ f: midi(88), type: 'triangle', t: 0, dur: 0.12, g: 0.13 });
    tone({ f: midi(97), type: 'triangle', t: 0.06, dur: 0.5, g: 0.12 });
    bell(midi(100), 0.06, 0.7, 0.05);
  },
  /** Hallazgo legendario: cuerdas que crecen sobre redoble de timbal y cadencia heroica bVI–bVII–I con metales y arpa (original). */
  reveal() {
    strings([45, 52, 57, 60], 0, 2.4, 0.045, sfxBus, 900);                                    // tensión (la menor)
    for (let k = 0; k < 14; k++) timpani(midi(33), 0.9 + k * 0.1, 0.08 + k * 0.012);          // redoble
    const brass = (notes, t, dur) => strings(notes, t, dur, 0.07, sfxBus, 2600);
    brass([53, 57, 60, 65], 2.4, 0.5);       // fa
    brass([55, 59, 62, 67], 2.9, 0.5);       // sol
    brass([57, 61, 64, 69], 3.4, 2.6);       // la mayor: ¡hallazgo!
    timpani(midi(33), 3.4, 0.45);
    [69, 73, 76, 81, 85, 88].forEach((n, i) => harp(midi(n), 3.4 + i * 0.06, 0.1));
    [76, 81, 85, 88, 93].forEach((n, i) => bell(midi(n), 3.6 + i * 0.1, 2.4, 0.08));
    flute(midi(81), 3.5, 0.5, 0.1); flute(midi(85), 4.0, 0.35, 0.1); flute(midi(88), 4.35, 1.6, 0.11);
  },
  tap() { tone({ f: 1046, type: 'triangle', dur: 0.08, g: 0.1 }); tone({ f: 1568, type: 'sine', t: 0.02, dur: 0.12, g: 0.04 }); },
  page() { noise({ dur: 0.5, g: 0.1, freq: 500, sweepTo: 3000, q: 0.6 }); },
};

/** Reproduce un efecto por nombre. Si el audio no está desbloqueado, no hace nada. */
export function play(name) {
  if (!ctx || muted || !SFX[name]) return;
  try { SFX[name](); } catch (e) { console.warn('audio', name, e); }
}
export const sfxNames = Object.keys(SFX);

// ---------- música: vals de aventura (melodía ORIGINAL en re dórico): arpa, ocarina, cuerdas y bajo ----------
// 8 compases de 3 tiempos a 84 bpm. Acordes (notas MIDI) y melodía [tiempo, nota, duración en tiempos].
const BEAT = 60 / 84, BAR = 3;
const CHORDS = [[50, 53, 57], [48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50], [45, 49, 52]];
const MELODY = [
  [[0, 74, 1], [1, 77, 0.5], [1.5, 79, 0.5], [2, 81, 1]],
  [[0, 79, 1.5], [1.5, 76, 0.5], [2, 72, 1]],
  [[0, 74, 1], [1, 71, 1], [2, 74, 1]],
  [[0, 76, 2.8]],
  [[0, 77, 1], [1, 81, 0.5], [1.5, 84, 0.5], [2, 81, 1]],
  [[0, 79, 1], [1, 76, 1], [2, 79, 1]],
  [[0, 83, 1.5], [1.5, 81, 0.5], [2, 79, 1]],
  [[0, 76, 1], [1, 73, 1], [2, 76, 0.9]],
];

function scheduleBar(t, i) {
  const chord = CHORDS[i % 8];
  const off = t - ctx.currentTime;
  const second = Math.floor(i / 8) % 2 === 1;                       // 2.ª vuelta: la melodía sube una octava, más suave
  strings(chord.map((n) => n + 12), off, BEAT * BAR, 0.022, musicBus, 1100);
  tone({ f: midi(chord[0] - 12), type: 'triangle', t: off, dur: BEAT * 1.6, g: 0.16, a: 0.01, dest: musicBus });   // bajo
  tone({ f: midi(chord[2] - 12), type: 'triangle', t: off + BEAT * 2, dur: BEAT * 0.9, g: 0.1, a: 0.01, dest: musicBus });
  const arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24, chord[2] + 12, chord[1] + 12];
  arp.forEach((n, k) => harp(midi(n), off + k * BEAT / 2, 0.06, musicBus, 1.4));
  MELODY[i % 8].forEach(([b, n, d]) => flute(midi(n + (second ? 12 : 0)), off + b * BEAT, d * BEAT, second ? 0.05 : 0.075, musicBus));
}
function pump() {
  if (!musicOn || !ctx) return;
  while (nextBarTime < ctx.currentTime + 1.5) {
    if (nextBarTime < ctx.currentTime) nextBarTime = ctx.currentTime + 0.05;
    scheduleBar(nextBarTime, barIndex++);
    nextBarTime += BEAT * BAR;
  }
}
export function startMusic() {
  if (!ctx || musicOn) return;
  musicOn = true; nextBarTime = ctx.currentTime + 0.1; barIndex = 0;
  pump(); musicTimer = setInterval(pump, 400);
}
export function stopMusic() { musicOn = false; clearInterval(musicTimer); musicTimer = null; }
