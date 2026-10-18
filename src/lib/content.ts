import { getCollection } from 'astro:content';

const DAY_MS = 24 * 60 * 60 * 1000;

// Fin del evento: medianoche tras su último día (date + days).
export const eventEnd = (date: Date, days = 1) => date.valueOf() + days * DAY_MS;

// Lo que no está validado se marca `draft: true` en su .md y no se publica.
// Un evento cuya fecha ya ha pasado se trata como `pasado` aunque nadie haya
// editado su `status`: la web es estática, así que basta con volver a construir.
export const eventos = async () => {
  const now = Date.now();
  return (await getCollection('eventos'))
    .filter((e) => !e.data.draft)
    .map((e) => (eventEnd(e.data.date, e.data.days) <= now ? { ...e, data: { ...e.data, status: 'pasado' as const } } : e))
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
};

export const posts = async () =>
  (await getCollection('blog')).filter((p) => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

// Con menos de 3 posts propios el blog no se enseña en menú, home ni footer.
export const BLOG_MIN = 3;
export const blogVisible = async () => (await posts()).length >= BLOG_MIN;
