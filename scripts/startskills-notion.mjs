// Lógica pura de Start Skills <- Notion: de propiedades de página a campos del
// contrato (src/lib/startskills.ts). Sin red ni disco, para poder testearla.
// Las columnas se emparejan por TIPO + palabras clave del nombre (no por nombre
// exacto), igual que api/_lib/notion.mjs: renombrar una columna no la rompe.

/** Minúsculas, sin tildes y sin puntuación, para comparar nombres de columna. */
export function normalize(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** "Proyéctate" -> "proyectate". */
export function slugify(text) {
  return normalize(text).replace(/ /g, '-');
}

/** "Bloque 3: Gestiona" -> { numero: 3, titulo: 'Gestiona' }. Sin prefijo: numero null. */
export function parseTitulo(raw) {
  const t = String(raw ?? '').trim();
  const m = t.match(/^bloque\s*(\d+)\s*[:\-–—.]?\s*(.*)$/i);
  if (m) return { numero: Number(m[1]), titulo: m[2].trim() };
  return { numero: null, titulo: t };
}

const texto = (arr) => (Array.isArray(arr) ? arr.map((x) => x.plain_text ?? '').join('').trim() : '');

/** ¿El nombre de columna contiene la palabra clave? Las cortas (<4) solo como palabra entera. */
function casa(nombreNorm, clave) {
  const k = normalize(clave);
  if (k.length < 4) return nombreNorm.split(' ').includes(k);
  return nombreNorm.includes(k);
}

/**
 * Primera propiedad del tipo dado cuyo nombre contiene alguna palabra clave y
 * ninguna de `excluye`. `usadas` (Set) evita que dos campos reclamen la misma.
 * Devuelve la propiedad (con .name añadido) o null.
 */
export function pick(props, type, claves, { excluye = [], usadas = new Set() } = {}) {
  for (const [name, prop] of Object.entries(props ?? {})) {
    if (prop?.type !== type || usadas.has(name)) continue;
    const n = normalize(name);
    if (excluye.some((e) => casa(n, e))) continue;
    if (claves.some((c) => casa(n, c))) {
      usadas.add(name);
      return { ...prop, name };
    }
  }
  return null;
}

export function titleOf(props) {
  const p = Object.values(props ?? {}).find((x) => x?.type === 'title');
  return p ? texto(p.title) : '';
}

export function fechaISO(prop) {
  const s = prop?.date?.start;
  return s ? String(s).slice(0, 10) : null;
}

/** URLs de una propiedad files (subidos a Notion o externos). */
export function urlsDeFiles(prop) {
  return (prop?.files ?? []).map((f) => f?.file?.url ?? f?.external?.url).filter(Boolean);
}

/** ¿Hay un checkbox Oculto/Borrador marcado? */
export function estaOculto(props) {
  return Object.entries(props ?? {}).some(
    ([name, p]) => p?.type === 'checkbox' && p.checkbox && /oculto|borrador/.test(normalize(name)),
  );
}

/**
 * Página de la base "Bloques" -> campos del bloque (sin fotos ni participantes).
 * Devuelve null si debe saltarse (sin título, oculto o sin número derivable).
 * formador.fotoUrl es la URL temporal de Notion, que el sync descarga.
 */
export function mapBloque(page) {
  const props = page?.properties ?? {};
  const rawTitle = titleOf(props);
  if (!rawTitle || estaOculto(props)) return null;

  const parsed = parseTitulo(rawTitle);
  const numProp = pick(props, 'number', ['numero', 'n', 'orden']);
  const numero = numProp?.number ?? parsed.numero;
  if (numero == null) return null;
  const titulo = parsed.titulo || rawTitle.trim();

  const usadas = new Set();
  const cargo = pick(props, 'rich_text', ['cargo'], { usadas });
  const nombre = pick(props, 'rich_text', ['ponente', 'formador'], { usadas });
  const hora = pick(props, 'rich_text', ['hora'], { usadas });
  const lugar = pick(props, 'rich_text', ['lugar', 'sitio'], { usadas });
  const tema = pick(props, 'rich_text', ['tema', 'descripcion'], { usadas });
  const fecha = pick(props, 'date', ['fecha', 'dia', 'date']) ?? Object.values(props).find((p) => p?.type === 'date');
  const linkedin = pick(props, 'url', ['linkedin', 'ponente', 'formador']) ?? pick(props, 'url', ['url', 'enlace']);
  const foto = pick(props, 'files', ['foto', 'ponente', 'formador']);

  const nombreFormador = nombre ? texto(nombre.rich_text) : '';
  return {
    slug: slugify(titulo),
    numero,
    titulo,
    tema: tema ? texto(tema.rich_text) : '',
    fecha: fechaISO(fecha) ?? '',
    hora: (hora && texto(hora.rich_text)) || null,
    lugar: (lugar && texto(lugar.rich_text)) || null,
    formador: nombreFormador
      ? {
          nombre: nombreFormador,
          cargo: (cargo && texto(cargo.rich_text)) || null,
          linkedin: urlSegura(linkedin?.url),
          fotoUrl: urlsDeFiles(foto)[0] ?? null,
        }
      : null,
  };
}

/**
 * Fila de "Participantes" -> persona (+ fotoUrl temporal e ids de bloques
 * relacionados). Null si no tiene nombre u oculto.
 */
export function mapPersona(page) {
  const props = page?.properties ?? {};
  const nombre = titleOf(props);
  if (!nombre || estaOculto(props)) return null;
  const claves = ['asociacion', 'club', 'entidad'];
  const asoSel = pick(props, 'select', claves);
  const asoTxt = asoSel ? null : pick(props, 'rich_text', claves);
  const asociacion = asoSel ? asoSel.select?.name : asoTxt ? texto(asoTxt.rich_text) : null;
  const linkedin = pick(props, 'url', ['linkedin']) ?? pick(props, 'url', ['url', 'enlace']);
  const foto = pick(props, 'files', ['foto', 'imagen']);
  const rel = pick(props, 'relation', ['bloque']) ?? Object.values(props).find((p) => p?.type === 'relation');
  return {
    nombre,
    asociacion: asociacion || null,
    linkedin: urlSegura(linkedin?.url),
    fotoUrl: urlsDeFiles(foto)[0] ?? null,
    bloqueIds: (rel?.relation ?? []).map((r) => r.id),
  };
}

export function ordenarPersonas(personas) {
  return [...personas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Solo enlaces http(s). "linkedin.com/in/x" sin esquema se completa con https://.
 * Cualquier otra cosa (javascript:, data:, texto suelto) -> null: no se publica.
 */
export function urlSegura(valor) {
  if (!valor || typeof valor !== 'string') return null;
  let t = valor.trim();
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/|$)/i.test(t)) t = 'https://' + t;
  try {
    const u = new URL(t);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}
