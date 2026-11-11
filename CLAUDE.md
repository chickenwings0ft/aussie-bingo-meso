# Aussie Bingo · Meso

Bingo del road trip por Australia (30 nov – 18 dic 2026). Web estática, mobile-first, sin framework, sin dependencias y sin paso de build. Se despliega en Vercel desde `main`.

## Estructura

```
index.html          Esqueleto: cabecera, pestañas, paneles y diálogos (vacíos; los rellena app.js)
css/styles.css      Todos los estilos. Mobile-first; breakpoints en 480 px y 720 px
js/data.js          TODO el contenido: cabecera, intro, etapas, casillas, instrucciones, premios
js/store.js         Estado del cartón + adaptadores de guardado (hoy: localStorage)
js/app.js           Pintado, ficha de casilla, líneas, avisos, reinicio, pestañas
assets/             PDF original (botón «Descargar PDF»)
vercel.json         cleanUrls + cabecera X-Robots-Tag: noindex
```

No hay `package.json`. Para probar en local: `npx serve .` (con `file://` no cargan los módulos ES).

## Cambiar o añadir casillas

Solo se toca `js/data.js`.

- **Cambiar un texto**: edita `text` (texto completo), `short` (título corto del móvil), `category`, `ruleTitle` / `rule` (instrucción).
- **Orden**: el cartón se pinta por filas en el orden del array `CELLS`. Las instrucciones salen en ese mismo orden, agrupadas por `stage`.
- **Añadir o quitar**: `CELLS.length` debe seguir siendo múltiplo de `GRID.columns` (ahora 5 × 6 = 30). Las líneas (filas y columnas) se calculan solas.
- **`id`**: es la clave con la que se guarda el progreso. No lo cambies en una casilla ya publicada (se perdería su marca). Si sustituyes una casilla por otra distinta, ponle un `id` nuevo.
- **`short`**: en un móvil de 390 px la casilla mide unos 68 px. Usa palabras de 9 letras como mucho y 2–3 palabras en total.
- **`kind: 'free'`**: casilla gratis, siempre marcada, no se puede desmarcar. **`kind: 'secret'`**: casilla secreta (fondo oscuro).
- **Etapa nueva**: añádela a `STAGES` y usa su `id` en `stage`.
- **Premios y avisos**: `PRIZES`. Los avisos se forman como `¡{label}! {text}` con los premios `line` y `full`.

### Casilla secreta

La casilla `secreto` se queda como `???` con el texto «No preguntes. Lo sabrás cuando toque.». El repo y la web son públicos: no escribas qué es en ningún archivo, comentario ni mensaje de commit.

## Reglas del juego (en código)

- Línea = fila o columna completa (sin diagonales). La casilla gratis cuenta como marcada.
- Al completar una línea nueva: aviso de línea. Al completar el cartón: diálogo de cartón lleno.
- Reinicio con doble confirmación en un `<dialog>` propio. No usar `alert` / `confirm`.

## Guardado y sincronización futura

`store.js` separa el estado de dónde se guarda:

- Estado: `{ version: 1, cells: { [id]: { done, at } } }`. `at` es la fecha del último cambio.
- `mergeStates(a, b)` fusiona dos copias quedándose, casilla a casilla, con el cambio más reciente. Reiniciar escribe `done: false` con fecha nueva (no borra), para que también se propague.
- Un adaptador es `{ load(), save(state), subscribe(onState) }`; `load` y `save` pueden ser asíncronos.

Para sincronizar dos móviles (p. ej. Supabase): escribe `createSupabaseAdapter()` con esa forma (una fila por cartón con el estado en JSON, o una fila por casilla; `subscribe` con Realtime) y añádelo a `adapters` en `app.js`, detrás del de localStorage. No hay que tocar el pintado.

## Diseño

- Colores: verde `#0B6B45`, dorado `#F5B700`, tinta `#10261D`, fondo `#FFFDF6` (variables en `:root`).
- Fuentes: Anton (títulos) y Archivo (texto), de Google Fonts.
- Accesibilidad: casillas como `<button>`, contraste AA (sobre dorado, siempre texto en tinta; nunca verde ni blanco), objetivos táctiles ≥ 44 px, `prefers-reduced-motion` respetado.
- La web lleva `noindex, nofollow` (meta y cabecera HTTP). No añadas un `robots.txt` con `Disallow`: impediría que Google leyera el `noindex`.

## Despliegue

Push a `main` → Vercel despliega solo. Antes de dar un cambio por bueno, revísalo a 390 px y en escritorio.
