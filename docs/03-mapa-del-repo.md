# 03 · Mapa del repo

Qué hay en cada sitio. Si buscas "¿dónde cambio X?", la respuesta corta está en la tabla de [04 · Contenido](04-contenido.md#dónde-se-cambia-cada-cosa).

```
start-uc3m/
├── api/                  Funciones serverless de Vercel (socios y contacto)
│   ├── _lib/             Código compartido: BD, correo, HTTP/rate limit, Notion
│   ├── membership/       Alta de socios: disponibilidad, elegibilidad, checkout, teléfono
│   ├── stripe/webhook.mjs  Confirma el pago y da de alta al socio
│   └── contacto.mjs      Formulario de contacto y patrocinio
├── db/                   Esquema SQL y scripts de socios (tests, operativa, servidor local de api/)
├── docs/                 Esta documentación
├── public/               Archivos que se sirven tal cual (logos, vídeo, favicon, manifest)
├── src/
│   ├── assets/           Imágenes que optimiza Astro (fotos de eventos y del equipo)
│   ├── components/       Piezas reutilizables (.astro) y el lanyard de Start Camp (React)
│   ├── content/          Contenido en markdown: eventos, blog y podcast
│   ├── content.config.ts Esquema (campos obligatorios y tipos) de cada colección
│   ├── layouts/Base.astro  Esqueleto de todas las páginas
│   ├── lib/              Datos y lógica: site.ts, content.ts, fotos.ts, motion.ts…
│   ├── pages/            Una página por archivo (la ruta sale del nombre)
│   ├── socios/           Islas React de socios y privacidad (vienen de la web anterior)
│   ├── startcamp/        Perfil del Start Camp (React + Supabase). Ver [startcamp-perfil.md](startcamp-perfil.md)
│   └── styles/global.css Tokens de marca, utilidades y animaciones base
├── .github/workflows/    CI: build y tests en cada PR
├── astro.config.mjs      Configuración de Astro (sitio, sitemap, React, proxy de /api)
├── vercel.json           Configuración de Vercel (duración de las funciones)
└── vitest.config.mjs     Configuración de los tests
```

## `src/lib/` (datos y lógica)

| Archivo | Qué contiene |
|---|---|
| `site.ts` | **El "CMS" de las listas**: nombre, claim, correo, redes, curso, menú, patrocinadores, departamentos, equipo, alumni, niveles de patrocinio (`tiers`), hitos, pilares, enlaces de `/links` y recursos |
| `content.ts` | Qué se publica: quita los `draft`, marca como `pasado` los eventos ya celebrados, ordena, y decide si el blog es visible (`BLOG_MIN = 3`) |
| `fotos.ts` | `foto(nombre)` para cargar una foto de `src/assets/fotos`, y `eventoFotos`: qué fotos usa cada evento (tarjeta, hero, lateral, galería) |
| `motion.ts` | Loader inicial, scroll suave (Lenis) y animaciones de entrada (GSAP). Se apaga con `prefers-reduced-motion` |
| `ics.ts` | Genera el archivo de calendario (`.ics`) del botón "Añadir al calendario", con la hora de Madrid bien calculada (horario de verano incluido) |
| `startcamp.ts` | `startcampPromoUrl()`: decide en qué páginas salen el banner y la barra de Start Camp |

## `src/components/`

| Componente | Qué es |
|---|---|
| `Nav.astro`, `Footer.astro` | Menú (fijo arriba) y pie. El enlace al blog solo aparece con ≥ 3 posts |
| `Logo.astro` | Wordmark de Start (`tone="white" \| "cobalt"`, `full` añade "EMPRENDEDORES \| UC3M") |
| `PageHead.astro` | Cabecera azul de las páginas interiores (`eyebrow`, `title`, `intro`) |
| `Photo.astro` | Foto optimizada de `src/assets/fotos`. Sin `name`, pinta el hueco de marca |
| `Placeholder.astro` | Hueco de marca para cuando no hay foto |
| `Doodle.astro` | Garabatos del brand kit: `star`, `arrow`, `underline`, `burst` |
| `SocialIcons.astro` | Iconos oficiales de las redes en un color |
| `SponsorTicker.astro` | Marquesina de logos de patrocinadores |
| `PodcastTrack.astro` | Pista horizontal de la home con los últimos episodios |
| `Momentos.astro` | Muro "Así se vive Start" con fotos tipo polaroid |
| `HistoriaVideo.astro` | Vídeo de la historia de Start (avance en bucle y vídeo completo al pulsar play) |
| `ContactForm.astro` | Formulario de contacto o patrocinio (llama a `/api/contacto`) |
| `StartcampBanner.astro`, `StartcampBar.astro` | Avisos de Start Camp en móvil y tablet |
| `lanyard/` | Tarjeta colgante de Start Camp en escritorio (React), su física y la cuenta atrás compartida |

## `src/content/`

| Carpeta | Un archivo por… | Esquema |
|---|---|---|
| `eventos/` | evento (`start-camp.md` → `/eventos/start-camp`) | `eventos` en `content.config.ts` |
| `blog/` | post | `blog` |
| `podcast/` | episodio (`ep-NN.md`) | `podcast` |

Cómo rellenarlos, campo a campo: [04 · Contenido](04-contenido.md).

## `src/assets/` y `public/`

| Carpeta | Qué hay | Cómo se usa |
|---|---|---|
| `src/assets/fotos/` | Fotos de eventos (JPG, ~2400 px) | Con `<Photo name="…">`; Astro genera AVIF/WebP |
| `src/assets/equipo/` | Fotos del equipo (~1200 px) | Campo `photo` de cada persona en `site.team` |
| `src/assets/component_assets/` | QR de Neonpass del lanyard | Importado por el lanyard |
| `public/brand/` | Logos de Start (blanco, cobalto, completo) | URL directa: `/brand/…` |
| `public/logos/` | Logos de patrocinadores | Campo `logo` de `site.sponsors` |
| `public/video/` | Vídeo de la historia (avance, 720p, 1080p y póster) | `HistoriaVideo.astro`. Límite de Vercel: < 25 MB por archivo |
| `public/logo-email.png` | Logo que cargan los correos de socios ya enviados | **No borrar ni mover**: rompería correos antiguos |

## `api/` y `db/`

Todo esto es de socios y contacto. Está explicado en [socios.md](socios.md) y [07 · Formularios](07-formularios.md).

| Archivo | Qué hace |
|---|---|
| `api/_lib/db.mjs` | Conexión a Postgres (Neon) |
| `api/_lib/http.mjs` | Utilidades HTTP y `rateLimit` (en Postgres) |
| `api/_lib/email.mjs` | Correos con Resend (bienvenida al socio, etc.) |
| `api/_lib/notion.mjs` | Crea la ficha del socio en Notion |
| `api/membership/availability.mjs` | `GET` estado de las modalidades de socio |
| `api/membership/premium-eligibility.mjs` | `POST` ¿puede este correo ser premium? |
| `api/membership/checkout.mjs` | `POST` reserva plaza y abre Stripe Checkout |
| `api/membership/telefono.mjs` | `POST` guarda el teléfono desde el enlace personal |
| `api/stripe/webhook.mjs` | `POST` confirma el pago: número de socio, correo y Notion |
| `api/contacto.mjs` | `POST` formulario de contacto y patrocinio |
| `db/schema.sql` | Esquema completo (idempotente) |
| `db/dev-api.js` | Servidor local de `api/` (`npm run dev:api`) |
| `db/test-*.js` | Tests de esquema, API, Stripe, Notion, correo y e2e |
| `db/invitar.js`, `corregir-email.js`, `pedir-telefonos.js` | Scripts de operativa de socios |

## Configuración

| Archivo | Para qué |
|---|---|
| `astro.config.mjs` | `site` (dominio canónico `www`), salida estática, sitemap (sin páginas de paso de socios), React, proxy de `/api` al 3001 en local |
| `vercel.json` | Framework Astro, `npm run build`, y 15 s máximo por función |
| `.github/workflows/build.yml` | CI: `npm run build` + `npm test`, y `test:socios` contra un Postgres desechable |
| `vitest.config.mjs`, `vitest.setup.mjs` | Tests con jsdom y Testing Library |
| `tsconfig.json` | TypeScript estricto de Astro |
