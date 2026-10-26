import { getEntry } from 'astro:content';

// Inscripción al Start Camp para los avisos (banner y barra), o undefined en las páginas donde no deben salir:
// la propia ficha del Camp (ya tiene la inscripción; ojo, la de 2025 sí lo lleva) y las secciones de `exclude`.
export async function startcampPromoUrl(pathname: string, exclude: string[] = []) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/eventos/start-camp' || exclude.some((p) => path === p || path.startsWith(p + '/'))) return undefined;
  const camp = await getEntry('eventos', 'start-camp');
  return camp?.data.external;
}
