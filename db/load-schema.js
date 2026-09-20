/* eslint-disable no-console */
/**
 * Carga db/schema.sql en la base a la que apunte DATABASE_URL y comprueba
 * que quedo bien.
 *
 *   node db/load-schema.js
 *
 * Es idempotente: se puede lanzar las veces que haga falta. No borra datos.
 * Antes de tocar nada dice a que servidor y base se va a conectar, para que
 * no se cargue el esquema en la base equivocada por error.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL (ponla en .env.local o en el entorno).');
  process.exit(2);
}

/** Describe la conexion sin revelar la contrasena. */
function describe(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      base: u.pathname.replace(/^\//, '') || '(por defecto)',
      usuario: u.username || '(sin usuario)',
      pooled: /-pooler\./.test(u.hostname),
    };
  } catch {
    return { host: '(no se pudo leer la URL)', base: '?', usuario: '?', pooled: false };
  }
}

async function main() {
  const info = describe(DATABASE_URL);
  console.log('Conectando a:');
  console.log('  servidor  ' + info.host);
  console.log('  base      ' + info.base);
  console.log('  usuario   ' + info.usuario);
  console.log('  pooled    ' + (info.pooled ? 'si' : 'NO (para produccion usa la que lleva -pooler)'));
  console.log('');

  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(info.host);
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: true },
  });

  await client.connect();

  // Que habia antes, para saber si esto crea o solo reaplica.
  const previas = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'memberships'"
  );
  const yaExistia = previas.rows[0].n > 0;

  if (yaExistia) {
    const socios = await client.query("select count(*)::int as n from memberships where status = 'paid'");
    console.log('La base ya tenia el esquema. Socios dados de alta: ' + socios.rows[0].n);
    console.log('Reaplicar es seguro: no borra nada.\n');
  }

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.query(sql);
  console.log('Esquema aplicado.\n');

  // ---- comprobaciones ----
  const tablas = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log('Tablas y vistas:');
  tablas.rows.forEach((r) => console.log('  ' + r.table_name));

  const funciones = await client.query(
    "select routine_name from information_schema.routines where routine_schema = 'public' order by routine_name"
  );
  console.log('\nFunciones:');
  funciones.rows.forEach((r) => console.log('  ' + r.routine_name));

  const seq = await client.query("select last_value, is_called from member_number_seq");
  const siguiente = seq.rows[0].is_called ? Number(seq.rows[0].last_value) + 1 : Number(seq.rows[0].last_value);
  console.log('\nProximo numero de socio: ' + String(siguiente).padStart(4, '0'));

  const disponibilidad = await client.query(
    'select plan, tier, price_cents, state, remaining from membership_availability'
  );
  console.log('\nModalidades:');
  disponibilidad.rows.forEach((r) => {
    const nombre = r.plan === 'premium' ? 'premium' : 'estandar tramo ' + r.tier;
    const precio = (r.price_cents / 100).toFixed(2).replace('.', ',') + ' EUR';
    const plazas = r.remaining === null ? '' : '  (' + r.remaining + ' plazas)';
    console.log('  ' + nombre.padEnd(18) + precio.padEnd(11) + r.state + plazas);
  });

  await client.end();

  const esperadas = ['memberships', 'membership_settings', 'premium_invites', 'rate_limits', 'membership_availability'];
  const presentes = tablas.rows.map((r) => r.table_name);
  const faltan = esperadas.filter((t) => !presentes.includes(t));

  console.log('\n' + '-'.repeat(60));
  if (faltan.length) {
    console.log('Faltan: ' + faltan.join(', '));
    process.exitCode = 1;
    return;
  }
  console.log('Base lista.');
}

main().catch((err) => {
  console.error('\nError: ' + err.message);
  if (/no pg_hba|SSL|self.signed/i.test(err.message)) {
    console.error('Pista: revisa que la connection string incluya ?sslmode=require');
  }
  process.exitCode = 1;
});
