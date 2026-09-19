import { Resend } from 'resend';
import { formatMemberNumber, formatEuros } from './http.mjs';

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'startuc3m@gmail.com';

/**
 * Correo de bienvenida. Nunca lanza: si Resend falla, el webhook debe
 * responder 200 igualmente para que Stripe no reintente un pago que ya
 * quedo registrado.
 */
export async function sendWelcomeEmail(member) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, skipped: true, error: 'RESEND_NOT_CONFIGURED' };
  }

  const memberId = formatMemberNumber(member.member_number);
  const modalidad = member.plan === 'premium' ? 'Premium' : 'Estándar (tramo ' + member.tier + ')';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: member.email,
      subject: 'Bienvenido a Start — socio nº ' + memberId,
      html: welcomeHtml({ name: member.full_name, memberId, modalidad, priceCents: member.price_cents }),
      text: welcomeText({ name: member.full_name, memberId, modalidad, priceCents: member.price_cents }),
    });

    if (error) return { ok: false, error: String(error.message || error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function welcomeText({ name, memberId, modalidad, priceCents }) {
  return [
    'Hola ' + name + ',',
    '',
    'Ya eres socio de Start UC3M. Este es tu carne:',
    '',
    '  Numero de socio: ' + memberId,
    '  Modalidad: ' + modalidad,
    '  Importe: ' + formatEuros(priceCents),
    '',
    'Guarda este numero: es el que te identifica en nuestros eventos.',
    'El recibo del pago te llega aparte, de Stripe.',
    '',
    'Cualquier cosa, escribenos a ' + CONTACT_EMAIL + '.',
    '',
    'Nos vemos pronto,',
    'El equipo de Start UC3M',
  ].join('\n');
}

function welcomeHtml({ name, memberId, modalidad, priceCents }) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#18181b;">Hola ${escapeHtml(name)},</p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;color:#18181b;">
                  Ya eres socio de <strong>Start UC3M</strong>. Este es tu carn&eacute;:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;">
                  <tr>
                    <td style="padding:20px 24px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">N&uacute;mero de socio</p>
                      <p style="margin:0;font-size:40px;font-weight:bold;letter-spacing:.06em;color:#18181b;">${memberId}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 20px 24px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#3f3f46;">
                        <tr>
                          <td style="padding:6px 0;color:#71717a;">Modalidad</td>
                          <td style="padding:6px 0;text-align:right;">${escapeHtml(modalidad)}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#71717a;">Importe</td>
                          <td style="padding:6px 0;text-align:right;">${formatEuros(priceCents)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#3f3f46;">
                  Guarda este n&uacute;mero: es el que te identifica en nuestros eventos.
                  El recibo del pago te llega aparte, de Stripe.
                </p>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#3f3f46;">
                  Cualquier cosa, escr&iacute;benos a
                  <a href="mailto:${CONTACT_EMAIL}" style="color:#2563eb;">${CONTACT_EMAIL}</a>.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#71717a;">
                  Nos vemos pronto,<br />El equipo de Start UC3M
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
