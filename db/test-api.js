/* eslint-disable no-console */
/**
 * Tests de integracion de los endpoints, contra Postgres real.
 *
 *   DATABASE_URL=postgres://... node db/test-api.js
 *
 * Stripe no se toca: los casos que cubrimos aqui se rechazan antes de
 * llegar a crear la sesion de pago.
 */

const http = require('http');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(2);
}
// Estos tests vacian las tablas. Contra la base de Start eso borraria a los
// socios, asi que hay que pedirlo a proposito.
if (/neon\.tech|prod/i.test(DATABASE_URL) && !process.env.ALLOW_REMOTE_TEST_DB) {
  console.error('DATABASE_URL apunta a una base remota y estos tests la VACIAN.');
  console.error('Si es una rama de pruebas, exporta ALLOW_REMOTE_TEST_DB=1.');
  process.exit(2);
}

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_no_usado';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_no_usado';

const pool = new Pool({ connectionString: DATABASE_URL });

let passed = 0;
const failures = [];

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'valor inesperado') + ': esperaba ' + expected + ', obtuve ' + actual);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function reset() {
  await pool.query('truncate premium_invites, memberships restart identity cascade');
  await pool.query('delete from rate_limits');
  await pool.query("select setval('member_number_seq', 1, false)");
  await pool.query('update membership_settings set premium_open = true');
}

async function test(name, fn) {
  await reset();
  try {
    await fn();
    passed += 1;
    console.log('  ok   ' + name);
  } catch (err) {
    failures.push({ name, err });
    console.log('  FAIL ' + name);
    console.log('       ' + (err && err.message));
  }
}

/** Levanta un servidor que enruta a los handlers reales. */
async function startServer() {
  const availability = (await import('../api/membership/availability.mjs')).default;
  const eligibility = (await import('../api/membership/premium-eligibility.mjs')).default;
  const checkout = (await import('../api/membership/checkout.mjs')).default;
  const webhook = (await import('../api/stripe/webhook.mjs')).default;

  const routes = {
    '/api/membership/availability': availability,
    '/api/membership/premium-eligibility': eligibility,
    '/api/membership/checkout': checkout,
    '/api/stripe/webhook': webhook,
  };

  const server = http.createServer((req, res) => {
    const path = req.url.split('?')[0];
    const handler = routes[path];
    if (!handler) {
      res.statusCode = 404;
      return res.end('no encontrado');
    }
    // Vercel no rellena req.body cuando bodyParser esta desactivado, y
    // nuestros handlers leen el stream: lo dejamos intacto igual que alli.
    return handler(req, res);
  });

  await new Promise((resolve) => server.listen(0, resolve));
  return { server, port: server.address().port };
}

function request(port, method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: Object.assign(
          payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {},
          headers || {}
        ),
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            /* respuesta no JSON */
          }
          resolve({ status: res.statusCode, body: json, text });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const { server, port } = await startServer();
  const call = (method, path, body, headers) => request(port, method, path, body, headers);

  console.log('\nGET /api/membership/availability');

  await test('devuelve las 4 modalidades con su estado', async () => {
    const res = await call('GET', '/api/membership/availability');
    assertEqual(res.status, 200, 'status');
    assertEqual(res.body.options.length, 4, 'numero de modalidades');

    const tier1 = res.body.options.find((o) => o.tier === 1);
    assertEqual(tier1.state, 'available', 'estado tramo 1');
    assertEqual(tier1.priceCents, 799, 'precio tramo 1');
    assertEqual(tier1.remaining, 10, 'plazas restantes');

    const premium = res.body.options.find((o) => o.plan === 'premium');
    assertEqual(premium.state, 'invite_only', 'estado premium');
    assertEqual(premium.priceCents, 2000, 'precio premium');
  });

  await test('solo expone remaining del tramo vigente', async () => {
    const res = await call('GET', '/api/membership/availability');
    const tier2 = res.body.options.find((o) => o.tier === 2);
    assertEqual(tier2.state, 'coming_soon', 'estado tramo 2');
    assertEqual(tier2.remaining, null, 'un tramo futuro no revela plazas');
  });

  await test('rechaza metodos que no sean GET', async () => {
    const res = await call('POST', '/api/membership/availability', {});
    assertEqual(res.status, 405, 'status');
  });

  console.log('\nPOST /api/membership/premium-eligibility');

  await test('un email invitado es elegible', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    const res = await call('POST', '/api/membership/premium-eligibility', { email: 'vip@uc3m.es' });
    assertEqual(res.status, 200, 'status');
    assertEqual(res.body.eligible, true, 'elegible');
  });

  await test('un email no invitado no es elegible', async () => {
    const res = await call('POST', '/api/membership/premium-eligibility', { email: 'nadie@uc3m.es' });
    assertEqual(res.body.eligible, false, 'elegible');
  });

  await test('con premium cerrado nadie es elegible', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    await pool.query('update membership_settings set premium_open = false');
    const res = await call('POST', '/api/membership/premium-eligibility', { email: 'vip@uc3m.es' });
    assertEqual(res.body.eligible, false, 'elegible');
  });

  await test('una invitacion ya usada deja de ser elegible', async () => {
    await pool.query("insert into premium_invites (email, used_at) values ('vip@uc3m.es', now())");
    const res = await call('POST', '/api/membership/premium-eligibility', { email: 'vip@uc3m.es' });
    assertEqual(res.body.eligible, false, 'elegible');
  });

  await test('no revela nada por el tiempo de respuesta', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");

    const t1 = Date.now();
    await call('POST', '/api/membership/premium-eligibility', { email: 'vip@uc3m.es' });
    const invitado = Date.now() - t1;

    const t2 = Date.now();
    await call('POST', '/api/membership/premium-eligibility', { email: 'nadie@uc3m.es' });
    const noInvitado = Date.now() - t2;

    assert(invitado >= 300, 'respuesta invitado demasiado rapida: ' + invitado + 'ms');
    assert(noInvitado >= 300, 'respuesta no invitado demasiado rapida: ' + noInvitado + 'ms');
    assert(
      Math.abs(invitado - noInvitado) < 150,
      'diferencia de tiempo observable: ' + invitado + 'ms vs ' + noInvitado + 'ms'
    );
  });

  await test('corta el sondeo masivo con rate limiting', async () => {
    let limited = 0;
    for (let i = 0; i < 14; i += 1) {
      const res = await call('POST', '/api/membership/premium-eligibility', { email: 'x@uc3m.es' });
      if (res.status === 429) limited += 1;
    }
    assert(limited > 0, 'ninguna peticion fue limitada tras 14 intentos');
  });

  console.log('\nPOST /api/membership/checkout');

  await test('criterio 4 - la API rechaza el premium de un email no invitado', async () => {
    const res = await call('POST', '/api/membership/checkout', {
      name: 'Intruso Listo',
      email: 'intruso@uc3m.es',
      plan: 'premium',
      acceptedPrivacy: true,
    });
    assertEqual(res.status, 409, 'status');
    assertEqual(res.body.error, 'PREMIUM_NOT_INVITED', 'error');

    const { rows } = await pool.query('select count(*)::int as n from memberships');
    assertEqual(rows[0].n, 0, 'no debe quedar ninguna reserva');
  });

  await test('criterio 6 - la API rechaza el premium con premium_open = false', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    await pool.query('update membership_settings set premium_open = false');
    const res = await call('POST', '/api/membership/checkout', {
      name: 'Socio VIP',
      email: 'vip@uc3m.es',
      plan: 'premium',
      acceptedPrivacy: true,
    });
    assertEqual(res.status, 409, 'status');
    assertEqual(res.body.error, 'PREMIUM_CLOSED', 'error');
  });

  await test('criterio 9 - la API rechaza a quien ya es socio', async () => {
    const r = await pool.query("select * from reserve_membership('socio@uc3m.es', 'Socio Uno', 'standard')");
    await pool.query('select confirm_membership_payment($1, $2)', [r.rows[0].id, 'pi_x']);

    const res = await call('POST', '/api/membership/checkout', {
      name: 'Socio Uno',
      email: 'socio@uc3m.es',
      plan: 'standard',
      acceptedPrivacy: true,
    });
    assertEqual(res.status, 409, 'status');
    assertEqual(res.body.error, 'ALREADY_MEMBER', 'error');
  });

  await test('exige aceptar la politica de privacidad', async () => {
    const res = await call('POST', '/api/membership/checkout', {
      name: 'Ana Garcia',
      email: 'ana@uc3m.es',
      plan: 'standard',
      acceptedPrivacy: false,
    });
    assertEqual(res.status, 400, 'status');
    assertEqual(res.body.error, 'PRIVACY_NOT_ACCEPTED', 'error');
  });

  await test('valida email y nombre antes de tocar la BD', async () => {
    const malEmail = await call('POST', '/api/membership/checkout', {
      name: 'Ana Garcia',
      email: 'esto-no-es-un-email',
      plan: 'standard',
      acceptedPrivacy: true,
    });
    assertEqual(malEmail.body.error, 'INVALID_EMAIL', 'email invalido');

    const malNombre = await call('POST', '/api/membership/checkout', {
      name: 'A',
      email: 'ana@uc3m.es',
      plan: 'standard',
      acceptedPrivacy: true,
    });
    assertEqual(malNombre.body.error, 'INVALID_NAME', 'nombre invalido');

    const { rows } = await pool.query('select count(*)::int as n from memberships');
    assertEqual(rows[0].n, 0, 'no debe crearse ninguna reserva');
  });

  console.log('\nPOST /api/stripe/webhook');

  await test('rechaza un webhook sin firma valida', async () => {
    const res = await call('POST', '/api/stripe/webhook', { type: 'checkout.session.completed' });
    assertEqual(res.status, 400, 'status');
    assertEqual(res.body.error, 'INVALID_SIGNATURE', 'error');
  });

  await test('un evento falsificado no da de alta a nadie', async () => {
    await call(
      'POST',
      '/api/stripe/webhook',
      {
        type: 'checkout.session.completed',
        data: { object: { payment_status: 'paid', metadata: { membership_id: 'x' } } },
      },
      { 'stripe-signature': 't=1,v1=falsa' }
    );
    const { rows } = await pool.query("select count(*)::int as n from memberships where status = 'paid'");
    assertEqual(rows[0].n, 0, 'no debe haber socios');
  });

  server.close();
  await pool.end();

  console.log('\n' + '-'.repeat(60));
  console.log(passed + ' pasados, ' + failures.length + ' fallidos');
  if (failures.length) {
    failures.forEach((f) => console.log('  FAIL ' + f.name + '\n    ' + f.err.message));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
