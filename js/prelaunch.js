// Intro previa al viaje: diapositivas tipo «stories» + cuenta atrás.
// Todo el texto, las fotos, los bichos, las canciones y las fechas salen de
// PRELAUNCH (data.js).
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

// ── Bandera de Australia (assets/bandera-australia.svg) ─────────────────────
function createFlag(extraClass = '') {
  const wrap = el('span', `pl-flag ${extraClass}`.trim());
  const img = el('img');
  img.src = 'assets/bandera-australia.svg';
  img.alt = 'Bandera de Australia';
  img.width = 1280;
  img.height = 640;
  wrap.append(img);
  return wrap;
}

// ── Fondo de cada diapositiva: color, sol, brillo y, si hay, foto ───────────
function createBackground(slide) {
  const bg = el('div', 'pl-bg');
  if (slide.background?.src) {
    const img = el('img', 'pl-bg__img');
    img.src = slide.background.src;
    img.alt = slide.background.alt ?? '';
    img.decoding = 'async';
    if (slide.background.position) img.style.objectPosition = slide.background.position;
    bg.append(img, el('div', 'pl-bg__shade'));
  }
  const glow = el('div', 'pl-glow');
  glow.setAttribute('aria-hidden', 'true');
  bg.append(glow);
  return bg;
}

// ── Koalas y canguros ───────────────────────────────────────────────────────
const KOALA = '🐨';
const ROO = '🦘';

const CRITTERS = {
  'koala-hang'() {
    const wrap = el('div', 'pl-critter pl-critter--hang');
    const swing = el('span', 'pl-swing');
    swing.append(el('span', 'pl-emoji', KOALA));
    wrap.append(el('span', 'pl-branch'), swing);
    return wrap;
  },
  'koala-peek'() {
    const wrap = el('div', 'pl-critter pl-critter--peek');
    wrap.append(el('span', 'pl-emoji', KOALA));
    return wrap;
  },
  'roo-hop'() {
    const wrap = el('div', 'pl-critter pl-critter--hop');
    const hop = el('span', 'pl-hop');
    hop.append(el('span', 'pl-emoji', ROO));
    wrap.append(hop);
    return wrap;
  },
  tape() {
    const wrap = el('div', 'pl-critter pl-critter--tape');
    const label = Array(8).fill('PELIGRO').join(' · ');
    wrap.append(el('span', 'pl-tape pl-tape--a', label), el('span', 'pl-tape pl-tape--b', label));
    return wrap;
  },
  rain() {
    const wrap = el('div', 'pl-critter pl-critter--rain');
    for (let i = 0; i < 16; i++) {
      const drop = el('span', 'pl-emoji', i % 2 ? KOALA : ROO);
      drop.style.setProperty('--x', `${(i * 61) % 100}%`);
      drop.style.setProperty('--d', `${((i * 37) % 23) / 10}s`);
      drop.style.setProperty('--s', `${1.6 + ((i * 13) % 9) / 10}s`);
      drop.style.setProperty('--r', `${((i * 47) % 70) - 35}deg`);
      wrap.append(drop);
    }
    return wrap;
  },
};

function createCritters(list = []) {
  const layer = el('div', 'pl-critters');
  layer.setAttribute('aria-hidden', 'true');
  for (const name of list) if (CRITTERS[name]) layer.append(CRITTERS[name]());
  return layer;
}

// ── Pegatina: foto recortada con fondo transparente ─────────────────────────
function createSticker(sticker, extraClass = '') {
  const img = el('img', `pl-sticker ${extraClass}`.trim());
  img.src = sticker.src;
  img.alt = sticker.alt ?? '';
  img.decoding = 'async';
  if (sticker.effect !== 'crash') return img;
  const wrap = el('div', 'pl-crash');
  const boom = el('span', 'pl-boom', '💥');
  boom.setAttribute('aria-hidden', 'true');
  wrap.append(img, boom);
  return wrap;
}

// ── Contenido de cada tipo de diapositiva ───────────────────────────────────
// Cada función devuelve los nodos y, si hace falta, un `tick` que se llama
// cada segundo.

// Texto que entra palabra a palabra.
function words(text, className) {
  const p = el('p', className);
  p.setAttribute('aria-label', text);
  text.split(' ').forEach((word, i) => {
    const span = el('span', 'pl-word', word);
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--w', i);
    p.append(span, ' ');
  });
  return p;
}

const BUILDERS = {
  title(slide) {
    const nodes = [];
    if (slide.flag) nodes.push(createFlag());
    if (slide.kicker) nodes.push(el('p', 'pl-kicker', slide.kicker));
    nodes.push(el('h2', 'pl-title pl-title--glow', slide.title), el('p', 'pl-lead', slide.text));
    return { nodes };
  },

  text(slide) {
    const nodes = [words(slide.text, 'pl-text')];
    if (slide.sticker?.src) nodes.push(createSticker(slide.sticker, 'pl-sticker--story'));
    return { nodes };
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
    const nodes = [];
    if (slide.shot?.src) {
      const frame = el('figure', 'pl-shot');
      const img = el('img');
      img.src = slide.shot.src;
      img.alt = slide.shot.alt ?? '';
      img.decoding = 'async';
      frame.append(img);
      if (slide.shot.rec) {
        const rec = el('span', 'pl-shot__rec', 'REC');
        rec.setAttribute('aria-hidden', 'true');
        frame.append(rec, el('span', 'pl-shot__res', '5.3K60'));
        frame.lastChild.setAttribute('aria-hidden', 'true');
      }
      nodes.push(frame);
    }
    const bar = el('div', `pl-loader${slide.done ? ' is-done' : ''}`);
    bar.append(el('span'));
    const status = el('p', 'pl-status', slide.done ? slide.doneText : slide.loadingText);
    nodes.push(el('h2', 'pl-title pl-title--mid pl-title--glow', slide.title), bar, status);
    return { nodes };
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
    if (slide.sticker?.src) nodes.push(createSticker(slide.sticker));
    return { nodes };
  },

  final(slide, targets) {
    const nodes = [];
    if (slide.flag) nodes.push(createFlag('pl-flag--small'));
    nodes.push(el('h2', 'pl-title pl-title--mid pl-title--glow', slide.title));
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

// ── Música: reproductor oficial de Spotify, una canción por diapositiva ─────
// El reproductor se controla con la API de inserción de Spotify: al cambiar de
// diapositiva se carga su canción y, si la música ya estaba sonando, se pone.
// Los navegadores solo dejan sonar audio después de que la persona toque algo,
// por eso la música empieza con el botón «Empezar» (o con el play del propio
// reproductor). Sin sesión de Spotify suenan fragmentos de 30 s.
function mountSpotify(container, firstUri) {
  let controller = null;
  let wanted = firstUri; // canción que debería estar cargada
  let loaded = firstUri; // canción cargada en el reproductor
  let active = false; // la música está «encendida»
  let pending = false; // se ha pedido sonar y aún no ha arrancado
  let fallbackTimer;

  const playSoon = () => {
    if (!controller || !active) return;
    pending = true;
    clearTimeout(fallbackTimer);
    // Si el reproductor no avisa de que está listo, se intenta igualmente.
    fallbackTimer = setTimeout(() => {
      if (pending && active) controller.play();
    }, 1200);
  };

  const load = (uri) => {
    if (!controller || uri === loaded) return;
    loaded = uri;
    controller.loadUri(uri);
    playSoon();
  };

  const slot = el('div');
  container.append(slot);
  window.onSpotifyIframeApiReady = (api) => {
    api.createController(slot, { uri: firstUri, width: '100%', height: 80, theme: 'dark' }, (created) => {
      controller = created;
      controller.addListener('ready', () => {
        if (pending && active) controller.play();
      });
      controller.addListener('playback_update', (event) => {
        const data = event?.data;
        if (!data) return;
        if (!data.isPaused) {
          active = true;
          pending = false;
          clearTimeout(fallbackTimer);
        } else if (!pending && data.position > 0 && data.position < data.duration - 1000) {
          // Pausa a mano: no se vuelve a poner sola al cambiar de diapositiva.
          active = false;
        }
      });
      if (wanted !== loaded) load(wanted);
      else if (active) {
        pending = true;
        controller.play();
      }
    });
  };

  // Plan B si la API de Spotify no carga: reproductor normal, al que se le
  // cambia la canción en cada diapositiva (aunque no puede ponerla sola).
  let frame = null;
  const embedUrl = (uri) => {
    const [, kind, id] = uri.split(':');
    return `https://open.spotify.com/embed/${kind}/${id}?theme=0`;
  };
  const useFallback = () => {
    if (controller || frame) return;
    slot.remove();
    frame = el('iframe');
    frame.src = embedUrl(wanted);
    frame.title = 'Reproductor de Spotify';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    container.append(frame);
  };

  // La API se intenta cargar dos veces antes de pasar al plan B.
  const loadApi = (attempt = 1) => {
    const script = el('script');
    script.src = `https://open.spotify.com/embed/iframe-api/v1${attempt > 1 ? `?retry=${Date.now()}` : ''}`;
    script.async = true;
    script.onerror = () => {
      script.remove();
      if (attempt < 2) setTimeout(() => loadApi(attempt + 1), 800);
      else useFallback();
    };
    document.head.append(script);
  };
  loadApi();

  return {
    // Primer toque de la persona: enciende la música.
    start(uri) {
      active = true;
      wanted = uri || wanted;
      if (!controller) return;
      if (wanted !== loaded) load(wanted);
      else {
        pending = true;
        controller.play();
      }
    },
    setTrack(uri) {
      if (!uri || uri === wanted) return;
      wanted = uri;
      if (frame) frame.src = embedUrl(uri);
      else load(uri);
    },
  };
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
  stage.dataset.theme = 'ink';
  const bars = el('div', 'pl-bars');
  bars.setAttribute('aria-hidden', 'true');
  const deck = el('div', 'pl-deck');

  const sections = slides.map((slide, i) => {
    const classes = ['pl-slide', `pl-slide--${slide.type}`, `pl-theme--${slide.theme}`];
    if (slide.background?.src) classes.push(slide.background.dim ? 'pl-slide--dim' : 'pl-slide--photo');
    const section = el('section', classes.join(' '));
    section.hidden = true;
    section.setAttribute('aria-label', `Diapositiva ${i + 1} de ${slides.length}`);
    section.append(createBackground(slide), createCritters(slide.critters));
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
  const intro = PRELAUNCH.start;
  const start = el('section', 'pl-slide pl-slide--start pl-theme--ink');
  start.append(createBackground({}), createCritters(intro.critters));
  const startBody = el('div', 'pl-body');
  const startButton = el('button', 'pl-button', flag.get() ? intro.again : intro.button);
  startButton.type = 'button';
  const skipButton = el('button', 'pl-button pl-button--ghost', intro.skip);
  skipButton.type = 'button';
  skipButton.hidden = !flag.get();
  if (intro.sticker?.src) {
    const img = el('img', 'pl-sticker pl-sticker--cover');
    img.src = intro.sticker.src;
    img.alt = intro.sticker.alt ?? '';
    img.decoding = 'async';
    img.fetchPriority = 'high';
    startBody.append(img);
  }
  if (intro.flag) startBody.append(createFlag('pl-flag--small'));
  startBody.append(
    el('p', 'pl-kicker', intro.kicker),
    el('h1', 'pl-title pl-title--mid pl-title--glow', intro.title),
    startButton,
    skipButton,
  );
  if (intro.track) startBody.append(el('p', 'pl-note', intro.hint));
  [...startBody.children].forEach((node, n) => {
    node.classList.add('pl-in');
    node.style.setProperty('--n', n);
  });
  start.append(startBody);
  deck.append(start);

  // Zonas para tocar: izquierda = atrás, derecha = siguiente
  const prev = el('button', 'pl-nav pl-nav--prev');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Anterior');
  const next = el('button', 'pl-nav pl-nav--next');
  next.type = 'button';
  next.setAttribute('aria-label', 'Siguiente');

  const replay = el('button', 'pl-button pl-button--ghost pl-replay', intro.again);
  replay.type = 'button';
  sections[last].querySelector('.pl-body').append(replay);

  const music = el('div', 'pl-music');
  const firstTrack = intro.track || slides.find((s) => s.track)?.track;
  let player = null;
  stage.append(bars, deck, prev, next);
  if (firstTrack) {
    stage.append(music);
    stage.classList.add('has-music');
    player = mountSpotify(music, firstTrack);
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
      section.style.transform = '';
      section.style.transition = '';
    });
    [...bars.children].forEach((bar, i) => {
      bar.className = `pl-bar${i < index || index === last ? ' is-done' : i === index ? ' is-active' : ''}`;
    });
    player?.setTrack(slides[index].track);
    if (index === last) flag.set();
  }

  bars.addEventListener('animationend', (event) => {
    if (event.target.parentElement?.classList.contains('is-active')) go(index + 1);
  });
  startButton.addEventListener('click', () => {
    player?.start(slides[0].track);
    go(0);
  });
  skipButton.addEventListener('click', () => {
    player?.start(slides[last].track);
    go(last);
  });
  replay.addEventListener('click', () => go(0));

  // Tras deslizar, el navegador también lanza un «click» del mismo gesto:
  // ese se ignora. El siguiente toque vuelve a contar.
  let swiped = false;
  const onNav = (step) => () => {
    if (swiped) {
      swiped = false;
      return;
    }
    const to = index + step;
    if (to >= 0 && to <= last) go(to);
  };
  next.addEventListener('click', onNav(1));
  prev.addEventListener('click', onNav(-1));

  // Deslizar: hacia la izquierda = siguiente, hacia la derecha = anterior.
  // La diapositiva sigue un poco al dedo mientras se arrastra.
  const SWIPE_MIN = 45;
  let drag = null;
  const current = () => sections[index];
  stage.addEventListener('pointerdown', (event) => {
    swiped = false;
    if (index < 0 || !event.isPrimary || event.target.closest('.pl-music, button:not(.pl-nav)')) return;
    drag = { x: event.clientX, y: event.clientY, dx: 0, horizontal: null };
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    drag.dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (drag.horizontal === null && Math.hypot(drag.dx, dy) > 8) {
      drag.horizontal = Math.abs(drag.dx) > Math.abs(dy);
    }
    if (!drag.horizontal) return;
    // Resistencia en los extremos (antes de la primera y después de la última).
    const edge = (drag.dx > 0 && index === 0) || (drag.dx < 0 && index === last);
    const section = current();
    section.style.transition = 'none';
    section.style.transform = `translateX(${drag.dx * (edge ? 0.12 : 0.35)}px)`;
  });
  const endDrag = (event) => {
    if (!drag) return;
    const { dx, horizontal } = drag;
    drag = null;
    const section = current();
    section.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
    section.style.transform = '';
    if (event.type === 'pointercancel' || !horizontal || Math.abs(dx) < SWIPE_MIN) return;
    swiped = true;
    if (dx < 0 && index < last) go(index + 1);
    else if (dx > 0 && index > 0) go(index - 1);
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

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
