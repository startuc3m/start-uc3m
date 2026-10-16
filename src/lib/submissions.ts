// Ruta compartida al almacén local de envíos de formularios (usado por api/forms.ts y por las
// rutas que necesitan leer envíos ya guardados, como el conteo de plazas de un evento).
// Basada en process.cwd() (no en import.meta.url): una vez empaquetado por Vite, este módulo
// vive en dist/server/chunks/ y ya no guarda la misma profundidad relativa que en src/, así que
// una ruta relativa al archivo se resolvía fuera del proyecto.
import { join } from 'node:path';
export const SUBMISSIONS_FILE = join(process.cwd(), 'data', 'submissions.json');

export async function readSubmissions(): Promise<{ id: string; form: string; at: string; data: Record<string, string> }[]> {
  const { readFile } = await import('node:fs/promises');
  return readFile(SUBMISSIONS_FILE, 'utf8').then(JSON.parse).catch(() => []);
}
