/* eslint-disable no-console */
/**
 * Comprueba la configuracion de Resend y, si quieres, envia el correo de
 * bienvenida de verdad usando el mismo codigo que el webhook.
 *
 *   node db/test-email.js                  # solo revisa la configuracion
 *   node db/test-email.js tu@email.com     # ademas envia un correo real
 *
 * Lee RESEND_API_KEY y EMAIL_FROM del entorno o de .env.local.
 * La clave no se imprime nunca.
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
      }
    });
}

const DESTINO = process.argv[2] || null;

let fallos = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { fallos += 1; console.log('  FAIL ' + m); };
const aviso = (m) => console.log('  ~    ' + m);

/** "Start UC3M <socios@startuc3m.es>" -> socios@startuc3m.es */
function direccionDe(from) {
  const conNombre = from.match(/<([^>]+)>/);
  return (conNombre ? conNombre[1] : from).trim();
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  console.log('\nConfiguracion');

  if (!apiKey) {
    fail('falta RESEND_API_KEY');
  } else if (!apiKey.startsWith('re_')) {
    fail('RESEND_API_KEY no empieza por "re_": no parece una clave de Resend');
  } else {
    ok('RESEND_API_KEY presente');
  }

  if (!from) {
    fail('falta EMAIL_FROM');
  } else {
    const direccion = direccionDe(from);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(direccion)) {
      fail('EMAIL_FROM no contiene una direccion valida: ' + from);
    } else {
      ok('EMAIL_FROM: ' + from);
      if (!/<.+>/.test(from)) {
        aviso('sin nombre visible. Mejor: Start UC3M <' + direccion + '>');
      }
    }
  }

  if (fallos) return resumen();

  // ---------------------------------------------------------------
  // Dominios verificados
  // ---------------------------------------------------------------
  console.log('\nDominios en Resend');

  const dominioFrom = direccionDe(from).split('@')[1].toLowerCase();

  if (dominioFrom === 'resend.dev') {
    aviso('estas usando el remitente de pruebas de Resend');
    aviso('solo llegara a la direccion de tu cuenta de Resend, a nadie mas');
    aviso('para produccion hace falta el dominio de Start verificado');
  } else {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: 'Bearer ' + apiKey },
    });

    if (!res.ok) {
      fail('no se pudo consultar los dominios: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
      return resumen();
    }

    const { data } = await res.json();
    const dominios = data || [];

    if (!dominios.length) {
      fail('no hay ningun dominio dado de alta en Resend');
    } else {
      dominios.forEach((d) => {
        console.log('    ' + d.name.padEnd(28) + d.status);
      });
    }

    const encaja = dominios.find(
      (d) => dominioFrom === d.name.toLowerCase() || dominioFrom.endsWith('.' + d.name.toLowerCase())
    );

    if (!encaja) {
      fail('EMAIL_FROM usa "' + dominioFrom + '", que no esta dado de alta en Resend');
    } else if (encaja.status !== 'verified') {
      fail('el dominio "' + encaja.name + '" esta en estado "' + encaja.status + '", no verificado');
      aviso('hasta que verifique, los envios se rechazan');
    } else {
      ok('el dominio "' + encaja.name + '" esta verificado');
    }
  }

  // ---------------------------------------------------------------
  // Envio real, con el codigo del webhook
  // ---------------------------------------------------------------
  if (!DESTINO) {
    console.log('\n  (pasa una direccion para enviar un correo de prueba:');
    console.log('   node db/test-email.js tu@email.com)');
    return resumen();
  }

  console.log('\nEnvio de prueba a ' + DESTINO);

  const { sendWelcomeEmail } = await import('../api/_lib/email.mjs');

  const resultado = await sendWelcomeEmail({
    full_name: 'Socio de Prueba',
    member_number: 42,
    email: DESTINO,
    plan: 'standard',
    tier: 1,
    price_cents: 799,
    paid_at: new Date().toISOString(),
  });

  if (resultado.ok) {
    ok('correo enviado: asunto "Bienvenido a Start — socio nº 0042"');
    console.log('       Revisa la bandeja (y spam) de ' + DESTINO + '.');
    console.log('       Comprueba que el numero sale como 0042 y el importe como 7,99 EUR.');
  } else if (resultado.skipped) {
    fail('el modulo se salto el envio: ' + resultado.error);
  } else {
    fail('Resend rechazo el envio: ' + resultado.error);
  }

  return resumen();
}

function resumen() {
  console.log('\n' + '-'.repeat(60));
  if (fallos) {
    console.log(fallos + ' problema(s)');
    process.exitCode = 1;
    return;
  }
  console.log('Todo correcto.');
}

main().catch((err) => {
  console.error('\nError: ' + err.message);
  process.exitCode = 1;
});
