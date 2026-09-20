/**
 * Solo desarrollo. CRA carga este fichero automaticamente al hacer
 * `npm start`; no entra en el build de produccion.
 *
 * El servidor de CRA solo sirve la web. Las funciones de api/ las ejecuta
 * Vercel en produccion, y en local las levanta `npm run dev:api` en el
 * puerto 3001. Esto reenvia ahi las llamadas a /api.
 *
 * Por que aqui y no con el campo "proxy" de package.json: al declarar
 * "proxy", react-scripts 5 activa la comprobacion de host del dev server
 * con `allowedHosts: [allowedHost]`, y en Windows sin IP de red local ese
 * valor llega vacio, asi que el servidor no arranca:
 *
 *   Invalid options object. Dev Server has been initialized using an
 *   options object that does not match the API schema.
 *    - options.allowedHosts[0] should be a non-empty string.
 *
 * Con setupProxy.js el proxy funciona igual y esa rama no se activa.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      // El webhook de Stripe NO debe pasar por aqui: su firma se calcula
      // sobre los bytes exactos del cuerpo. Apuntalo directamente a 3001:
      //   stripe listen --forward-to localhost:3001/api/stripe/webhook
      onError(err, req, res) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'API_NO_DISPONIBLE',
            detalle: 'Levanta la API con: npm run dev:api',
          })
        );
      },
    })
  );
};
