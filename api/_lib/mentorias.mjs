import { query } from './db.mjs';
import { sendMentoriaEmail } from './email.mjs';

// Mentorías en Mad Tech Campus: precio único, fijado aquí y no en el formulario.
export const MENTORIA_PRICE_CENTS = 1500;
export const MENTORIA_LABEL = 'Mentoría Start UC3M · Mad Tech Campus';
// Marca en la metadata de la sesión de Stripe para que el webhook distinga
// estos pagos de las altas de socio, que comparten el mismo endpoint.
export const MENTORIA_KIND = 'mentoria';

export function isMentoriaSession(session) {
  return Boolean(session && session.metadata && session.metadata.kind === MENTORIA_KIND);
}

/** checkout.session.completed de una mentoría. Lanza solo si falla la BD (Stripe reintenta). */
export async function handleMentoriaCompleted(session) {
  if (session.payment_status !== 'paid') {
    console.log('[webhook] mentoría sin pago confirmado', session.id);
    return;
  }
  const id = session.metadata.mentoria_id;
  if (!id) {
    console.error('[webhook] mentoría sin mentoria_id', session.id);
    return;
  }

  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent && session.payment_intent.id) || null;

  const { rows } = await query('select * from confirm_mentoria_payment($1, $2)', [id, paymentIntent]);
  const payment = rows[0];
  if (!payment || !payment.id) {
    console.log('[webhook] reintento ignorado, la mentoría ya estaba pagada', id);
    return;
  }

  console.log('[webhook] mentoría pagada (' + payment.email + ')');
  const email = await sendMentoriaEmail(payment);
  if (!email.ok && !email.skipped) {
    console.error('[webhook] no se envió la confirmación de mentoría a ' + payment.email, email.error);
  }
}

/** checkout.session.expired de una mentoría. */
export async function handleMentoriaExpired(session) {
  const id = session.metadata && session.metadata.mentoria_id;
  if (!id) return;
  await query('select expire_mentoria_payment($1)', [id]);
  console.log('[webhook] mentoría caducada sin pagar', id);
}
