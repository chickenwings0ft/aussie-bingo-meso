# Aussie Bingo · Meso Road Trip 2026

Cartón de bingo para el road trip por Australia (30 nov – 18 dic 2026), pensado para usarse desde el móvil.

**Web:** https://aussie-bingo-meso.vercel.app

Web estática (HTML + CSS + JS, sin dependencias ni build) desplegada en Vercel: cada push a `main` actualiza la web.

- Contenido: [`js/data.js`](js/data.js)
- Cómo cambiar casillas y cómo está montado: [`CLAUDE.md`](CLAUDE.md)

Para verla en local hace falta un servidor estático (los módulos ES no cargan con `file://`):

```bash
npx serve .
```
