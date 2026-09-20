import { query } from './db.mjs';

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
}

/** Lee el cuerpo como JSON. Tolera que Vercel ya lo haya parseado. */
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  const raw = await readRawBody(req);
  if (!raw.length) return null;
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    return null;
  }
}

/** Cuerpo sin tocar. Imprescindible para verificar la firma de Stripe. */
export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** IP del cliente segun la cabecera que pone el Edge Network de Vercel. */
export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'desconocida';
}

/**
 * Rate limiting respaldado por la BD (ver rate_limit_hit en db/schema.sql).
 * Devuelve true si la peticion se permite.
 */
export async function rateLimit(bucket, limit, windowSeconds) {
  try {
    const { rows } = await query('select rate_limit_hit($1, $2, $3) as allowed', [
      bucket,
      limit,
      windowSeconds,
    ]);
    return rows[0].allowed;
  } catch {
    // Si el limitador falla no bloqueamos el registro de socios.
    return true;
  }
}

/**
 * Iguala el tiempo de respuesta a un suelo fijo.
 *
 * El endpoint de elegibilidad premium debe tardar lo mismo tanto si el
 * email esta invitado como si no: si no, el propio tiempo de respuesta
 * revela quien esta en la lista.
 */
export async function padTiming(startedAt, floorMs) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < floorMs) {
    await new Promise((resolve) => setTimeout(resolve, floorMs - elapsed));
  }
}

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function formatMemberNumber(n) {
  return String(n).padStart(4, '0');
}

export function formatEuros(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}
