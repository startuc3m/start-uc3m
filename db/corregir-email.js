/* eslint-disable no-console */
/**
 * Corrige el email de un socio y le reenvia el correo con su numero.
 *
 *   node db/corregir-email.js viejo@mal.es nuevo@bien.es           (simulacion)
 *   node db/corregir-email.js viejo@mal.es nuevo@bien.es --aplicar
 *
 * Hace las tres cosas que hay que hacer, que es justo donde se olvida
 * alguna si se hace a mano:
 *   1. cambia el email en Postgres
 *   2. lo cambia tambien en la ficha de Notion
 *   3. reenvia el correo de bienvenida a la direccion buena
 *
 * Sin --aplicar solo enseña lo que haria. Trabaja contra PRODUCCION.
 *
 * Lo que NO puede arreglar: el recibo de Stripe ya salio hacia la
 * direccion equivocada y el email del cliente en Stripe no se puede
 * reescribir. Si la socia necesita el recibo, se le reenvia a mano desde
 * el panel de Stripe.
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
Object.keys(env).forEach((k) => {
  if (!process.env[k]) process.env[k] = env[k];
});

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const [viejoRaw, nuevoRaw] = args.filter((a) => !a.startsWith('--'));

if (!viejoRaw || !nuevoRaw) {
  console.error('Uso: node db/corregir-email.js viejo@mal.es nuevo@bien.es [--aplicar]');
  process.exit(2);
}

const viejo = viejoRaw.trim().toLowerCase();
const nuevo = nuevoRaw.trim().toLowerCase();

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nuevo)) {
  console.error('El email nuevo no es valido: ' + nuevo);
  process.exit(2);
}

// El envio del correo usa NEXT_PUBLIC_SITE_URL para el logotipo. En
// .env.local apunta a localhost, y entonces la imagen no cargaria.
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.startuc3m.es';

async function main() {
  const url = env.DATABASE_URL_PROD || env.DATABASE_URL;
  const base = new URL(url).pathname.replace(/^\//, '');
  console.log('\nBase: ' + base + (base === 'neondb' ? '  (PRODUCCION)' : '  (pruebas)'));
  console.log(aplicar ? 'Modo: APLICAR\n' : 'Modo: simulacion (añade --aplicar para hacerlo de verdad)\n');

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
  await c.connect();

  const { rows } = await c.query('select * from memberships where email = $1', [viejo]);
  if (!rows.length) {
    console.error('No hay ningun socio con el email ' + viejo);
    await c.end();
    process.exitCode = 1;
    return;
  }
  const socio = rows[0];

  const choque = await c.query(
    "select 1 from memberships where email = $1 and id <> $2 and status = 'paid'",
    [nuevo, socio.id]
  );
  if (choque.rowCount) {
    console.error('Ya existe otro socio con el email ' + nuevo + '. Revisalo a mano.');
    await c.end();
    process.exitCode = 1;
    return;
  }

  const numero = String(socio.member_number).padStart(4, '0');
  console.log('  Socio      ' + numero + '  ' + socio.full_name);
  console.log('  Email      ' + viejo);
  console.log('  Nuevo      ' + nuevo);
  console.log('  Modalidad  ' + (socio.plan === 'premium' ? 'Starter' : 'Estandar, tramo ' + socio.tier));
  console.log('  Importe    ' + (socio.price_cents / 100).toFixed(2).replace('.', ',') + ' EUR');

  if (!aplicar) {
    console.log('\n  Se haria: cambiar en Postgres, cambiar en Notion y reenviar el correo.');
    await c.end();
    return;
  }

  // 1. Postgres
  await c.query('update memberships set email = $2 where id = $1', [socio.id, nuevo]);
  console.log('\n  ok   Postgres actualizado');
  await c.end();

  // 2. Notion
  const notionOk = await actualizarNotion(socio.member_number, nuevo);
  console.log('  ' + (notionOk ? 'ok   Notion actualizado' : '~    Notion: no se encontro la ficha, revisala a mano'));

  // 3. Correo
  const { sendWelcomeEmail } = await import('../api/_lib/email.mjs');
  const r = await sendWelcomeEmail({ ...socio, email: nuevo });
  if (r.ok) {
    console.log('  ok   correo reenviado a ' + nuevo);
  } else {
    console.log('  FAIL no se pudo reenviar el correo: ' + r.error);
    process.exitCode = 1;
  }
}

async function actualizarNotion(memberNumber, nuevo) {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SOCIOS_DATABASE_ID;
  if (!token || !databaseId) return false;

  const headers = {
    Authorization: 'Bearer ' + token,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch('https://api.notion.com/v1/databases/' + databaseId + '/query', {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 100 }),
    });
    const { results = [] } = await res.json();

    const page = results.find((p) => {
      const props = p.properties || {};
      const n = Object.keys(props).find((k) => props[k].type === 'number' && /socio|miembro/i.test(k));
      return n && props[n].number === memberNumber;
    });
    if (!page) return false;

    const emailProp = Object.keys(page.properties).find((k) => page.properties[k].type === 'email');
    if (!emailProp) return false;

    const upd = await fetch('https://api.notion.com/v1/pages/' + page.id, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties: { [emailProp]: { email: nuevo } } }),
    });
    return upd.ok;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error('\nError: ' + err.message);
  process.exitCode = 1;
});
