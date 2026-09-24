/* eslint-disable no-console */
/**
 * Servidor local para las funciones de api/.
 *
 *   node db/dev-api.js          (o: npm run dev:api)
 *
 * El servidor de desarrollo de CRA solo sirve la web; las funciones
 * serverless las ejecuta Vercel en produccion. Esto las levanta en local
 * para poder probar el flujo entero sin desplegar.
 *
 * El formulario en localhost:3000 las alcanza por el "proxy" declarado en
 * package.json. El webhook de Stripe, en cambio, conviene apuntarlo AQUI
 * directamente:
 *
 *   stripe listen --forward-to localhost:3001/api/stripe/webhook
 *
 * Pasar por el proxy de CRA puede alterar el cuerpo de la peticion, y la
 * firma de Stripe se calcula sobre los bytes exactos: si cambian, deja de
 * validar.
 */

const http = require('http');
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

const PORT = Number(process.env.DEV_API_PORT || 3001);

// Notion no tiene entorno de pruebas: la clave apunta siempre a la base
// real de Start. Y los numeros de socio de la base de pruebas empiezan
// tambien en 1, asi que una prueba en local escribiria sobre la ficha de
// un socio de verdad. Si no estamos contra produccion, se desactiva.
const contraProduccion = /\/neondb(\?|$)/.test(process.env.DATABASE_URL || '');
if (!contraProduccion && process.env.NOTION_API_KEY) {
  delete process.env.NOTION_API_KEY;
  process.env.DEV_NOTION_DESACTIVADO = '1';
}

function describeDb(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, '') + ' en ' + u.hostname;
  } catch {
    return '(no se pudo leer DATABASE_URL)';
  }
}

async function main() {
  const rutas = {
    '/api/membership/availability': (await import('../api/membership/availability.mjs')).default,
    '/api/membership/premium-eligibility': (await import('../api/membership/premium-eligibility.mjs')).default,
    '/api/membership/checkout': (await import('../api/membership/checkout.mjs')).default,
    '/api/membership/telefono': (await import('../api/membership/telefono.mjs')).default,
    '/api/stripe/webhook': (await import('../api/stripe/webhook.mjs')).default,
  };

  const server = http.createServer(async (req, res) => {
    const ruta = req.url.split('?')[0];
    const handler = rutas[ruta];

    const inicio = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - inicio;
      console.log('  ' + String(res.statusCode) + '  ' + req.method.padEnd(4) + ' ' + ruta + '  ' + ms + 'ms');
    });

    if (!handler) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'NOT_FOUND', ruta }));
    }

    try {
      await handler(req, res);
    } catch (err) {
      console.error('  error en ' + ruta, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'SERVER_ERROR' }));
      }
    }
  });

  server.listen(PORT, () => {
    const base = 'http://localhost:' + PORT;
    console.log('\nAPI de socios en ' + base);
    console.log('  base de datos   ' + describeDb(process.env.DATABASE_URL));
    console.log('  Stripe          ' + (process.env.STRIPE_SECRET_KEY || '').slice(0, 8) + '...');
    console.log('  webhook secret  ' + (process.env.STRIPE_WEBHOOK_SECRET ? 'puesto' : 'FALTA'));
    console.log('  remitente       ' + (process.env.EMAIL_FROM || '(sin EMAIL_FROM)'));
    console.log(
      '  Notion          ' +
        (process.env.DEV_NOTION_DESACTIVADO
          ? 'DESACTIVADO (base de pruebas: escribiria sobre socios reales)'
          : process.env.NOTION_API_KEY
          ? 'configurado'
          : 'sin configurar')
    );

    if (/\/neondb(\?|$)/.test(process.env.DATABASE_URL || '')) {
      console.log('\n  AVISO: estas apuntando a neondb, la base de PRODUCCION.');
      console.log('  Los pagos de prueba consumirian numeros de socio reales.');
    }

    console.log('\nRutas:');
    Object.keys(rutas).forEach((r) => console.log('  ' + base + r));
    console.log('\nEn otra terminal:');
    console.log('  npm start');
    console.log('  stripe listen --forward-to localhost:' + PORT + '/api/stripe/webhook');
    console.log('');
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
