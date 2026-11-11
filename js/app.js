import { TRIP, GRID, STAGES, PRIZES, CELLS, PRELAUNCH } from './data.js';
import { initPrelaunch } from './prelaunch.js';
import { createStore, createLocalAdapter } from './store.js';
import { createSupabaseAdapter, createCode, isValidCode } from './sync.js';
import { SUPABASE } from './config.js';

const STORAGE_KEY = 'aussie-bingo-meso:v1';

const INTRO_KEY = 'aussie-bingo-meso:intro';
const SYNC_CODE_KEY = 'aussie-bingo-meso:sync';
const REFEREE_KEY = 'aussie-bingo-meso:referee';

// Preferencias de este dispositivo (no forman parte del progreso).
const readFlag = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeFlag = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
};

const $ = (id) => document.getElementById(id);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.5 4.5 8.5-10" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const byId = new Map(CELLS.map((cell) => [cell.id, cell]));
const stageTitle = new Map(STAGES.map((stage) => [stage.id, stage.title]));
const prize = (id) => PRIZES.find((p) => p.id === id);

// Sincronización entre móviles (inactiva hasta que se activa desde la web).
const remote = createSupabaseAdapter({ ...SUPABASE, codeKey: SYNC_CODE_KEY });

const store = createStore({
  ids: CELLS.map((cell) => cell.id),
  alwaysDone: CELLS.filter((cell) => cell.kind === 'free').map((cell) => cell.id),
  adapters: [createLocalAdapter(STORAGE_KEY), remote],
});

// ── Líneas: filas y columnas completas ──────────────────────────────────────
const LINES = (() => {
  const cols = GRID.columns;
  const rows = Math.ceil(CELLS.length / cols);
  const lines = [];
  for (let r = 0; r < rows; r++) lines.push(CELLS.slice(r * cols, r * cols + cols).map((c) => c.id));
  for (let c = 0; c < cols; c++) lines.push(CELLS.filter((_, i) => i % cols === c).map((cell) => cell.id));
  return lines;
})();

const completedLines = () => LINES.filter((line) => line.every((id) => store.isDone(id)));
const doneCount = () => CELLS.filter((cell) => store.isDone(cell.id)).length;

// ── Pintado inicial (una sola vez) ──────────────────────────────────────────
const cellButtons = new Map();
const ruleButtons = new Map();
const stageCounters = new Map();

function renderStatic() {
  $('kicker').textContent = TRIP.kicker;
  $('title').textContent = TRIP.title;
  $('route').textContent = TRIP.route.join(' → ');
  $('people').textContent = TRIP.people;
  $('rules-kicker').textContent = TRIP.rulesKicker;
  $('rules-title').textContent = TRIP.rulesTitle;
  $('rules-note').textContent = TRIP.rulesNote;
  $('howto-title').textContent = TRIP.howToTitle;
  $('howto').textContent = TRIP.howTo;
  $('pdf-link').href = TRIP.pdf;

  // «¿En qué consiste?»: abierto la primera vez; después recuerda si se cerró.
  const intro = $('intro');
  $('intro-title').textContent = TRIP.introTitle;
  $('intro-close').textContent = TRIP.introClose;
  for (const step of TRIP.intro) $('intro-steps').append(el('li', '', step));
  intro.open = readFlag(INTRO_KEY) !== 'closed';
  intro.addEventListener('toggle', () => writeFlag(INTRO_KEY, intro.open ? 'open' : 'closed'));
  $('intro-close').addEventListener('click', () => {
    intro.open = false;
  });

  // Cartón
  const grid = $('grid');
  grid.style.setProperty('--cols', GRID.columns);
  for (const cell of CELLS) {
    const button = el('button', 'cell');
    button.type = 'button';
    button.dataset.id = cell.id;
    button.setAttribute('aria-haspopup', 'dialog');
    if (cell.kind) button.classList.add(`cell--${cell.kind}`);

    const check = el('span', 'cell__check');
    check.innerHTML = CHECK_SVG;
    const full = el('span', 'cell__full');
    full.append(el('span', 'cell__cat', cell.category), el('span', 'cell__text', cell.text));
    if (cell.note) full.append(el('span', 'cell__note', cell.note));
    button.append(check, el('span', 'cell__short', cell.short), full);

    button.addEventListener('click', () => openSheet(cell.id));
    cellButtons.set(cell.id, button);
    grid.append(button);
  }

  // Instrucciones, agrupadas por etapa
  const rules = $('rules');
  for (const stage of STAGES) {
    const cells = CELLS.filter((cell) => cell.stage === stage.id);
    if (!cells.length) continue;
    const section = el('section', 'stage');
    const heading = el('h3', 'stage__title');
    const counter = el('span', 'stage__count');
    heading.append(el('span', '', stage.title), counter);
    stageCounters.set(stage.id, { counter, cells });
    const list = el('ul', 'stage__list');
    for (const cell of cells) {
      const item = el('li');
      const button = el('button', 'rule');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      const check = el('span', 'rule__check');
      check.innerHTML = CHECK_SVG;
      const text = el('span', 'rule__text');
      text.append(el('b', '', cell.ruleTitle), ` ${cell.rule}`);
      button.append(check, text);
      button.addEventListener('click', () => openSheet(cell.id));
      ruleButtons.set(cell.id, button);
      item.append(button);
      list.append(item);
    }
    section.append(heading, list);
    rules.append(section);
  }

  // Premios
  for (const p of PRIZES) {
    const item = el('li', `prize prize--${p.id}`);
    item.append(el('span', 'prize__label', p.label), el('span', '', p.text));
    $('prizes').append(item);
  }
}

// ── Actualización al cambiar el estado ──────────────────────────────────────
function update() {
  const lines = completedLines();
  const inLine = new Set(lines.flat());
  const done = doneCount();

  for (const cell of CELLS) {
    const isDone = store.isDone(cell.id);
    const state = isDone ? 'hecha' : 'pendiente';
    const name = cell.kind === 'secret' ? 'Casilla secreta' : `${cell.category}: ${cell.text}`;

    const button = cellButtons.get(cell.id);
    button.classList.toggle('is-done', isDone);
    button.classList.toggle('in-line', inLine.has(cell.id));
    button.setAttribute('aria-label', `${name}. ${state}`);

    const rule = ruleButtons.get(cell.id);
    rule.classList.toggle('is-done', isDone);
    rule.setAttribute('aria-label', `${cell.ruleTitle} ${cell.rule} ${state}`);
  }

  for (const { counter, cells } of stageCounters.values()) {
    counter.textContent = `${cells.filter((c) => store.isDone(c.id)).length}/${cells.length}`;
  }

  $('count-cells').textContent = `${done}/${CELLS.length}`;
  $('count-lines').textContent = `${lines.length}/${LINES.length}`;
  $('progress-fill').style.width = `${(done / CELLS.length) * 100}%`;
  const bar = $('progress');
  bar.setAttribute('aria-valuemax', CELLS.length);
  bar.setAttribute('aria-valuenow', done);
  bar.setAttribute('aria-valuetext', `${done} de ${CELLS.length} casillas, ${lines.length} de ${LINES.length} líneas`);

  if (sheet.open) fillSheet(sheet.dataset.id);
}

// ── Ficha de casilla ────────────────────────────────────────────────────────
const sheet = $('sheet');

function fillSheet(id) {
  const cell = byId.get(id);
  const isDone = store.isDone(id);
  sheet.dataset.id = id;
  sheet.classList.toggle('is-done', isDone);
  sheet.classList.toggle('is-secret', cell.kind === 'secret');
  $('sheet-cat').textContent = cell.category;
  $('sheet-stage').textContent = stageTitle.get(cell.stage) ?? '';
  $('sheet-title').textContent = cell.text;
  $('sheet-note').textContent = cell.note ?? '';
  $('sheet-note').hidden = !cell.note;
  $('sheet-rule-title').textContent = cell.ruleTitle;
  $('sheet-rule').textContent = cell.rule;

  const toggle = $('sheet-toggle');
  toggle.disabled = store.isLocked(id);
  toggle.textContent = store.isLocked(id)
    ? 'Casilla gratis · siempre marcada'
    : isDone
      ? 'Desmarcar casilla'
      : 'Marcar como hecha';
  toggle.classList.toggle('btn--primary', !isDone);
  toggle.classList.toggle('btn--outline', isDone);
}

function openSheet(id) {
  fillSheet(id);
  sheet.showModal();
}

$('sheet-close').addEventListener('click', () => sheet.close());
$('sheet-toggle').addEventListener('click', () => {
  const id = sheet.dataset.id;
  const linesBefore = completedLines().length;
  const wasFull = doneCount() === CELLS.length;
  store.toggle(id);
  sheet.close();

  if (!store.isDone(id)) return;
  if (!wasFull && doneCount() === CELLS.length) {
    showFull();
  } else if (completedLines().length > linesBefore) {
    const p = prize('line');
    showToast(`¡${p.label}! ${p.text}`);
  }
});

// Cerrar los diálogos al tocar fuera.
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

// ── Avisos ──────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4500);
}

function showFull() {
  const p = prize('full');
  $('full-title').textContent = `¡${p.label}!`;
  $('full-text').textContent = p.text;
  $('full-dialog').showModal();
}
$('full-close').addEventListener('click', () => $('full-dialog').close());

// ── Reinicio con doble confirmación ─────────────────────────────────────────
const resetDialog = $('reset-dialog');
const RESET_STEPS = [
  {
    title: '¿Reiniciar el cartón?',
    text: 'Se desmarcarán todas las casillas.',
    textSynced: 'Se desmarcarán todas las casillas, también en el otro móvil.',
    confirm: 'Sí, reiniciar',
  },
  {
    title: '¿Seguro del todo?',
    text: 'Se borra todo el progreso y no se puede deshacer.',
    confirm: 'Borrar todo',
  },
];
let resetStep = 0;

function showResetStep(step) {
  resetStep = step;
  $('reset-title').textContent = RESET_STEPS[step].title;
  const { text, textSynced } = RESET_STEPS[step];
  $('reset-text').textContent = (remote.getCode() && textSynced) || text;
  $('reset-confirm').textContent = RESET_STEPS[step].confirm;
  $('reset-cancel').focus();
}

$('reset-open').addEventListener('click', () => {
  resetDialog.showModal();
  showResetStep(0);
});
$('reset-cancel').addEventListener('click', () => resetDialog.close());
$('reset-confirm').addEventListener('click', () => {
  if (resetStep === 0) {
    showResetStep(1);
    return;
  }
  store.reset();
  resetDialog.close();
  showToast('Cartón reiniciado');
});

// ── Sincronización entre móviles ────────────────────────────────────────────
const syncDialog = $('sync-dialog');
const SYNC_STATUS = {
  off: '',
  syncing: 'Sincronizando…',
  ok: 'Sincronizado',
  error: 'Sin conexión. Se sincronizará al recuperarla.',
};
let pendingCode = null; // código de un enlace recibido, a la espera de confirmar

const shareLink = () => `${location.origin}${location.pathname}#sync=${remote.getCode()}`;

function renderSync() {
  const on = Boolean(remote.getCode());
  const joining = Boolean(pendingCode);
  $('sync-open-label').textContent = on ? 'Sincronización activada' : 'Sincronizar móviles';

  $('sync-title').textContent = joining
    ? '¿Unirte al cartón compartido?'
    : on
      ? 'Sincronización activada'
      : 'Sincronizar móviles';
  $('sync-text').textContent = joining
    ? 'Lo que haya marcado en este móvil se juntará con el cartón compartido.'
    : on
      ? 'Abre este enlace en el otro móvil. A partir de ahí, lo que marque uno lo verá el otro.'
      : 'Comparte el cartón entre dos móviles: lo que marque uno lo verá el otro. Se crea un enlace privado para abrir en el otro móvil.';

  const link = $('sync-link');
  link.hidden = !on || joining;
  link.value = on ? shareLink() : '';

  const status = on && !joining ? remote.getStatus() : 'off';
  $('sync-status').textContent = SYNC_STATUS[status];
  $('sync-status').dataset.status = status;

  $('sync-primary').textContent = joining ? 'Unirme' : on ? 'Compartir enlace' : 'Activar';
  $('sync-secondary').textContent = joining ? 'Cancelar' : 'Cerrar';
  $('sync-off').hidden = !on || joining;
}

function activateSync(code) {
  remote.setCode(code);
  store.flush();
  renderSync();
}

async function shareSyncLink() {
  const url = shareLink();
  if (navigator.share) {
    try {
      await navigator.share({ title: TRIP.title, text: 'Cartón compartido', url });
    } catch {
      /* compartir cancelado */
    }
    return;
  }
  const button = $('sync-primary');
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = '¡Enlace copiado!';
  } catch {
    $('sync-link').select();
    button.textContent = 'Copia el enlace de arriba';
  }
  setTimeout(renderSync, 2200);
}

// Enlace recibido: …/#sync=CÓDIGO. Se quita de la barra y se pide confirmar.
function checkJoinLink() {
  const match = location.hash.match(/^#sync=(.+)$/);
  if (!match) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!remote.available || !isValidCode(match[1]) || match[1] === remote.getCode()) return;
  pendingCode = match[1];
  renderSync();
  if (!syncDialog.open) syncDialog.showModal();
}

if (remote.available) {
  $('sync-open').hidden = false;
  remote.onStatus(renderSync);
  $('sync-open').addEventListener('click', () => {
    renderSync();
    syncDialog.showModal();
  });
  $('sync-primary').addEventListener('click', () => {
    if (pendingCode) {
      const code = pendingCode;
      pendingCode = null;
      activateSync(code);
      syncDialog.close();
      showToast('Cartón compartido conectado');
    } else if (remote.getCode()) {
      shareSyncLink();
    } else {
      activateSync(createCode());
    }
  });
  $('sync-secondary').addEventListener('click', () => syncDialog.close());
  $('sync-off').addEventListener('click', () => {
    remote.setCode(null);
    renderSync();
  });
  syncDialog.addEventListener('close', () => {
    pendingCode = null;
  });
  window.addEventListener('hashchange', checkJoinLink);
  renderSync();
}

// ── Pestañas ────────────────────────────────────────────────────────────────
const tabs = [...document.querySelectorAll('[role="tab"]')];

function selectTab(tab, { focus = false } = {}) {
  for (const other of tabs) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    $(other.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
  const bar = document.querySelector('.bar');
  if (bar.getBoundingClientRect().top <= 0) bar.scrollIntoView();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    selectTab(tabs[(index + step + tabs.length) % tabs.length], { focus: true });
  });
});

// ── Arranque ────────────────────────────────────────────────────────────────
// El bingo se activa en PRELAUNCH.unlockAt. Antes de esa fecha solo se ve la
// intro, salvo en modo árbitro: abrir la web con #arbitro una vez lo activa en
// ese dispositivo (para preparar y probar el cartón antes del viaje).
function startBingo() {
  document.documentElement.classList.remove('gate-pending', 'is-locked');
  renderStatic();
  store.subscribe(update);
  store.init();
  checkJoinLink();
}

const root = document.documentElement;
const unlockAt = Date.parse(PRELAUNCH.unlockAt);
const claimReferee = () => {
  if (location.hash !== '#arbitro') return false;
  writeFlag(REFEREE_KEY, '1');
  history.replaceState(null, '', location.pathname + location.search);
  return true;
};
claimReferee();
window.addEventListener('hashchange', () => claimReferee() && location.reload());
const isReferee = readFlag(REFEREE_KEY) === '1';

if (Date.now() >= unlockAt || isReferee) {
  if (Date.now() < unlockAt) {
    $('referee').hidden = false;
    $('referee-exit').addEventListener('click', () => {
      try {
        localStorage.removeItem(REFEREE_KEY);
      } catch {
        /* sin almacenamiento */
      }
      location.reload();
    });
  }
  startBingo();
} else {
  root.classList.replace('gate-pending', 'is-locked');
  initPrelaunch({ onUnlock: startBingo });
}
