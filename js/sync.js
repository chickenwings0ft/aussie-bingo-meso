// Adaptador de sincronización con Supabase (misma forma que el de localStorage:
// load / save / subscribe; ver store.js).
//
// Cómo funciona:
//   · Un cartón compartido se identifica por un código secreto aleatorio que
//     vive en el enlace para compartir (#sync=CÓDIGO) y en localStorage.
//   · Cada sincronización es una sola llamada a la función sync_card(código,
//     casillas): el servidor fusiona (gana el cambio más reciente de cada
//     casilla) y devuelve el resultado.
//   · Sin código, el adaptador no hace nada: el cartón es solo local.
//   · Se sincroniza al cargar, al marcar, al volver a la pestaña, al recuperar
//     conexión y cada POLL_MS mientras la web está visible.

const POLL_MS = 15000;
const CODE_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

export const isValidCode = (code) => typeof code === 'string' && CODE_PATTERN.test(code);

export function createCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

export function createSupabaseAdapter({ url, key, codeKey }) {
  const available = Boolean(url && key);
  const statusListeners = new Set();
  let code = null;
  let latest = { version: 1, cells: {} }; // último estado local conocido
  let onRemote = () => {};
  let status = 'off'; // off | syncing | ok | error
  let timer;
  let running = null;
  let again = false;

  try {
    const saved = localStorage.getItem(codeKey);
    if (isValidCode(saved)) code = saved;
  } catch {
    /* sin almacenamiento */
  }

  function setStatus(next) {
    if (status === next) return;
    status = next;
    statusListeners.forEach((fn) => fn(status));
  }

  async function request(cells) {
    const response = await fetch(`${url}/rest/v1/rpc/sync_card`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code, p_cells: cells }),
    });
    if (!response.ok) throw new Error(`sync ${response.status}`);
    return { version: 1, cells: await response.json() };
  }

  // Envía el estado local y devuelve el fusionado (o null si no hay
  // sincronización o falla). Nunca hay dos llamadas a la vez.
  async function sync() {
    if (!available || !code) return null;
    if (running) {
      again = true;
      return running;
    }
    setStatus('syncing');
    running = (async () => {
      try {
        const usedCode = code;
        const remote = await request(latest.cells);
        if (code !== usedCode) return null;
        setStatus('ok');
        return remote;
      } catch {
        setStatus(code ? 'error' : 'off');
        return null;
      } finally {
        running = null;
        if (again) {
          again = false;
          sync().then((remote) => remote && onRemote(remote));
        }
      }
    })();
    return running;
  }

  const pull = () => sync().then((remote) => remote && onRemote(remote));

  function schedule() {
    clearInterval(timer);
    if (!available || !code) return;
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') pull();
    }, POLL_MS);
  }

  return {
    available,
    load: () => sync(),
    save(state) {
      latest = state;
      pull();
    },
    subscribe(onState) {
      onRemote = onState;
      schedule();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') pull();
      });
      window.addEventListener('online', pull);
      return () => clearInterval(timer);
    },

    // ── Extras propios de este adaptador (los usa la interfaz) ──
    getCode: () => code,
    getStatus: () => status,
    onStatus(fn) {
      statusListeners.add(fn);
      return () => statusListeners.delete(fn);
    },
    // Activa (o cambia) el cartón compartido; null lo desactiva en este móvil.
    setCode(next) {
      code = isValidCode(next) ? next : null;
      try {
        if (code) localStorage.setItem(codeKey, code);
        else localStorage.removeItem(codeKey);
      } catch {
        /* sin almacenamiento */
      }
      setStatus(code ? 'syncing' : 'off');
      schedule();
    },
  };
}
