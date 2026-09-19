import { formatMemberNumber } from './http.mjs';

const NOTION_VERSION = '2022-06-28';

/**
 * Alta del socio en la base de datos de Notion de Start.
 *
 * El esquema esperado esta documentado en docs/socios.md. Si faltan las
 * variables de entorno, la funcion no hace nada: Notion es un espejo de
 * la BD, no la fuente de verdad, asi que su ausencia no debe impedir
 * que alguien se haga socio.
 *
 * Devuelve { ok, skipped?, error? }. Nunca lanza.
 */
export async function createNotionMember(member) {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SOCIOS_DATABASE_ID;

  if (!token || !databaseId) {
    return { ok: false, skipped: true, error: 'NOTION_NOT_CONFIGURED' };
  }

  const properties = {
    Nombre: { title: [{ text: { content: member.full_name } }] },
    'Nº socio': { number: member.member_number },
    Email: { email: member.email },
    Modalidad: { select: { name: member.plan === 'premium' ? 'Premium' : 'Estándar' } },
    Tramo: { select: { name: member.plan === 'premium' ? 'Premium' : 'Tramo ' + member.tier } },
    Importe: { number: member.price_cents / 100 },
    'Fecha de pago': { date: { start: new Date(member.paid_at || Date.now()).toISOString() } },
    'ID socio': {
      rich_text: [{ text: { content: formatMemberNumber(member.member_number) } }],
    },
    'Stripe payment intent': {
      rich_text: [{ text: { content: member.stripe_payment_intent || '' } }],
    },
  };

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, error: 'HTTP ' + response.status + ': ' + detail.slice(0, 400) };
    }

    const page = await response.json();
    return { ok: true, pageId: page.id };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}
