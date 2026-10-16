# Decisiones

## 2026-09-17 · Dirección visual
- **Azul cobalto `#2b3a91` como color principal** (hero y cabeceras), papel `#f8fafc` para lectura y navy `#070d22` para bloques de datos. Nada de colores nuevos: toda la paleta sale de la CSS de startuc3m.es. Amarillo y cian, casi sin uso.
- **Titillium Web** para todo el texto: es la familia más cercana al wordmark `start_` (el logo original parece Klavika, comercial). JetBrains Mono para etiquetas con cursor `_`.
- Titulares monumentales, etiquetas mono, sin tarjetas innecesarias.
- Podcasts con protagonismo: pista horizontal pineada que avanza con el scroll en la home (GSAP ScrollTrigger).

## 2026-09-17 · Stack
- **Astro 7 + Tailwind v4 + GSAP + Lenis**, salida estática con adaptador Node solo para `/api/forms`.
- "CMS" = markdown en `src/content` + `src/lib/site.ts`. Un panel (Keystatic/Payload) queda para más adelante (#8) si hace falta.
- Formularios propios (Start, evento, patrocinio, contacto, newsletter) guardan en `data/submissions.json`; sustituyen a Tally y Luma.

## 2026-09-17 · Email de confirmación
- Sin SMTP/Mailpit por ahora: cada envío registra en consola (dev) el email de confirmación que se mandaría (`src/lib/mail.ts`), como contempla el issue #9. Se sustituye por un SMTP local el día que haga falta probar la entrega real.
