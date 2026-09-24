import { query, pgErrorCode } from '../_lib/db.mjs';
import {
  sendJson,
  methodNotAllowed,
  readJsonBody,
  clientIp,
  rateLimit,
  formatMemberNumber,
} from '../_lib/http.mjs';
import { updateNotionPhone } from '../_lib/notion.mjs';

// El token es un secreto de 32 caracteres. El limite frena un intento de
// adivinarlo a fuerza bruta; con ese espacio de busqueda es inalcanzable
// igualmente, pero no cuesta nada cerrarlo.
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 60;

/**
 * /api/membership/telefono
 *
 * GET  ?t=<token>            -> { name, memberNumber, phone }
 * POST { token, phone }      -> { ok, phone }
 *
 * Es el enlace personal que reciben los socios dados de alta antes de que
 * el telefono se pidiera en el alta. El token identifica al socio, asi
 * que no tiene que escribir su email ni puede rellenar el de otro.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  try {
    const allowed = await rateLimit('telefono:' + clientIp(req), RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!allowed) return sendJson(res, 429, { error: 'RATE_LIMITED' });

    if (req.method === 'GET') {
      const token = tokenDeLaUrl(req.url);
      if (!token) return sendJson(res, 400, { error: 'INVALID_TOKEN' });

      const { rows } = await query('select * from membership_by_phone_token($1)', [token]);
      const socio = rows[0];
      if (!socio || !socio.id) return sendJson(res, 404, { error: 'INVALID_TOKEN' });

      return sendJson(res, 200, {
        name: socio.full_name,
        memberNumber: formatMemberNumber(socio.member_number),
        // Si ya lo dejo, se lo mostramos para que vea que consta.
        phone: socio.phone || null,
      });
    }

    const body = (await readJsonBody(req)) || {};
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!token) return sendJson(res, 400, { error: 'INVALID_TOKEN' });
    if (!phone) return sendJson(res, 400, { error: 'INVALID_PHONE' });

    let socio;
    try {
      const { rows } = await query('select * from set_phone_by_token($1, $2)', [token, phone]);
      socio = rows[0];
    } catch (err) {
      const code = pgErrorCode(err);
      if (code === 'INVALID_TOKEN') return sendJson(res, 404, { error: code });
      if (code) return sendJson(res, 400, { error: code });
      throw err;
    }

    // Notion es un espejo: si falla, el telefono ya esta guardado donde
    // importa y no le devolvemos un error a quien acaba de colaborar.
    const notion = await updateNotionPhone(socio.member_number, socio.phone);
    if (!notion.ok && !notion.skipped) {
      console.error('[telefono] no se actualizo Notion del socio ' + socio.member_number, notion.error);
    }

    console.log('[telefono] socio ' + socio.member_number + ' ha dejado su telefono');
    return sendJson(res, 200, { ok: true, phone: socio.phone });
  } catch (err) {
    console.error('[telefono] error', err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
}

function tokenDeLaUrl(url) {
  const i = String(url || '').indexOf('?');
  if (i === -1) return '';
  const params = new URLSearchParams(String(url).slice(i + 1));
  return (params.get('t') || '').trim();
}
