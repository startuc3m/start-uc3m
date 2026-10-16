# Modelo de contenido

El issue #8 original asumía Payload con panel `/admin`; se descartó en `docs/decisions.md` (2026-09-17) a favor de algo más ligero y 100% local. El "CMS" real de este proyecto son dos cosas:

## 1. Colecciones (`src/content.config.ts` + `src/content/*`)

Contenido que cambia con frecuencia y tiene una entrada por archivo, editable como markdown con frontmatter:

| Colección | Carpeta | Campos | Usada en |
|---|---|---|---|
| `blog` | `src/content/blog/*.md` | `title, excerpt, date, category, author, cover?, draft` | `/blog`, `/blog/[slug]`, `/blog/rss.xml` |
| `eventos` | `src/content/eventos/*.md` | `title, subtitle, date, time, place, type, status, seats?, sponsors[], agenda[], tags[], external?` | `/eventos`, `/eventos/[slug]` |
| `podcast` | `src/content/podcast/*.md` | `title, guest, role, episode, date, duration, youtube?, spotify?, cover?` | `/podcast` |

Editar contenido = editar/añadir un `.md` y hacer commit. No hay seed ni base de datos: el propio contenido versionado en git **es** el seed.

El markdown de un post admite HTML crudo tal cual (Astro no lo sanitiza), así que para incrustar un vídeo de YouTube o un post de Instagram basta con pegar su `<iframe>`/embed directamente en el `.md` — no hace falta ninguna sintaxis especial.

## 2. Datos estructurados (`src/lib/site.ts`)

Todo lo que no encaja como "artículo individual" — listas cortas y globals — vive como objetos tipados en `site.ts`: `team`, `departments`, `alumni`, `tiers`, `links`, `resources`, `sponsors`, más los globals `name/claim/description/email/social/course`. Mismo criterio: para cambiar contenido, se edita este archivo y se comitea.

## 3. Envíos de formularios (`submissions`)

No es contenido editorial sino datos generados por usuarios. Ver `docs/forms.md`: se guardan en `data/submissions.json` (gitignored) y se exportan con `npm run export:submissions`.

## Media

`public/media/` (fotos de equipo, eventos) y `public/logos/` (patrocinadores) — subida manual al repo, sin gestor de medios.

## Por qué no hay panel todavía

Un panel de edición (Keystatic/Payload) sigue siendo válido para cuando la junta necesite editar sin tocar código ni git — pendiente de decidir si compensa frente a la simplicidad actual. Mientras tanto, cualquiera con acceso al repo edita markdown o `site.ts` directamente.
