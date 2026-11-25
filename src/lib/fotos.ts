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
export const eventoFotos: Record<string, EventoFotos> = {
  // Fotos oficiales del Start Camp 2026 (carpeta de Drive que pasó Álvaro el 25/11/2026, 305 fotos).
  // Galería: un equipo por foto (sin repetir personas ni grupos), más Red Bull y Lovable, que patrocinaron.
  // La foto grande de los cuatro con la pizarra de «Open2Agents» es del equipo ganador (Álvaro, 25/11).
  'start-camp': {
    card: 'sc26-foto-final', hero: 'sc26-camisetas',
    gallery: ['sc26-sala-trabajando', 'sc26-lovable', 'sc26-detalle', 'sc26-ponencia-dario', 'sc26-equipo-chicas', 'sc26-equipo-foto', 'sc26-equipo-cuatro', 'sc26-pizarra-modelo', 'sc26-equipo-mesa', 'sc26-ponencia-fernando', 'sc26-mentores-jurado', 'sc26-equipo-charla', 'sc26-pizarra-euqual', 'sc26-equipo-mesa-larga', 'sc26-organizacion'],
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
