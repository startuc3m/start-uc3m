const NOTION_VERSION = '2022-06-28';

// Esquema de la base cacheado por instancia lambda. Evita pedirlo en cada
// alta sin dejarlo fijo para siempre: una instancia nueva lo relee.
let schemaCache = null;

/**
 * Propiedades que sabemos rellenar, por nombre.
 *
 * Solo se envian las que existan de verdad en la base y con el tipo que
 * esperamos. Notion rechaza el alta entera si mandas una propiedad que no
 * existe, asi que si RRHH renombra o borra una columna preferimos crear la
 * ficha sin ese dato antes que perder el alta.
 */
function candidateProperties(member) {
  const tramo = member.plan === 'premium' ? 'Premium' : 'Tramo ' + member.tier;

  return {
    'Nº socio': { number: member.member_number },
    'N.º socio': { number: member.member_number },
    'Numero de socio': { number: member.member_number },
    Email: { email: member.email },
    Modalidad: { select: { name: member.plan === 'premium' ? 'Premium' : 'Estándar' } },
    Tramo: { select: { name: tramo } },
    Importe: { number: member.price_cents / 100 },
    'Fecha de pago': { date: { start: new Date(member.paid_at || Date.now()).toISOString() } },
    'ID socio': { rich_text: [{ text: { content: padMemberNumber(member.member_number) } }] },
    'Stripe payment intent': {
      rich_text: [{ text: { content: member.stripe_payment_intent || '' } }],
    },
  };
}

function padMemberNumber(n) {
  return String(n).padStart(4, '0');
}

/** El tipo de valor que estamos construyendo, para contrastarlo con Notion. */
function valueType(value) {
  return Object.keys(value)[0];
}

/**
 * Cruza lo que sabemos rellenar con lo que la base tiene de verdad.
 *
 * `schema` es {nombre: tipo} tal y como lo devuelve Notion. La propiedad de
 * titulo se localiza por tipo, no por nombre, asi que da igual si se llama
 * "Nombre", "Socio" o "Name".
 *
 * Exportada para poder probarla sin tocar la red (db/test-notion.js).
 */
export function buildProperties(member, schema) {
  const properties = {};
  const omitidas = [];

  const titleProp = Object.keys(schema).find((name) => schema[name] === 'title');
  if (titleProp) {
    properties[titleProp] = { title: [{ text: { content: member.full_name } }] };
  } else {
    omitidas.push('(ninguna propiedad de tipo titulo)');
  }

  const candidatas = candidateProperties(member);
  const yaPuestas = new Set();

  Object.keys(candidatas).forEach((name) => {
    if (name === titleProp) return;
    if (!(name in schema)) return;

    const esperado = valueType(candidatas[name]);
    if (schema[name] !== esperado) {
      omitidas.push(name + ' (es ' + schema[name] + ', esperabamos ' + esperado + ')');
      return;
    }

    // Varios alias apuntan al mismo dato (p. ej. "Nº socio" / "N.º socio"):
    // con que exista uno basta.
    const clave = esperado + ':' + JSON.stringify(candidatas[name]);
    if (yaPuestas.has(clave)) return;
    yaPuestas.add(clave);

    properties[name] = candidatas[name];
  });

  return { properties, omitidas };
}

async function notionFetch(token, path, options) {
  return fetch('https://api.notion.com/v1' + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options && options.headers),
    },
  });
}

/** Lee {nombre: tipo} de la base. Cacheado por instancia. */
export async function fetchSchema(token, databaseId, { force = false } = {}) {
  if (schemaCache && !force) return schemaCache;

  const response = await notionFetch(token, '/databases/' + databaseId, { method: 'GET' });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('HTTP ' + response.status + ': ' + detail.slice(0, 400));
  }

  const database = await response.json();
  const schema = {};
  Object.keys(database.properties || {}).forEach((name) => {
    schema[name] = database.properties[name].type;
  });

  schemaCache = schema;
  return schema;
}

/**
 * Alta del socio en la base de datos de Notion de Start.
 *
 * Notion es un espejo de Postgres, no la fuente de verdad: si falta la
 * configuracion o la API responde mal, no impedimos que alguien se haga
 * socio. Devuelve { ok, skipped?, error?, omitidas? } y nunca lanza.
 */
export async function createNotionMember(member) {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SOCIOS_DATABASE_ID;

  if (!token || !databaseId) {
    return { ok: false, skipped: true, error: 'NOTION_NOT_CONFIGURED' };
  }

  try {
    const schema = await fetchSchema(token, databaseId);
    const { properties, omitidas } = buildProperties(member, schema);

    const response = await notionFetch(token, '/pages', {
      method: 'POST',
      body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
    });

    if (!response.ok) {
      const detail = await response.text();
      // Si la base cambio despues de cachear el esquema, reintentamos una
      // vez con el esquema fresco antes de darlo por perdido.
      if (response.status === 400 && schemaCache) {
        schemaCache = null;
        const fresco = await fetchSchema(token, databaseId, { force: true });
        const segundo = buildProperties(member, fresco);
        const reintento = await notionFetch(token, '/pages', {
          method: 'POST',
          body: JSON.stringify({ parent: { database_id: databaseId }, properties: segundo.properties }),
        });
        if (reintento.ok) {
          const page = await reintento.json();
          return { ok: true, pageId: page.id, omitidas: segundo.omitidas, reintentado: true };
        }
      }
      return { ok: false, error: 'HTTP ' + response.status + ': ' + detail.slice(0, 400) };
    }

    const page = await response.json();
    return { ok: true, pageId: page.id, omitidas };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}
