/* eslint-disable no-console */
/**
 * Comprueba la configuracion de Stripe antes de la prueba de punta a punta.
 *
 *   node db/test-stripe.js
 *
 * Lo primero que mira es que la clave sea de PRUEBA. La cuenta de Start
 * tiene dinero real, y una sk_live_ aqui significaria cobrar de verdad en
 * cada prueba. La clave no se imprime nunca.
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

let fallos = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { fallos += 1; console.log('  FAIL ' + m); };
const aviso = (m) => console.log('  ~    ' + m);

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  console.log('\nClave');

  if (!key) {
    fail('falta STRIPE_SECRET_KEY');
    return resumen();
  }

  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    fail('ESTA ES LA CLAVE REAL (sk_live_). Cada prueba cobraria de verdad.');
    console.log('       Ve a https://dashboard.stripe.com/test/apikeys y coge la sk_test_.');
    return resumen();
  }

  if (!key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
    fail('STRIPE_SECRET_KEY no parece una clave de Stripe (deberia empezar por sk_test_)');
    return resumen();
  }

  ok('clave de PRUEBA (sk_test_)');

  // ---------------------------------------------------------------
  const Stripe = require('stripe');
  const stripe = new Stripe(key);

  console.log('\nCuenta');

  let account;
  try {
    account = await stripe.accounts.retrieve();
  } catch (err) {
    fail('Stripe rechazo la clave: ' + err.message);
    return resumen();
  }

  ok('cuenta: ' + (account.business_profile?.name || account.settings?.dashboard?.display_name || account.id));
  ok('pais: ' + (account.country || '?') + '   moneda por defecto: ' + (account.default_currency || '?'));

  if (account.default_currency && account.default_currency.toLowerCase() !== 'eur') {
    aviso('la moneda por defecto no es EUR; nosotros cobramos siempre en EUR');
  }
  if (!account.charges_enabled) {
    aviso('charges_enabled = false: en modo test da igual, pero en produccion hay que completar el alta');
  }

  // ---------------------------------------------------------------
  console.log('\nSesion de pago de prueba');

  if (!siteUrl) {
    fail('falta NEXT_PUBLIC_SITE_URL: sin el, no se pueden construir las URLs de vuelta');
    return resumen();
  }

  const base = siteUrl.replace(/\/$/, '');
  ok('URLs de vuelta sobre ' + base);

  try {
    // Misma forma exacta que api/membership/checkout.mjs.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'es',
      customer_email: 'prueba-configuracion@startuc3m.es',
      client_reference_id: '00000000-0000-0000-0000-000000000000',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 799,
            product_data: { name: 'Socio de Start UC3M', description: 'Comprobacion de configuracion' },
          },
          quantity: 1,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      metadata: { membership_id: 'comprobacion', plan: 'standard', tier: '1' },
      success_url: base + '/socios/gracias?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: base + '/socios?cancelado=1',
    });

    ok('Stripe acepta la sesion tal y como la crea el checkout');
    ok('importe: ' + (session.amount_total / 100).toFixed(2).replace('.', ',') + ' EUR');
    ok('caduca a los 31 min (la reserva en BD dura 45)');

    await stripe.checkout.sessions.expire(session.id);
    ok('sesion de comprobacion cerrada');
  } catch (err) {
    fail('Stripe rechazo la sesion: ' + err.message);
    return resumen();
  }

  // ---------------------------------------------------------------
  console.log('\nWebhook');

  if (!whsec) {
    aviso('falta STRIPE_WEBHOOK_SECRET');
    aviso('para local sale de: stripe listen --forward-to localhost:3000/api/stripe/webhook');
  } else if (!whsec.startsWith('whsec_')) {
    fail('STRIPE_WEBHOOK_SECRET deberia empezar por whsec_');
  } else {
    ok('STRIPE_WEBHOOK_SECRET presente');
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
