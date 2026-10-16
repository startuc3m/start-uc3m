// Semilla del CMS: datos reales del sitio serializados en build. El panel los carga
// y guarda los cambios en localStorage (cms:<colección>) — funciona 100 % en local.
import { getCollection } from 'astro:content';
import { site } from '../site';

export async function buildSeed() {
  const [posts, eventos, podcast] = await Promise.all([getCollection('blog'), getCollection('eventos'), getCollection('podcast')]);
  const d = (x: Date) => x.toISOString().slice(0, 10);
  return {
    posts: posts.map((p) => ({ id: p.id, title: p.data.title, excerpt: p.data.excerpt, date: d(p.data.date), category: p.data.category, author: p.data.author, cover: p.data.cover ?? '', draft: p.data.draft, body: p.body ?? '' })),
    eventos: eventos.map((e) => ({ id: e.id, title: e.data.title, subtitle: e.data.subtitle, date: d(e.data.date), time: e.data.time, place: e.data.place, type: e.data.type, status: e.data.status, seats: e.data.seats ?? '', sponsors: e.data.sponsors, tags: e.data.tags, agenda: e.data.agenda, image: (e.data as any).image ?? '', highlights: (e.data as any).highlights ?? [], body: e.body ?? '' })),
    podcast: podcast.map((p) => ({ id: p.id, title: p.data.title, guest: p.data.guest, role: p.data.role, episode: p.data.episode, date: d(p.data.date), duration: p.data.duration, youtube: p.data.youtube ?? '', youtubeId: (p.data as any).youtubeId ?? '', cover: p.data.cover ?? '', published: true })),
    equipo: site.team.map((m, i) => ({ id: 'm' + i, ...m, order: i })),
    departamentos: site.departments.map((d, i) => ({ id: 'd' + i, ...d })),
    patrocinadores: site.sponsors.map((s, i) => ({ id: 's' + i, ...s, logo: (s as any).logo ?? '', web: '', active: true })),
    links: site.links.map((l, i) => ({ id: 'l' + i, ...l, featured: (l as any).featured ?? false, active: true, order: i })),
    recursos: site.resources.map((r, i) => ({ id: 'r' + i, ...r })),
    tiers: site.tiers.map((t, i) => ({ id: 't' + i, ...t })),
    site: { name: site.name, claim: site.claim, description: site.description, email: site.email, course: site.course, ...site.social },
    envios: [
      { id: 'e1', form: 'unete', at: '2026-09-17T09:12:00Z', data: { nombre: 'Lucía', apellidos: 'Fernández', email: 'lucia@alumnos.uc3m.es', estudios: 'ADE · 2º', dept1: 'Eventos' } },
      { id: 'e2', form: 'evento', at: '2026-09-17T10:40:00Z', data: { nombre: 'Diego Ortiz', email: 'diego@alumnos.uc3m.es', evento: 'Buildathon Pitchless × NomuLabs', equipo: 'No tengo equipo' } },
      { id: 'e3', form: 'patrocinio', at: '2026-09-16T17:05:00Z', data: { empresa: 'NomuLabs', nombre: 'Equipo NomuLabs', email: 'hola@nomulabs.com', interes: 'Partner fijo' } },
      { id: 'e4', form: 'newsletter', at: '2026-09-16T12:00:00Z', data: { email: 'marta@alumnos.uc3m.es' } },
      { id: 'e5', form: 'contacto', at: '2026-09-15T19:30:00Z', data: { nombre: 'Pablo', email: 'pablo@gmail.com', asunto: 'Tengo una startup', mensaje: 'Queremos presentar en StartXperience.' } },
    ],
  };
}
