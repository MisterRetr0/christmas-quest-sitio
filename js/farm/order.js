// order.js — cartel de madera clavado con el pedido (siempre visible arriba a la derecha) y vuelo de productos hacia él.
import { ART } from './farm.js';

// Filas del pedido: clave → etiqueta
const ROWS = [['veg', 'Verduras ×3'], ['egg', 'Huevo'], ['dish', 'Chow mein']];

/**
 * @param {HTMLElement} root  contenedor del capítulo (position:absolute)
 * @returns {{el, setVeg(n), setEgg(b), setDish(b), fly(fromEl, kind, cb), slot(kind)}}
 */
export function createOrder(root, { reduced = () => false } = {}) {
  const el = document.createElement('aside');
  el.className = 'c4-order';
  el.setAttribute('aria-label', 'Pedido de hoy');
  el.innerHTML = `
    <i class="c4-seam"></i><i class="c4-seam"></i><i class="c4-nail"></i><i class="c4-nail"></i><i class="c4-nail"></i><i class="c4-nail"></i>
    <h3>Pedido de hoy</h3>
    <ul>${ROWS.map(([k, t]) => `<li data-k="${k}"><span class="c4-box"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11 L8 16 L17 4" /></svg></span><span class="c4-lbl">${t}</span></li>`).join('')}</ul>
    <p class="c4-sig">— N. Dios <small>(letra sospechosamente parecida a la de mamá)</small></p>`;
  root.appendChild(el);
  const li = (k) => el.querySelector(`li[data-k="${k}"]`);
  const tick = (k, on, pop) => {
    const r = li(k); r.classList.toggle('on', !!on);
    if (on && pop) { r.classList.remove('pop'); void r.offsetWidth; r.classList.add('pop'); }
  };

  const api = {
    el,
    setVeg(n, pop) { li('veg').querySelector('.c4-lbl').textContent = n > 0 && n < 3 ? `Verduras ${n}/3` : 'Verduras ×3'; tick('veg', n >= 3, pop); },
    setEgg(on, pop) { tick('egg', on, pop); },
    setDish(on, pop) { tick('dish', on, pop); },
    /** Elemento de la fila (destino del vuelo). */
    slot(kind) { return li(kind === 'cabbage' || kind === 'carrot' || kind === 'onion' ? 'veg' : kind === 'plate' ? 'dish' : 'egg'); },
    /**
     * Hace volar un icono (kind: cabbage|carrot|onion|egg|plate) desde `fromEl` hasta su fila de la tarjeta.
     * `cb` se llama al llegar (o de inmediato si hay movimiento reducido).
     */
    fly(fromEl, kind, cb) {
      const R = root.getBoundingClientRect();
      const a = fromEl.getBoundingClientRect(), b = api.slot(kind).querySelector('.c4-box').getBoundingClientRect();
      if (reduced()) { cb && cb(); return; }
      const f = document.createElement('span');
      f.className = 'c4-fly'; f.innerHTML = ART.icons[kind];
      const sx = a.left + a.width / 2 - R.left, sy = a.top + a.height / 2 - R.top;
      const ex = b.left + b.width / 2 - R.left, ey = b.top + b.height / 2 - R.top;
      f.style.left = `${sx - 24}px`; f.style.top = `${sy - 24}px`;
      root.appendChild(f);
      const dx = ex - sx, dy = ey - sy;
      const an = f.animate([
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: 'translate(0,-34px) scale(1.15)', opacity: 1, offset: 0.22 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7 - 30}px) scale(.85)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0.9 },
      ], { duration: 760, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' });
      let done = false;
      const fin = () => { if (done) return; done = true; f.remove(); cb && cb(); };
      an.onfinish = fin; setTimeout(fin, 1000);
    },
  };
  return api;
}
