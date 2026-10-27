# Formularios

La web es estática: los formularios llaman a funciones serverless de `api/`, que Vercel sirve junto a `dist/`.

## Contacto y patrocinio

`POST /api/contacto` (`api/contacto.mjs`), con JSON `{ form, nombre, email, mensaje, asunto?, empresa?, privacidad, website }`. El componente es `src/components/ContactForm.astro` (en `/contacto`, `/patrocina` y la home).

Flujo:
1. Honeypot: si el campo oculto `website` viene relleno, responde `200 { ok: true }` sin enviar nada.
2. `form` debe ser `contacto` o `patrocinio`; nombre, email, mensaje y casilla de privacidad se validan → si no, `400 { error: 'INVALID_*' }`.
3. Rate limit: máx. 5 envíos por IP cada 10 minutos (`rateLimit` de `api/_lib/http.mjs`, en Postgres). Si la BD no responde, se rechaza (`429`): es un endpoint público que manda correo.
4. Se envía un correo con Resend al buzón de Start (`CONTACT_EMAIL`, por defecto startuc3m@gmail.com), con `replyTo` a quien escribe. Si Resend no está configurado o falla, se devuelve error: no se contesta "recibido" sin haber enviado nada.

No se guarda nada en la web.

## Socios

El alta de socios (`/socios`) va por `api/membership/*` y Stripe; está documentada en `docs/` (flujo de socios).

## Únete

Las inscripciones están cerradas (#31) y `/unete` no tiene formulario. Para la próxima convocatoria hay que crear un handler en `api/` (como `api/contacto.mjs`) y su formulario.

## Correo de acceso al perfil del Start Camp

El perfil del Start Camp (`/eventos/start-camp/avatar`) no tiene formulario en `api/`: se entra con un enlace de un solo uso que manda Supabase (magic link). La plantilla de ese correo es `docs/correo-enlace-startcamp.html`. Todo el perfil está documentado en [`docs/startcamp-perfil.md`](../startcamp-perfil.md).

- **Dónde va:** Supabase → Authentication → Emails → Templates → **Magic Link**. La pega quien administra Supabase; no se despliega con la web.
- **Asunto:** `Tu enlace para entrar en tu perfil del Start Camp`
- **Variables:** `{{ .ConfirmationURL }}` (el enlace, caduca en 1 hora) y `{{ .Data.nombre }}` (`user_metadata.nombre`, lo carga el script de entradas). Se pegan tal cual, sin sustituirlas.
- **Saludo:** si `user_metadata.nombre` no existe, queda en «Hola:».
- **Remitente:** no está en la plantilla; se configura aparte en el SMTP personalizado de Supabase (Resend).
