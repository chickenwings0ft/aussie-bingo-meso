// Estado del cartón, separado de dónde se guarda.
//
// El estado es un mapa por casilla con marca de tiempo:
//   { version: 1, cells: { [id]: { done: boolean, at: number } } }
// La marca de tiempo permite fusionar dos copias (dos móviles) quedándose con
// el cambio más reciente de cada casilla. Reiniciar no borra: escribe
// done:false con fecha nueva, para que el reinicio también se propague.
//
// Un «adaptador» es cualquier objeto con:
//   load()            → estado guardado o null (puede devolver una Promise)
//   save(state)       → guarda el estado completo (puede devolver una Promise)
//   subscribe(onState)→ avisa cuando el estado cambia fuera de esta pestaña;
//                       devuelve una función para cancelar
// Hay dos: localStorage (aquí) y Supabase (sync.js). El primero de la lista
// `adapters` (app.js) debe ser el local: se carga antes para pintar al instante.

const EMPTY = () => ({ version: 1, cells: {} });

function sanitize(raw) {
  const state = EMPTY();
  if (!raw || typeof raw !== 'object' || typeof raw.cells !== 'object' || !raw.cells) return state;
  for (const [id, cell] of Object.entries(raw.cells)) {
    if (cell && typeof cell === 'object') {
      state.cells[id] = { done: Boolean(cell.done), at: Number(cell.at) || 0 };
    }
  }
  return state;
}

// Fusiona dos estados: en cada casilla gana el cambio más reciente.
export function mergeStates(a, b) {
  const out = EMPTY();
  for (const source of [a, b]) {
    for (const [id, cell] of Object.entries(source.cells)) {
      const current = out.cells[id];
      if (!current || cell.at > current.at) out.cells[id] = { ...cell };
    }
  }
  return out;
}

export function createLocalAdapter(key) {
  return {
    load() {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Navegación privada o almacenamiento lleno: se sigue jugando en memoria.
      }
    },
    subscribe(onState) {
      const handler = (event) => {
        if (event.key !== key || !event.newValue) return;
        try {
          onState(JSON.parse(event.newValue));
        } catch {
          /* valor corrupto: se ignora */
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}

// ids: todas las casillas · alwaysDone: las que no se pueden desmarcar.
export function createStore({ ids, alwaysDone = [], adapters }) {
  const locked = new Set(alwaysDone);
  const listeners = new Set();
  let state = EMPTY();

  const emit = () => listeners.forEach((fn) => fn());
  const persist = (except) =>
    adapters.forEach((adapter) => adapter !== except && adapter.save(state));

  // Incorpora un estado que llega de fuera (otra pestaña, otro móvil) y lo
  // guarda en el resto de adaptadores.
  function receive(raw, source) {
    const merged = mergeStates(state, sanitize(raw));
    if (JSON.stringify(merged) === JSON.stringify(state)) return;
    state = merged;
    persist(source);
    emit();
  }

  function set(id, done) {
    if (locked.has(id) || !ids.includes(id)) return;
    state.cells[id] = { done, at: Date.now() };
    persist();
    emit();
  }

  return {
    async init() {
      // Primero lo guardado en este dispositivo, para pintar al instante.
      for (const adapter of adapters) {
        adapter.subscribe?.((raw) => receive(raw, adapter));
      }
      const [local, ...rest] = adapters;
      state = mergeStates(state, sanitize(await local.load()));
      emit();
      // Después los remotos; al terminar, todos reciben el estado fusionado.
      for (const adapter of rest) {
        state = mergeStates(state, sanitize(await adapter.load()));
      }
      persist();
      emit();
    },
    // Vuelve a enviar el estado a todos los adaptadores (p. ej. al activar la
    // sincronización).
    flush: () => persist(),
    isDone: (id) => locked.has(id) || Boolean(state.cells[id]?.done),
    isLocked: (id) => locked.has(id),
    toggle(id) {
      set(id, !this.isDone(id));
    },
    reset() {
      const at = Date.now();
      for (const id of Object.keys(state.cells)) state.cells[id] = { done: false, at };
      persist();
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
