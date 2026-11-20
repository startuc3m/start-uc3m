import Stripe from 'stripe';
import { query, pgErrorCode } from '../_lib/db.mjs';
import {
  sendJson,
  methodNotAllowed,
  readJsonBody,
  clientIp,
  rateLimit,
  normalizeEmail,
  isValidEmail,
} from '../_lib/http.mjs';
import { MENTORIA_PRICE_CENTS, MENTORIA_LABEL, MENTORIA_KIND } from '../_lib/mentorias.mjs';

// Mismo margen que socios: Stripe no admite menos de 30 min.
const SESSION_MINUTES = 31;
const RATE_LIMIT = 8;
const RATE_WINDOW_SECONDS = 60;

/**
 * POST /api/mentorias/checkout
 * { name, email, phone, acceptedPrivacy } -> { url, priceCents }
 *
 * El precio es fijo y lo decide el servidor: nada de lo que mande el
 * cliente cambia lo que se cobra.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = (await readJsonBody(req)) || {};
    const email = normalizeEmail(body.email);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!isValidEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });
    if (name.length < 2) return sendJson(res, 400, { error: 'INVALID_NAME' });
    if (!phone) return sendJson(res, 400, { error: 'INVALID_PHONE' });
    if (body.acceptedPrivacy !== true) return sendJson(res, 400, { error: 'PRIVACY_NOT_ACCEPTED' });

    const allowed = await rateLimit('mentoria:' + clientIp(req), RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!allowed) return sendJson(res, 429, { error: 'RATE_LIMITED' });

    let payment;
    try {
      const { rows } = await query('select * from create_mentoria_payment($1, $2, $3, $4)', [
        email,
        name,
        phone,
        MENTORIA_PRICE_CENTS,
      ]);
      payment = rows[0];
    } catch (err) {
      const code = pgErrorCode(err);
      if (code) return sendJson(res, 409, { error: code });
      throw err;
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const priceData = { currency: 'eur', unit_amount: payment.price_cents };
    if (process.env.STRIPE_PRODUCT_MENTORIA) {
      priceData.product = process.env.STRIPE_PRODUCT_MENTORIA;
    } else {
      priceData.product_data = { name: MENTORIA_LABEL, description: 'Pago único' };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'es',
      customer_email: payment.email,
      line_items: [{ price_data: priceData, quantity: 1 }],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      // `kind` es lo que usa el webhook para no confundir este pago con un
      // alta de socio. Sin client_reference_id a propósito: el webhook de
      // socios lo usa como id de membresía.
      metadata: { kind: MENTORIA_KIND, mentoria_id: payment.id },
      success_url: siteUrl + '/mentorias/gracias?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/mentorias?cancelado=1',
    });

    await query('update mentoria_payments set stripe_session_id = $2 where id = $1', [
      payment.id,
      session.id,
    ]);

    return sendJson(res, 200, { url: session.url, priceCents: payment.price_cents });
  } catch (err) {
    console.error('[mentorias/checkout] error', err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
}
