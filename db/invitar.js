/* eslint-disable no-console */
/**
 * Gestiona las invitaciones a la modalidad Starter (25 EUR).
 *
 *   node db/invitar.js --lista                      ver quien esta invitado
 *   node db/invitar.js ana@uc3m.es luis@gmail.com   invitar
 *   node db/invitar.js --quitar ana@uc3m.es         retirar la invitacion
 *   node db/invitar.js --abrir | --cerrar           abrir o cerrar el Starter
 *
 * Por defecto trabaja contra PRODUCCION (DATABASE_URL_PROD), que es donde
 * estan los socios de verdad. Con --pruebas usa la base de pruebas.
 *
 * Los emails se normalizan a minusculas: el formulario compara asi, y una
 * mayuscula de mas dejaria a alguien sin poder pagar.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envFile = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    });
}

const args = process.argv.slice(2);
const usarPruebas = args.includes('--pruebas');
const soloLista = args.includes('--lista');
const quitar = args.includes('--quitar');
const abrir = args.includes('--abrir');
const cerrar = args.includes('--cerrar');

const emails = args
  .filter((a) => !a.startsWith('--'))
  .map((e) => e.trim().toLowerCase());

const url = usarPruebas ? env.DATABASE_URL : env.DATABASE_URL_PROD || env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL_PROD en .env.local');
  process.exit(2);
}

const invalidos = emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
if (invalidos.length) {
  console.error('Estos no parecen emails validos:');
  invalidos.forEach((e) => console.error('  ' + e));
  process.exit(2);
}

async function main() {
  const base = new URL(url).pathname.replace(/^\//, '');
  console.log('\nBase: ' + base + (base === 'neondb' ? '  (PRODUCCION)' : '  (pruebas)'));

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
  await c.connect();

  if (abrir || cerrar) {
    await c.query('update membership_settings set premium_open = $1 where id', [Boolean(abrir)]);
    console.log('Starter ' + (abrir ? 'ABIERTO' : 'CERRADO'));
  }

  if (quitar && emails.length) {
    const r = await c.query(
      'delete from premium_invites where email = any($1) and used_at is null returning email',
      [emails]
    );
    console.log('\nInvitaciones retiradas: ' + r.rowCount);
    r.rows.forEach((x) => console.log('  ' + x.email));
    const yaUsadas = emails.filter((e) => !r.rows.some((x) => x.email === e));
    if (yaUsadas.length) {
      console.log('\nEstas NO se han tocado porque ya se usaron (esa persona ya es socia):');
      yaUsadas.forEach((e) => console.log('  ' + e));
    }
  } else if (emails.length) {
    const r = await c.query(
      `insert into premium_invites (email, note)
       select unnest($1::text[]), 'junta'
       on conflict (email) do nothing
       returning email`,
      [emails]
    );
    console.log('\nInvitaciones nuevas: ' + r.rowCount);
    r.rows.forEach((x) => console.log('  ' + x.email));
    const yaEstaban = emails.filter((e) => !r.rows.some((x) => x.email === e));
    if (yaEstaban.length) {
      console.log('\nYa estaban invitados:');
      yaEstaban.forEach((e) => console.log('  ' + e));
    }
  }

  // Estado final, siempre
  const s = await c.query('select premium_open, premium_price_cents from membership_settings where id');
  const inv = await c.query(
    `select i.email, i.note, i.used_at, m.member_number
       from premium_invites i
       left join memberships m on m.id = i.membership_id
      order by i.used_at nulls first, i.email`
  );

  console.log('\nStarter: ' + (s.rows[0].premium_open ? 'ABIERTO' : 'CERRADO') +
              ' a ' + (s.rows[0].premium_price_cents / 100).toFixed(2).replace('.', ',') + ' EUR');
  console.log('Invitaciones: ' + inv.rowCount);

  if (inv.rowCount) {
    console.log('');
    inv.rows.forEach((r) => {
      const estado = r.used_at
        ? 'USADA  (socio ' + String(r.member_number).padStart(4, '0') + ')'
        : 'pendiente';
      console.log('  ' + r.email.padEnd(34) + estado);
    });
  }

  if (!s.rows[0].premium_open && inv.rowCount) {
    console.log('\n  AVISO: hay invitados pero el Starter esta CERRADO: no podran pagar.');
    console.log('  Abrelo con: node db/invitar.js --abrir');
  }

  await c.end();
}

main().catch((err) => {
  console.error('\nError: ' + err.message);
  process.exitCode = 1;
});
