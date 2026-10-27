import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// "CMS" ligero: cada colección es una carpeta de markdown en src/content.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    category: z.enum(['Eventos', 'Comunidad', 'Recursos', 'Prensa']),
    author: z.string().default('Start UC3M'),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const eventos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eventos' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    time: z.string(),
    place: z.string(),
    type: z.string(),
    status: z.enum(['abierto', 'sold-out', 'pasado']).default('abierto'),
    seats: z.number().optional(),
    sponsors: z.array(z.string()).default([]),
    agenda: z.array(z.object({ time: z.string(), title: z.string(), desc: z.string() })).default([]),
    tags: z.array(z.string()).default([]),
    external: z.string().optional(),
    image: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    edition: z.string().optional(),
    days: z.number().default(1),
    endTime: z.string().optional(),
    price: z.string().optional(),
    priceNote: z.string().optional(),
    // Premios, mentores y jurado: solo lo confirmado; `total` es lo previsto y `names` lo ya cerrado.
    prizes: z.array(z.object({ place: z.string(), prize: z.string().optional(), note: z.string().optional() })).default([]),
    mentors: z.object({ total: z.number(), names: z.array(z.string()).default([]) }).optional(),
    jury: z.object({ total: z.number(), names: z.array(z.string()).default([]) }).optional(),
    // Info práctica (cómo llegar, horario, equipo…): una tarjeta por punto, con enlace opcional.
    info: z.array(z.object({ title: z.string(), text: z.string(), link: z.object({ href: z.string(), label: z.string() }).optional() })).default([]),
    draft: z.boolean().default(false),
  }),
});

const podcast = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/podcast' }),
  schema: z.object({
    title: z.string(),
    guest: z.string(),
    role: z.string(),
    episode: z.number(),
    date: z.coerce.date(),
    duration: z.string(),
    youtube: z.string().optional(),
    youtubeId: z.string().optional(),
    spotify: z.string().optional(),
    cover: z.string().optional(),
  }),
});

export const collections = { blog, eventos, podcast };
