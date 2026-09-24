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

// Stripe no admite menos de 30 min de caducidad de sesion. La reserva en
// BD dura 45 min (membership_settings.reservation_minutes), asi que la
// sesion siempre caduca antes que la plaza.
const SESSION_MINUTES = 31;

const RATE_LIMIT = 8;
const RATE_WINDOW_SECONDS = 60;

const PLAN_LABEL = {
  premium: 'Socio Starter de Start UC3M',
  standard: 'Socio de Start UC3M',
};

/**
 * POST /api/membership/checkout
 * { name, email, plan } -> { url, plan, tier, priceCents }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = (await readJsonBody(req)) || {};
    const email = normalizeEmail(body.email);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const plan = body.plan === 'premium' ? 'premium' : 'standard';

    if (!isValidEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });
    if (name.length < 2) return sendJson(res, 400, { error: 'INVALID_NAME' });
    if (!phone) return sendJson(res, 400, { error: 'INVALID_PHONE' });
    if (body.acceptedPrivacy !== true) return sendJson(res, 400, { error: 'PRIVACY_NOT_ACCEPTED' });

    const allowed = await rateLimit('checkout:' + clientIp(req), RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!allowed) return sendJson(res, 429, { error: 'RATE_LIMITED' });

    // La reserva valida la elegibilidad premium y fija el precio. Nada de
    // lo que mande el cliente influye en cuanto se cobra.
    let membership;
    try {
      const { rows } = await query('select * from reserve_membership($1, $2, $3, $4)', [
        email,
        name,
        plan,
        phone,
      ]);
      membership = rows[0];
    } catch (err) {
      const code = pgErrorCode(err);
      if (code) return sendJson(res, 409, { error: code });
      throw err;
    }

    // Si ya habia una sesion viva para esta reserva, se reutiliza en vez
    // de abrir otra (el plan: "si tiene un pago en curso, se reutiliza").
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (membership.stripe_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(membership.stripe_session_id);
        if (existing.status === 'open' && existing.url) {
          return sendJson(res, 200, {
            url: existing.url,
            plan: membership.plan,
            tier: membership.tier,
            priceCents: membership.price_cents,
            reused: true,
          });
        }
      } catch (err) {
        console.error('[checkout] no se pudo recuperar la sesion previa', err);
      }
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const productEnv =
      membership.plan === 'premium'
        ? process.env.STRIPE_PRODUCT_PREMIUM
        : process.env.STRIPE_PRODUCT_STANDARD;

    const priceData = {
      currency: 'eur',
      unit_amount: membership.price_cents,
    };
    if (productEnv) {
      priceData.product = productEnv;
    } else {
      priceData.product_data = {
        name: PLAN_LABEL[membership.plan],
        description:
          membership.plan === 'premium'
            ? 'Cuota anual premium, por invitacion de Start'
            : 'Cuota anual de socio, tramo ' + membership.tier,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'es',
      // El email queda fijado: el socio se registra a este email y no a
      // otro que el usuario pudiera escribir dentro de Stripe.
      customer_email: membership.email,
      client_reference_id: membership.id,
      line_items: [{ price_data: priceData, quantity: 1 }],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      metadata: {
        membership_id: membership.id,
        plan: membership.plan,
        tier: membership.tier === null ? '' : String(membership.tier),
      },
      success_url: siteUrl + '/socios/gracias?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/socios?cancelado=1',
    });

    await query('update memberships set stripe_session_id = $2 where id = $1', [
      membership.id,
      session.id,
    ]);

    return sendJson(res, 200, {
      url: session.url,
      plan: membership.plan,
      tier: membership.tier,
      priceCents: membership.price_cents,
      reused: false,
    });
  } catch (err) {
    console.error('[checkout] error', err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
}
