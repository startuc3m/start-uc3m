import { query } from '../_lib/db.mjs';
import {
  sendJson,
  methodNotAllowed,
  readJsonBody,
  clientIp,
  rateLimit,
  padTiming,
  normalizeEmail,
  isValidEmail,
} from '../_lib/http.mjs';

// El endpoint responde "si/no" sobre si un email concreto esta invitado,
// asi que es un oraculo para averiguar quien esta en la lista. Se protege
// con rate limiting por IP y con un tiempo de respuesta constante.
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 60;
const RESPONSE_FLOOR_MS = 300;

/**
 * POST /api/membership/premium-eligibility
 * { email } -> { eligible: boolean }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const startedAt = Date.now();

  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body && body.email);

    const allowed = await rateLimit(
      'premium-eligibility:' + clientIp(req),
      RATE_LIMIT,
      RATE_WINDOW_SECONDS
    );
    if (!allowed) {
      await padTiming(startedAt, RESPONSE_FLOOR_MS);
      return sendJson(res, 429, { error: 'RATE_LIMITED' });
    }

    if (!isValidEmail(email)) {
      await padTiming(startedAt, RESPONSE_FLOOR_MS);
      return sendJson(res, 200, { eligible: false });
    }

    const { rows } = await query(
      `select (s.premium_open
               and exists (select 1 from premium_invites i
                            where i.email = $1 and i.used_at is null)
               and not exists (select 1 from memberships m
                                where m.email = $1 and m.status = 'paid')
              ) as eligible
         from membership_settings s
        where s.id`,
      [email]
    );

    const eligible = Boolean(rows.length && rows[0].eligible);

    // Mismo tiempo de respuesta tanto si esta invitado como si no.
    await padTiming(startedAt, RESPONSE_FLOOR_MS);
    return sendJson(res, 200, { eligible });
  } catch (err) {
    console.error('[premium-eligibility] error', err);
    await padTiming(startedAt, RESPONSE_FLOOR_MS);
    return sendJson(res, 200, { eligible: false });
  }
}
