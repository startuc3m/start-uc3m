# 04 · Contenido

Cómo cambiar lo que se ve en la web **sin tocar el diseño**. Casi todo el contenido son archivos de texto: markdown en `src/content/` y listas en `src/lib/site.ts`.

> **Regla de oro:** no se publica nada que no esté confirmado (fechas, cifras, premios, ponentes, promesas a empresas). Si algo está a medias, se marca `draft: true` o se deja fuera. Ante la duda, pregunta al departamento responsable.

## Dónde se cambia cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Un evento (crear, editar, cerrar) | `src/content/eventos/<id>.md` |
| Las fotos de un evento | `src/lib/fotos.ts` (`eventoFotos`) + `src/assets/fotos/` |
| Un post del blog | `src/content/blog/<id>.md` |
| Un episodio del podcast | `src/content/podcast/ep-NN.md` |
| Alguien del equipo o su foto | `src/lib/site.ts` (`team`) + `src/assets/equipo/` |
| Un departamento | `src/lib/site.ts` (`departments`) |
| Patrocinadores y sus logos | `src/lib/site.ts` (`sponsors`) + `public/logos/` |
| Niveles de patrocinio del media kit | `src/lib/site.ts` (`tiers`) |
| Hitos de la historia, pilares | `src/lib/site.ts` (`milestones`, `pillars`) |
| Enlaces de `/links` (bio de Instagram) | `src/lib/site.ts` (`links`) |
| Página de recursos | `src/lib/site.ts` (`resources`) |
| Correo, redes, curso, claim | `src/lib/site.ts` (primeras líneas) |
| Menú principal | `src/lib/site.ts` (`nav`) |
| Textos fijos de una página | `src/pages/<página>.astro` |
| Fechas de la cuenta atrás de Start Camp | `src/components/lanyard/startcamp_countdown.js`. Ver [06](06-start-camp.md) |

## Cómo hacer el cambio

**Si sabes usar git**, sigue [10 · Cómo trabajamos](10-como-trabajamos.md): rama, cambio, `npm run dev` para verlo y PR.

**Si no**, puedes editar desde la web de GitHub:

1. Abre el archivo en [github.com/startuc3m/start-uc3m](https://github.com/startuc3m/start-uc3m).
2. Pulsa el lápiz (*Edit this file*).
3. Haz el cambio y, abajo, elige **"Create a new branch… and start a pull request"**.
4. Vercel genera una vista previa del PR en un par de minutos (sale el enlace en el PR). Revísala.
5. Pide a alguien de IT que lo revise y lo mergee.

Si el frontmatter tiene un error (falta un campo obligatorio, una fecha mal escrita…), **el build falla** y Vercel lo marca en rojo en el PR. No se publica nada roto.

---

## Eventos

Un archivo por evento en `src/content/eventos/`. El nombre del archivo es la URL: `start-camp.md` → `/eventos/start-camp`.

### Ejemplo mínimo

```yaml
---
title: "Buildathon Welcome Start"
subtitle: "Construye tu primer prototipo con IA en una tarde"
date: 2026-09-17
time: "18:00"
place: "Campus Puerta de Toledo"
type: "Arranque de temporada"
status: abierto
external: "https://www.neonpass.es/event/…"
---
Texto del evento en markdown. Puede tener **negritas**, enlaces y párrafos.
```

### Todos los campos

| Campo | Obligatorio | Qué es | Dónde se ve |
|---|---|---|---|
| `title` | ✅ | Nombre del evento | Tarjetas, ficha, calendario |
| `subtitle` | ✅ | Frase que lo resume | Ficha, tarjetas, descripción para buscadores |
| `date` | ✅ | Primer día, `AAAA-MM-DD` | Tarjetas, ficha, orden, cuenta atrás |
| `time` | ✅ | Hora de inicio, `"HH:MM"` (hora de Madrid) | Ficha, calendario |
| `place` | ✅ | Lugar | Ficha, tarjetas |
| `type` | ✅ | Formato ("Campamento", "Hackathon"…) | Etiqueta de la ficha |
| `status` | | `abierto` (por defecto), `sold-out` o `pasado` | Botones y etiquetas. Un evento con la fecha pasada se trata como `pasado` solo |
| `external` | | Enlace de inscripción (Neonpass) | Botones "Reservar plaza" en home, `/eventos` y ficha |
| `days` | | Número de días (por defecto 1) | Fechas de la ficha, calendario, cuándo pasa a `pasado` |
| `endTime` | | Hora de fin, `"HH:MM"` | Ficha ("9:00 (sábado) – 20:00 (domingo)") |
| `price`, `priceNote` | | Precio y nota ("10 % para socios") | Caja de datos de la ficha |
| `edition` | | "Curso 2026/27" | Etiqueta de la ficha |
| `tags` | | Etiquetas cortas | Píldoras de la ficha y las tarjetas |
| `highlights` | | Tres frases destacadas | Franja bajo la cabecera de la ficha |
| `agenda` | | Lista de `{ time, title, desc }` | Agenda de la ficha (si no hay, sale una foto) |
| `sponsors` | | Nombres, tal cual están en `site.sponsors` | "Con el apoyo de", con su logo |
| `prizes` | | Lista de `{ place, prize?, note? }`. Sin `prize` sale "Por anunciar" | Sección "Premios" |
| `mentors` | | `{ total, names }`: total previsto y nombres confirmados | Sección "N mentores" con huecos para los que faltan |
| `jury` | | `{ total, names }` | Sección "N jurados" |
| `info` | | Lista de `{ title, text, link? }` | Sección "Info práctica" (cómo llegar, horario…) |
| `seats` | | Número de plazas | Solo si gestionamos plazas de verdad (hoy no) |
| `draft` | | `true` = no se publica | — |

Las secciones de premios, mentores, jurado e info práctica **solo aparecen si el campo existe**. Así se pueden ir rellenando a medida que se confirman.

### Fotos de un evento

1. Las fotos oficiales están en el Drive de Marketing, carpeta **FOTOS EVENTOS**.
2. Redúcelas a 2400 px por el lado largo y guárdalas en `src/assets/fotos/` con un nombre descriptivo, en minúsculas y con guiones: `start-camp-pitch.jpg`.
   En Mac: `sips -Z 2400 original.jpg --out src/assets/fotos/start-camp-pitch.jpg`
3. En `src/lib/fotos.ts`, añade o edita la entrada del evento (la clave es el id del `.md`):

```ts
'mi-evento': {
  card: 'mi-evento-sala',        // tarjeta en home y /eventos
  hero: 'mi-evento-grupo',       // fondo de la cabecera de la ficha
  side: 'mi-evento-mesa',        // foto lateral si no hay agenda
  gallery: ['mi-evento-1', 'mi-evento-2', '…'],  // mosaico "Así fue"
  galleryTitle: 'Así fue',       // opcional
},
```

Sin entrada en `eventoFotos`, la ficha usa el hueco de marca. Si escribes mal un nombre, el build falla con `Falta la foto src/assets/fotos/<nombre>.jpg`.

### Cuando un evento acaba

No hace falta hacer nada: en el siguiente despliegue pasa a "Lo que ya hemos construido". Si quieres que cambie justo al acabar, haz un despliegue ese día (cualquier PR mergeado sirve). Lo ideal es añadir después la crónica y la galería (#64).

---

## Blog

Un archivo por post en `src/content/blog/`.

```yaml
---
title: "Así fue el Buildathon"
excerpt: "Sesenta personas, veinte prototipos y una sangriada."
date: 2026-09-18
category: Eventos        # Eventos | Comunidad | Recursos | Prensa
author: "Start UC3M"     # opcional
cover: "…"               # opcional
draft: false
---
Texto en markdown.
```

- **El blog solo se muestra (menú, home, pie, `/links`) con 3 posts publicados o más** (`BLOG_MIN` en `src/lib/content.ts`). Con menos, las páginas existen pero no se enlazan.
- Solo posts propios: nada de noticias de otros medios.
- Se puede pegar HTML dentro del markdown: el `<iframe>` de un vídeo de YouTube o el embed de un post de Instagram funcionan tal cual.
- Una fuente fácil son los posts de LinkedIn de Start: se adaptan y se enlaza el original (#42).

---

## Podcast (StartTheWeek)

Un archivo por episodio: `src/content/podcast/ep-NN.md` (con dos cifras: `ep-07.md`).

```yaml
---
title: "Pedro Clavería, co-CEO y cofundador de Playtomic"
guest: "Pedro Clavería"
role: "StartTheWeek #6"
episode: 6
date: 2023-05-01                 # fecha de publicación en YouTube
duration: "Vídeo"
youtube: "https://www.youtube.com/watch?v=GgGys5QETtk"
youtubeId: "GgGys5QETtk"
cover: "https://img.youtube.com/vi/GgGys5QETtk/hqdefault.jpg"
---
Una línea de descripción.
```

- **El orden lo marca `episode`**, no la fecha. La home enseña los 4 últimos.
- Los datos salen del canal [@StartUC3MG](https://www.youtube.com/@StartUC3MG). Solo episodios completos, no los cortos ni los clips.
- `youtubeId` es lo que va después de `v=` en la URL. La miniatura sale de ahí.

---

## Equipo

En `src/lib/site.ts`, array `team`:

```ts
{ name: "Nombre Apellido", role: 'Responsable', depts: ["IT"], linkedin: 'https://www.linkedin.com/in/…', photo: 'nombre_apellido.jpg' },
```

- `depts` admite varios departamentos, con el nombre exacto de `departments`.
- `photo` es el nombre del archivo en `src/assets/equipo/`. Quien no tiene foto sale con sus iniciales.
- **Fotos:** cada persona sube la suya a su fila de la base *Miembros* del Notion de Start (campo *Foto*). Cada cierto tiempo, alguien de IT la descarga, la reduce (`sips -Z 1200 foto.jpg --out src/assets/equipo/nombre_apellido.jpg`) y la pone en `photo`.
- Si cambias una foto, **usa un nombre de archivo nuevo**: el navegador guarda las imágenes y seguiría enseñando la vieja.
- Nunca se publican correos ni teléfonos.

## Patrocinadores

En `src/lib/site.ts`, array `sponsors`:

```ts
{ name: 'NomuLabs', logo: '/logos/nomulabs.png', tier: 'Partner' },   // tier: Partner | Evento | Colaborador
```

- El logo va en `public/logos/`. Mejor SVG o PNG con fondo transparente. Sin `logo`, sale el nombre en texto.
- Solo patrocinadores confirmados por Partnerships.
- Para que salgan en la ficha de un evento, pon su `name` en el campo `sponsors` del evento.

## Textos de las páginas

Los textos fijos (titulares, párrafos de cada sección) están en cada `src/pages/*.astro`, entre las etiquetas HTML. Cámbialos ahí con cuidado de no romper las etiquetas, y revisa el resultado en `npm run dev` o en la vista previa del PR. El tono es cercano y en primera persona del plural ("hacemos", "te acompañamos"), validado por Comunicación.
