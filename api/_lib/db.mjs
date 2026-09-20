import pg from 'pg';

const { Pool } = pg;

let pool;

/**
 * Pool reutilizado entre invocaciones de la misma instancia lambda.
 * `max` bajo a proposito: en serverless hay muchas instancias y el limite
 * de conexiones de Neon es compartido.
 */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Falta la variable de entorno DATABASE_URL');
    }
    const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
    pool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: isLocal ? false : { rejectUnauthorized: true },
    });
  }
  return pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

/**
 * Traduce las excepciones de reserve_membership a un codigo estable.
 * Postgres las entrega como `error.message` con el texto del RAISE.
 */
const CODES = [
  'ALREADY_MEMBER',
  'PREMIUM_CLOSED',
  'PREMIUM_NOT_INVITED',
  'INVALID_PLAN',
  'INVALID_EMAIL',
  'INVALID_NAME',
];

export function pgErrorCode(err) {
  const message = String((err && err.message) || '');
  return CODES.find((code) => message.includes(code)) || null;
}
