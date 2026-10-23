import type { ImageMetadata } from 'astro';

// Fotos del Drive de Start (#41), ya recortadas y reducidas a 2400 px en src/assets/fotos.
// Astro genera AVIF/WebP del tamaño de cada hueco en el build.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.jpg', { eager: true });

export function foto(name: string): ImageMetadata {
  const f = files[`../assets/fotos/${name}.jpg`];
  if (!f) throw new Error(`Falta la foto src/assets/fotos/${name}.jpg`);
  return f.default;
}

type EventoFotos = { card: string; hero: string; side?: string };

// Fotos por evento (id = nombre del .md). Sin entrada, la ficha usa el hueco de marca.
// Start Camp 2026 todavía no se ha celebrado: usa fotos de la edición 2025.
export const eventoFotos: Record<string, EventoFotos> = {
  'start-camp': { card: 'start-camp-escenario', hero: 'start-camp-grupo', side: 'start-camp-mentor' },
  'start-camp-2025': { card: 'start-camp-equipos', hero: 'start-camp-escenario', side: 'start-camp-trabajo' },
  'startxperience': { card: 'startxperience-escenario', hero: 'startxperience-escenario' },
  // Fotos del post de Instagram de Start sobre el Buildathon (17/09/2026).
  'buildathon-welcome-start': { card: 'buildathon-sala', hero: 'buildathon-sala', side: 'buildathon-equipo' },
  // Provisional, con fotos de equipos del Start Camp 2025 hasta tener las suyas.
  'lovable-hackathon': { card: 'equipo-pitch', hero: 'sala-trabajo-staff', side: 'equipo-mesa' },
};
