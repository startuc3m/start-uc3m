import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { posts as publicados } from '../../lib/content';

export const GET: APIRoute = async (context) => {
  const posts = await publicados();
  return rss({
    title: 'Blog de Start UC3M',
    description: 'Crónicas de eventos, comunidad, recursos y prensa de la asociación de emprendedores de la UC3M.',
    site: context.site ?? 'https://startuc3m.es',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      pubDate: p.data.date,
      author: p.data.author,
      categories: [p.data.category],
      link: `/blog/${p.id}/`,
    })),
  });
};
