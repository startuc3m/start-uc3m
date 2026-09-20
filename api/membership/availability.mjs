import { query } from '../_lib/db.mjs';
import { sendJson, methodNotAllowed } from '../_lib/http.mjs';

/**
 * GET /api/membership/availability
 *
 * Devuelve el estado de las 4 modalidades para pintar el formulario.
 * Los precios que salen de aqui son informativos: el que se cobra lo
 * decide el servidor al crear el pago.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    // Red de seguridad: sin esto una reserva caducada seguiria ocupando
    // plaza en la vista hasta que alguien intentase reservar.
    await query('select expire_stale_reservations()');

    const { rows } = await query(
      'select plan, tier, price_cents, state, remaining, occupied from membership_availability'
    );

    const options = rows.map((row) => ({
      plan: row.plan,
      tier: row.tier,
      priceCents: row.price_cents,
      state: row.state,
      remaining: row.state === 'available' ? row.remaining : null,
    }));

    const current = options.find((o) => o.plan === 'standard' && o.state === 'available') || null;

    return sendJson(res, 200, {
      options,
      currentStandard: current,
      occupied: rows.length ? rows[0].occupied : 0,
    });
  } catch (err) {
    console.error('[availability] error', err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
}
