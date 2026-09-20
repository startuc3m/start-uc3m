/* eslint-disable no-console */
/**
 * Comprueba que la base de Notion de Start y el codigo encajan.
 *
 *   node db/test-notion.js            # solo lectura: contrasta el esquema
 *   node db/test-notion.js --alta     # ademas crea una ficha de prueba y la archiva
 *
 * Lee NOTION_API_KEY y NOTION_SOCIOS_DATABASE_ID del entorno o de .env.local.
 * El token no se imprime nunca.
 */

const fs = require('fs');
const path = require('path');

// Carga .env.local sin dependencias: es un fichero de secretos, ignorado por git.
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    });
}

const CREAR_ALTA = process.argv.includes('--alta');

const SOCIO_EJEMPLO = {
  full_name: 'Prueba de Integración',
  member_number: 9999,
  email: 'prueba-integracion@startuc3m.es',
  plan: 'standard',
  tier: 1,
  price_cents: 799,
  paid_at: new Date().toISOString(),
  stripe_payment_intent: 'pi_prueba_integracion',
};

let fallos = 0;

function ok(msg) {
  console.log('  ok   ' + msg);
}

function fail(msg) {
  fallos += 1;
  console.log('  FAIL ' + msg);
}

function aviso(msg) {
  console.log('  ~    ' + msg);
}

async function main() {
  const { buildProperties, fetchSchema } = await import('../api/_lib/notion.mjs');

  // ---------------------------------------------------------------
  // 1. Comprobaciones sin red
  // ---------------------------------------------------------------
  console.log('\nLogica de construccion de propiedades (sin red)');

  {
    const schema = { Socio: 'title', Email: 'email' };
    const { properties } = buildProperties(SOCIO_EJEMPLO, schema);
    if (properties.Socio && properties.Socio.title[0].text.content === SOCIO_EJEMPLO.full_name) {
      ok('el titulo se localiza por tipo, no por nombre');
    } else {
      fail('no encontro la propiedad de titulo cuando se llama "Socio"');
    }
  }

  {
    const schema = { Nombre: 'title', Email: 'email' };
    const { properties } = buildProperties(SOCIO_EJEMPLO, schema);
    const inesperadas = Object.keys(properties).filter((k) => !(k in schema));
    if (inesperadas.length === 0) {
      ok('no envia propiedades que la base no tiene');
    } else {
      fail('enviaria propiedades inexistentes: ' + inesperadas.join(', '));
    }
  }

  {
    // La tabla real de Start, tal y como la creo RRHH.
    const schema = {
      Socios: 'title',
      'Número socio': 'number',
      Email: 'email',
      Modalidad: 'select',
      Importe: 'number',
      'Fecha de pago': 'date',
      'Stripe payment intent': 'rich_text',
    };
    const { properties } = buildProperties(SOCIO_EJEMPLO, schema);

    const comprobaciones = [
      ['Socios', properties.Socios && properties.Socios.title[0].text.content === SOCIO_EJEMPLO.full_name],
      ['Número socio', properties['Número socio'] && properties['Número socio'].number === 9999],
      ['Email', properties.Email && properties.Email.email === SOCIO_EJEMPLO.email],
      ['Modalidad', properties.Modalidad && properties.Modalidad.select.name === 'Estándar'],
      ['Importe', properties.Importe && properties.Importe.number === 7.99],
      ['Fecha de pago', Boolean(properties['Fecha de pago'])],
      ['Stripe payment intent', Boolean(properties['Stripe payment intent'])],
    ];

    const malas = comprobaciones.filter(([, bien]) => !bien).map(([n]) => n);
    if (malas.length === 0) {
      ok('la tabla real de Start se rellena entera (7 columnas)');
    } else {
      fail('no se rellenarian: ' + malas.join(', '));
    }
  }

  {
    // "Número socio" e "Importe" son las dos number: no deben confundirse.
    const schema = { Nombre: 'title', 'Número socio': 'number', Importe: 'number' };
    const { properties } = buildProperties(SOCIO_EJEMPLO, schema);
    if (properties['Número socio'].number === 9999 && properties.Importe.number === 7.99) {
      ok('distingue dos columnas numericas por el nombre');
    } else {
      fail('confundio el numero de socio con el importe');
    }
  }

  {
    // El mismo dato, escrito de varias formas.
    ['Nº socio', 'Numero de socio', 'Num. socio', 'NÚMERO SOCIO', 'ID miembro'].forEach((nombre) => {
      const schema = { Nombre: 'title', [nombre]: 'number' };
      const { properties } = buildProperties(SOCIO_EJEMPLO, schema);
      if (properties[nombre] && properties[nombre].number === 9999) {
        ok('reconoce la columna "' + nombre + '"');
      } else {
        fail('no reconocio la columna "' + nombre + '"');
      }
    });
  }

  {
    const schema = { Nombre: 'title', Importe: 'rich_text' };
    const { properties, omitidas } = buildProperties(SOCIO_EJEMPLO, schema);
    if (!properties.Importe && omitidas.some((o) => o.startsWith('importe'))) {
      ok('omite un dato cuando ninguna columna encaja, en vez de romper el alta');
    } else {
      fail('no detecto que Importe no es una columna numerica');
    }
  }

  // ---------------------------------------------------------------
  // 2. Contra la base real
  // ---------------------------------------------------------------
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SOCIOS_DATABASE_ID;

  if (!token || !databaseId) {
    console.log('\nSin NOTION_API_KEY / NOTION_SOCIOS_DATABASE_ID: me salto la parte online.');
    console.log('Ponlas en .env.local (ya esta en .gitignore) y vuelve a lanzarlo.');
    return resumen();
  }

  console.log('\nContra la base real de Notion');

  let schema;
  try {
    schema = await fetchSchema(token, databaseId, { force: true });
    ok('la integracion ve la base (' + Object.keys(schema).length + ' propiedades)');
  } catch (err) {
    fail('no se pudo leer la base: ' + err.message);
    if (String(err.message).includes('404')) {
      console.log('       404 casi siempre significa que la integracion no esta conectada a la base.');
      console.log('       En Notion: ⋯ → Connections → Connect to → vuestra integracion.');
    }
    if (String(err.message).includes('401')) {
      console.log('       401 es token invalido o de otro workspace.');
    }
    return resumen();
  }

  console.log('\n  Propiedades de la base:');
  Object.keys(schema).forEach((name) => {
    console.log('    ' + name.padEnd(28) + schema[name]);
  });

  const { properties, omitidas } = buildProperties(SOCIO_EJEMPLO, schema);

  console.log('\n  Se rellenaran:');
  Object.keys(properties).forEach((name) => console.log('    ' + name));

  if (omitidas.length) {
    console.log('\n  No se rellenaran:');
    omitidas.forEach((o) => aviso(o));
  }

  const titulo = Object.keys(schema).find((n) => schema[n] === 'title');
  if (titulo) {
    ok('el nombre del socio ira a la propiedad "' + titulo + '"');
  } else {
    fail('la base no tiene propiedad de titulo: el nombre del socio no se guardaria');
  }

  ['Email', 'Importe', 'Fecha de pago'].forEach((name) => {
    if (properties[name]) {
      ok('"' + name + '" se rellenara');
    } else {
      aviso('"' + name + '" no existe en la base; el dato solo quedara en Postgres');
    }
  });

  const numero = Object.keys(properties).find((n) => /socio/i.test(n) && properties[n].number !== undefined);
  if (numero) {
    ok('el numero de socio ira a "' + numero + '"');
  } else {
    fail('ninguna propiedad recibe el numero de socio: sin el, la ficha no se puede cruzar con Postgres');
  }

  // ---------------------------------------------------------------
  // 3. Alta real de prueba
  // ---------------------------------------------------------------
  if (!CREAR_ALTA) {
    console.log('\n  (lanza con --alta para crear una ficha de prueba y archivarla)');
    return resumen();
  }

  console.log('\nAlta de prueba');

  const crear = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });

  if (!crear.ok) {
    fail('Notion rechazo el alta: ' + (await crear.text()).slice(0, 500));
    return resumen();
  }

  const page = await crear.json();
  ok('ficha creada: ' + page.url);

  const archivar = await fetch('https://api.notion.com/v1/pages/' + page.id, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  });

  if (archivar.ok) {
    ok('ficha de prueba archivada, la base queda limpia');
  } else {
    aviso('la ficha de prueba quedo sin archivar, borrala a mano: ' + page.url);
  }

  return resumen();
}

function resumen() {
  console.log('\n' + '-'.repeat(60));
  if (fallos) {
    console.log(fallos + ' comprobacion(es) fallida(s)');
    // exitCode en vez de exit(): con exit(), node en Windows aborta con un
    // assert de libuv si quedan sockets de fetch sin cerrar.
    process.exitCode = 1;
    return;
  }
  console.log('Todo correcto.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
