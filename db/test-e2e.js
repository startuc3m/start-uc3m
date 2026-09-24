/* eslint-disable no-console */
/**
 * Prueba de punta a punta sin navegador.
 *
 *   node db/test-e2e.js tu@email.com
 *
 * Recorre el flujo completo llamando a los mismos handlers que Vercel:
 * disponibilidad -> checkout (sesion real de Stripe) -> webhook firmado ->
 * alta del socio -> correo -> ficha en Notion.
 *
 * Lo unico que no cubre es rellenar la tarjeta en la pasarela: el evento
 * de pago se firma aqui con el mismo algoritmo que usa Stripe, que es lo
 * que hace `stripe trigger`.
 *
 * SOLO contra la base de pruebas. Se niega a tocar neondb.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
      }
    });
}

const DESTINO = process.argv[2];
if (!DESTINO || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(DESTINO)) {
  console.error('Uso: node db/test-e2e.js tu@email.com');
  process.exit(2);
}

if (/\/neondb(\?|$)/.test(process.env.DATABASE_URL || '')) {
  console.error('DATABASE_URL apunta a neondb (PRODUCCION). Esta prueba vacia la base.');
  console.error('Apunta DATABASE_URL a socios_test.');
  process.exit(2);
}

// El webhook necesita un secreto para verificar la firma. En local lo
// fijamos nosotros y firmamos con el mismo, igual que hace stripe listen.
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_pruebadepuntaapunta';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: true },
});

let fallos = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { fallos += 1; console.log('  FAIL ' + m); };
const info = (m) => console.log('       ' + m);

/** Respuesta falsa con la misma forma que la de Vercel. */
function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    end(payload) { this.body = payload; this._resolve(); },
  };
  res.done = new Promise((r) => { res._resolve = r; });
  return res;
}

/** Peticion falsa: un stream legible, como la que recibe una funcion. */
function fakeReq(method, body, headers) {
  const { Readable } = require('stream');
  const raw = body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
  const req = Readable.from([raw]);
  req.method = method;
  req.url = '/';
  req.headers = Object.assign({ 'content-type': 'application/json' }, headers || {});
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

async function llamar(handler, method, body, headers) {
  const req = fakeReq(method, body, headers);
  const res = fakeRes();
  await handler(req, res);
  await res.done;
  let json = null;
  try { json = JSON.parse(res.body); } catch { /* no json */ }
  return { status: res.statusCode, body: json };
}

async function main() {
  const availability = (await import('../api/membership/availability.mjs')).default;
  const checkout = (await import('../api/membership/checkout.mjs')).default;
  const webhook = (await import('../api/stripe/webhook.mjs')).default;
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  console.log('\nPreparando la base de pruebas');
  await pool.query('truncate premium_invites, memberships restart identity cascade');
  await pool.query('delete from rate_limits');
  await pool.query("select setval('member_number_seq', 1, false)");
  await pool.query('update membership_settings set premium_open = true');
  ok('base limpia, proximo numero 0001');

  // ---------------------------------------------------------------
  console.log('\n1. Disponibilidad');
  const disp = await llamar(availability, 'GET');
  const tramo1 = disp.body.options.find((o) => o.tier === 1);
  if (tramo1.state === 'available' && tramo1.priceCents === 799 && tramo1.remaining === 10) {
    ok('tramo 1 disponible a 7,99 EUR con 10 plazas');
  } else {
    fail('estado inicial inesperado: ' + JSON.stringify(tramo1));
  }

  // ---------------------------------------------------------------
  console.log('\n2. Checkout');
  const alta = await llamar(checkout, 'POST', {
    name: 'Socio de Prueba',
    email: DESTINO,
    plan: 'standard',
    phone: '666123456',
    acceptedPrivacy: true,
  });

  if (alta.status !== 200 || !alta.body.url) {
    fail('el checkout fallo: ' + JSON.stringify(alta.body));
    return resumen();
  }
  ok('sesion de Stripe creada, se cobrarian ' + (alta.body.priceCents / 100).toFixed(2).replace('.', ',') + ' EUR (tramo ' + alta.body.tier + ')');

  const reserva = await pool.query("select * from memberships where email = $1", [DESTINO.toLowerCase()]);
  const fila = reserva.rows[0];
  if (fila && fila.status === 'reserved' && fila.member_number === null) {
    ok('plaza reservada, todavia SIN numero de socio (se asigna al pagar)');
  } else {
    fail('la reserva no quedo como se esperaba: ' + JSON.stringify(fila));
  }

  const ocupadas = await pool.query('select membership_occupied() as n');
  if (ocupadas.rows[0].n === 1) ok('la reserva ocupa plaza mientras no caduque');
  else fail('ocupacion inesperada: ' + ocupadas.rows[0].n);

  // ---------------------------------------------------------------
  console.log('\n3. Webhook de pago (evento firmado igual que Stripe)');

  const evento = {
    id: 'evt_prueba_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: fila.stripe_session_id,
        object: 'checkout.session',
        payment_status: 'paid',
        payment_intent: 'pi_prueba_' + Date.now(),
        client_reference_id: fila.id,
        metadata: { membership_id: fila.id, plan: 'standard', tier: '1' },
      },
    },
  };

  const cuerpo = JSON.stringify(evento);
  const firma = stripe.webhooks.generateTestHeaderString({
    payload: cuerpo,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  const { Readable } = require('stream');
  async function enviarWebhook(sig) {
    const req = Readable.from([Buffer.from(cuerpo)]);
    req.method = 'POST';
    req.url = '/';
    req.headers = { 'content-type': 'application/json', 'stripe-signature': sig };
    req.socket = { remoteAddress: '127.0.0.1' };
    const res = fakeRes();
    await webhook(req, res);
    await res.done;
    return { status: res.statusCode, body: JSON.parse(res.body) };
  }

  const falsa = await enviarWebhook('t=1,v1=firmafalsa');
  if (falsa.status === 400 && falsa.body.error === 'INVALID_SIGNATURE') {
    ok('rechaza un evento con firma invalida');
  } else {
    fail('acepto una firma invalida: ' + JSON.stringify(falsa));
  }

  const buena = await enviarWebhook(firma);
  if (buena.status === 200) ok('acepta el evento firmado');
  else fail('el webhook devolvio ' + buena.status + ': ' + JSON.stringify(buena.body));

  // ---------------------------------------------------------------
  console.log('\n4. El socio ha quedado dado de alta');

  const socio = (await pool.query('select * from memberships where id = $1', [fila.id])).rows[0];

  if (socio.status === 'paid') ok('estado: paid'); else fail('estado: ' + socio.status);
  if (socio.member_number === 1) ok('numero de socio: 0001'); else fail('numero de socio: ' + socio.member_number);
  if (socio.paid_at) ok('fecha de pago registrada'); else fail('sin fecha de pago');
  if (socio.price_cents === 799) ok('importe cobrado: 7,99 EUR'); else fail('importe: ' + socio.price_cents);

  info('El correo y la ficha de Notion salen de este mismo paso;');
  info('si algo hubiera fallado, apareceria arriba como [webhook] ...');

  // ---------------------------------------------------------------
  console.log('\n5. Idempotencia: Stripe reintenta el mismo evento');

  const reintento = await enviarWebhook(firma);
  if (reintento.status === 200) ok('el reintento responde 200 (no hace reintentar a Stripe)');
  else fail('el reintento devolvio ' + reintento.status);

  const tras = (await pool.query('select member_number from memberships where id = $1', [fila.id])).rows[0];
  if (tras.member_number === 1) ok('el numero de socio no cambia');
  else fail('el numero cambio a ' + tras.member_number);

  const seq = await pool.query('select last_value from member_number_seq');
  if (Number(seq.rows[0].last_value) === 1) ok('el reintento no consumio la secuencia');
  else fail('la secuencia avanzo a ' + seq.rows[0].last_value);

  // ---------------------------------------------------------------
  console.log('\n6. El segundo socio');

  const segundo = await llamar(checkout, 'POST', {
    name: 'Segundo Socio',
    email: 'segundo-prueba@startuc3m.es',
    plan: 'standard',
    phone: '666123456',
    acceptedPrivacy: true,
  });

  if (segundo.status === 200 && segundo.body.priceCents === 799) {
    ok('sigue en el tramo 1 a 7,99 EUR (quedan plazas)');
  } else {
    fail('precio inesperado: ' + JSON.stringify(segundo.body));
  }

  const repetido = await llamar(checkout, 'POST', {
    name: 'Socio de Prueba',
    email: DESTINO,
    plan: 'standard',
    phone: '666123456',
    acceptedPrivacy: true,
  });
  if (repetido.status === 409 && repetido.body.error === 'ALREADY_MEMBER') {
    ok('quien ya es socio no puede volver a pagar');
  } else {
    fail('deberia rechazar a un socio existente: ' + JSON.stringify(repetido.body));
  }

  // ---------------------------------------------------------------
  // 7. Limpieza en Notion
  //
  // NOTION_API_KEY apunta a la base real de Start, asi que el alta de
  // prueba crea una ficha de verdad. Si no la archivamos, cada ejecucion
  // deja un socio inventado mezclado con los reales.
  // ---------------------------------------------------------------
  console.log('\n7. Limpieza de Notion');
  await limpiarNotion();

  await pool.end();
  return resumen();
}

async function limpiarNotion() {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SOCIOS_DATABASE_ID;

  if (!token || !databaseId) {
    aviso('sin configurar, no hay nada que limpiar');
    return;
  }

  const headers = {
    Authorization: 'Bearer ' + token,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 50 }),
    });
    const { results = [] } = await res.json();

    let archivadas = 0;
    for (const page of results) {
      // Las altas de esta prueba llevan siempre un payment intent 'pi_prueba_...'.
      const pi = (page.properties['Stripe payment intent']?.rich_text || [])
        .map((x) => x.plain_text)
        .join('');
      if (!pi.startsWith('pi_prueba')) continue;

      await fetch('https://api.notion.com/v1/pages/' + page.id, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ archived: true }),
      });
      archivadas += 1;
    }

    if (archivadas) ok(archivadas + ' ficha(s) de prueba archivadas');
    else aviso('no se creo ninguna ficha (Notion pudo fallar, revisa los logs de arriba)');
  } catch (err) {
    fail('no se pudo limpiar Notion: ' + err.message + ' — archivala a mano');
  }
}

function aviso(m) {
  console.log('  ~    ' + m);
}

function resumen() {
  console.log('\n' + '-'.repeat(60));
  if (fallos) {
    console.log(fallos + ' fallo(s)');
    process.exitCode = 1;
    return;
  }
  console.log('Flujo completo correcto.');
  console.log('Revisa ahora el correo y la ficha creada en Notion.');
}

main().catch(async (err) => {
  console.error('\nError: ' + err.message);
  try { await pool.end(); } catch { /* ya cerrado */ }
  process.exitCode = 1;
});
