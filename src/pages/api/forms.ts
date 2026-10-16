import type { APIRoute } from 'astro';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SUBMISSIONS_FILE } from '../../lib/submissions';
import { logConfirmationEmail } from '../../lib/mail';
import { formSchemas, type FormName } from '../../lib/forms-schemas';
import { isRateLimited } from '../../lib/ratelimit';

export const prerender = false;

// Guarda cada envío en data/submissions.json (local, sin servicios externos).
const FILE = SUBMISSIONS_FILE;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const fd = await request.formData();
  const form = String(fd.get('form') ?? '') as FormName;
  const schema = formSchemas[form];
  if (!schema) return json({ error: 'Formulario desconocido' }, 400);
  if (fd.get('website')) return json({ ok: true }); // honeypot: fingimos éxito

  const ip = (() => { try { return clientAddress; } catch { return 'unknown'; } })();
  if (isRateLimited(`${ip}:${form}`)) return json({ error: 'Demasiados envíos. Inténtalo de nuevo en unos minutos.' }, 429);

  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (k !== 'website' && k !== 'form' && typeof v === 'string') raw[k] = v.trim();
  // Normaliza los campos ausentes a '' para que falten con el mensaje de zod, no con "expected string, received undefined".
  const normalized = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, raw[k] ?? '']));
  const parsed = schema.safeParse(normalized);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Datos no válidos' }, 400);
  const data = parsed.data as Record<string, string>;

  await mkdir(dirname(FILE), { recursive: true });
  const list = await readFile(FILE, 'utf8').then(JSON.parse).catch(() => []);
  list.push({ id: crypto.randomUUID(), form, at: new Date().toISOString(), data });
  await writeFile(FILE, JSON.stringify(list, null, 2));
  logConfirmationEmail(data.email, form, data);
  return json({ ok: true });
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
