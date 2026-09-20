# Registro y pago de socios

Flujo completo: el invitado entra en `/socios`, elige modalidad, paga por Stripe y
el webhook le asigna un número de socio, le manda el correo de bienvenida y crea
su ficha en el Notion de Start.

## Piezas

| Ruta | Qué hace |
|---|---|
| `db/schema.sql` | Esquema completo. Idempotente: se puede reejecutar. |
| `api/membership/availability.mjs` | `GET` — estado de las 4 modalidades |
| `api/membership/premium-eligibility.mjs` | `POST` — `{email}` → `{eligible}`, con rate limiting |
| `api/membership/checkout.mjs` | `POST` — reserva plaza y abre Stripe Checkout |
| `api/stripe/webhook.mjs` | `POST` — confirma pago, asigna ID, correo y Notion |
| `src/pages/Socios.js` | Formulario público |
| `src/pages/SociosGracias.js` | Vuelta desde Stripe |

## Variables de entorno

```
DATABASE_URL                 # Postgres de Neon
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRODUCT_STANDARD      # opcional: si no se pone, el producto se crea al vuelo
STRIPE_PRODUCT_PREMIUM       # opcional
RESEND_API_KEY
EMAIL_FROM                   # "Start UC3M <socios@startuc3m.es>"
CONTACT_EMAIL                # opcional, sale en el correo de bienvenida
NEXT_PUBLIC_SITE_URL         # https://startuc3m.es
NOTION_API_KEY               # token de la integración interna de Notion
NOTION_SOCIOS_DATABASE_ID    # id de la base de datos de socios
```

Sin `RESEND_*` o sin `NOTION_*` el sistema **sigue funcionando**: el socio queda
dado de alta en la BD, que es la fuente de verdad, y el fallo solo se registra en
los logs. Se hizo así a propósito: un fallo de Notion o de Resend no puede dejar a
alguien pagado y sin dar de alta.

## Puesta en marcha

### 1. Base de datos

Crear la base en Neon (Vercel Marketplace) y ejecutar `db/schema.sql` en la consola
SQL. Vercel inyecta `DATABASE_URL` automáticamente al conectar la integración.

### 2. Stripe

1. Cuenta a nombre de la asociación, en modo test primero.
2. Activar el envío de recibos: *Settings → Customer emails → Successful payments*.
3. Webhook a `https://startuc3m.es/api/stripe/webhook` con los eventos
   `checkout.session.completed` y `checkout.session.expired`.
4. Copiar el signing secret a `STRIPE_WEBHOOK_SECRET`.

### 3. Notion

La base vive en el Notion **de Start**, no en una cuenta personal.

1. Crear una base de datos llamada *Socios Start UC3M*. El código **no exige** un
   esquema concreto: lee las propiedades que tenga la base y rellena solo las que
   reconoce, así que renombrar o quitar una columna no rompe el alta, solo deja
   ese dato fuera de Notion.

   | Propiedad | Tipo | Estado |
   |---|---|---|
   | *(la de título, se llame como se llame)* | Título | recibe el nombre del socio |
   | `Nº socio` | Número | **en uso** |
   | `Email` | Email | **en uso** |
   | `Modalidad` | Selección — `Estándar`, `Premium` | **en uso** |
   | `Importe` | Número (formato euro) | **en uso** |
   | `Fecha de pago` | Fecha | **en uso** |
   | `Stripe payment intent` | Texto | **en uso** |
   | `Tramo` | Selección — `Tramo 1`…`Tramo 3`, `Premium` | opcional, se deduce del importe |
   | `ID socio` | Texto | opcional, es `Nº socio` con ceros delante |

   La propiedad de título se localiza **por tipo**, no por nombre: da igual que se
   llame `Nombre`, `Socio` o `Name`.

   Para comprobar que la base y el código encajan, sin esperar a un pago real:

   ```bash
   npm run test:notion            # contrasta el esquema
   node db/test-notion.js --alta  # además crea una ficha de prueba y la archiva
   ```

2. Crear una integración interna en <https://www.notion.so/my-integrations>
   (workspace de Start), con permiso de *Insert content*.
3. Copiar el *Internal Integration Token* a `NOTION_API_KEY`.
4. En la base de datos: *⋯ → Connections → Connect to →* la integración recién
   creada. **Sin este paso la API responde 404 aunque el token sea correcto.**
5. El id de la base son los 32 caracteres de su URL:
   `notion.so/<workspace>/<ESTO_ES_EL_ID>?v=…` → `NOTION_SOCIOS_DATABASE_ID`.

### 4. Resend

Dominio verificado de Start y `EMAIL_FROM` con una dirección de ese dominio.

## Operativa

```sql
-- Añadir invitados premium
insert into premium_invites (email, note) values
  ('persona@alumnos.uc3m.es', 'junta'),
  ('otra@gmail.com', 'ponente')
on conflict (email) do nothing;

-- Abrir / cerrar el premium
update membership_settings set premium_open = false;

-- Cambiar precios o cupos sin tocar código
update membership_settings set tier1_limit = 15, tier2_price_cents = 999;

-- Exportar socios
select lpad(member_number::text, 4, '0') as id, full_name, email, plan, tier,
       price_cents / 100.0 as eur, paid_at
  from memberships
 where status = 'paid'
 order by member_number;

-- Quién tiene un pago a medias ahora mismo
select email, plan, tier, reserved_until
  from memberships
 where status = 'reserved' and reserved_until > now();
```

## Tests

```bash
npm test                 # formulario (React)
npm run test:socios      # lógica SQL + endpoints, necesita DATABASE_URL
```

Para la BD de pruebas basta un Postgres desechable:

```bash
docker run -d --name start-socios-pg \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=socios_test \
  -p 55432:5432 postgres:16-alpine

DATABASE_URL="postgres://postgres:test@localhost:55432/socios_test" npm run test:socios
```

## Prueba end-to-end en modo test

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Tarjeta `4242 4242 4242 4242`, cualquier fecha futura y CVC. Comprobar que llega
el correo, que el número de socio es correlativo y que aparece la fila en Notion.

## Decisiones que conviene recordar

- **El precio lo decide siempre el servidor.** Lo que muestra el formulario es
  informativo; si el tramo cambia mientras el usuario rellena, se le avisa antes
  de redirigir en lugar de cobrarle de más en silencio.
- **El premium no consume plazas estándar**, pero sí comparte la numeración de
  socio.
- **El número de socio se asigna al pagar**, no al reservar, para que un pago
  abandonado no deje un hueco en la serie.
- **El webhook es idempotente**: `confirm_membership_payment` no devuelve fila en
  un reintento, así que ni se reenvía el correo ni se duplica la ficha de Notion.
- **Riesgo aceptado en el premium**: quien conozca el email de un invitado podría
  pagar en su nombre. El socio quedaría a nombre de ese email y pagando más. Si se
  quiere cerrar, hay que verificar el email con un código de un solo uso.
