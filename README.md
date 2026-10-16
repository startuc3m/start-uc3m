# Web Start UC3M

Web de la asociación de emprendedores de la UC3M ([startuc3m.es](https://startuc3m.es)). Astro + Tailwind v4 + GSAP/Lenis, basada en el diseño de Ángel Martín ([aaangelmartin/WebStartUC3M](https://github.com/aaangelmartin/WebStartUC3M)).

La web es **100 % estática**. Lo único con servidor es el alta y pago de socios: funciones de Vercel en `api/` con Postgres (Neon), Stripe, Resend y Notion. Ver [`docs/socios.md`](docs/socios.md).

## Arrancar

```bash
npm install
npm run dev        # web en http://localhost:4321
npm run dev:api    # (opcional) funciones de api/ en :3001; necesita .env.local
```

`npm run dev` reenvía `/api` al 3001. Sin `dev:api`, `/socios` muestra el formulario pero no carga las modalidades. **Nunca** apuntes `DATABASE_URL` de local a la BD de producción.

`npm run build` genera `dist/`. En Vercel se despliega solo: cada PR tiene su preview y `main` es producción.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Colores y tipografía | `src/styles/global.css` |
| Textos globales, equipo, departamentos, tiers, links, recursos | `src/lib/site.ts` |
| Eventos | `src/content/eventos/*.md` |
| Posts del blog | `src/content/blog/*.md` |
| Episodios del podcast | `src/content/podcast/*.md` |
| Qué se publica (borradores fuera, blog oculto con < 3 posts) | `src/lib/content.ts` |
| Páginas | `src/pages/` |
| Socios y privacidad (React, vienen de la web anterior) | `src/socios/` + `src/pages/socios/`, `src/pages/privacidad.astro` |
| Funciones de socios | `api/` |
| Esquema de la BD y scripts de socios | `db/` |
| Animaciones | `src/lib/motion.ts` |
| Hueco de imagen mientras no haya fotos | `src/components/Placeholder.astro` |

## Añadir o cambiar contenido

- **Evento**: `src/content/eventos/mi-evento.md`. `status: abierto | sold-out | pasado`. La inscripción es el enlace de `external` (Luma, Neonpass…); sin él, la ficha dice "inscripción muy pronto".
- **Algo sin confirmar**: `draft: true` en el frontmatter. No se publica.
- **Post**: `src/content/blog/mi-post.md` con `title, excerpt, date, category`. El blog aparece en menú y home cuando hay 3 publicados.
- **Episodio**: `src/content/podcast/ep-NN.md`.
- **Miembro del equipo**: array `team` de `src/lib/site.ts`. `depts` admite varios departamentos.

Regla: **no se publica nada que no esté confirmado** (cifras, eventos, promesas a empresas). Lo pendiente está en los issues con la etiqueta `bloqueado: directiva`.

## Cómo trabajamos

- `main` = producción. La web nueva se integra en `migracion/astro` hasta el corte.
- Una rama por issue (`feat/<n>-tema`, `fix/<n>-tema`) y PR contra `migracion/astro`.
- Commits en español con *conventional commits*: `feat(eventos): …`, `fix(socios): …`.
- Todo lo que toque `api/` o `db/` se prueba en el preview con Stripe en **modo test** antes de mergear.

## Reglas de marca

- Colores de la web original: cobalto `#2b3a91` (principal), `#0e1a52`, `#070d22`, `#0b1233`, `#cddaff`, `#f8fafc`, `#f3f4f6`, `#e0e0e0`.
- Tipografía: **Titillium Web**; JetBrains Mono para etiquetas con cursor `_`.
