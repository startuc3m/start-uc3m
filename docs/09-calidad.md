# 09 · Calidad

Qué se comprueba, cómo y cuándo.

## Las tres comprobaciones automáticas

| Comprobación | Comando | Qué valida |
|---|---|---|
| **Build** | `npm run build` | Que todas las páginas se generan, que el frontmatter de cada `.md` cumple su esquema y que existen todas las fotos referenciadas. **Es el test más importante de la web**: la parte Astro no tiene tests de componente |
| **Tests de la web** | `npm test` | Vitest + Testing Library sobre las islas React de socios (`src/socios/*.test.jsx`) |
| **Tests de socios** | `npm run test:socios` | La lógica SQL de `db/schema.sql` y los endpoints de `api/`, contra un Postgres real |

## CI (GitHub Actions)

`.github/workflows/build.yml` se ejecuta en cada PR contra `main`:

| Job | Pasos |
|---|---|
| `build` | `npm ci` → `npm run build` → `npm test` |
| `socios` | Levanta un Postgres 16 desechable y ejecuta `npm run test:socios` |

Un PR con el CI en rojo no se mergea.

> **Hazlo siempre en local antes de subir**: `npm run build && npm test`. Si las Actions no arrancan (por ejemplo, por límite de minutos), lo que cuenta es lo que hayas comprobado en local; dilo en el PR.

## Tests de socios en detalle

```bash
# Postgres desechable con Docker
docker run -d --name start-socios-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=socios_test -p 55432:5432 postgres:16-alpine
DATABASE_URL="postgres://postgres:test@localhost:55432/socios_test" npm run test:socios
```

| Script | Qué prueba | Necesita |
|---|---|---|
| `test:db` | Funciones SQL (reservas, numeración, idempotencia) | `DATABASE_URL` de pruebas |
| `test:api` | Endpoints de `api/membership` y el webhook | `DATABASE_URL` de pruebas |
| `test:notion` | Que la base de Notion encaja con el código (`--alta` crea y archiva una ficha) | `NOTION_*` |
| `test:email` | Envío real con Resend | `RESEND_*` |
| `test:stripe` | Conexión con Stripe en modo test | `STRIPE_SECRET_KEY` de test |
| `test:e2e` | Flujo completo: disponibilidad → checkout → webhook firmado → alta → correo → Notion | Todo lo anterior, en modo test |

Nunca apuntes estos scripts a la base de datos de producción.

## Checklist de QA antes de mergear

Para cualquier PR que cambie algo visible:

- [ ] **Móvil (~400 px) y escritorio**: en las herramientas del navegador o, mejor, en un móvil real.
- [ ] **Sin scroll horizontal** a 360 px.
- [ ] **Animaciones con "reducir movimiento"** activado: todo se ve sin animar (en Chrome: *DevTools → Rendering → Emulate prefers-reduced-motion*).
- [ ] **Contraste, `alt` y foco** visibles (ver [05 · Diseño](05-diseno.md#accesibilidad)).
- [ ] **Enlaces**: ninguno roto ni vacío (`href="#"`).
- [ ] **Contenido confirmado**: nada sin validar con el departamento responsable.

## Lighthouse

Sobre la build de producción, no sobre `npm run dev` (el modo desarrollo es mucho más lento):

```bash
npm run build && npm run preview          # sirve dist/ en localhost:4321
npx lighthouse http://localhost:4321/ --view
```

Objetivo: **≥ 90 en rendimiento y ≥ 95 en accesibilidad** en la home y las páginas principales. Última medición (29/10/2026, móvil, con los arreglos del PR #74):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| `/` | 90 | 100 | 100 | 100 |
| `/eventos/start-camp` | 98 | 100 | 100 | 100 |
| `/socios` | 95 | 100 | 96 | 100 |
| `/podcast` | 97 | 100 | 96 | 100 |
| `/equipo` | 97 | 96 | 100 | 100 |

> Lighthouse puede marcar falsos fallos de contraste si mide en mitad de una animación de entrada (colores "lavados"). Compruébalo con "reducir movimiento" activado.

## Enlaces rotos

No hay script en el repo todavía. La forma rápida: con `npm run preview` en marcha, recorrer los `href` de cada página y comprobar el código de respuesta. LinkedIn responde `999` y algunas webs `403` a los robots, aunque el enlace funcione: compruébalos a mano.

## Deuda técnica conocida

| Qué | Dónde | Por qué importa |
|---|---|---|
| Clases `.adm-*` del panel `/admin` que se quitó (#15) | `src/styles/global.css`, bloque "Panel /admin" | CSS muerto: se puede borrar |
| Sin tests de las páginas Astro | — | El build cubre mucho, pero no comportamientos (filtros, cuentas atrás) |
| Fechas de Start Camp en dos sitios | `start-camp.md` y `startcamp_countdown.js` | Si cambian, hay que tocar los dos (ver [06](06-start-camp.md)) |
| Enlace de Neonpass en tres sitios | `start-camp.md`, `EVENT_URL` del lanyard y su QR | Ídem |
