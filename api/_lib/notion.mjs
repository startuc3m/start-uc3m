const NOTION_VERSION = '2022-06-28';

// Esquema de la base cacheado por instancia lambda. Evita pedirlo en cada
// alta sin dejarlo fijo para siempre: una instancia nueva lo relee.
let schemaCache = null;

function padMemberNumber(n) {
  return String(n).padStart(4, '0');
}

/** Minusculas, sin tildes y sin puntuacion, para comparar nombres de columna. */
function normalize(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Los datos que sabemos escribir, cada uno emparejado por TIPO mas palabras
 * clave del nombre, no por un nombre exacto.
 *
 * Es deliberado: la columna puede llamarse "Nº socio", "Numero socio" o
 * "Num. de socio" y sigue siendo la misma. Casar por nombre literal hacia
 * que un dato se dejase de escribir en silencio al renombrar una columna.
 *
 * `excluye` desempata entre columnas del mismo tipo (Importe tambien es
 * number). El orden importa: el primer campo que reclama una columna se
 * la queda.
 */
function fieldSpecs(member) {
  return [
    {
      clave: 'numero de socio',
      tipo: 'number',
      incluye: ['socio', 'miembro', 'member'],
      excluye: ['importe', 'precio', 'cuota', 'euro'],
      valor: () => ({ number: member.member_number }),
    },
    {
      clave: 'importe',
      tipo: 'number',
      incluye: ['importe', 'precio', 'cuota', 'euro', 'pagado'],
      valor: () => ({ number: member.price_cents / 100 }),
    },
    {
      clave: 'email',
      tipo: 'email',
      incluye: [],
      valor: () => ({ email: member.email }),
    },
    {
      clave: 'modalidad',
      tipo: 'select',
      incluye: ['modalidad', 'plan', 'tipo'],
      excluye: ['tramo'],
      valor: () => ({ select: { name: member.plan === 'premium' ? 'Premium' : 'Estándar' } }),
    },
    {
      clave: 'tramo',
      tipo: 'select',
      incluye: ['tramo'],
      valor: () => ({
        select: { name: member.plan === 'premium' ? 'Premium' : 'Tramo ' + member.tier },
      }),
    },
    {
      clave: 'fecha de pago',
      tipo: 'date',
      incluye: [],
      valor: () => ({ date: { start: new Date(member.paid_at || Date.now()).toISOString() } }),
    },
    {
      clave: 'referencia de stripe',
      tipo: 'rich_text',
      incluye: ['stripe', 'intent', 'pago'],
      valor: () => ({
        rich_text: [{ text: { content: member.stripe_payment_intent || '' } }],
      }),
    },
    {
      clave: 'id de socio',
      tipo: 'rich_text',
      incluye: ['id', 'codigo', 'carne'],
      excluye: ['stripe', 'intent'],
      valor: () => ({
        rich_text: [{ text: { content: padMemberNumber(member.member_number) } }],
      }),
    },
  ];
}

/**
 * Cruza lo que sabemos escribir con lo que la base tiene de verdad.
 *
 * `schema` es {nombre: tipo} tal y como lo devuelve Notion. La propiedad de
 * titulo se localiza por tipo, asi que da igual si se llama "Nombre",
 * "Socio" o "Name".
 *
 * Exportada para poder probarla sin tocar la red (db/test-notion.js).
 */
export function buildProperties(member, schema) {
  const properties = {};
  const omitidas = [];
  const usadas = new Set();

  const titleProp = Object.keys(schema).find((name) => schema[name] === 'title');
  if (titleProp) {
    properties[titleProp] = { title: [{ text: { content: member.full_name } }] };
    usadas.add(titleProp);
  } else {
    omitidas.push('(la base no tiene propiedad de titulo)');
  }

  const columnas = Object.keys(schema).map((name) => ({ name, norm: normalize(name) }));

  fieldSpecs(member).forEach((spec) => {
    const candidatas = columnas.filter(
      (c) => !usadas.has(c.name) && schema[c.name] === spec.tipo
    );

    const excluye = spec.excluye || [];
    const permitidas = candidatas.filter(
      (c) => !excluye.some((palabra) => c.norm.includes(palabra))
    );

    // Con palabras clave, exigimos que el nombre encaje. Sin ellas (email,
    // fecha) el tipo ya identifica el dato, y basta con que quede una sola
    // columna de ese tipo.
    //
    // Sin esta distincion, un dato sin columna propia se colaria en la
    // unica columna libre de su tipo: la referencia de Stripe acabaria
    // escrita dentro de una columna llamada "Importe".
    let elegida = spec.incluye.length
      ? permitidas.find((c) => spec.incluye.some((palabra) => c.norm.includes(palabra)))
      : null;
    if (!elegida && spec.incluye.length === 0 && permitidas.length === 1) {
      elegida = permitidas[0];
    }

    if (!elegida) {
      omitidas.push(spec.clave + ' (ninguna columna ' + spec.tipo + ' encaja)');
      return;
    }

    usadas.add(elegida.name);
    properties[elegida.name] = spec.valor();
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
