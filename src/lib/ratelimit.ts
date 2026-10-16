// Rate limit en memoria (ventana deslizante) por clave, p.ej. `${ip}:${form}`.
// Suficiente para un sitio local/pequeño de una sola instancia; no sobrevive a un reinicio del proceso.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}
