import type { ImageMetadata } from 'astro';

// Fotos del Drive de Start (#41), ya recortadas y reducidas a 2400 px en src/assets/fotos.
// Astro genera AVIF/WebP del tamaño de cada hueco en el build.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.jpg', { eager: true });

export function foto(name: string): ImageMetadata {
  const f = files[`../assets/fotos/${name}.jpg`];
  if (!f) throw new Error(`Falta la foto src/assets/fotos/${name}.jpg`);
  return f.default;
}

// gallery: mosaico "Así fue" de la ficha (#64); galleryTitle lo cambia (p. ej. edición anterior).
// poster: el cartel oficial del evento; se enseña entero (sin recortar) en la home, en /eventos y en la ficha.
type EventoFotos = { card?: string; hero?: string; side?: string; poster?: string; gallery?: string[]; galleryTitle?: string };

// Fotos por evento (id = nombre del .md). Sin entrada, la ficha usa el hueco de marca.
// Start Camp 2026 todavía no se ha celebrado: usa fotos de la edición 2025.
export const eventoFotos: Record<string, EventoFotos> = {
  'start-camp': {
    card: 'start-camp-escenario', hero: 'start-camp-grupo', side: 'start-camp-mentor',
    galleryTitle: 'Así fueron otros Start Camp',
    gallery: ['start-camp-principio', 'start-camp-sonrisas', 'start-camp-ponencia', 'start-camp-equipo-trabajo', 'start-camp-amigas', 'start-camp-pitch', 'start-camp-mesa', 'start-camp-publico-2', 'start-camp-staff', 'start-camp-portatiles'],
  },
  'start-camp-2025': { card: 'start-camp-equipos', hero: 'start-camp-escenario', side: 'start-camp-trabajo' },
  'startxperience': { card: 'startxperience-escenario', hero: 'startxperience-escenario' },
  // Fotos del post de Instagram de Start sobre el Buildathon (17/09/2026).
  'buildathon-welcome-start': { card: 'buildathon-sala', hero: 'buildathon-sala', side: 'buildathon-equipo' },
  // Cartel oficial que pasó Álvaro (25/11/2026). Sin hero: la cabecera usa el propio cartel desenfocado de fondo.
  'start-to-invest': { poster: 'start-to-invest-cartel' },
  // Provisional, con fotos de equipos del Start Camp 2025 hasta tener las suyas.
  'lovable-hackathon': { card: 'equipo-pitch', hero: 'sala-trabajo-staff', side: 'equipo-mesa' },
};
