# 01 · Empezar

De cero a tener la web corriendo en tu ordenador y abrir tu primer PR. Unos 15 minutos.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | **22.12 o más** (`engines` de `package.json`) | Astro, los tests y los scripts |
| npm | la que trae Node | Dependencias |
| git | cualquiera reciente | Control de versiones |
| [GitHub CLI](https://cli.github.com) (`gh`) | opcional | Abrir PRs e issues desde la terminal |
| [Stripe CLI](https://stripe.com/docs/stripe-cli) | opcional | Solo si vas a probar pagos de socios en local |

> En Mac lo más cómodo es `brew install node gh`. Comprueba la versión con `node -v`.

## Instalar y arrancar

```bash
git clone https://github.com/startuc3m/start-uc3m.git
cd start-uc3m
npm install
npm run dev
```

Abre **http://localhost:4321**. Cada vez que guardas un archivo, la página se recarga sola.

Eso es todo lo que necesitas para trabajar en páginas, textos, eventos, podcast, equipo o diseño. **No hace falta ninguna variable de entorno** para la parte pública.

### Solo si vas a tocar socios o formularios

Las funciones de `api/` (socios, contacto) no las sirve Astro. Para probarlas en local:

```bash
# crea .env.local con las variables de la tabla de abajo
npm run dev:api                # funciones de api/ en http://localhost:3001
npm run dev                    # en otra terminal; reenvía /api al 3001
```

Variables que usan (todas en `.env.local`, que **nunca** se sube a git):

| Variable | Para qué | ¿Obligatoria en local? |
|---|---|---|
| `DATABASE_URL` | Postgres de socios | Sí, **una BD de pruebas**. Nunca la de producción |
| `STRIPE_SECRET_KEY` | Pagos | Sí, clave de **modo test** (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Firma del webhook | Sí, la que da `stripe listen` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Correos | No: sin ellas el alta funciona y el correo solo se registra en consola |
| `NOTION_API_KEY`, `NOTION_SOCIOS_DATABASE_ID` | Ficha del socio en Notion | No (`DEV_NOTION_DESACTIVADO=1` lo apaga) |
| `CONTACT_EMAIL` | Buzón del formulario de contacto | No (por defecto, startuc3m@gmail.com) |
| `NEXT_PUBLIC_SITE_URL` | URL base en los correos | No |

El detalle completo está en [socios.md](socios.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Web en local con recarga en caliente (puerto 4321) |
| `npm run build` | Genera la web final en `dist/`. Si falla aquí, fallará en Vercel |
| `npm run preview` | Sirve `dist/` como en producción (para Lighthouse o probar el build) |
| `npm test` | Tests de la web (Vitest) |
| `npm run dev:api` | Funciones de `api/` en el puerto 3001 |
| `npm run test:socios` | Tests de la lógica SQL y los endpoints de socios (necesita `DATABASE_URL` de pruebas) |
| `npm run db:load` | Carga `db/schema.sql` en la BD de `DATABASE_URL` |

El resto de scripts (`invitar`, `corregir-email`, `pedir-telefonos`, `test:stripe`, `test:e2e`…) son de operativa de socios y están en [socios.md](socios.md).

## Accesos que vas a necesitar

Pídeselos a quien lleve IT. No todo el mundo necesita todo.

| Servicio | Para qué | Quién lo necesita |
|---|---|---|
| **GitHub** (org `startuc3m`) | Código, issues, PRs | Todo IT |
| **Vercel** (proyecto `start-uc3m`) | Despliegues, previews, variables, logs, analítica | Quien despliega o depura producción |
| **Neon** | Base de datos de socios | Solo quien toca socios |
| **Stripe** | Pagos (modo test para desarrollar) | Solo quien toca socios |
| **Resend** | Envío de correos | Solo quien toca correos |
| **Notion** de Start | Equipo, eventos, tareas (solo lectura) | Todo IT, para sacar contenido |
| **Drive** de Marketing | Fotos oficiales (carpeta *FOTOS EVENTOS*) y brand kit | Quien cambia fotos o diseño |

## Tu primer cambio

1. Elige un issue (los que tienen la etiqueta `good first issue` son buenos para empezar) o pide uno.
2. Crea una rama desde `main`: `git checkout -b fix/<número>-lo-que-sea`.
3. Haz el cambio y compruébalo en `npm run dev`, en móvil (las herramientas del navegador a ~400 px) y en escritorio.
4. Antes de subir: `npm run build && npm test`.
5. Commit en español con *conventional commits*: `fix(eventos): …`.
6. Abre el PR contra `main`, enlaza el issue (`Closes #N`) y pide revisión.

Todo esto está explicado con más detalle en [10 · Cómo trabajamos](10-como-trabajamos.md).

## Siguiente

- Cómo está montada la web: [02 · Arquitectura](02-arquitectura.md)
- Dónde está cada cosa: [03 · Mapa del repo](03-mapa-del-repo.md)
