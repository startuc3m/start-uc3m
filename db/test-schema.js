/* eslint-disable no-console */
/**
 * Tests de la logica SQL de socios (plan, seccion 10).
 *
 *   DATABASE_URL=postgres://... node db/test-schema.js
 *
 * Cada test corre sobre una BD limpia: se vacian las tablas y se reinicia
 * la secuencia antes de empezar. NO apuntes esto a produccion.
 */

const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(2);
}
if (/neon\.tech|prod/i.test(DATABASE_URL) && !process.env.ALLOW_REMOTE_TEST_DB) {
  console.error('DATABASE_URL parece remota. Exporta ALLOW_REMOTE_TEST_DB=1 si es una rama de pruebas.');
  process.exit(2);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });

let passed = 0;
const failures = [];

async function reset() {
  await pool.query('truncate premium_invites, memberships restart identity cascade');
  await pool.query("select setval('member_number_seq', 1, false)");
  await pool.query('update membership_settings set premium_open = true, reservation_minutes = 45');
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'valor inesperado') + ': esperaba ' + expected + ', obtuve ' + actual);
  }
}

async function reserve(email, name, plan) {
  const { rows } = await pool.query('select * from reserve_membership($1, $2, $3)', [
    email,
    name || 'Socio de Prueba',
    plan || 'standard',
  ]);
  return rows[0];
}

async function reserveAndPay(email, plan) {
  const r = await reserve(email, 'Socio ' + email, plan);
  const { rows } = await pool.query('select * from confirm_membership_payment($1, $2)', [
    r.id,
    'pi_' + r.id.slice(0, 8),
  ]);
  return rows[0];
}

async function expectError(fn, code) {
  let threw = null;
  try {
    await fn();
  } catch (err) {
    threw = err;
  }
  assert(threw !== null, 'esperaba excepcion ' + code + ', no hubo ninguna');
  assert(
    String(threw.message).includes(code),
    'esperaba excepcion ' + code + ', obtuve: ' + threw.message
  );
}

// -------------------------------------------------------------------
// Criterio 1: precios por tramo
// -------------------------------------------------------------------
async function testTierPricing() {
  await test('criterio 1 - las plazas 1..10 se cobran a 7,99', async () => {
    for (let i = 1; i <= 10; i += 1) {
      const m = await reserveAndPay('socio' + i + '@uc3m.es', 'standard');
      assertEqual(m.price_cents, 799, 'plaza ' + i);
      assertEqual(m.tier, 1, 'tramo de la plaza ' + i);
    }
  });

  await test('criterio 1 - las plazas 11..30 se cobran a 8,99', async () => {
    for (let i = 1; i <= 10; i += 1) await reserveAndPay('base' + i + '@uc3m.es', 'standard');
    for (let i = 11; i <= 30; i += 1) {
      const m = await reserveAndPay('socio' + i + '@uc3m.es', 'standard');
      assertEqual(m.price_cents, 899, 'plaza ' + i);
      assertEqual(m.tier, 2, 'tramo de la plaza ' + i);
    }
  });

  await test('criterio 1 - de la plaza 31 en adelante se cobra 9,99', async () => {
    for (let i = 1; i <= 30; i += 1) await reserveAndPay('base' + i + '@uc3m.es', 'standard');
    for (let i = 31; i <= 34; i += 1) {
      const m = await reserveAndPay('socio' + i + '@uc3m.es', 'standard');
      assertEqual(m.price_cents, 999, 'plaza ' + i);
      assertEqual(m.tier, 3, 'tramo de la plaza ' + i);
    }
  });

  await test('no se puede elegir un tramo futuro: el servidor impone el vigente', async () => {
    const m = await reserve('nuevo@uc3m.es', 'Nuevo', 'standard');
    assertEqual(m.price_cents, 799, 'primera plaza');
    assertEqual(m.tier, 1, 'tramo');
  });
}

// -------------------------------------------------------------------
// Criterio 2: concurrencia sobre la ultima plaza del tramo
// -------------------------------------------------------------------
async function testConcurrency() {
  await test('criterio 2 - dos reservas simultaneas por la ultima plaza del tramo 1', async () => {
    // Ocupamos 9 de las 10 plazas: queda exactamente una a 7,99.
    for (let i = 1; i <= 9; i += 1) await reserveAndPay('base' + i + '@uc3m.es', 'standard');

    const [a, b] = await Promise.all([
      reserve('carrera-a@uc3m.es', 'Ana Carrera', 'standard'),
      reserve('carrera-b@uc3m.es', 'Bruno Carrera', 'standard'),
    ]);

    const prices = [a.price_cents, b.price_cents].sort();
    assertEqual(prices[0], 799, 'la primera debe llevarse el precio bajo');
    assertEqual(prices[1], 899, 'la segunda NO puede llevarse el precio bajo');
  });

  await test('criterio 2 - 20 reservas simultaneas reparten exactamente 10 plazas a 7,99', async () => {
    const emails = [];
    for (let i = 1; i <= 20; i += 1) emails.push('masivo' + i + '@uc3m.es');

    const results = await Promise.all(emails.map((e) => reserve(e, 'Socio', 'standard')));

    const at799 = results.filter((r) => r.price_cents === 799).length;
    const at899 = results.filter((r) => r.price_cents === 899).length;
    assertEqual(at799, 10, 'plazas a 7,99');
    assertEqual(at899, 10, 'plazas a 8,99');
  });
}

// -------------------------------------------------------------------
// Criterio 3: las reservas caducadas liberan plaza
// -------------------------------------------------------------------
async function testExpiry() {
  await test('criterio 3 - una reserva abandonada libera la plaza al caducar', async () => {
    const r = await reserve('abandona@uc3m.es', 'Abandona', 'standard');
    assertEqual(r.tier, 1, 'ocupa la primera plaza');
    assertEqual(await occupied(), 1, 'ocupacion con la reserva viva');

    // La forzamos a caducar.
    await pool.query("update memberships set reserved_until = now() - interval '1 minute' where id = $1", [r.id]);
    await pool.query('select expire_stale_reservations()');

    assertEqual(await occupied(), 0, 'ocupacion tras caducar');

    const otro = await reserve('otro@uc3m.es', 'Otro', 'standard');
    assertEqual(otro.price_cents, 799, 'la plaza liberada vuelve a estar a 7,99');
  });

  await test('un pago que llega sobre una reserva ya caducada se da de alta igualmente', async () => {
    const r = await reserve('tarde@uc3m.es', 'Tarde', 'standard');
    await pool.query("update memberships set status = 'expired' where id = $1", [r.id]);

    const m = await pool.query('select * from confirm_membership_payment($1, $2)', [r.id, 'pi_tarde']);
    assert(m.rows[0] && m.rows[0].id, 'debe darse de alta pese a la caducidad');
    assertEqual(m.rows[0].status, 'paid', 'estado');
    assertEqual(m.rows[0].member_number, 1, 'recibe numero de socio');
  });

  await test('una reserva viva se reutiliza en vez de crear otra', async () => {
    const a = await reserve('mismo@uc3m.es', 'Mismo', 'standard');
    const b = await reserve('mismo@uc3m.es', 'Mismo', 'standard');
    assertEqual(b.id, a.id, 'debe devolver la misma reserva');
    assertEqual(await occupied(), 1, 'no debe consumir dos plazas');
  });
}

async function occupied() {
  const { rows } = await pool.query('select membership_occupied() as n');
  return rows[0].n;
}

// -------------------------------------------------------------------
// Criterios 4, 5, 6: premium por invitacion
// -------------------------------------------------------------------
async function testPremium() {
  await test('criterio 4 - un email no invitado no puede pagar el premium', async () => {
    await expectError(() => reserve('intruso@uc3m.es', 'Intruso', 'premium'), 'PREMIUM_NOT_INVITED');
  });

  await test('criterio 5 - un invitado solo puede usar su invitacion una vez', async () => {
    await pool.query("insert into premium_invites (email, note) values ('vip@uc3m.es', 'junta')");

    const m = await reserveAndPay('vip@uc3m.es', 'premium');
    assertEqual(m.price_cents, 2000, 'precio premium');
    assertEqual(m.plan, 'premium', 'modalidad');

    const { rows } = await pool.query("select used_at from premium_invites where email = 'vip@uc3m.es'");
    assert(rows[0].used_at !== null, 'la invitacion debe quedar marcada como usada');

    // Ya es socio: no puede volver.
    await expectError(() => reserve('vip@uc3m.es', 'VIP', 'premium'), 'ALREADY_MEMBER');
  });

  await test('criterio 6 - con premium_open = false nadie puede pagar el premium', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    await pool.query('update membership_settings set premium_open = false');
    await expectError(() => reserve('vip@uc3m.es', 'VIP', 'premium'), 'PREMIUM_CLOSED');
  });

  await test('el premium NO consume plazas de los tramos estandar', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    await reserveAndPay('vip@uc3m.es', 'premium');

    assertEqual(await occupied(), 0, 'la ocupacion estandar no se mueve');
    const m = await reserveAndPay('primero@uc3m.es', 'standard');
    assertEqual(m.price_cents, 799, 'el primer estandar sigue a 7,99');
    assertEqual(m.member_number, 2, 'pero comparte numeracion de socio');
  });

  await test('el email se normaliza a minusculas', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    const m = await reserve('  VIP@UC3M.es  ', 'VIP', 'premium');
    assertEqual(m.email, 'vip@uc3m.es', 'email normalizado');
  });
}

// -------------------------------------------------------------------
// Criterios 7, 8, 9: numeracion e idempotencia
// -------------------------------------------------------------------
async function testMemberNumbers() {
  await test('criterio 7 - los numeros de socio son correlativos desde 1 y no se repiten', async () => {
    const nums = [];
    for (let i = 1; i <= 5; i += 1) {
      const m = await reserveAndPay('socio' + i + '@uc3m.es', 'standard');
      nums.push(m.member_number);
    }
    assert(JSON.stringify(nums) === JSON.stringify([1, 2, 3, 4, 5]), 'obtenidos: ' + nums.join(','));
  });

  await test('criterio 7 - un pago abandonado no deja hueco en la numeracion', async () => {
    const a = await reserveAndPay('a@uc3m.es', 'standard');
    await reserve('abandona@uc3m.es', 'Abandona', 'standard'); // nunca paga
    const c = await reserveAndPay('c@uc3m.es', 'standard');

    assertEqual(a.member_number, 1, 'primer socio');
    assertEqual(c.member_number, 2, 'segundo socio, sin hueco');
  });

  await test('criterio 7 - estandar y premium comparten una unica numeracion', async () => {
    await pool.query("insert into premium_invites (email) values ('vip@uc3m.es')");
    const a = await reserveAndPay('a@uc3m.es', 'standard');
    const b = await reserveAndPay('vip@uc3m.es', 'premium');
    const c = await reserveAndPay('c@uc3m.es', 'standard');
    assertEqual(a.member_number, 1, 'estandar');
    assertEqual(b.member_number, 2, 'premium');
    assertEqual(c.member_number, 3, 'estandar');
  });

  await test('criterio 8 - un reintento del webhook no reasigna numero ni devuelve fila', async () => {
    const r = await reserve('reintento@uc3m.es', 'Reintento', 'standard');

    const first = await pool.query('select * from confirm_membership_payment($1, $2)', [r.id, 'pi_1']);
    assertEqual(first.rows[0].member_number, 1, 'primera confirmacion asigna el 1');

    const second = await pool.query('select * from confirm_membership_payment($1, $2)', [r.id, 'pi_1']);
    assert(second.rows[0].id === null, 'el reintento no debe devolver fila (asi no se reenvia el correo)');

    const { rows } = await pool.query('select member_number from memberships where id = $1', [r.id]);
    assertEqual(rows[0].member_number, 1, 'el numero no cambia');

    const next = await reserveAndPay('siguiente@uc3m.es', 'standard');
    assertEqual(next.member_number, 2, 'el reintento no consumio la secuencia');
  });

  await test('criterio 9 - un email que ya es socio no puede volver a pagar', async () => {
    await reserveAndPay('socio@uc3m.es', 'standard');
    await expectError(() => reserve('socio@uc3m.es', 'Socio', 'standard'), 'ALREADY_MEMBER');
    await expectError(() => reserve('SOCIO@UC3M.ES', 'Socio', 'standard'), 'ALREADY_MEMBER');
  });
}

// -------------------------------------------------------------------
// Criterio 10: la vista que pinta el formulario
// -------------------------------------------------------------------
async function testAvailability() {
  async function availability() {
    const { rows } = await pool.query('select * from membership_availability');
    const by = {};
    rows.forEach((r) => {
      by[r.plan === 'premium' ? 'premium' : 'tier' + r.tier] = r;
    });
    return by;
  }

  await test('criterio 10 - sin socios: tramo 1 disponible, 2 y 3 proximamente', async () => {
    const a = await availability();
    assertEqual(a.tier1.state, 'available', 'tramo 1');
    assertEqual(a.tier1.remaining, 10, 'plazas restantes del tramo 1');
    assertEqual(a.tier2.state, 'coming_soon', 'tramo 2');
    assertEqual(a.tier3.state, 'coming_soon', 'tramo 3');
    assertEqual(a.premium.state, 'invite_only', 'premium');
  });

  await test('criterio 10 - con 10 socios: tramo 1 agotado, tramo 2 disponible', async () => {
    for (let i = 1; i <= 10; i += 1) await reserveAndPay('base' + i + '@uc3m.es', 'standard');
    const a = await availability();
    assertEqual(a.tier1.state, 'sold_out', 'tramo 1');
    assertEqual(a.tier1.remaining, 0, 'restantes tramo 1');
    assertEqual(a.tier2.state, 'available', 'tramo 2');
    assertEqual(a.tier2.remaining, 20, 'restantes tramo 2');
    assertEqual(a.tier3.state, 'coming_soon', 'tramo 3');
  });

  await test('criterio 10 - con 30 socios: solo queda el tramo 3', async () => {
    for (let i = 1; i <= 30; i += 1) await reserveAndPay('base' + i + '@uc3m.es', 'standard');
    const a = await availability();
    assertEqual(a.tier1.state, 'sold_out', 'tramo 1');
    assertEqual(a.tier2.state, 'sold_out', 'tramo 2');
    assertEqual(a.tier3.state, 'available', 'tramo 3');
  });

  await test('criterio 10 - premium cerrado se refleja en la vista', async () => {
    await pool.query('update membership_settings set premium_open = false');
    const a = await availability();
    assertEqual(a.premium.state, 'closed', 'premium');
  });
}

// -------------------------------------------------------------------
// Rate limiting del endpoint de elegibilidad premium
// -------------------------------------------------------------------
async function testRateLimit() {
  async function hit(bucket, limit, windowSeconds) {
    const { rows } = await pool.query('select rate_limit_hit($1, $2, $3) as allowed', [
      bucket,
      limit,
      windowSeconds,
    ]);
    return rows[0].allowed;
  }

  await test('rate limit - permite hasta el limite y despues corta', async () => {
    await pool.query('delete from rate_limits');
    for (let i = 1; i <= 5; i += 1) {
      assertEqual(await hit('ip:1.2.3.4', 5, 60), true, 'peticion ' + i);
    }
    assertEqual(await hit('ip:1.2.3.4', 5, 60), false, 'peticion 6 debe cortarse');
  });

  await test('rate limit - la ventana se reinicia al expirar', async () => {
    await pool.query('delete from rate_limits');
    for (let i = 1; i <= 5; i += 1) await hit('ip:5.6.7.8', 5, 60);
    assertEqual(await hit('ip:5.6.7.8', 5, 60), false, 'agotado');

    await pool.query(
      "update rate_limits set window_start = now() - interval '2 minutes' where bucket = 'ip:5.6.7.8'"
    );
    assertEqual(await hit('ip:5.6.7.8', 5, 60), true, 'tras la ventana vuelve a permitir');
  });

  await test('rate limit - los buckets son independientes', async () => {
    await pool.query('delete from rate_limits');
    for (let i = 1; i <= 5; i += 1) await hit('ip:1.1.1.1', 5, 60);
    assertEqual(await hit('ip:1.1.1.1', 5, 60), false, 'bucket agotado');
    assertEqual(await hit('ip:2.2.2.2', 5, 60), true, 'otro bucket sigue libre');
  });
}

// -------------------------------------------------------------------

async function loadSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
}

async function main() {
  console.log('Cargando db/schema.sql...');
  await loadSchema();

  console.log('\nTramos y precios');
  await testTierPricing();
  console.log('\nConcurrencia');
  await testConcurrency();
  console.log('\nReservas y caducidad');
  await testExpiry();
  console.log('\nPremium por invitacion');
  await testPremium();
  console.log('\nNumeracion de socio e idempotencia');
  await testMemberNumbers();
  console.log('\nDisponibilidad (formulario)');
  await testAvailability();
  console.log('\nRate limiting');
  await testRateLimit();

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
