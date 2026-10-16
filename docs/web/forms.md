# Formularios

Un único endpoint genérico para los cinco formularios del sitio: `unete`, `evento`, `patrocinio`, `contacto`, `newsletter`.

## Endpoint

`POST /api/forms` (`src/pages/api/forms.ts`), `output: 'static'` con `prerender = false` — corre en el adaptador Node, no en build. Recibe `multipart/form-data` con un campo `form` que identifica el formulario.

Flujo:
1. `form` debe ser uno de los formularios conocidos (`src/lib/forms-schemas.ts`) → si no, `400`.
2. Honeypot: si el campo oculto `website` viene relleno, responde `200 { ok: true }` sin guardar nada (parece un envío correcto, pero se descarta).
3. Rate limit: máx. 5 envíos por IP+formulario cada 10 minutos (`src/lib/ratelimit.ts`, en memoria) → si se supera, `429`.
4. Validación con [zod](https://zod.dev) según el esquema del formulario → si falla, `400 { error: '<primer mensaje>' }`.
5. Se guarda en `data/submissions.json` (gitignored): `{ id, form, at, data }`.
6. Se "envía" el email de confirmación: en dev, se registra en consola (`src/lib/mail.ts`, ver `docs/decisions.md`).

## Esquemas (`src/lib/forms-schemas.ts`)

Cada formulario tiene su propio `z.object(...)` con los campos que ya envían las páginas (`<Form name="…" fields={[...]} />` en `src/pages/*.astro`). Email siempre validado con `zod`; campos requeridos con mensaje de error en español.

Para añadir un campo nuevo a un formulario: añádelo al array `fields` de la página **y** al esquema correspondiente en `forms-schemas.ts` — si falta en el esquema, zod lo ignora silenciosamente (`strip` por defecto); si falta en el formulario pero es requerido en el esquema, el envío fallará con 400.

## Rate limit

`src/lib/ratelimit.ts` implementa una ventana deslizante en memoria (`Map<string, number[]>`), sin dependencias externas. Al ser un único proceso Node local, no sobrevive a un reinicio ni escala a varias instancias — suficiente para el tamaño de este sitio. Clave: `${ip}:${form}`.

## Exportar a CSV

No hay panel `/admin` todavía (el CMS con panel queda pospuesto, ver `docs/decisions.md`). Para sacar los envíos guardados:

```bash
npm run export:submissions
```

Lee `data/submissions.json` y escribe `data/submissions.csv` con columnas `id, form, at` + la unión de todas las claves de `data` vistas en los envíos.

## Formulario de ejemplo end-to-end

`/unete` → `POST /api/forms` (`form=unete`) → `data/submissions.json` → consola muestra el email de confirmación simulado. Probado contra el build de producción (`npm run build && node dist/server/entry.mjs`).
