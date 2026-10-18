import { Resend } from 'resend';
import {
  sendJson,
  methodNotAllowed,
  readJsonBody,
  clientIp,
  rateLimit,
  normalizeEmail,
  isValidEmail,
} from './_lib/http.mjs';

// Formularios de contacto y patrocinio de la web. No guarda nada: manda un
// correo al buzon de Start con Resend y responde. Si el correo no sale, se
// dice: un formulario que contesta "recibido" sin haber enviado nada pierde
// a la gente que escribe (que es justo lo que hacia la web de Angel en Vercel).
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'startuc3m@gmail.com';

const FORMULARIOS = {
  contacto: { asunto: (d) => 'Contacto web: ' + (d.asunto || 'sin asunto') },
  patrocinio: { asunto: (d) => 'Patrocinio web: ' + (d.empresa || d.nombre) },
};

const limpio = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * POST /api/contacto
 * { form, nombre, email, mensaje, asunto?, empresa?, privacidad, website }
 *   -> 200 { ok: true }
 *   -> 400 { error: 'INVALID_*' } | 429 RATE_LIMITED | 503 NO_DISPONIBLE
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const body = (await readJsonBody(req)) || {};

  // Honeypot: un humano no ve este campo. Se responde como si todo fuera
  // bien para no darle pistas al bot.
  if (limpio(body.website, 200)) return sendJson(res, 200, { ok: true });

  const form = FORMULARIOS[body.form] ? body.form : null;
  const datos = {
    nombre: limpio(body.nombre, 100),
    email: normalizeEmail(body.email),
    asunto: limpio(body.asunto, 150),
    empresa: limpio(body.empresa, 150),
    mensaje: limpio(body.mensaje, 4000),
  };

  if (!form) return sendJson(res, 400, { error: 'INVALID_FORM' });
  if (datos.nombre.length < 2) return sendJson(res, 400, { error: 'INVALID_NAME' });
  if (!isValidEmail(datos.email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });
  if (datos.mensaje.length < 10) return sendJson(res, 400, { error: 'INVALID_MESSAGE' });
  if (body.privacidad !== true) return sendJson(res, 400, { error: 'PRIVACY_REQUIRED' });

  const allowed = await rateLimit('contacto:' + clientIp(req), RATE_LIMIT, RATE_WINDOW_SECONDS, {
    failOpen: false,
  });
  if (!allowed) return sendJson(res, 429, { error: 'RATE_LIMITED' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error('[contacto] Resend sin configurar');
    return sendJson(res, 503, { error: 'NO_DISPONIBLE' });
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: CONTACT_EMAIL,
      // Responder al correo responde directamente a quien escribio.
      replyTo: datos.email,
      subject: FORMULARIOS[form].asunto(datos),
      text: [
        'Formulario: ' + form,
        'Nombre: ' + datos.nombre,
        'Email: ' + datos.email,
        datos.empresa ? 'Empresa: ' + datos.empresa : null,
        datos.asunto ? 'Asunto: ' + datos.asunto : null,
        '',
        datos.mensaje,
      ]
        .filter((l) => l !== null)
        .join('\n'),
    });
    if (error) throw new Error(String(error.message || error));
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error('[contacto] error enviando', err);
    return sendJson(res, 503, { error: 'NO_DISPONIBLE' });
  }
}
