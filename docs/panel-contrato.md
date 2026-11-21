# Área de socios: lo que el front le pide al backend

> **Propuesta, no decisión.** Esto sale del prototipo navegable (`/panel/demo/`) y sirve para hablarlo con Estrella, que lleva el backend (PR #87). Nada de esto está implementado en el servidor.

## Cómo encaja con #87

El cliente de #87 (`src/panel/client.js`) expone `api(action, input)`: `GET /api/panel?action=…` para leer y `POST` con JSON para escribir, siempre con el token de Supabase. El prototipo usa **la misma firma** (`src/panel/demo/api.js`), así que pasar de la demo al backend real es cambiar ese archivo.

| Ya existe en #87 | Lo pide además el diseño |
|---|---|
| `me`, `users`, `preview`, `invite`, `member`, `resend`, `process` | `feed`, `people`, `person`, `map`, `offers`, `offer`, `offer.interest`, `offer.interested`, `offer.create`, `event.going`, `checkin`, `notifications`, `notifications.read`, `profile.update`, `onboarding.done` |

Las `demo.*` (ajustes, reiniciar) solo existen en el prototipo.

## Acciones

Las formas exactas están en `src/panel/demo/api.js` (y sus pruebas en `api.test.js`). Resumen:

| Acción | Método | Entrada | Respuesta |
|---|---|---|---|
| `me` | GET | — | `{ me }` con `level` (n, nombre, progreso), `stampList`, `family`, `number` (nº de carné), permisos `canPublish` y `canManage` |
| `feed` | GET | — | `{ items, newcomers, sameCareer }`. `items` mezcla `event`, `offer` y `stamp`; se genera con los datos, nadie lo escribe |
| `people` | GET | `q`, `filter` (`todos`, `socios`, `starters`), `type` | `{ people, total }` |
| `person` | GET | `id` | `{ person, team, sameType }` |
| `map` | GET | — | `{ myType, families[{ types[{ code, count }] }] }` |
| `offers` | GET | `tab` (`todas`, `interesan`, `mias`) | `{ offers, counts }`, cada oferta con `interestedCount`, 3 `interestedPeople` y `isInterested` |
| `offer` | GET | `id` | `{ offer }` |
| `offer.interest` | POST | `id`, `on` | `{ offer }`. Al marcarla, quien publica ve tu perfil y tu CV |
| `offer.interested` | GET | `id` | `{ people }`. Solo para quien publicó la oferta |
| `offer.create` | POST | título, tipo, lugar, plazo, descripción | `{ offer }`. Solo Junta y Responsables (`canPublish` de #87) |
| `event.going` | POST | `id`, `on` | `{ going }` |
| `checkin` | POST | código del QR del evento | `{ stamp, isNew, level, levelUp }` |
| `notifications` | GET | — | `{ items[{ text, when, unread }] }` |
| `profile.update` | POST | nombre, carrera, curso, LinkedIn, frase, personalidad | `{ me }`. Reutiliza `validateProfile` de #87 |

## Tablas que harían falta (borrador)

- `events`: id, título, fecha, lugar, foto, `stamp_id`.
- `stamps`: id, etiqueta (`CAMP`), nombre, color, fecha.
- `attendances`: `member_id`, `event_id`, `checked_in_at`. **Un sello = una asistencia fichada**; el nivel se calcula contando y no se guarda.
- `event_rsvps`: `member_id`, `event_id` («Voy»).
- `offers`: id, título, empresa, tipo, lugar, duración, horas, remuneración, plazo, descripción, foto, `created_by`, `published_at`, `closed_at`.
- `offer_interests`: `member_id`, `offer_id`, `created_at`.
- `notifications`: o derivadas de lo anterior (lo más simple) o una tabla con `read_at`.
- En `panel_profiles` (#87): frase corta y nº de carné.

## Preguntas abiertas para decidir juntos

1. **Fichar**: ¿lo escanea alguien del equipo (el QR del carné) o cada persona escanea el QR del evento? El diseño muestra el QR en el carné, así que sería lo primero.
2. **Niveles**: los umbrales de la demo (3, 8 y 14 sellos) son inventados.
3. **CV**: ¿se sube en el perfil (Storage de Supabase, `panel_files` de #87) y se comparte solo con quien publica la oferta?
4. **Feed**: ¿qué entra y durante cuánto tiempo? En la demo, eventos de las próximas 2 semanas, ofertas nuevas y sellos recientes.
5. **Privacidad**: la ficha de una persona enseña sus sellos y su personalidad a toda la comunidad. Hay que añadirlo a `/privacidad` y dejar que cada persona lo oculte.
