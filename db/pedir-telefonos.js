/* eslint-disable no-console */
/**
 * Pide el telefono a los socios que se dieron de alta antes de que se
 * pidiera en el formulario.
 *
 *   node db/pedir-telefonos.js --lista            quien lo tiene y quien no
 *   node db/pedir-telefonos.js --prueba tu@email  te manda a ti uno de muestra
 *   node db/pedir-telefonos.js --enviar           lo manda de verdad
 *
 * Cada socio recibe SU enlace personal, asi que solo tiene que escribir
 * el numero. A quien ya lo haya dejado no se le escribe.
 *
 * Trabaja contra PRODUCCION. Sin --enviar no manda nada.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envFile = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    });
}

const SITE = 'https://www.startuc3m.es';
const CONTACTO = env.CONTACT_EMAIL || 'startuc3m@gmail.com';

const args = process.argv.slice(2);
const soloLista = args.includes('--lista');
const enviar = args.includes('--enviar');
const iPrueba = args.indexOf('--prueba');
const emailPrueba = iPrueba !== -1 ? args[iPrueba + 1] : null;

// Entre envios, para no disparar el limite de Resend (2 por segundo).
const PAUSA_MS = 600;

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function texto({ nombre, numero, enlace }) {
  return [
    'Hola ' + nombre + ',',
    '',
    'Estamos montando el grupo de WhatsApp de socios de Start y nos falta tu telefono.',
    '',
    'Dejanoslo aqui, es un momento:',
    '  ' + enlace,
    '',
    'Ese enlace es tuyo: al abrirlo ya sabemos que eres el socio n' + numero + ', asi que solo',
    'tienes que escribir el numero.',
    '',
    'Si prefieres no darnoslo, no pasa nada: seguiras siendo socio igualmente, solo que no',
    'podremos anadirte al grupo.',
    '',
    'Cualquier cosa, respondenos a este correo.',
    '',
    'El equipo de Start UC3M',
  ].join('\n');
}

function html({ nombre, numero, enlace }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>Nos falta tu tel&eacute;fono</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a1338;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Un momento y te a&ntilde;adimos al grupo de WhatsApp de socios.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a1338" style="background-color:#0a1338;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:Helvetica,Arial,sans-serif;">

            <tr>
              <td align="center" style="padding:0 0 24px 0;">
                <img src="${SITE}/logo-email.png" width="150" alt="Start UC3M"
                     style="display:block;width:150px;max-width:60%;height:auto;border:0;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:bold;letter-spacing:.04em;" />
              </td>
            </tr>

            <tr>
              <td bgcolor="#0e1a52" style="background-color:#0e1a52;border-radius:14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:34px 32px 0 32px;">
                      <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#4cc9f0;">
                        Socio n&ordm; ${numero}
                      </p>
                      <p style="margin:0 0 14px 0;font-size:16px;line-height:1.5;color:#ffffff;">
                        Hola ${escapeHtml(nombre)},
                      </p>
                      <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#bcc7ea;">
                        Estamos montando el <span style="color:#ffffff;font-weight:bold;">grupo de WhatsApp de socios</span>
                        y nos falta tu tel&eacute;fono. D&eacute;janoslo aqu&iacute; y te a&ntilde;adimos.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:0 32px 6px 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" bgcolor="#4cc9f0" style="border-radius:10px;">
                            <a href="${enlace}"
                               style="display:inline-block;padding:15px 34px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;letter-spacing:.03em;color:#0a1338;text-decoration:none;border-radius:10px;">
                              Dejar mi tel&eacute;fono
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 32px 34px 32px;">
                      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.65;color:#93a0cd;">
                        El enlace es tuyo: al abrirlo ya sabemos qui&eacute;n eres, as&iacute; que solo tienes
                        que escribir el n&uacute;mero. No lo reenv&iacute;es a nadie.
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.65;color:#93a0cd;">
                        Si prefieres no d&aacute;rnoslo, no pasa nada: seguir&aacute;s siendo socio igualmente.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:26px 24px 8px 24px;">
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

async function main() {
  const url = env.DATABASE_URL_PROD || env.DATABASE_URL;
  const base = new URL(url).pathname.replace(/^\//, '');
  console.log('\nBase: ' + base + (base === 'neondb' ? '  (PRODUCCION)' : '  (pruebas)'));

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: true } });
  await c.connect();

  const nuevos = (await c.query('select ensure_phone_tokens() as n')).rows[0].n;
  if (nuevos) console.log('Enlaces personales creados: ' + nuevos);

  const { rows } = await c.query(
    `select member_number, full_name, email, phone, phone_token
       from memberships
      where status = 'paid'
      order by member_number`
  );
  await c.end();

  const conTelefono = rows.filter((r) => r.phone);
  const sinTelefono = rows.filter((r) => !r.phone);

  console.log('\nSocios: ' + rows.length);
  console.log('  con telefono: ' + conTelefono.length);
  console.log('  sin telefono: ' + sinTelefono.length);

  if (soloLista) {
    console.log('');
    rows.forEach((r) => {
      const id = String(r.member_number).padStart(4, '0');
      console.log('  ' + id + '  ' + String(r.full_name).padEnd(32) + (r.phone || '(falta)'));
    });
    return;
  }

  const { sendRaw } = await cargarEnvio();

  // --- correo de muestra ---
  if (emailPrueba) {
    const enlace = SITE + '/socios/telefono?t=' + (rows[0] ? rows[0].phone_token : 'ejemplo');
    const datos = { nombre: 'Nombre De Prueba', numero: '0042', enlace };
    const r = await sendRaw({
      to: emailPrueba,
      subject: 'Nos falta tu teléfono para el grupo de socios',
      html: html(datos),
      text: texto(datos),
    });
    console.log('\n' + (r.ok ? '  ok   muestra enviada a ' + emailPrueba : '  FAIL ' + r.error));
    return;
  }

  if (!enviar) {
    console.log('\nSe escribiria a ' + sinTelefono.length + ' socio(s):');
    sinTelefono.forEach((r) =>
      console.log('  ' + String(r.member_number).padStart(4, '0') + '  ' + r.email)
    );
    console.log('\nAñade --enviar para mandarlo de verdad, o --prueba tu@email para verlo antes.');
    return;
  }

  console.log('\nEnviando a ' + sinTelefono.length + ' socio(s)...\n');
  let enviados = 0;
  const fallos = [];

  for (const socio of sinTelefono) {
    const numero = String(socio.member_number).padStart(4, '0');
    const datos = {
      nombre: socio.full_name,
      numero,
      enlace: SITE + '/socios/telefono?t=' + socio.phone_token,
    };

    const r = await sendRaw({
      to: socio.email,
      subject: 'Nos falta tu teléfono para el grupo de socios',
      html: html(datos),
      text: texto(datos),
    });

    if (r.ok) {
      enviados += 1;
      console.log('  ok   ' + numero + '  ' + socio.email);
    } else {
      fallos.push({ socio, error: r.error });
      console.log('  FAIL ' + numero + '  ' + socio.email + '  ' + r.error);
    }

    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  console.log('\n' + '-'.repeat(60));
  console.log(enviados + ' enviados, ' + fallos.length + ' fallidos');
  if (fallos.length) process.exitCode = 1;
}

/** Envia por Resend con el mismo remitente que el correo de bienvenida. */
async function cargarEnvio() {
  const { Resend } = require('resend');
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error('Faltan RESEND_API_KEY o EMAIL_FROM en .env.local');
    process.exit(2);
  }
  if (/resend\.dev/.test(from)) {
    console.error('EMAIL_FROM usa resend.dev: solo llegaria a tu propia direccion.');
    console.error('Ponlo a: Start UC3M <socios@startuc3m.es>');
    process.exit(2);
  }

  const resend = new Resend(apiKey);

  return {
    async sendRaw({ to, subject, html: cuerpoHtml, text }) {
      try {
        const { error } = await resend.emails.send({
          from,
          replyTo: CONTACTO,
          to,
          subject,
          html: cuerpoHtml,
          text,
        });
        if (error) return { ok: false, error: String(error.message || error) };
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String((err && err.message) || err) };
      }
    },
  };
}

main().catch((err) => {
  console.error('\nError: ' + err.message);
  process.exitCode = 1;
});
