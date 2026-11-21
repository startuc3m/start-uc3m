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

## Añadido en la versión 2 (con ideas de la demo de Ángel)

| Acción | Entrada | Devuelve | Notas |
|---|---|---|---|
| `events` | `{ tab: 'proximos' \| 'mias' \| 'pasados' }` | `{ events, all }` | `all` alimenta el calendario (id, fecha, fin, si vas) |
| `event` | `{ id }` | `{ event }` | con `isGoing`, `goingCount`, `stamp`, `price`, `membersOnly` |
| `channels` | — | `{ channels, dms }` | canales (sustituyen a la comunidad de WhatsApp) y mensajes directos, con no leídos |
| `channel` | `{ id }` (`dm:<persona>` para directos) | `{ channel, messages }` | marca el canal como leído |
| `channel.send` | `{ id, text }` | `{ message }` | `anuncios` es de solo lectura salvo para la Junta |
| `message.react` | `{ id, emoji, on }` | `{ ok }` | |
| `prefs` / `prefs.update` | `{ group, key, value }` | `{ prefs }` | notificaciones y privacidad de Ajustes |
| `member.join` | `{ plan }` | `{ me }` | alta de socio con pago; la pasarela (Stripe u otra) está por decidir |

Tablas nuevas que harían falta: `channels`, `channel_members`, `messages`, `reactions`, `event_tickets` (sustituye a «apuntados»), `memberships` (temporada, plan, pago) y `user_prefs`. `me.links` (LinkedIn, Instagram, correo, web) va en el perfil y se comparte en el QR como vCard.

## Solapes con la PR #87 (leer antes de fusionar)

Esta demo y el backend de Estrella (#87) tocan las mismas decisiones. **Manda #87** (`docs/panel-roles.md` y `docs/panel.md`); la demo las copia para enseñarlas, no las define. Quien revise o fusione cualquiera de las dos PRs debe comprobar que siguen coincidiendo:

| Tema | Fuente de verdad en #87 | Dónde lo imita la demo |
|---|---|---|
| Roles: `kind`, `department`, `position`, `manage_users` | `docs/panel-roles.md` §1-2, `src/panel/model.js` | `src/panel/demo/data.js` (`canManage`, `canPublish`, `positionLabel`) |
| Permisos de edición por sección (`startskills`, `eventos`, `blog`) | `panel_permissions`, migración `20261121223358` | `PERMISSION_SCOPES`, apartado «Gestión» de Yo |
| Puntos manuales (Responsable solo a su departamento; Junta a cualquiera) | §3 (pendiente) | `canGivePoints`, acción `points.add`, pantalla `/ranking` |
| Starter del mes y portada (solo con `public_consent`) | §5 y §7 (por decidir) | `STARTER_OF_MONTH`, tarjeta en Inicio |
| Pagar no da acceso | regla 4.6 | `member.join` devuelve `pendiente`; pantalla «Pago recibido» |
| Acceso: Google y correo/contraseña | `docs/panel.md` | Pantalla de acceso (sin Apple ni enlace mágico) |
| Alta: nombre, carrera, curso y foto obligatorios; personalidad o «No lo sé» | `docs/panel.md` | Alta guiada con «Seguir» bloqueado hasta completar |

Si una regla cambia en #87, hay que cambiar también la fila correspondiente de la demo (o al revés, si se decide que la demo propone algo mejor). La API real debería devolver en `me` el cargo y los permisos ya calculados (`positionLabel`, `canManage`, `canPublish`, `permissions`), para que el front no repita reglas.

Funciones de la demo que **no están en ninguna fase de #87** y hay que acordar antes de construirlas: canales y mensajes (sustituir WhatsApp), eventos con entradas, pago de la cuota dentro de la app, seguir a gente y el grafo o mapa de afinidades.
