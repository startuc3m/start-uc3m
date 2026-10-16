import { getCollection } from 'astro:content';

// Lo que no está validado se marca `draft: true` en su .md y no se publica.
export const eventos = async () =>
  (await getCollection('eventos')).filter((e) => !e.data.draft).sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());

export const posts = async () =>
  (await getCollection('blog')).filter((p) => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

// Con menos de 3 posts propios el blog no se enseña en menú, home ni footer.
export const BLOG_MIN = 3;
export const blogVisible = async () => (await posts()).length >= BLOG_MIN;
