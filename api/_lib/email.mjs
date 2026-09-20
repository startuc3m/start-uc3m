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
  const modalidad = member.plan === 'premium' ? 'Starter' : 'Estándar (tramo ' + member.tier + ')';

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      // El remitente puede ser una direccion que solo envia (para Resend
      // basta con tener el dominio verificado, no hace falta buzon). Sin
      // esto, quien conteste al correo de bienvenida escribiria a un buzon
      // inexistente y su respuesta se perderia.
      replyTo: CONTACT_EMAIL,
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

export function welcomeText({ name, memberId, modalidad, priceCents }) {
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

// URL fija en public/, no del bundle: el hash del build cambiaria en cada
// despliegue y romperia la imagen de los correos ya enviados.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.startuc3m.es').replace(/\/$/, '');
const LOGO = SITE + '/logo-email.png';

/**
 * Plantilla con la identidad de Start: el azul #0e1a52 de la web y el
 * cian #4cc9f0 del acento.
 *
 * Escrita con las restricciones del correo, no de la web: tablas en vez
 * de flex, estilos en linea, `bgcolor` ademas del CSS (Outlook usa el
 * motor de Word y se salta muchas reglas), y nada de fuentes web, que
 * Gmail elimina. Por eso el tipo de letra no es Josefin Sans como en la
 * web: no sobreviviria al envio.
 *
 * El numero de socio va en texto, nunca en una imagen: muchos clientes
 * bloquean las imagenes por defecto y es el dato que importa.
 */
export function welcomeHtml({ name, memberId, modalidad, priceCents }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>Bienvenido a Start UC3M</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a1338;">
    <!-- Resumen que algunos clientes muestran junto al asunto -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Tu n&uacute;mero de socio es el ${memberId}. Gu&aacute;rdalo: te identifica en nuestros eventos.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a1338" style="background-color:#0a1338;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:Helvetica,Arial,sans-serif;">

            <!-- Logotipo -->
            <tr>
              <td align="center" style="padding:0 0 24px 0;">
                <!-- El texto alternativo va estilado: si el cliente bloquea
                     las imagenes, "Start UC3M" tiene que leerse igual sobre
                     el fondo oscuro, no quedar en negro invisible. -->
                <img src="${LOGO}" width="150" alt="Start UC3M"
                     style="display:block;width:150px;max-width:60%;height:auto;border:0;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.04em;" />
              </td>
            </tr>

            <!-- Tarjeta -->
            <tr>
              <td bgcolor="#0e1a52" style="background-color:#0e1a52;border-radius:14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                  <tr>
                    <td style="padding:34px 32px 0 32px;">
                      <p style="margin:0 0 14px 0;font-size:16px;line-height:1.5;color:#ffffff;">
                        Hola ${escapeHtml(name)},
                      </p>
                      <p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;color:#bcc7ea;">
                        Ya eres socio de <span style="color:#ffffff;font-weight:bold;">Start UC3M</span>.
                        Este es tu carn&eacute;:
                      </p>
                    </td>
                  </tr>

                  <!-- Numero de socio -->
                  <tr>
                    <td style="padding:0 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a1338" style="background-color:#0a1338;border-radius:12px;">
                        <tr>
                          <td align="center" style="padding:26px 24px 20px 24px;">
                            <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#4cc9f0;">
                              N&uacute;mero de socio
                            </p>
                            <p style="margin:0;font-size:52px;line-height:1;font-weight:bold;letter-spacing:.08em;color:#4cc9f0;">
                              ${memberId}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 24px 22px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
                              <tr>
                                <td style="padding:9px 0;border-top:1px solid #1d2a63;color:#93a0cd;">Modalidad</td>
                                <td align="right" style="padding:9px 0;border-top:1px solid #1d2a63;color:#ffffff;">${escapeHtml(modalidad)}</td>
                              </tr>
                              <tr>
                                <td style="padding:9px 0;border-top:1px solid #1d2a63;color:#93a0cd;">Importe</td>
                                <td align="right" style="padding:9px 0;border-top:1px solid #1d2a63;color:#ffffff;">${formatEuros(priceCents)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:26px 32px 34px 32px;">
                      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#bcc7ea;">
                        Gu&aacute;rdalo: es el n&uacute;mero que te identifica en nuestros eventos.
                        El recibo del pago te llega aparte, de Stripe.
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.65;color:#bcc7ea;">
                        Cualquier cosa, escr&iacute;benos a
                        <a href="mailto:${CONTACT_EMAIL}" style="color:#4cc9f0;text-decoration:underline;">${CONTACT_EMAIL}</a>.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Pie -->
            <tr>
              <td align="center" style="padding:26px 24px 8px 24px;">
                <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#ffffff;">
                  Nos vemos pronto
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6f7cae;">
                  El equipo de Start UC3M &middot;
                  <a href="${SITE}" style="color:#6f7cae;text-decoration:underline;">startuc3m.es</a>
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
