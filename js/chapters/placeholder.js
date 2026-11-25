// placeholder.js — escena de relleno compartida por los 6 capítulos del esqueleto.
// Fondo SVG de capas de papel (con parallax) + título + silueta donde irá el PNG del personaje.

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {HTMLElement} container  página del capítulo
 * @param {{n:number,title:string,tint:string,far:string,mid:string,near:string,slot:string}} cfg
 * @returns {HTMLElement} el elemento .scene-body (para añadir cosas)
 */
export function buildPlaceholder(container, cfg) {
  container.style.setProperty('--tint', cfg.tint);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'bg');
  svg.setAttribute('viewBox', '0 0 360 640');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  // Tres capas de papel recortado con sombra entre capas (mismo borde en todos los mundos)
  svg.innerHTML = `
    <defs>
      <filter id="sh${cfg.n}" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="-3" stdDeviation="3" flood-color="#1F2A44" flood-opacity=".28"/>
      </filter>
    </defs>
    <rect width="360" height="640" fill="${cfg.tint}"/>
    <g class="layer" style="--d:4"><circle cx="270" cy="150" r="46" fill="#FFF8EE" opacity=".55"/></g>
    <g class="layer" style="--d:8" filter="url(#sh${cfg.n})"><path d="M-20 360 C60 300 140 340 200 310 S320 290 380 330 V660 H-20Z" fill="${cfg.far}"/></g>
    <g class="layer" style="--d:14" filter="url(#sh${cfg.n})"><path d="M-20 440 C70 390 150 450 230 420 S330 400 380 430 V660 H-20Z" fill="${cfg.mid}"/></g>
    <g class="layer" style="--d:22" filter="url(#sh${cfg.n})"><path d="M-20 520 C80 490 160 540 250 510 S340 495 380 515 V660 H-20Z" fill="${cfg.near}"/></g>`;
  container.appendChild(svg);

  const body = document.createElement('div');
  body.className = 'scene-body';
  body.innerHTML = `<p class="ch-kicker">Capítulo ${cfg.n}</p><h1 class="ch-title"></h1><div class="char-slot" role="img"></div>`;
  body.querySelector('.ch-title').textContent = cfg.title;
  const slot = body.querySelector('.char-slot');
  slot.setAttribute('aria-label', 'Espacio reservado para el personaje');
  slot.textContent = cfg.slot;
  container.appendChild(body);
  return body;
}
