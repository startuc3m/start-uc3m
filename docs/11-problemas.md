# 11 · Problemas frecuentes

Errores que ya nos han pasado. Si te pasa uno nuevo y lo resuelves, añádelo aquí.

## En local

### He añadido un campo nuevo a un evento y `npm run dev` da error 500 (`Cannot read properties of undefined`)

Astro guarda en caché el contenido ya procesado y no siempre detecta cambios en `src/content.config.ts`.

```bash
npx astro dev stop          # si hay un servidor en segundo plano
rm -f .astro/data-store.json
npm run dev -- --force
```

El build (`npm run build`) siempre parte de cero, así que si el build funciona y el dev no, es esto.

### `npm run dev` dice "Dev server already running" y abre otro puerto

Hay otro servidor de Astro en marcha (quizá de otra terminal). `npx astro dev stop` lo para. Comprueba en qué puerto está con `npx astro dev status`.

### `/socios` carga pero no aparecen las modalidades

Falta el servidor de `api/`. Arranca `npm run dev:api` en otra terminal (necesita `.env.local`). Ver [01 · Empezar](01-empezar.md#solo-si-vas-a-tocar-socios-o-formularios).

### El webhook de Stripe falla en local con un error de firma

No lo mandes por el proxy de Astro (`:4321`): cambia el cuerpo de la petición y la firma deja de validar. Apúntalo directamente a `stripe listen --forward-to localhost:3001/api/stripe/webhook`.

### He cambiado una foto del equipo y sigue saliendo la vieja

El navegador guarda la imagen en caché. Usa un nombre de archivo nuevo (`nombre_apellido_2.jpg`) en lugar de sobrescribir el anterior.

### El build falla con `Falta la foto src/assets/fotos/<nombre>.jpg`

Hay un nombre mal escrito en `src/lib/fotos.ts`, o la foto no se ha subido. Los nombres van sin extensión y la foto tiene que ser `.jpg`.

### El build falla con un error de esquema (`InvalidContentEntryDataError`)

El frontmatter de un `.md` no cumple `src/content.config.ts`: falta un campo obligatorio, una fecha no tiene el formato `AAAA-MM-DD`, o `category` / `status` tiene un valor que no está en la lista. El error dice qué archivo y qué campo.

## En producción

### Un pago se cobra pero el socio no queda dado de alta

Casi seguro es el webhook de Stripe. Comprueba en Stripe → *Developers → Webhooks*:
1. Que la URL es **`https://www.startuc3m.es/api/stripe/webhook`**, con `www`. Sin `www` hay una redirección 308 y Stripe no la sigue.
2. Que no hay entregas fallidas. Si las hay, pulsa *Resend* en cada una: el webhook es idempotente, así que no duplica socios ni correos.

Más en [socios.md](socios.md).

### Un evento que ya ha pasado sigue saliendo como "abierto"

La web es estática: el estado `pasado` se calcula al construir. Haz un despliegue (cualquier merge a `main`, o *Redeploy* en Vercel).

### La preview de Vercel pide iniciar sesión

Es la *Deployment Protection* de Vercel. Entra con una cuenta del equipo, o crea un enlace para compartir desde el despliegue.

### Un archivo de `public/` no se sirve (404) aunque está en el repo

Vercel no sirve archivos de más de 25 MB. Por eso el vídeo de la historia está recodificado. Reduce el archivo.

### El formulario de contacto dice que no se ha podido enviar

Responde `503 NO_DISPONIBLE` cuando Resend falla o no está configurado, y `429` si la base de datos no responde (por seguridad, se rechaza). Mira los logs de la función en Vercel → *Logs*, filtrando por `/api/contacto`.

### Los avisos de Start Camp siguen saliendo después del evento

No deberían: se esconden en el navegador al pasar `STARTCAMP_END` (`src/components/lanyard/startcamp_countdown.js`). Si salen, comprueba esa fecha. Ver [06 · Start Camp](06-start-camp.md).
