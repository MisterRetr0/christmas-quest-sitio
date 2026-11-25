// ui.js — componentes de interfaz: guirnalda, texto por frases, HUD de Pandoras,
// botón de sonido (toque = silenciar, pulsación larga = volumen) y diálogo de papel.
import { reducedMotion } from './fx.js';

const $ = (id) => document.getElementById(id);

// ---------- Guirnalda de progreso ----------
/** Crea los adornos. onJump(i) se llama solo para adornos ya visitados. */
export function buildGarland(titles, onJump) {
  const nav = $('garland');
  nav.textContent = '';
  const items = titles.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'orn';
    // corazón entintado (6 = progreso); relleno rojo = visitado, naranja = actual; con trama a 45° al sombrear
    b.innerHTML = '<svg viewBox="0 0 28 26" aria-hidden="true"><path class="heart" d="M14 24 C4 16 1.5 11 1.5 7.5 C1.5 3.8 4.4 1.5 7.6 1.5 C10.4 1.5 12.6 3 14 5.4 C15.4 3 17.6 1.5 20.4 1.5 C23.6 1.5 26.5 3.8 26.5 7.5 C26.5 11 24 16 14 24Z"/><path class="hatch" d="M14 24 C24 16 26.5 11 26.5 7.5 L23 8 C22 13 19 17 14 21Z" fill="url(#hatch45)" stroke="none"/></svg>';
    b.addEventListener('click', () => { if (b.dataset.visited === 'true') onJump(i); });
    nav.appendChild(b);
    return b;
  });
  return {
    update(visited, current) {
      items.forEach((b, i) => {
        const v = visited.includes(i);
        b.dataset.visited = String(v);
        b.setAttribute('aria-disabled', String(!v || i === current));
        b.setAttribute('aria-label', `Capítulo ${i + 1}: ${titles[i]}${v ? (i === current ? ' (actual)' : ', repetir') : ' (aún no visitado)'}`);
        if (i === current) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    },
  };
}

// ---------- Texto: fundido por frase (250 ms), nunca letra por letra ----------
export function splitSentences(text) {
  return String(text).replace(/([.!?…]+["”]?)\s+/g, '$1\u0001').split('\u0001').filter(Boolean);
}
export function revealText(text) {
  const el = $('narration');
  el.textContent = '';
  el.classList.toggle('no-anim', reducedMotion());
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  if (words > 28) console.warn(`[ui] Pantalla con ${words} palabras (máx. ~28):`, text);
  splitSentences(text).forEach((s, i) => {
    const sp = document.createElement('span');
    sp.className = 'sent'; sp.textContent = s;
    sp.style.animationDelay = `${i * 350}ms`;
    el.appendChild(sp);
  });
}

// ---------- Placa de nombre del diálogo (A2 §4): atributo data-speaker + ::before en CSS ----------
export function setSpeaker(name) {
  const el = $('narration');
  if (name) el.dataset.speaker = String(name); else delete el.dataset.speaker;
}

// ---------- HUD de Pandoras ----------
export function setPandorasHud(n, { show = true, bounce = false } = {}) {
  const hud = $('hud-pandoras');
  if (show) hud.hidden = false;
  $('pandoras-count').textContent = String(n);
  if (bounce && !reducedMotion()) {
    hud.classList.remove('bounce'); void hud.offsetWidth; hud.classList.add('bounce');
  }
}
export function hidePandorasHud() { $('hud-pandoras').hidden = true; }

// ---------- Botón de sonido ----------
export function initSoundButton(audio) {
  const btn = $('sound-btn'), pop = $('vol-pop'), range = $('vol-range');
  let timer = 0, long = false, closeTimer = 0;

  const refresh = () => {
    btn.dataset.muted = String(audio.isMuted());
    btn.setAttribute('aria-label', audio.isMuted()
      ? 'Sonido silenciado. Toca para activar; mantén pulsado para el volumen'
      : 'Sonido activado. Toca para silenciar; mantén pulsado para el volumen');
  };
  const openPop = () => {
    range.value = Math.round(audio.getVolume() * 100);
    pop.hidden = false; armClose();
  };
  const closePop = () => { pop.hidden = true; clearTimeout(closeTimer); };
  const armClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(closePop, 3500); };

  btn.addEventListener('pointerdown', () => {
    long = false; clearTimeout(timer);
    timer = setTimeout(() => { long = true; openPop(); }, 500); // pulsación larga ~500 ms
  });
  const cancel = () => clearTimeout(timer);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointercancel', cancel);
  btn.addEventListener('pointerup', () => {
    cancel();
    if (long) return;                 // la pulsación larga ya abrió el control
    audio.unlock(); audio.toggleMute(); refresh();
  });
  // Teclado: Enter/Espacio = silenciar; Mayúscula+Enter o menú contextual = volumen
  btn.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.shiftKey) { e.preventDefault(); audio.unlock(); audio.toggleMute(); refresh(); }
    else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); openPop(); }
  });
  btn.addEventListener('contextmenu', (e) => { e.preventDefault(); openPop(); });
  range.addEventListener('input', () => {
    audio.unlock();
    audio.setVolume(range.value / 100);
    if (audio.isMuted() && range.value > 0) audio.setMuted(false);
    refresh(); armClose();
  });
  document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) closePop(); });
  refresh();
}

// ---------- Diálogo de papel ----------
/** Devuelve una promesa con el id del botón elegido. buttons: [{id,label,primary}] */
export function paperDialog(title, buttons, subtitle = '') {
  return new Promise((resolve) => {
    const root = $('modal-root');
    const box = document.createElement('div');
    box.className = 'paper-dialog parchment'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    const seal = document.createElement('span'); seal.className = 'seal'; seal.setAttribute('aria-hidden', 'true'); box.appendChild(seal);
    const h = document.createElement('h2'); h.textContent = title; h.id = 'dlg-title';
    box.setAttribute('aria-labelledby', 'dlg-title');
    const row = document.createElement('div'); row.className = 'btns';
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'btn' + (b.primary ? ' primary' : ' btn--ghost'); el.textContent = b.label;
      el.addEventListener('click', () => { root.textContent = ''; resolve(b.id); });
      row.appendChild(el);
    });
    box.append(h); if (subtitle) { const p = document.createElement('p'); p.textContent = subtitle; box.append(p); } else h.style.marginBottom = '18px';
    box.append(row); root.appendChild(box);
    row.firstChild.focus();
  });
}
