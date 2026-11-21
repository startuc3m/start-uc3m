// Sincroniza Start Skills desde Notion en el build.
//   - Lee la base "Bloques" (y los participantes) y escribe
//     src/data/startskills.generated.json con el contrato de src/lib/startskills.ts.
//   - Descarga las fotos (las URLs de Notion caducan en ~1 h) a public/startskills/.
// Sin NOTION_API_KEY / NOTION_STARTSKILLS_DATABASE_ID no hace nada: la web usa la
// semilla src/data/startskills.seed.json. Ver docs/12-start-skills.md.
import { cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { zipSync } from 'fflate';
import { mapBloque, mapPersona, normalize, ordenarPersonas, slugify, titleOf } from './startskills-notion.mjs';

const NOTION_VERSION = '2022-06-28';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(raiz, 'public', 'startskills');
// Se escribe aquí y se cambia por public/startskills al final: si el sync falla a medias,
// la web conserva las fotos de la última sincronización buena.
const tmpDir = join(raiz, 'public', 'startskills.tmp');
const generado = join(raiz, 'src', 'data', 'startskills.generated.json');

// En local las variables vienen de .env.local / .env (Node 22+). No pisan las ya definidas
// (en Vercel el entorno manda). Si el fichero no existe, se ignora.
for (const f of ['.env.local', '.env']) {
  try { process.loadEnvFile(join(raiz, f)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}

const token = process.env.NOTION_API_KEY;
const bloquesDb = process.env.NOTION_STARTSKILLS_DATABASE_ID;
let participantesDb = process.env.NOTION_STARTSKILLS_PARTICIPANTES_DATABASE_ID;

if (!token || !bloquesDb) {
  // Sin Notion manda la semilla: se borra un JSON generado antiguo para que no la tape.
  await rm(generado, { force: true });
  console.log('Start Skills: Notion no está configurado; la web usa los datos de ejemplo (semilla)');
  process.exit(0);
}

// Límites para lo que llega de Notion: nada de ficheros gigantes ni imágenes "bomba".
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PIXELES = 50_000_000;
// Solo fotos de verdad, reconocidas por sus primeros bytes (no por la extensión): JPG, PNG, GIF,
// WebP y AVIF/HEIC. Un SVG u otro formato no llega a sharp, así nunca pasa por librsvg ni otros
// decodificadores que no hacen falta para fotos de un evento.
function esFoto(buf) {
  const ascii = (a, b) => buf.subarray(a, b).toString('latin1');
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf.readUInt32BE(0) === 0x89504e47) return true; // PNG
  if (ascii(0, 4) === 'GIF8') return true; // GIF
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return true; // WebP
  return ascii(4, 8) === 'ftyp' && /^(avif|avis|heic|heix|mif1|msf1|hevc)$/.test(ascii(8, 12)); // AVIF/HEIC
}
const lector = (buf) => {
  if (!esFoto(buf)) throw new Error('formato no admitido (solo JPG, PNG, GIF, WebP, AVIF o HEIC)');
  return sharp(buf, { limitInputPixels: MAX_PIXELES });
};

class NotionError extends Error {}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Llamada a Notion. Reintenta (hasta 5) si Notion limita (429), falla (5xx) o la red se corta. */
async function notion(path, { method = 'GET', body, que } = {}) {
  let res;
  for (let intento = 1; ; intento++) {
    try {
      res = await fetch(`https://api.notion.com/v1${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      if (intento >= 5) throw new NotionError(`Start Skills: no se pudo contactar con Notion en ${path}: ${e.message}`);
      await esperar(1000 * 2 ** intento);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && intento < 5) {
      const espera = Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** intento;
      await esperar(espera);
      continue;
    }
    break;
  }
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    let pista = '';
    if (res.status === 401) pista = ' Revisa NOTION_API_KEY (token inválido o caducado).';
    else if (res.status === 404)
      pista = ` Revisa ${que ?? 'el id de la base'} y que la integración esté invitada a esa base en Notion (Conexiones).`;
    throw new NotionError(`Start Skills: Notion respondió ${res.status} en ${path}.${pista} ${detalle.slice(0, 200)}`);
  }
  return res.json();
}

async function paginar(fn) {
  const out = [];
  let cursor;
  do {
    const r = await fn(cursor);
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

const queryDb = (id, que) =>
  paginar((cursor) => notion(`/databases/${id}/query`, { method: 'POST', body: { page_size: 100, start_cursor: cursor }, que }));

const hijos = (id) =>
  paginar((cursor) => notion(`/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`));

/** Imágenes del cuerpo de una página; entra un nivel en columnas. */
async function imagenesDePagina(pageId) {
  const urls = [];
  const bases = [];
  for (const b of await hijos(pageId)) {
    if (b.type === 'image') urls.push(b.image?.file?.url ?? b.image?.external?.url);
    else if (b.type === 'child_database') bases.push(b.id);
    else if (b.type === 'column_list') {
      for (const col of await hijos(b.id)) {
        if (col.type !== 'column') continue;
        for (const c of await hijos(col.id)) {
          if (c.type === 'image') urls.push(c.image?.file?.url ?? c.image?.external?.url);
          else if (c.type === 'child_database') bases.push(c.id);
        }
      }
    }
  }
  return { urls: urls.filter(Boolean), bases };
}

/** Descarga con 3 intentos. Si al final falla, lanza: el build se para y la web sigue como estaba. */
class Definitivo extends Error {}

async function leerConTope(res) {
  if (Number(res.headers.get('content-length')) > MAX_BYTES) throw new Definitivo('pesa más de 25 MB');
  const trozos = [];
  let total = 0;
  for await (const trozo of res.body) {
    total += trozo.length;
    if (total > MAX_BYTES) throw new Definitivo('pesa más de 25 MB');
    trozos.push(trozo);
  }
  return Buffer.concat(trozos);
}

/** Descarga con 3 intentos (solo https, hasta 25 MB). Si al final falla, lanza: el build se para y la web sigue como estaba. */
async function descargar(url, que) {
  let protocolo = '';
  try { protocolo = new URL(url).protocol; } catch {}
  if (protocolo !== 'https:') throw new NotionError(`Start Skills: ${que} no es un enlace https; súbela a Notion como imagen.`);
  for (let intento = 1; ; intento++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new Definitivo(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await leerConTope(res);
    } catch (e) {
      if (e instanceof Definitivo || intento >= 3)
        throw new NotionError(`Start Skills: no se pudo descargar ${que} (${e.message}). Revisa la imagen en Notion y vuelve a lanzar la actualización.`);
      await esperar(1000 * intento);
    }
  }
}

/** Ejecuta fn sobre items con concurrencia limitada, conservando el orden. */
async function conLimite(items, limite, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limite, items.length) }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n], n);
      }
    }),
  );
  return out;
}

/** Descarga y prepara una foto (original, miniatura de 800 y de 400). null si no se puede leer. */
async function procesarFoto(url, posicion, bloque) {
  const buf = await descargar(url, `la imagen ${posicion} de "${bloque}"`);
  try {
    // flatten: los PNG con transparencia salen sobre blanco, no sobre negro.
    const original = await lector(buf).rotate().flatten({ background: '#ffffff' }).resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const thumb = await sharp(original.data).resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
    const small = await sharp(original.data).resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
    return { original, thumb, small };
  } catch (e) {
    console.warn(`Start Skills: la imagen ${posicion} de "${bloque}" no se puede usar y se omite. Si es una foto HEIC de iPhone, súbela a Notion como JPG. (${e.message})`);
    return null;
  }
}

const usados = new Set();
const recortes = new Map(); // url+lado -> promesa del JPG, para no repetir la misma persona en cada bloque
/** Foto de persona recortada en cuadrado (lado px), o null si falla. 160 para avatares, 480 para formadores. */
async function fotoPersona(url, dir, publico, nombre, lado = 160) {
  if (!url) return null;
  const raizNombre = slugify(nombre) || 'persona';
  let base = raizNombre;
  for (let n = 2; usados.has(`${dir}/${base}`); n++) base = `${raizNombre}-${n}`;
  usados.add(`${dir}/${base}`);
  const clave = `${lado}|${url}`;
  if (!recortes.has(clave))
    recortes.set(clave, descargar(url, `la foto de ${nombre}`).then((buf) =>
      lector(buf).rotate().flatten({ background: '#ffffff' }).resize(lado, lado, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()));
  try {
    const out = await recortes.get(clave);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${base}.jpg`), out);
    return `${publico}/${base}.jpg`;
  } catch (e) {
    console.warn(`Start Skills: la foto de ${nombre} no se puede usar y se omite. Si es HEIC de iPhone, súbela como JPG. (${e.message})`);
    return null;
  }
}

/** Id de la base a la que apunta la relación "Participantes" (o la única relación) de Bloques. */
async function baseRelacionada(dbId) {
  const db = await notion(`/databases/${dbId}`, { que: 'NOTION_STARTSKILLS_DATABASE_ID' });
  const rels = Object.entries(db.properties ?? {}).filter(([, p]) => p.type === 'relation' && p.relation?.database_id);
  const rel = rels.find(([nombre]) => normalize(nombre).includes('participante')) ?? (rels.length === 1 ? rels[0] : undefined);
  return rel?.[1].relation.database_id;
}

async function main() {
  const paginas = await queryDb(bloquesDb, 'NOTION_STARTSKILLS_DATABASE_ID');
  const slugs = new Set();
  const bloques = [];
  for (const page of paginas) {
    const datos = mapBloque(page);
    const nombre = titleOf(page.properties ?? {}) || '(sin título)';
    if (!datos) {
      if (titleOf(page.properties ?? {})) console.warn(`Start Skills: se omite «${nombre}» (está marcado como oculto o su título no empieza por «Bloque N:»)`);
      continue;
    }
    if (!datos.fecha) {
      console.warn(`Start Skills: se omite «${nombre}»: no tiene fecha, así que no se publica`);
      continue;
    }
    // URL única y nunca vacía (dos bloques con el mismo título no se pisan las fotos).
    let slug = datos.slug || `bloque-${datos.numero}`;
    for (let n = 2; slugs.has(slug); n++) slug = `${datos.slug || `bloque-${datos.numero}`}-${n}`;
    slugs.add(slug);
    bloques.push({ page, datos: { ...datos, slug } });
  }

  // (a) base de participantes aparte, agrupada por la relación a bloques. Sin la
  // variable, se saca de la relación "Participantes" de la base de Bloques.
  if (!participantesDb) {
    participantesDb = await baseRelacionada(bloquesDb);
    if (participantesDb) console.log('Start Skills: participantes desde la base relacionada con Bloques');
  }
  const porBloque = new Map();
  if (participantesDb) {
    for (const fila of await queryDb(participantesDb, 'NOTION_STARTSKILLS_PARTICIPANTES_DATABASE_ID')) {
      const p = mapPersona(fila);
      if (!p) continue;
      for (const id of p.bloqueIds) (porBloque.get(id.replace(/-/g, '')) ?? porBloque.set(id.replace(/-/g, ''), []).get(id.replace(/-/g, ''))).push(p);
    }
  }

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  const resultado = [];

  for (const { page, datos } of bloques) {
    const slug = datos.slug;
    const dir = join(tmpDir, slug);
    const publico = `/startskills/${slug}`;
    await mkdir(dir, { recursive: true });

    const { urls, bases } = await imagenesDePagina(page.id);

    // (b) bases inline "Participantes" dentro de la página del bloque
    let personas = porBloque.get(page.id.replace(/-/g, '')) ?? [];
    if (!participantesDb) {
      for (const db of bases) {
        try {
          personas = personas.concat((await queryDb(db)).map(mapPersona).filter(Boolean));
        } catch (e) {
          console.warn(`Start Skills: no se pudo leer la lista de participantes de «${datos.titulo}»: ${e.message}`);
        }
      }
    }

    const leidas = (await conLimite(urls, 4, (u, i) => procesarFoto(u, i + 1, datos.titulo))).filter(Boolean);
    // Numeración seguida (01, 02…) solo con las fotos válidas: el número de la web y el del fichero coinciden.
    const procesadas = [];
    for (const [i, f] of leidas.entries()) {
      const nn = String(i + 1).padStart(2, '0');
      await writeFile(join(dir, `${nn}.jpg`), f.original.data);
      await writeFile(join(dir, `${nn}-thumb.jpg`), f.thumb);
      await writeFile(join(dir, `${nn}-sm.jpg`), f.small);
      procesadas.push({
        foto: { src: `${publico}/${nn}.jpg`, thumb: `${publico}/${nn}-thumb.jpg`, small: `${publico}/${nn}-sm.jpg`, ancho: f.original.info.width, alto: f.original.info.height },
        nombre: `${nn}.jpg`,
        data: f.original.data,
      });
    }
    let zip = null;
    if (procesadas.length) {
      const files = Object.fromEntries(procesadas.map((f) => [f.nombre, new Uint8Array(f.data)]));
      const bytes = zipSync(files, { level: 0 });
      const nombreZip = `start-skills-${slug}.zip`;
      await writeFile(join(dir, nombreZip), bytes);
      zip = { src: `${publico}/${nombreZip}`, bytes: bytes.length };
    }

    const personasDir = join(dir, 'personas');
    const participantes = await conLimite(ordenarPersonas(personas), 4, async (p) => ({
      nombre: p.nombre,
      asociacion: p.asociacion,
      linkedin: p.linkedin,
      foto: await fotoPersona(p.fotoUrl, personasDir, `${publico}/personas`, p.nombre),
    }));

    let formador = null;
    if (datos.formador) {
      const { fotoUrl, ...f } = datos.formador;
      formador = { ...f, foto: await fotoPersona(fotoUrl, personasDir, `${publico}/personas`, f.nombre, 480) };
    }

    const { formador: _f, ...resto } = datos;
    resultado.push({ ...resto, formador, participantes, fotos: procesadas.map((f) => f.foto), zip });
    console.log(`Start Skills: bloque ${datos.numero} «${datos.titulo}»: ${participantes.length} ${participantes.length === 1 ? 'participante' : 'participantes'}, ${procesadas.length} ${procesadas.length === 1 ? 'foto' : 'fotos'}`);
  }

  if (resultado.length === 0)
    throw new NotionError('Start Skills: Notion no devolvió ningún bloque publicable (revisa títulos "Bloque N: …", fechas y la casilla Oculto). No se cambia nada.');
  resultado.sort((a, b) => a.numero - b.numero);
  await cambiarCarpetas();
  await mkdir(dirname(generado), { recursive: true });
  await writeFile(generado, JSON.stringify({ fuente: 'notion', actualizado: new Date().toISOString(), bloques: resultado }, null, 2) + '\n');
  console.log(`Start Skills: ${resultado.length} bloques sincronizados desde Notion`);
}

/**
 * Pone las fotos nuevas en public/startskills sin perder las anteriores si algo falla:
 * la vieja se aparta, entra la nueva y solo entonces se borra la vieja. Si renombrar no se
 * puede (Windows con `npm run dev` vigilando public/), se copia encima.
 */
async function cambiarCarpetas() {
  const vieja = `${publicDir}.old`;
  await rm(vieja, { recursive: true, force: true });
  try {
    await rename(publicDir, vieja).catch((e) => { if (e.code !== 'ENOENT') throw e; });
    await rename(tmpDir, publicDir);
  } catch (e) {
    // Lo anterior vuelve a su sitio (si se llegó a apartar).
    await rename(vieja, publicDir).catch(() => {});
    if (e.code !== 'EPERM' && e.code !== 'EBUSY') throw e;
    await cp(tmpDir, publicDir, { recursive: true, force: true });
    await rm(tmpDir, { recursive: true, force: true });
  }
  await rm(vieja, { recursive: true, force: true });
}

main().catch(async (e) => {
  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  console.error(e instanceof NotionError ? e.message : `Start Skills: la actualización desde Notion ha fallado. Pasa este mensaje a IT:\n${e.stack ?? e}`);
  process.exitCode = 1;
});
