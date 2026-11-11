// Intro previa al viaje: diapositivas tipo «stories» + cuenta atrás.
// Todo el texto y las fechas salen de PRELAUNCH (data.js).
import { PRELAUNCH } from './data.js';

const SEEN_KEY = 'aussie-bingo-meso:prelaunch-seen';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const pad = (n) => String(n).padStart(2, '0');
const flag = {
  get() {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  },
  set() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* sin almacenamiento */
    }
  },
};

function timeLeft(target) {
  const total = Math.max(0, Math.floor((target - Date.now()) / 1000));
  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    totalHours: Math.floor(total / 3600),
  };
}

// ── Bandera de Australia (SVG, proporciones oficiales) ──────────────────────
let flagCount = 0;
function star(cx, cy, radius, points) {
  const coords = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? radius * (4 / 9) : radius;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    coords.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${coords.join(' ')}"/>`;
}

function createFlag(extraClass = '') {
  const id = `pl-flag-${++flagCount}`;
  const wrap = el('span', `pl-flag ${extraClass}`.trim());
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Bandera de Australia');
  wrap.innerHTML = `
    <svg viewBox="0 0 10080 5040" aria-hidden="true">
      <defs>
        <clipPath id="${id}-a"><path d="M0,0v30h60v-30z"/></clipPath>
        <clipPath id="${id}-b"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>
      </defs>
      <rect width="10080" height="5040" fill="#012169"/>
      <svg width="5040" height="2520" viewBox="0 0 60 30">
        <g clip-path="url(#${id}-a)">
          <path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/>
          <path d="M0,0L60,30M60,0L0,30" clip-path="url(#${id}-b)" stroke="#C8102E" stroke-width="4"/>
          <path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/>
          <path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/>
        </g>
      </svg>
      <g fill="#fff">
        ${star(2520, 3780, 756, 7)}
        ${star(7560, 4200, 360, 7)}
        ${star(6300, 2205, 360, 7)}
        ${star(7560, 840, 360, 7)}
        ${star(8680, 1869, 360, 7)}
        ${star(8064, 2730, 210, 5)}
      </g>
    </svg>`;
  return wrap;
}

// ── Contenido de cada tipo de diapositiva ───────────────────────────────────
// Cada función devuelve los nodos y, si hace falta, un `tick` que se llama
// cada segundo.
const BUILDERS = {
  title(slide) {
    const nodes = [];
    if (PRELAUNCH.photo) {
      const img = el('img', 'pl-photo');
      img.src = PRELAUNCH.photo;
      img.alt = PRELAUNCH.photoAlt ?? '';
      nodes.push(img);
    }
    if (slide.flag) nodes.push(createFlag());
    if (slide.kicker) nodes.push(el('p', 'pl-kicker', slide.kicker));
    nodes.push(el('h2', 'pl-title', slide.title), el('p', 'pl-lead', slide.text));
    return { nodes };
  },

  text(slide) {
    return { nodes: [el('p', 'pl-text', slide.text)] };
  },

  hours(slide, targets) {
    const number = el('p', 'pl-number');
    const unit = el('p', 'pl-unit', slide.unit);
    const sub = el('p', 'pl-sub');
    const tick = () => {
      const left = timeLeft(targets.departureAt);
      number.textContent = left.totalHours.toLocaleString('es-ES');
      sub.textContent = left.total
        ? `${pad(left.minutes)} min ${pad(left.seconds)} s`
        : slide.doneText;
    };
    return { nodes: [el('p', 'pl-kicker', slide.kicker), number, unit, sub], tick };
  },

  loading(slide) {
    const bar = el('div', `pl-loader${slide.done ? ' is-done' : ''}`);
    bar.append(el('span'));
    const status = el('p', 'pl-status', slide.done ? slide.doneText : slide.loadingText);
    return { nodes: [el('h2', 'pl-title pl-title--mid', slide.title), bar, status] };
  },

  progress(slide) {
    const count = el('p', 'pl-number pl-number--mid', `${slide.done}/${slide.total}`);
    const pills = el('div', 'pl-pills');
    pills.setAttribute('role', 'img');
    pills.setAttribute('aria-label', `${slide.done} de ${slide.total} ${slide.unit}`);
    for (let i = 0; i < slide.total; i++) {
      const pill = el('span', i < slide.done ? 'is-on' : '');
      pill.style.setProperty('--i', i);
      pills.append(pill);
    }
    return {
      nodes: [
        el('p', 'pl-kicker', slide.title),
        count,
        pills,
        el('p', 'pl-lead', `${slide.done} de ${slide.total} ${slide.unit}`),
      ],
    };
  },

  big(slide) {
    const nodes = [el('p', 'pl-kicker pl-kicker--big', slide.title), el('p', 'pl-huge', slide.big)];
    if (slide.flag) nodes.unshift(createFlag());
    return { nodes };
  },

  final(slide, targets) {
    const nodes = [];
    if (PRELAUNCH.photo) {
      const img = el('img', 'pl-photo pl-photo--small');
      img.src = PRELAUNCH.photo;
      img.alt = PRELAUNCH.photoAlt ?? '';
      nodes.push(img);
    }
    if (slide.flag) nodes.push(createFlag('pl-flag--small'));
    nodes.push(el('h2', 'pl-title pl-title--mid', slide.title));
    const ticks = [];
    for (const counter of slide.counters) {
      const card = el('div', 'pl-counter');
      const digits = el('div', 'pl-digits');
      const cells = ['días', 'h', 'min', 's'].map((label) => {
        const box = el('span', 'pl-digit');
        const value = el('b');
        box.append(value, el('small', '', label));
        digits.append(box);
        return value;
      });
      const done = el('p', 'pl-counter__done', counter.doneText);
      done.hidden = true;
      card.append(el('p', 'pl-counter__label', counter.label), digits, done);
      nodes.push(card);
      ticks.push(() => {
        const left = timeLeft(targets[counter.target]);
        [left.days, pad(left.hours), pad(left.minutes), pad(left.seconds)].forEach((v, i) => {
          cells[i].textContent = v;
        });
        digits.hidden = !left.total;
        done.hidden = Boolean(left.total);
      });
    }
    nodes.push(el('p', 'pl-note', slide.note));
    return { nodes, tick: () => ticks.forEach((fn) => fn()) };
  },
};

// ── Música: reproductor oficial de Spotify ──────────────────────────────────
function mountSpotify(container, uri) {
  const [, kind, id] = uri.split(':');
  let controller = null;
  const fallback = () => {
    if (container.querySelector('iframe')) return;
    const frame = el('iframe');
    frame.src = `https://open.spotify.com/embed/${kind}/${id}?theme=0`;
    frame.title = 'Reproductor de Spotify';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.loading = 'lazy';
    container.append(frame);
  };
  const slot = el('div');
  container.append(slot);
  window.onSpotifyIframeApiReady = (api) => {
    api.createController(
      slot,
      { uri, width: '100%', height: 80, theme: 'dark' },
      (created) => {
        controller = created;
      },
    );
  };
  const script = el('script');
  script.src = 'https://open.spotify.com/embed/iframe-api/v1';
  script.async = true;
  script.onerror = fallback;
  document.head.append(script);
  // Algunos móviles solo dejan sonar si se toca el propio reproductor.
  return { play: () => controller?.play?.() };
}

// ── Montaje ─────────────────────────────────────────────────────────────────
export function initPrelaunch({ onUnlock }) {
  const root = document.getElementById('prelaunch');
  const targets = {
    departureAt: Date.parse(PRELAUNCH.departureAt),
    unlockAt: Date.parse(PRELAUNCH.unlockAt),
  };
  const slides = PRELAUNCH.slides;
  const last = slides.length - 1;
  const tickers = [];
  let index = -1; // -1 = pantalla de inicio

  const stage = el('div', 'pl-stage is-start');
  const bars = el('div', 'pl-bars');
  bars.setAttribute('aria-hidden', 'true');
  const deck = el('div', 'pl-deck');

  const sections = slides.map((slide, i) => {
    const section = el('section', `pl-slide pl-slide--${slide.type} pl-theme--${slide.theme}`);
    section.hidden = true;
    section.setAttribute('aria-label', `Diapositiva ${i + 1} de ${slides.length}`);
    section.append(el('div', 'pl-bg'));
    const body = el('div', 'pl-body');
    const { nodes, tick } = BUILDERS[slide.type](slide, targets);
    nodes.forEach((node, n) => {
      node.classList.add('pl-in');
      node.style.setProperty('--n', n);
      body.append(node);
    });
    if (tick) tickers.push(tick);
    section.append(body);
    deck.append(section);

    const bar = el('span', 'pl-bar');
    bar.append(el('i'));
    bar.style.setProperty('--dur', `${slide.seconds ?? 6}s`);
    bars.append(bar);
    return section;
  });

  // Pantalla de inicio
  const start = el('section', 'pl-slide pl-slide--start pl-theme--ink');
  start.append(el('div', 'pl-bg'));
  const startBody = el('div', 'pl-body');
  const startButton = el('button', 'pl-button', flag.get() ? PRELAUNCH.start.again : PRELAUNCH.start.button);
  startButton.type = 'button';
  const skipButton = el('button', 'pl-button pl-button--ghost', PRELAUNCH.start.skip);
  skipButton.type = 'button';
  skipButton.hidden = !flag.get();
  if (PRELAUNCH.start.flag) startBody.append(createFlag());
  startBody.append(
    el('p', 'pl-kicker', PRELAUNCH.start.kicker),
    el('h1', 'pl-title pl-title--mid', PRELAUNCH.start.title),
    startButton,
    skipButton,
  );
  if (PRELAUNCH.spotify) startBody.append(el('p', 'pl-note', PRELAUNCH.start.hint));
  start.append(startBody);
  deck.append(start);

  // Zonas para tocar: izquierda = atrás, derecha = siguiente
  const prev = el('button', 'pl-nav pl-nav--prev');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Anterior');
  const next = el('button', 'pl-nav pl-nav--next');
  next.type = 'button';
  next.setAttribute('aria-label', 'Siguiente');

  const replay = el('button', 'pl-button pl-button--ghost pl-replay', PRELAUNCH.start.again);
  replay.type = 'button';
  sections[last].querySelector('.pl-body').append(replay);

  const music = el('div', 'pl-music');
  let player = null;
  stage.append(bars, deck, prev, next);
  if (PRELAUNCH.spotify) {
    stage.append(music);
    stage.classList.add('has-music');
    player = mountSpotify(music, PRELAUNCH.spotify);
  }
  root.append(stage);
  root.hidden = false;

  function go(to) {
    index = Math.max(0, Math.min(last, to));
    stage.classList.remove('is-start');
    stage.classList.toggle('is-final', index === last);
    stage.dataset.theme = slides[index].theme;
    start.hidden = true;
    sections.forEach((section, i) => {
      section.hidden = i !== index;
    });
    [...bars.children].forEach((bar, i) => {
      bar.className = `pl-bar${i < index || index === last ? ' is-done' : i === index ? ' is-active' : ''}`;
    });
    if (index === last) flag.set();
  }

  bars.addEventListener('animationend', (event) => {
    if (event.target.parentElement?.classList.contains('is-active')) go(index + 1);
  });
  startButton.addEventListener('click', () => {
    player?.play();
    go(0);
  });
  skipButton.addEventListener('click', () => go(last));
  replay.addEventListener('click', () => go(0));
  next.addEventListener('click', () => index < last && go(index + 1));
  prev.addEventListener('click', () => index > 0 && go(index - 1));
  document.addEventListener('keydown', onKey);
  function onKey(event) {
    if (index < 0) return;
    if (event.key === 'ArrowRight') go(index + 1);
    if (event.key === 'ArrowLeft') go(index - 1);
  }

  // Mantener pulsado pausa el avance automático.
  const pause = (on) => stage.classList.toggle('is-paused', on);
  for (const zone of [prev, next]) {
    zone.addEventListener('pointerdown', () => pause(true));
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      zone.addEventListener(type, () => pause(false));
    }
  }

  // Reloj: actualiza contadores y abre el bingo cuando llega la hora.
  let timer;
  const tick = () => {
    tickers.forEach((fn) => fn());
    if (Date.now() >= targets.unlockAt) {
      clearInterval(timer);
      document.removeEventListener('keydown', onKey);
      root.hidden = true;
      root.replaceChildren();
      onUnlock();
    }
  };
  timer = setInterval(tick, 1000);
  tick();
}
