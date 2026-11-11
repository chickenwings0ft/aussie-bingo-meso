# Aussie Bingo · Meso

Bingo del road trip por Australia (30 nov – 18 dic 2026). Web estática, mobile-first, sin framework, sin dependencias y sin paso de build. El progreso se guarda en localStorage y, opcionalmente, se sincroniza entre móviles con Supabase. Se despliega en Vercel desde `main`.

## Estructura

```
index.html          Esqueleto: cabecera, pestañas, paneles y diálogos (vacíos; los rellena app.js)
css/styles.css      Todos los estilos. Mobile-first; breakpoints en 360, 480, 720 y 900 px (texto completo de casilla desde 900 px)
js/data.js          TODO el contenido: cabecera, intro, etapas, casillas, instrucciones, premios
js/prelaunch.js     Intro previa al viaje: diapositivas, contadores y reproductor de Spotify
css/prelaunch.css   Estilos de la intro y del bloqueo del bingo
js/store.js         Estado del cartón, fusión de estados y adaptador de localStorage
js/sync.js          Adaptador de Supabase (sincronización entre móviles)
js/config.js        URL y clave pública del proyecto de Supabase
js/app.js           Pintado, ficha de casilla, líneas, avisos, reinicio, sincronización, pestañas
supabase/schema.sql Tabla y función del proyecto de Supabase (referencia; ya aplicado)
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

## Intro previa al viaje

Hasta `PRELAUNCH.unlockAt` (1 dic 2026, 9:30 en Gold Coast) la web solo enseña la intro: una pantalla de inicio, diapositivas que avanzan solas (deslizar o tocar a la derecha = siguiente, a la izquierda = anterior, mantener pulsado = pausa) y una última diapositiva fija con dos contadores. Al llegar la hora, la intro desaparece sola y se ve el bingo.

Todo se edita en `PRELAUNCH`, en `js/data.js`:

- **Fechas**: `unlockAt` (activación del juego) y `departureAt` (salida de España). Llevan su huso horario.
- **Marcar algo como conseguido**: en la diapositiva `loading` correspondiente (GoPro, tienda de campaña) pon `done: true`. En la de `progress` (planazos pagados) sube `done`.
- **Textos y orden**: array `slides`. Tipos disponibles: `title`, `text`, `hours`, `loading`, `progress`, `big`, `final`. `theme` es `green`, `gold`, `ink` o `paper`; `seconds` es lo que dura en pantalla.
- **Fotos**: guárdalas en `assets/fotos/` (redimensionadas a ~1300 px) y ponlas en `background` de la diapositiva: `{ src, alt, position }`. Con `dim: true` la foto se oscurece para que se lea encima.
- **Pegatina**: `sticker` (en la portada `start` y en las diapositivas `big`) es una foto recortada con fondo transparente (`assets/fotos/meso-luk.webp`). Para recortar otra foto: recorte de sujetos de macOS (Vision) y luego `cwebp -q 82 -alpha_q 90`.
- **Bandera**: `assets/bandera-australia.svg`.
- **Vista previa del enlace** (WhatsApp, etc.): `assets/og.jpg` (1200×630) y las etiquetas `og:` de `index.html`. El `<title>` y la vista previa no dicen «bingo» a propósito: el juego es sorpresa hasta el 1 dic.
- **Koalas y canguros**: `critters` de cada diapositiva: `koala-hang`, `koala-peek`, `roo-hop`, `rain`, `tape` (cinta de peligro). Son emojis animados.
- **Música**: cada diapositiva tiene su `track` (`spotify:track:ID`, de la playlist de `PRELAUNCH.playlist`). Se usa el reproductor oficial de Spotify con su API de inserción: al cambiar de diapositiva carga la canción y, si la música ya sonaba, la pone. La música arranca con «Empezar» (los navegadores no dejan sonar nada sin un toque). Sin sesión de Spotify suenan 30 s. Para sacar el id de una canción: en Spotify, Compartir → Copiar enlace, y el id es lo que va tras `/track/`. No subas archivos de música con copyright al repo: es público.

**Modo árbitro**: abrir la web una vez con `#arbitro` al final de la URL enseña el bingo en ese dispositivo antes de la fecha (para probar y preparar la sincronización). El botón «Ver la intro» lo desactiva.

El bloqueo es solo visual y usa el reloj del dispositivo: el contenido del bingo está en `data.js`, que es público. Sirve para no destripar la sorpresa, no como seguridad.

## Reglas del juego (en código)

- Línea = fila o columna completa (sin diagonales). La casilla gratis cuenta como marcada.
- Al completar una línea nueva: aviso de línea. Al completar el cartón: diálogo de cartón lleno.
- Reinicio con doble confirmación en un `<dialog>` propio. No usar `alert` / `confirm`.

## Guardado y sincronización

`store.js` separa el estado de dónde se guarda:

- Estado: `{ version: 1, cells: { [id]: { done, at } } }`. `at` es la fecha del último cambio.
- `mergeStates(a, b)` fusiona dos copias quedándose, casilla a casilla, con el cambio más reciente. Reiniciar escribe `done: false` con fecha nueva (no borra), para que también se propague.
- Un adaptador es `{ load(), save(state), subscribe(onState) }`. Hay dos, en este orden: localStorage (siempre) y Supabase (`sync.js`).

Sincronización entre móviles (Supabase):

- Está apagada hasta que alguien pulsa «Sincronizar móviles → Activar». Eso genera un código secreto aleatorio y un enlace `…/#sync=CÓDIGO`. Al abrirlo en el otro móvil y aceptar, los dos comparten cartón. El código se guarda en localStorage (`aussie-bingo-meso:sync`).
- No hay cuentas ni Realtime. Cada sincronización es una llamada a la función `sync_card(p_code, p_cells)`, que fusiona en el servidor y devuelve el resultado. Se llama al cargar, al marcar, al volver a la pestaña, al recuperar conexión y cada 15 s con la web visible. Sin conexión se sigue jugando en local y se fusiona después.
- Seguridad: la clave de `config.js` es la pública («publishable»). La tabla `cards` tiene RLS sin políticas, así que no se puede leer ni escribir directamente; solo a través de `sync_card`, y solo quien conoce el código de un cartón puede verlo o cambiarlo. En la base de datos se guarda el hash del código, no el código.
- Si cambias la función o la tabla, hazlo con una migración en Supabase y actualiza `supabase/schema.sql`.
- Nunca pongas en el repo la clave `service_role` ni la contraseña de la base de datos.

## Diseño

- Colores: verde `#0B6B45`, dorado `#F5B700`, tinta `#10261D`, fondo `#FFFDF6` (variables en `:root`).
- Fuentes: Anton (títulos) y Archivo (texto), de Google Fonts.
- Accesibilidad: casillas como `<button>`, contraste AA (sobre dorado, siempre texto en tinta; nunca verde ni blanco), objetivos táctiles ≥ 44 px, `prefers-reduced-motion` respetado.
- La web lleva `noindex, nofollow` (meta y cabecera HTTP). No añadas un `robots.txt` con `Disallow`: impediría que Google leyera el `noindex`.

## Despliegue

Push a `main` → Vercel despliega solo. Antes de dar un cambio por bueno, revísalo a 390 px y en escritorio.
