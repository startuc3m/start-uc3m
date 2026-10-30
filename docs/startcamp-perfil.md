# Perfil del Start Camp 2026

Página donde cada asistente del Start Camp (7 y 8 de noviembre de 2026) crea un perfil corto y opcional para conocer a otros asistentes y formar grupos antes del evento. Se entra con el correo de la entrada: Supabase manda un enlace de un solo uso y, al volver, la persona crea, edita o borra su perfil.

- **Ruta:** `/eventos/start-camp/avatar`. Vivirá en `https://startcamp.startuc3m.es/eventos/start-camp/avatar`.
- **Página de error del enlace:** `/eventos/start-camp/enlace-no-valido`.
- **Rama:** `feat/avatares-startcamp`. PR en borrador: [#71](https://github.com/startuc3m/start-uc3m/pull/71).
- **Base de datos, login y scripts:** Pablo (Supabase). **Directorio de perfiles:** Lucas, con el carrusel curved arc. **Correo de campaña:** Lucas. **Textos legales:** Alejandro.

> «Avatar» es el nombre antiguo. En todo lo que se ve se dice «perfil»; «avatar» solo queda en la ruta y en los nombres de los componentes.

---

## 1. Estado a 27/10/2026

| Qué | Estado | Cómo se ha comprobado |
|---|---|---|
| Tests (`npm test`) | ✅ 239 pasan (228 del perfil) | En local y en el CI de la PR |
| Foto de perfil | ⏸️ Hecha pero **apagada** (`FOTOS_ACTIVAS = false`) | Tests con el interruptor apagado y encendido. Ver [§16](#16-fotos-desactivado) |
| Build (`npm run build`) | ✅ | En local, en el CI y en los dos proyectos de Vercel |
| Modo demo, 7 variantes | ✅ | En el preview publicado, una a una |
| Conexión real con Supabase | ✅ | La clave es válida; un correo que no está da `otp_disabled` → «No encontramos tu entrada_» |
| Login real y crear perfil | ✅ | Probado en el preview con un correo de attendees: crear el perfil y recargar funciona |
| Leer el perfil con la sesión abierta | ✅ | Comprobado en el preview publicado (lee `/rest/v1/profiles`) |
| Sin sesión no se lee nada | ✅ | La tabla `profiles` responde 42501 a la clave pública sin sesión |
| `noindex` y fuera del sitemap | ✅ | En el HTML generado y en `sitemap-0.xml` |
| Preview en el Vercel de Start | ⚠️ Compila, pero sin variables de Supabase | Ver [§9.2](#92-abrir-la-rama-desde-el-vercel-de-start) |
| Producción en `startcamp.startuc3m.es` | ⏳ Pendiente | Ver [§9.3](#93-paso-a-producción) |

---

## 2. Recorrido de la persona

1. Le llega el **correo de campaña** de Lucas, con un botón «Crea tu perfil» que lleva a la página. Ese correo **no lleva ningún token**.
2. **Entrar:** escribe el correo con el que compró la entrada y pulsa «Enviar enlace».
3. Supabase le manda el **correo de acceso** (plantilla `docs/correo-enlace-startcamp.html`), con un enlace de un solo uso que **caduca en 1 hora**.
4. Abre el enlace y **vuelve a la página con la sesión abierta**. `supabase-js` lee la sesión de la URL y la guarda en el navegador.
5. Con sesión aparecen **Mi perfil** y **Ver participantes**. En Mi perfil, **sin perfil:** formulario vacío con el nombre ya puesto (`user_metadata.nombre`) y la casilla de consentimiento. **Con perfil:** formulario relleno para editar, sin consentimiento. El directorio no exige haber creado un perfil propio.
6. Guarda. Al **crear** sale confeti. Después puede editar, **salir del grupo**, **borrar** el perfil o **cerrar sesión**.

Si vuelve otro día, la sesión de Supabase sigue en ese navegador y entra directamente. En otro navegador, o si cierra sesión, vuelve a pedir el enlace.

---

## 3. Pantallas

Las pantallas de acceso y edición están en `src/startcamp/AvatarForm.jsx`; `StartCampProfile.jsx` controla la sesión y la navegación al directorio.

| Pantalla | Cuándo sale | Qué enseña | En demo |
|---|---|---|---|
| **Cargando** | Al abrir, mientras se lee la sesión | — | Todas |
| **Entrar** | No hay sesión | «Entra con tu correo_», campo de correo y «Enviar enlace» | `?demo=1` |
| **Enlace enviado** | El enlace se ha mandado | «Revisa tu correo (te llega en unos minutos). El enlace caduca en 1 hora; si no lo ves, mira en spam o correo no deseado.» | `?demo=1` |
| **No encontramos tu entrada_** | Supabase no tiene ese correo | El correo escrito en negrita; dos causas con su solución (otro correo en NeonPass / compra reciente); cómo escribirnos; botones «Probar con otro correo» y «Escribirnos» (`mailto:` con asunto) | `?demo=correo-no-encontrado` |
| **Enlace caducado** | La URL vuelve con `error_code` (caducado o ya usado) | «¿Te has perdido?_», con «Pedir otro enlace» e «Ir a startuc3m.es» | `?demo=enlace-caducado` |
| **Formulario: crear** | Sesión sin perfil | Campos vacíos, nombre precargado, consentimiento, «Guardar mi perfil» y vista previa de la tarjeta | `?demo=sin-perfil` |
| **Formulario: editar** | Sesión con perfil | Campos rellenos, «Guardar cambios», «Salir del grupo», «Borrar mi perfil» y «Cerrar sesión» | `?demo=con-perfil` |
| **Guardado** | Guardado bien | «Guardado. Puedes volver cuando quieras; te pediremos tu correo.» Al crear, confeti | `sin-perfil` / `con-perfil` |
| **Error al guardar** | Red o 5xx | «No se ha podido guardar. Revisa tu conexión e inténtalo otra vez.» Conserva lo escrito | `?demo=error-red` |
| **Sesión caducada** | 42501 / 401 al guardar o borrar | «Tu sesión ha caducado. Pide otro enlace», con botón a Entrar | `?demo=sesion-caducada` |
| **Borrar** | «Borrar mi perfil» | Confirmación: «Se borrará tu perfil y dejarás de aparecer en el directorio» | `?demo=con-perfil` |
| **Error al cargar** | Falla la lectura del perfil | «No hemos podido cargar tu perfil…», con reintento | — |

Detalles de comportamiento:

- **Foco:** va al primer campo con error al guardar, al título de «No encontramos tu entrada_», al campo de correo con «Probar con otro correo» y a la opción «Busco grupo» con «Salir del grupo».
- **«Salir del grupo»:** solo sale al editar, si el estado no es «Busco grupo» y hay nombre de grupo. Deja «Busco grupo» y el nombre vacío, y avisa con «Guarda los cambios para salir del grupo.». No guarda solo: al guardar, `group_id` pasa a `null`.
- **Confeti:** solo al crear y si el guardado sale bien (`src/startcamp/confeti.js`). No sale al editar, si hay error ni con `prefers-reduced-motion`. La librería (unos 10 KB) se descarga solo en ese momento.
- **Página `enlace-no-valido`:** mismo contenido que la pantalla «Enlace caducado», como página suelta y con la estructura de la 404. «Pedir otro enlace» usa `RUTA_PERFIL`.
- **Cabecera de la página:** «Tu perfil_», con la entradilla. No sale el banner ni la barra de «Reserva plaza» (`startcampPromoUrl` los quita en todo `/eventos/start-camp/*`).

---

## 4. Archivos

| Archivo | Qué hace |
|---|---|
| `src/pages/eventos/start-camp/avatar.astro` | La página. Monta `StartCampProfile` con `client:only="react"` y lleva `noindex` |
| `src/startcamp/StartCampProfile.jsx` | Acceso a Mi perfil y Ver participantes, carga del directorio y renovación de fotos |
| `src/components/curved_arc/` | Carrusel de participantes, filtros y ficha de tamaño fijo |
| `src/pages/eventos/start-camp/enlace-no-valido.astro` | Página de enlace no válido, con `noindex` |
| `src/startcamp/AvatarForm.jsx` | Todas las pantallas y el formulario. Solo habla con `api.js` |
| `src/startcamp/AvatarCard.jsx` | Tarjeta del perfil: vista previa en el formulario y ficha para el directorio de Lucas. Recibe los datos con la forma de la base de datos (y `foto_url`, opcional, ver §16) |
| `src/startcamp/api.js` | Toda la comunicación con Supabase (base de datos y, con las fotos activas, Storage) y el modo demo. Única puerta a los datos |
| `src/startcamp/schema.js` | Validación (zod), conversión formulario ↔ base de datos (`aPayload`, `valoresIniciales`) y LinkedIn (usuario ↔ URL) |
| `src/startcamp/opciones.js` | Listas (estados, roles, intereses) con el texto exacto de la base de datos, límites, versión del consentimiento, URL de privacidad, correo de contacto y el interruptor `FOTOS_ACTIVAS` |
| `src/startcamp/foto.js` | Solo con las fotos activas: comprueba la imagen y la recorta, reduce y vuelve a codificar en el navegador (sin EXIF). Ver §16 |
| `src/startcamp/confeti.js` | Confeti al crear. Se quita borrando el archivo y su llamada en `AvatarForm.jsx` |
| `src/startcamp/*.test.js(x)` | Tests (ver §10) |
| `src/lib/startcamp.ts` | `startcampPromoUrl`: quita el banner de inscripción en `/eventos/start-camp/*` |
| `astro.config.mjs` | Saca las dos páginas del sitemap |
| `docs/correo-enlace-startcamp.html` | Plantilla del correo de acceso (Magic Link de Supabase) |
| `docs/07-formularios.md` | Dónde se pega esa plantilla, asunto y remitente |
| `.env.example` | Las dos variables de Supabase |

---

## 5. Campos y reglas

El formulario usa ids internos (`busco`, `tecnologia`…) y los convierte en un único sitio (`opciones.js`) a los **textos exactos** que guarda la base de datos. Si un texto no coincide carácter por carácter, tildes incluidas, la base de datos rechaza el perfil.

| Campo | Obligatorio | Regla en el front | Se guarda como |
|---|---|---|---|
| Nombre | Sí | 1–80 caracteres; precargado con `user_metadata.nombre` | `nombre` |
| Estado de grupo | Sí | Una de 3 tarjetas | `Busco grupo` · `Tengo grupo` · `Abierto a sumar gente` |
| Rol | Sí | Uno de 4 botones | `Negocio` · `Tecnología` · `Diseño` · `Otro` |
| Intereses | No | Máximo 3, de una lista cerrada de 12 | Array de textos: `IA`, `Datos`, `Fintech`, `Salud`, `Sostenibilidad`, `Educación`, `Impacto social`, `Videojuegos`, `Hardware y robótica`, `Marketing y consumo`, `Movilidad`, `Ciberseguridad` |
| LinkedIn | No | Solo el usuario (3–100 caracteres: letras, números, `-`, `_`). Al pegar la URL entera se queda el usuario | `linkedin_url` = `https://www.linkedin.com/in/<usuario>` (máx. 300), o `null` |
| Descripción | No | Máximo 280, con contador | `descripcion`, o `null` si está vacía |
| Nombre del grupo | No | Máximo 60. Solo se ve si el estado no es «Busco grupo» | Se convierte en `group_id` (ver §6.2) |
| Consentimiento | Sí, al crear | Casilla con enlace a la política de privacidad | `consent_at` (fecha ISO) + `consent_version` (`'v1'`) |

El texto del consentimiento nombra todo lo que ven otros asistentes: nombre, estado de grupo, rol, intereses, LinkedIn, descripción y nombre del grupo. Dice también para qué se usa, que solo lo ven asistentes, que se borra al acabar el Start Camp y que se puede borrar antes con «Borrar mi perfil». Lleva `PENDIENTE: texto de Legal`. **Si cambia el texto, hay que subir `CONSENTIMIENTO_VERSION`.**

El correo no se pide ni se enseña en el perfil.

---

## 6. Datos: Supabase

No hay `api/` propia para el perfil. El front habla directamente con Supabase con `@supabase/supabase-js` y la **clave publishable**, y la seguridad la ponen las reglas RLS de la base de datos. **La clave secreta nunca se usa en el front.**

`supabase-js` se carga la primera vez que hace falta, en un archivo aparte, así que el modo demo no lo descarga. Si faltan las variables de entorno, la página se queda en «Entrar» y «Enviar enlace» da error de conexión.

### 6.1 Llamadas (`src/startcamp/api.js`)

| Función | Llamada a Supabase |
|---|---|
| `pedirEnlace(email)` | `auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: origin + '/eventos/start-camp/avatar' } })` |
| `obtenerPerfil()` | `auth.getSession()` y, con sesión, `from('profiles').select('nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id, groups(nombre)').eq('user_id', id).maybeSingle()`. **Nunca `select('*')`**: da error de permisos |
| `guardarPerfil(datos, { crear: true })` | `from('profiles').insert({ user_id, nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id, consent_at, consent_version })`, sin pedir columnas de vuelta |
| `guardarPerfil(datos, { crear: false })` | `from('profiles').update({ nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id }).eq('user_id', id)`. Sin `consent_*` y **sin `upsert`** (falla) |
| `borrarPerfil()` | `from('profiles').delete().eq('user_id', id)` |
| `cerrarSesion()` | `auth.signOut()` |
| `leerErrorEnlace()` | Lee `error_code` del `#hash` o de la query al volver de un enlace caducado y lo quita de la barra de direcciones |

`emailRedirectTo` usa el **origen desde el que se pide el enlace**. Por eso cada dominio donde se abra la página (localhost, cada preview, producción) tiene que estar en las Redirect URLs de Supabase (§8).

### 6.2 Nombre del grupo → `group_id` (`resolverGrupo`)

1. Si el estado es «Busco grupo», o el nombre está vacío, `group_id = null`.
2. Si no, se lee `groups` (`select('id, nombre')`) y se busca el nombre **sin mirar mayúsculas ni espacios al final**.
3. Si no existe, se crea: `insert({ nombre, origen: 'manual' }).select('id').single()`.
4. Si el `insert` falla con `23505` (otra persona lo ha creado a la vez), se vuelve al paso 2. Como mucho 3 intentos; después, error de red.

### 6.3 Errores

| Código de Supabase | Qué significa | Qué ve la persona |
|---|---|---|
| `otp_disabled` / «Signups not allowed for otp» | El correo no está en Supabase (`shouldCreateUser: false`) | «No encontramos tu entrada_» |
| `23514` + `profiles_<campo>_check` | El campo no cumple una regla de la base de datos | Error en ese campo («Revisa este campo.», o el de LinkedIn) |
| `23505` en `groups` | Grupo creado a la vez por otra persona | Nada: se vuelve a buscar |
| `42501` o HTTP 401 | Sin permiso: sesión caducada o correo no cargado | «Tu sesión ha caducado. Pide otro enlace» |
| Red, 5xx o cualquier otro | — | «No se ha podido guardar…» (o «borrar»), conservando lo escrito |

---

## 7. Modo demo (`?demo=`)

Para enseñar y probar todas las pantallas sin Supabase: los datos viven en memoria y se pierden al recargar. Cada llamada tarda 600 ms para que se vean los estados de carga. En modo demo sale arriba una barra «Modo demo» con enlaces a todas las variantes.

**Nunca se activa en `www.startuc3m.es`, `startuc3m.es` ni `startcamp.startuc3m.es`** (`HOSTS_PRODUCCION` en `api.js`, con un test por cada uno). Sí funciona en localhost y en cualquier preview de Vercel.

| Variante | Qué enseña |
|---|---|
| `?demo=1` | Sin sesión: «Entrar». El enlace se manda bien |
| `?demo=correo-no-encontrado` | Al pedir el enlace: «No encontramos tu entrada_» |
| `?demo=enlace-caducado` | Pantalla de enlace caducado |
| `?demo=sin-perfil` | Con sesión y sin perfil: crear (con confeti) |
| `?demo=con-perfil` | Con perfil y grupo («Los del fondo»): editar, salir del grupo, borrar, cerrar sesión |
| `?demo=error-red` | Guardar y borrar fallan por red |
| `?demo=sesion-caducada` | La sesión caduca al guardar |

Cualquier otro valor de `?demo=` cae en `?demo=1`. `PERFILES_EJEMPLO` en `api.js` tiene tres perfiles con la forma de la base de datos, útiles para maquetar el directorio.

**Fotos en el modo demo** (aunque `FOTOS_ACTIVAS` esté a `false`): añade `&fotos=1` a cualquier variante (p. ej. `?demo=sin-perfil&fotos=1`), o usa `?demo=con-foto`, que es «Con perfil y grupo» con una foto de ejemplo. La foto que se sube se guarda en memoria (URL de objeto) y se pierde al recargar. Con las fotos activas, la barra «Modo demo» enseña también «Con foto» y sus enlaces mantienen `&fotos=1`.

---

## 8. Configuración

### 8.1 Variables de entorno

| Variable | Valor | Para qué |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `https://rufoyhnfrviquwcomoht.supabase.co` | Proyecto de Supabase |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (la da Pablo) | Clave pública del front |

- Las dos son **públicas**: llevan el prefijo `PUBLIC_` y Astro las **mete en el código al compilar**. Por eso, después de añadirlas o cambiarlas en Vercel, **hace falta un despliegue nuevo** (un push o «Redeploy»).
- **Local:** en `.env` (está en `.gitignore`); la plantilla es `.env.example`.
- **Nunca** pongas aquí la clave `secret` ni la `service_role`.

### 8.2 Supabase (lo administra Pablo)

| Dónde | Qué | Estado |
|---|---|---|
| Authentication → URL Configuration → **Redirect URLs** | `http://localhost:4321/**` | ✅ |
| | Preview personal: `https://start-avatares-git-7c9413-estrellatrabancapineda-8468s-projects.vercel.app/**` | ✅ |
| | Previews del Vercel de Start: `https://*-start-065e.vercel.app/**` | ⏳ (§9.2) |
| | Producción: `https://startcamp.startuc3m.es/eventos/start-camp/avatar` | ⏳ |
| Authentication → Emails → Templates → **Magic Link** | Pegar `docs/correo-enlace-startcamp.html`. Asunto: «Tu enlace para entrar en tu perfil del Start Camp» | ⏳ |
| Authentication → Emails → **SMTP** | Remitente «Start UC3M» con Resend | ⏳ |
| Usuarios | El script de carga de entradas crea cada usuario con `user_metadata.nombre` | ✅ (hecho por Pablo) |

Si una URL de vuelta no está en la lista, Supabase manda a la persona a la «Site URL» y la página no recibe la sesión.

---

## 9. Despliegue

### 9.1 Los dos proyectos de Vercel

El repo `startuc3m/start-uc3m` está conectado a **dos** proyectos de Vercel. Los dos compilan solos cada push de la rama.

| | Preview personal | Vercel de Start |
|---|---|---|
| Equipo / proyecto | `estrellatrabancapineda-8468s-projects` / `start-avatares-preview` | `start-065e` / `start-uc3m-ej5u` |
| Qué despliega | Solo esta rama, para enseñar el trabajo | Todas las ramas (preview) y `main` (producción) |
| URL de la rama | `https://start-avatares-git-7c9413-estrellatrabancapineda-8468s-projects.vercel.app` | `https://start-uc3m-ej5u-git-feat-avatares-startcamp-start-065e.vercel.app` (formato estándar de Vercel), o la del commit que sale en la PR |
| Variables de Supabase | ✅ en Production, Preview y Development | ❌ casi seguro que no están (no hay acceso para comprobarlo) |
| Quién puede abrirlo | Quien tenga sesión en esa cuenta de Vercel | Miembros del equipo de Vercel de Start |
| Estado de esta rama | ✅ Compila; demo y login real funcionan | ✅ Compila (estado «success» en cada commit); solo funciona el modo demo |

El preview personal es **provisional**. Lo que tiene que quedar es el Vercel de Start.

### 9.2 Abrir la rama desde el Vercel de Start

Ya está desplegada: cada push genera un preview en `start-uc3m-ej5u`. El enlace aparece en la PR #71 (comprobación «Vercel – start-uc3m-ej5u» → «Details») y en el panel de Vercel de Start → Deployments, filtrando por la rama `feat/avatares-startcamp`.

**Sin hacer nada más:** el modo demo funciona entero (`…/eventos/start-camp/avatar?demo=sin-perfil`). Sin `?demo`, la página se queda en «Entrar» y «Enviar enlace» da error de conexión, porque faltan las variables.

**Para que funcione también el login real**:

1. **Quien gestione el Vercel de Start:** en `start-uc3m-ej5u` → Settings → Environment Variables, añadir `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (§8.1) en **Preview** y **Production**. En Preview se pueden limitar a la rama `feat/avatares-startcamp` si no se quieren en todas.
2. ✅ **Hecho.** **Pablo:** añadir a las Redirect URLs de Supabase los previews de Start: `https://*-start-065e.vercel.app/**`, o solo `https://start-uc3m-ej5u-git-feat-avatares-startcamp-start-065e.vercel.app/**`. Pablo ya ha registrado las del Vercel de Start (previews y producción).
3. **Volver a desplegar** la rama en Start (Deployments → el último de la rama → «Redeploy», o cualquier push), porque las variables se meten al compilar.
4. Abrir `https://start-uc3m-ej5u-git-feat-avatares-startcamp-start-065e.vercel.app/eventos/start-camp/avatar`, **sin `?demo`**, con sesión en el Vercel de Start, y repetir las pruebas de §10.2.

Cuando funcione en Start, el preview personal sobra: se puede borrar el proyecto `start-avatares-preview` y quitar su URL de Supabase.

### 9.3 Paso a producción

Orden, para que esté publicado **antes del envío del correo de campaña (29-30/10)**:

1. Variables de Supabase en **Production** del proyecto de Start (paso 1 de §9.2). **Tienen que estar antes del merge**: si no, la compilación de producción sale sin ellas.
2. Dominio: en `start-uc3m-ej5u` → Settings → Domains, añadir `startcamp.startuc3m.es` y el registro DNS que pida Vercel.
3. Supabase: añadir `https://startcamp.startuc3m.es/eventos/start-camp/avatar` a las Redirect URLs, pegar la plantilla Magic Link y configurar el remitente (§8.2).
4. Visto bueno del equipo en la PR #71, sacarla de borrador y merge a `main` (lo hace Estrella).
5. Comprobar en `https://startcamp.startuc3m.es/eventos/start-camp/avatar` que `?demo=1` **no** activa el modo demo y repetir §10.2 con un correo real.
6. Lucas pone esa URL en el botón «Crea tu perfil» del correo de campaña.
7. Enlace a la página de perfil desde la ficha del Start Camp de la web.

Si `startcamp.startuc3m.es` se añade como otro dominio del mismo proyecto, toda la web responde también en ese dominio: la cabecera y el pie funcionan y `/eventos/start-camp/avatar` existe. Si se quiere que la raíz `https://startcamp.startuc3m.es/` lleve directamente al perfil, hace falta una redirección en `vercel.json` (con condición `has` de host). No está hecha.

---

## 10. Pruebas

### 10.1 Automáticas (`npm test`)

| Archivo | Tests | Qué cubre |
|---|---|---|
| `src/startcamp/schema.test.js` | 50 | Validación, ids ↔ textos de la base de datos, LinkedIn (usuario ↔ URL), `aPayload` (y la versión del consentimiento con fotos) y `valoresIniciales` |
| `src/startcamp/api.test.js` | 85 | Modo demo y sus hosts, variantes del mock, `leerErrorEnlace`, traducción de errores, cada llamada a Supabase con sus argumentos exactos (con un Supabase falso), `resolverGrupo` (incluido el 23505) y las fotos: interruptor apagado (ni `foto_path` ni Storage) y encendido (subir, quitar, borrar perfil borra la foto, URL firmada, errores de Storage, mock) |
| `src/startcamp/AvatarForm.test.jsx` | 61 | Pantallas, «No encontramos tu entrada_», enlace caducado, carga, campos, LinkedIn, guardar (crear/editar/errores), consentimiento, «Salir del grupo», confeti, borrar, barra demo y el campo de foto (apagado: no aparece; encendido: subir, cambiar, quitar, rechazo por tipo y tamaño, errores) |
| `src/startcamp/AvatarCard.test.jsx` | 5 | Foto en la tarjeta: iniciales sin foto, foto con el nombre como alt y vuelta a las iniciales si no carga |
| `src/startcamp/foto.test.js` | 22 | Tipos y tamaño aceptados, recorte centrado, 400x400, WebP o JPEG, objetivo de 150 KB y que no pasa nada del original (EXIF y GPS) |
| `src/startcamp/confeti.test.js` | 5 | Colores, ráfaga desde las dos esquinas, `prefers-reduced-motion`, librería que falla o no carga |

El CI de GitHub (`.github/workflows/build.yml`) ejecuta `npm run build` y `npm test` en cada PR contra `main`.

### 10.2 A mano, con login real

Sin `?demo`, con un correo cargado en Supabase:

1. **Entrar:** escribir el correo y pulsar «Enviar enlace». Sale «Revisa tu correo… caduca en 1 hora…».
2. **Correo:** llega el de Supabase (mirar spam).
3. **Volver:** abrir el enlace en el mismo navegador. Sale el formulario vacío con el nombre ya puesto.
4. **Crear:** «Tengo grupo» + nombre de grupo, rol, intereses y consentimiento. Sale «Guardado» y confeti. Recargar: los datos siguen.
5. **Editar:** cambiar un campo y guardar. Sin consentimiento ni confeti. Recargar y comprobar.
6. **Salir del grupo:** pulsarlo, guardar y recargar. Queda en «Busco grupo» y `group_id` en `null` en la tabla.
7. **Borrar:** confirmar. Sale «Tu perfil se ha borrado…». Recargar: formulario vacío.
8. **Cerrar sesión:** vuelve a «Entrar» y sigue así al recargar.
9. **Correo que no está:** sale «No encontramos tu entrada_».
10. **Enlace ya usado:** abrir otra vez el del paso 2. Sale «¿Te has perdido?_».

Si al guardar o borrar sale «Tu sesión ha caducado» con la sesión recién abierta, la base de datos ha denegado el permiso (42501): falta un permiso o una regla RLS.

---

## 11. Seguridad y privacidad

- **Solo la clave publishable** en el front. Sin sesión, `profiles` no se puede leer (comprobado: 42501).
- **Nombre, descripción y grupo se pintan como texto**, nunca como HTML (hay un test con un correo que lleva `<i>`).
- **Nada de datos del perfil en `localStorage`** más allá de la sesión que guarda `supabase-js`. No hay `console.log` de datos del perfil ni de la sesión.
- **No se piden ni se enseñan consentimientos de otras personas.**
- **`noindex`** (meta y cabecera `x-robots-tag` en Vercel) en las dos páginas, y fuera del sitemap.
- **El modo demo está bloqueado** en los tres dominios de producción.

---

## 12. Decisiones y diferencias con el brief

- **Grupo sin nombre:** si el estado no es «Busco grupo» pero el nombre del grupo está vacío, se guarda `group_id = null`. El brief §6 al pie de la letra intentaría crear un grupo sin nombre.
- **«No encontramos tu entrada»:** el brief §4 tenía una frase («Si has comprado hoy, puede tardar hasta un día en aparecer»). Ahora es una pantalla con dos causas, contacto y botones. La causa de la compra reciente promete que llegará un correo cuando la entrada esté cargada.
- **Ruta:** se queda en `/eventos/start-camp/avatar`, aunque la página dice «perfil». Cambiarla obliga a volver a registrarla en Supabase y a cambiar el correo de campaña.
- **Límite del nombre del grupo (60):** lo pone el front; la base de datos no lo fija. Pendiente de cuadrar con Pablo.
- **Cabecera y pie:** salen de `Base.astro`, con enlaces relativos (`/eventos`, `/socios`…). Los enlaces propios de las dos páginas son absolutos a `https://www.startuc3m.es`. Ver la nota de §9.3 sobre el dominio.

---

## 13. Pendiente

| Quién | Qué |
|---|---|
| Quien gestione el Vercel de Start | Variables de Supabase en `start-uc3m-ej5u` (Preview y Production) y dominio `startcamp.startuc3m.es` |
| Pablo | ✅ **Hecho:** Redirect URLs (previews de Start y producción) |
| Pablo | Pegar la plantilla Magic Link y configurar el remitente «Start UC3M» en el SMTP (Resend) |
| Pablo | Confirmar si `groups.origen` se puede leer desde el cliente, para avisar del grupo asignado |
| Pablo | Confirmar el límite del nombre del grupo (`MAX_NOMBRE_GRUPO = 60`) con la base de datos |
| Pablo y Lucas | Confirmar el horario de carga de entradas y que el correo de campaña llega también a quien compra tarde |
| Lucas | URL de producción en el botón «Crea tu perfil» del correo de campaña, **antes del 29-30/10** |
| Alejandro | Texto de consentimiento y página `/privacidad` (luego subir `CONSENTIMIENTO_VERSION`) |
| Pablo | **Solo si se deciden las fotos:** bucket, columna `foto_path` y políticas de Storage (§16), y confirmar los nombres marcados con `PENDIENTE: confirmar con Pablo` en `api.js` |
| Alejandro | **Solo si se deciden las fotos:** texto del consentimiento con la foto (`CONSENTIMIENTO_VERSION_FOTOS = 'v2'`) |
| Organización del Start Camp | Cerrar la lista de intereses y los roles (`opciones.js`) |
| Web | Enlace a la página de perfil desde la ficha del Start Camp, cuando esté la URL definitiva |

---

## 14. Cómo cambiar cosas

| Quiero… | Dónde |
|---|---|
| Cambiar intereses, roles o estados | `src/startcamp/opciones.js`. El campo `db` tiene que coincidir con la base de datos |
| Cambiar el texto del consentimiento | `AvatarForm.jsx` (busca `PENDIENTE: texto de Legal`) y subir `CONSENTIMIENTO_VERSION` en `opciones.js` |
| Cambiar mensajes | `MENSAJES` y `CAUSAS_NO_ENCONTRADO` en `AvatarForm.jsx` (los tests los usan) |
| Cambiar el correo de contacto | `site.email` en `src/lib/site.ts` (de ahí sale `EMAIL_CONTACTO`) |
| Cambiar límites | `MAX_NOMBRE`, `MAX_NOMBRE_GRUPO` en `schema.js`; `MAX_INTERESES`, `MAX_DESCRIPCION` en `opciones.js` |
| Quitar el confeti | Borrar `src/startcamp/confeti.js`, `confeti.test.js` y su import y llamada en `AvatarForm.jsx`; desinstalar `canvas-confetti` |
| Cambiar la ruta | `RUTA_PERFIL` en `api.js` + mover `avatar.astro` + Redirect URLs de Supabase + correo de campaña |
| Reutilizar la tarjeta en el directorio | `AvatarCard` recibe una fila de `profiles` tal cual (con `groups: { nombre }`) |
| Encender las fotos | §16. Al final, `FOTOS_ACTIVAS = true` en `opciones.js` |

---

## 15. Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Sin `?demo`, «Enviar enlace» siempre da error de conexión | Faltan las variables en ese proyecto de Vercel, o se añadieron sin volver a desplegar | §8.1 y redesplegar |
| El enlace del correo lleva a otra web o vuelve sin sesión | El dominio no está en las Redirect URLs | Añadirlo en Supabase (§8.2) |
| «No encontramos tu entrada_» con un correo que sí compró | No está cargado todavía, o compró con otro correo | Revisar el script de carga (Pablo) |
| «Tu sesión ha caducado» justo después de entrar | 42501: falta un permiso o una regla RLS | Pablo |
| El correo no llega | Límite de envíos del SMTP de Supabase, o está en spam | SMTP propio (Resend) |
| `?demo=` no hace nada | Es un dominio de producción (a propósito) | Probar en localhost o en un preview |
| El preview pide iniciar sesión en Vercel | La protección de despliegues de Vercel | Entrar con una cuenta del equipo, o un enlace para compartir |

---

## 16. Fotos (desactivado)

La **edición** de fotos sigue apagada con `FOTOS_ACTIVAS = false` (en `src/startcamp/opciones.js`): el formulario no enseña el campo ni sube, cambia o borra imágenes. El directorio sí lee las fotos que ya existan: pide `foto_path` y firma las rutas del bucket privado por lotes con `createSignedUrls(paths, 3600)`. Hay tests separados de edición y lectura del directorio.

Para enseñarla sin encender nada: modo demo con `&fotos=1` o `?demo=con-foto` (§7).

### 16.1 Qué hace cuando se enciende

- **Formulario:** campo «Foto (opcional)» encima del nombre: «Subir foto», vista previa redonda, «Cambiar» y «Quitar». Debajo: «Tu foto solo la verán otros asistentes con sesión iniciada y se borra con tu perfil.»
- **Archivos aceptados:** JPG, PNG, WebP y HEIC/HEIF (este último solo en los navegadores que lo abren, como Safari). Máximo 5 MB. Si no cumple, sale un mensaje claro y no se sube nada.
- **En el navegador, antes de subirla** (`foto.js`): recorte cuadrado centrado, 400x400 y WebP (JPEG si el navegador no sabe hacer WebP), bajando la calidad hasta < 150 KB. Como se vuelve a codificar desde un canvas, **el archivo nuevo no lleva los metadatos EXIF, ni la ubicación GPS**. Nunca se sube el archivo original (hay un test).
- **Al guardar:** primero se sube la foto (`subirFoto`) y su ruta va en el **mismo** `insert`/`update` del perfil (`foto_path`). «Quitar» se aplica al guardar (`quitarFoto`: borra el archivo y deja `foto_path` a `null`). «Borrar mi perfil» borra antes la foto y después la fila; si no puede borrar la foto, no borra la fila.
- **Para verla:** URL firmada de 1 hora (`createSignedUrl`), nunca pública. Si no carga (p. ej. ha caducado), la tarjeta vuelve a las iniciales.
- **Consentimiento:** añade «foto (si la subes)» a la lista y se guarda con `consent_version = 'v2'` (`CONSENTIMIENTO_VERSION_FOTOS`, pendiente del texto de Legal).
- **Errores:** sesión caducada y red dan los mensajes de siempre; si Storage rechaza el archivo, «No se ha podido subir la foto. Prueba con otra imagen.»

| Función (`api.js`) | Llamada |
|---|---|
| `subirFoto(blob)` | `storage.from('fotos-perfil').upload('<user_id>/foto.webp', blob, { upsert: true, contentType, cacheControl: '3600' })` |
| `obtenerPerfil()` | Añade `foto_path` al `select` y, si hay foto, `createSignedUrl(foto_path, 3600)` → `perfil.foto_url` |
| `guardarPerfil(datos)` | Si `datos.foto_path` viene, va en el `insert`/`update`. Si no cambia la foto, no se toca |
| `quitarFoto()` | `storage…remove(['<user_id>/foto.webp'])` y `update({ foto_path: null }).eq('user_id', id)` |
| `borrarPerfil()` | `storage…remove([…])` y después el `delete` de siempre |

El nombre del archivo es siempre `foto.webp`, aunque se suba JPEG (el tipo real va en `contentType`): así otra foto sobrescribe la anterior. El `upsert` es del **archivo** en Storage; en la tabla sigue sin usarse `upsert`.

### 16.2 Qué tiene que hacer Pablo para encenderlo

Los nombres del bucket, la columna y la caducidad están en `api.js` (`BUCKET_FOTOS`, `COLUMNA_FOTO`, `CADUCIDAD_URL_FOTO_S`), confirmados con Pablo. Si cambian, se cambian ahí.

1. **Bucket privado `fotos-perfil`:** Storage → New bucket, **Public bucket desactivado**. Recomendado: límite de 1 MB por archivo y tipos permitidos `image/webp, image/jpeg` (lo que sube la página).
2. **Columna `foto_path`** en `profiles` (`text`, admite `null`):

   ```sql
   alter table public.profiles add column foto_path text null;
   ```

   `profiles` tiene permisos por columna (por eso `select('*')` falla): hay que dar también permiso sobre la columna nueva, igual que sobre las demás. Por ejemplo:

   ```sql
   grant select (foto_path), insert (foto_path), update (foto_path) on public.profiles to authenticated;
   ```

3. **Políticas de Storage** (en `storage.objects`): cada persona solo escribe y borra en su carpeta `<user_id>/`, y solo pueden ver fotos los usuarios con sesión que estén en `attendees`. El `upsert` necesita las tres de escritura (`insert`, `update`) y la de lectura (`select`); `createSignedUrl` necesita la de lectura.

   Las políticas están en [`migrations/003_fotos.sql`](https://github.com/startuc3m/Startcamp/blob/main/migrations/003_fotos.sql) del repo de Pablo (`startuc3m/Startcamp`; hasta que se fusione, en su [PR #6](https://github.com/startuc3m/Startcamp/pull/6)). La de lectura usa `private.is_attendee()`: **no** puede consultar `attendees.user_id`, porque esa columna no existe (`attendees` va por correo) y el cliente no puede leer `attendees`.

   Ninguna política para `anon`: sin sesión no se ve ninguna foto.

4. **Borrado al acabar el Start Camp:** el script que borre los perfiles al acabar tiene que **vaciar también el bucket** `fotos-perfil` (borrar la fila no borra el archivo). Lo mismo si se borra un usuario de `auth.users` a mano.
5. **Encender:** `FOTOS_ACTIVAS = true` en `src/startcamp/opciones.js`, con el texto de Legal del consentimiento ya puesto (`PENDIENTE: texto de Legal` en `AvatarForm.jsx`). Commit, push y despliegue.

### 16.3 Comprobar después de encenderlo

Sin `?demo`, con un correo de attendees:

1. Subir una foto hecha con el móvil (con ubicación). Guardar. En Storage aparece `<user_id>/foto.webp`, de 400x400 y menos de 150 KB. Descargarla y comprobar que no tiene EXIF ni GPS (p. ej. con `exiftool`).
2. Recargar: la foto sale en el campo y en la tarjeta.
3. Con otra cuenta de attendees, la URL firmada se ve; sin sesión, la ruta del bucket da error.
4. Intentar subir a la carpeta de otra persona (p. ej. desde la consola con su `user_id`): Storage lo rechaza.
5. «Quitar» y guardar: el archivo desaparece y `foto_path` queda en `null`.
6. «Borrar mi perfil»: desaparecen la fila y el archivo.
7. Un GIF o una imagen de más de 5 MB: mensaje claro y no se sube nada.
