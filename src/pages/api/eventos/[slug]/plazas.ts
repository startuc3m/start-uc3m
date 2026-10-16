import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readSubmissions } from '../../../../lib/submissions';

export const prerender = false;

// Plazas ocupadas = envíos del formulario 'evento' para este evento que no son lista de espera.
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  const evento = (await getCollection('eventos')).find((e) => e.id === slug);
  if (!evento) return json({ error: 'Evento no encontrado' }, 404);

  const seats = evento.data.seats ?? null;
  const submissions = await readSubmissions();
  const taken = submissions.filter((s) => s.form === 'evento' && s.data.slug === slug && s.data.tipo !== 'lista-espera').length;
  const remaining = seats == null ? null : Math.max(0, seats - taken);

  return json({ seats, taken, remaining });
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
