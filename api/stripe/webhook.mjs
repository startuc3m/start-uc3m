import Stripe from 'stripe';
import { query } from '../_lib/db.mjs';
import { readRawBody, sendJson, methodNotAllowed } from '../_lib/http.mjs';
import { sendWelcomeEmail } from '../_lib/email.mjs';
import { createNotionMember } from '../_lib/notion.mjs';

// Sin esto Vercel parsea el cuerpo y la firma de Stripe deja de validar.
export const config = { api: { bodyParser: false } };

/**
 * POST /api/stripe/webhook
 *
 * Regla general: una vez la firma es valida, este endpoint responde 200
 * salvo que falle la propia BD. Si devolviese error por un fallo de
 * correo o de Notion, Stripe reintentaria un pago que ya esta registrado.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] firma invalida', err && err.message);
    return sendJson(res, 400, { error: 'INVALID_SIGNATURE' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCompleted(event.data.object);
    } else if (event.type === 'checkout.session.expired') {
      await handleExpired(event.data.object);
    }
    return sendJson(res, 200, { received: true });
  } catch (err) {
    // Fallo de BD: devolvemos 500 a proposito para que Stripe reintente.
    console.error('[webhook] error procesando ' + event.type, err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
}

async function handleCompleted(session) {
  if (session.payment_status !== 'paid') {
    console.log('[webhook] sesion completada sin pago confirmado', session.id);
    return;
  }

  const membershipId = (session.metadata && session.metadata.membership_id) || session.client_reference_id;
  if (!membershipId) {
    console.error('[webhook] sesion sin membership_id', session.id);
    return;
  }

  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent && session.payment_intent.id) || null;

  // Asigna el numero de socio y marca 'paid' en una sola sentencia.
  // Idempotente: en un reintento no devuelve fila, asi que ni se reenvia
  // el correo ni se duplica la ficha de Notion.
  const { rows } = await query('select * from confirm_membership_payment($1, $2)', [
    membershipId,
    paymentIntent,
  ]);
  const member = rows[0];

  if (!member || !member.id) {
    console.log('[webhook] reintento ignorado, la membresia ya estaba pagada', membershipId);
    return;
  }

  console.log('[webhook] socio ' + member.member_number + ' dado de alta (' + member.email + ')');

  // Los dos efectos externos van en paralelo y ninguno puede tumbar la
  // respuesta: el socio ya esta en la BD, que es la fuente de verdad.
  const [email, notion] = await Promise.all([
    sendWelcomeEmail(member),
    createNotionMember(member),
  ]);

  if (!email.ok) {
    console.error('[webhook] no se envio el correo de bienvenida a ' + member.email, email.error);
  }
  if (!notion.ok && !notion.skipped) {
    console.error('[webhook] no se creo la ficha en Notion del socio ' + member.member_number, notion.error);
  }
}

async function handleExpired(session) {
  const membershipId = (session.metadata && session.metadata.membership_id) || session.client_reference_id;
  if (!membershipId) return;

  await query('select expire_membership($1)', [membershipId]);
  console.log('[webhook] reserva liberada por sesion caducada', membershipId);
}
