import { getEntry } from 'astro:content';

// Inscripción al Start Camp para los avisos (banner y barra), o undefined en las páginas donde no deben salir:
// la propia ficha del Camp y sus subpáginas (el avatar es para quien ya tiene entrada; ojo, la de 2025 sí lo lleva)
// y las secciones de `exclude`.
export async function startcampPromoUrl(pathname: string, exclude: string[] = []) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if ([...exclude, '/eventos/start-camp'].some((p) => path === p || path.startsWith(p + '/'))) return undefined;
  const camp = await getEntry('eventos', 'start-camp');
  return camp?.data.external;
}
