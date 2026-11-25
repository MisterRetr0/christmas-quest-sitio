// vn-bridge.js — puente de los capítulos con el motor de novela visual (js/vn/vn.js, A2 §4).
// El motor lo construye otro desarrollador. Este puente lo carga de forma perezosa y DEGRADA con elegancia:
// si js/vn/vn.js aún no existe (o falla), todas las llamadas son inofensivas y los capítulos siguen mostrando solo el texto.
//
// Un beat de capítulo puede llevar:  { text, speaker, show:[[char,expr,side,opts]…], expr:{char:expr}, emote:[char,tipo]|[[char,tipo]…],
//                                      hop:char, shake:char, focus:char, hide:char|[chars], cg:'nombre'|null }
// Personajes: 'adventurer' | 'mom'. Lados: 'left' | 'center' | 'right'. Emotes: 'sweat' '!' '?' 'hearts' 'sparkle' 'anger' 'notes'.
import { revealText } from '../ui.js';

const arr = (v) => (v == null ? [] : Array.isArray(v) && Array.isArray(v[0]) ? v : [v]);

/**
 * @param {HTMLElement} container página del capítulo (aquí se crea la escena de sprites con vn.stage)
 * @param {object} api API del capítulo (usa api.setSpeaker si existe)
 */
export function makeVN(container, api) {
  let vn = null, ready = false;
  const queue = [];
  const loaded = import('../vn/vn.js').then((m) => {
    vn = m.vn || m.default || m;
    if (typeof vn.stage === 'function') vn.stage(container);
    ready = true; queue.splice(0).forEach((fn) => fn());
  }).catch(() => { vn = null; ready = true; });          // sin motor: solo texto

  const call = (name, ...args) => {
    const run = () => { try { if (vn && typeof vn[name] === 'function') vn[name](...args); } catch (e) { console.warn('[vn]', name, e); } };
    if (ready) run(); else queue.push(run);
  };
  const speaker = (name) => { try { api.setSpeaker && api.setSpeaker(name || ''); } catch (e) {} };

  return {
    loaded,
    has: () => !!vn,
    call,
    speaker,
    /** Aplica la especificación VN de un beat (todo opcional). */
    apply(spec = {}) {
      speaker(spec.speaker);
      arr(spec.hide).forEach((c) => call('hide', ...(Array.isArray(c) ? c : [c])));
      arr(spec.show).forEach((s) => call('show', s[0], s[1], s[2], s[3]));
      if (spec.expr) Object.entries(spec.expr).forEach(([c, e]) => call('expr', c, e));
      arr(spec.emote).forEach((e) => call('emote', e[0], e[1]));
      if (spec.hop) call('hop', spec.hop);
      if (spec.shake) call('shake', spec.shake);
      if ('focus' in spec) call('focus', spec.focus);       // focus:null = nadie atenuado
      if ('cg' in spec) { if (spec.cg) call('cg', spec.cg); else call('clearCg'); }
    },
    /** Muestra una línea de diálogo fuera de los beats (finales de rama) con el nombre del hablante. */
    say(text, who) { speaker(who); revealText(text); },
  };
}
