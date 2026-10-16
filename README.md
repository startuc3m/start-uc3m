# Web Start UC3M

Web de la asociación de emprendedores de la UC3M. Astro + Tailwind v4 + GSAP/Lenis. Todo funciona en local: blog, eventos, podcast, formularios y página de links.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:4321
```

`npm run build` genera `dist/`; `node dist/server/entry.mjs` sirve la web con el endpoint de formularios.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Tokens (colores de la marca, tipografía) | `src/styles/global.css` |
| Textos, equipo, departamentos, tiers, links, recursos | `src/lib/site.ts` |
| Posts del blog | `src/content/blog/*.md` |
| Eventos (con agenda e inscripción) | `src/content/eventos/*.md` |
| Episodios del podcast | `src/content/podcast/*.md` |
| Páginas | `src/pages/` |
| Nav, footer, formulario, cabecera de página, pista de podcasts | `src/components/` |
| Animaciones (reveal, split de titulares, scroll horizontal de podcasts, contadores) | `src/lib/motion.ts` |
| Envíos de formularios | `data/submissions.json` (gitignored) via `src/pages/api/forms.ts` |
| Email de confirmación | Se registra en consola en dev (`src/lib/mail.ts`); sin SMTP real todavía, ver `docs/decisions.md` |
| Diseño en Pencil | `../startuc3m.pen` (fuera del repo por ahora) |
| Investigación previa | `docs/research.md` |

## Reglas de marca

- Colores **solo** de la web original: cobalto `#2b3a91` (principal), `#0e1a52`, `#070d22`, `#0b1233`, `#cddaff`, `#f8fafc`, `#f3f4f6`, `#e0e0e0`. Amarillo `#f6c700` y cian `#4cc9f0` existen como tokens pero apenas se usan.
- Tipografía: **Titillium Web** (familia del logo) para todo; JetBrains Mono para etiquetas `eyebrow` con cursor `_`.
- Azul como color principal: hero y cabeceras en cobalto, lectura sobre papel, datos sobre navy.

## Añadir contenido

- **Post**: crea `src/content/blog/mi-post.md` con `title, excerpt, date, category` en el frontmatter.
- **Evento**: `src/content/eventos/mi-evento.md` con `status: abierto` para que aparezca el formulario de inscripción.
- **Episodio**: `src/content/podcast/ep-06.md`; la home muestra los últimos en la pista horizontal.

## Issues

Trabajo repartido en [issues](https://github.com/aaangelmartin/WebStartUC3M/issues) con milestones 1–4. Cada PR enlaza su issue (`Closes #n`).
