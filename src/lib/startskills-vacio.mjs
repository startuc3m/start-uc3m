// Un bloque "vacío" (futuro y sin nada publicado aún) no se indexa ni va al sitemap:
// sería una página casi en blanco en Google. Lo usan la página del bloque y astro.config.mjs,
// por eso vive aparte y en JS plano (el config no puede cargar startskills.ts).
export function bloqueVacio(b) {
  return !b.tema && !b.formador && b.participantes.length === 0 && b.fotos.length === 0;
}

/** Datos de Start Skills leídos del disco (Notion si se generó, si no la semilla). Solo para el config. */
export async function slugsVacios() {
  const { readFile } = await import('node:fs/promises');
  const leer = (f) => readFile(new URL(`../data/${f}`, import.meta.url), 'utf8').then(JSON.parse);
  const data = await leer('startskills.generated.json').catch(() => leer('startskills.seed.json'));
  return data.bloques.filter(bloqueVacio).map((b) => b.slug);
}
