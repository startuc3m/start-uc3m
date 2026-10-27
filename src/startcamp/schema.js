import { z } from 'zod';
import {
  CONSENTIMIENTO_VERSION,
  ESTADOS_GRUPO,
  INTERESES,
  MAX_DESCRIPCION,
  MAX_INTERESES,
  ROLES,
  idATexto,
  textoAId,
  tieneGrupo,
} from './opciones.js';

// Mismas reglas que la base de datos (brief del perfil, §5).
export const MAX_NOMBRE = 80;
// No lo fija la base de datos: cuadrarlo con quien conecte el back.
export const MAX_NOMBRE_GRUPO = 60;
export const MAX_LINKEDIN_URL = 300;

export const LINKEDIN_RE = /^[A-Za-z0-9_-]{3,100}$/;
export const MENSAJE_LINKEDIN = 'Eso no parece un perfil de LinkedIn';

const PREFIJO_LINKEDIN = 'https://www.linkedin.com/in/';
const URL_LINKEDIN_RE = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com\/in\/([^/?#\s]*)/i;

/**
 * URL (o lo que pegue la persona) → usuario de LinkedIn. Acepta el usuario
 * suelto o la URL entera (con o sin https, www, es. u otro subdominio,
 * barra final, ?trk=…).
 */
export function urlAUsuario(texto) {
  const valor = String(texto ?? '').trim();
  const url = valor.match(URL_LINKEDIN_RE);
  // Sin usuario detrás de /in/ se devuelve tal cual, para que no pase por vacío.
  if (url) return url[1] || valor;
  // Usuario suelto con restos de la URL detrás (usuario/?trk=…).
  return valor.replace(/[/?#].*$/, '') || valor;
}
export const extraerUsuarioLinkedin = urlAUsuario;

/** Usuario de LinkedIn → URL que guarda la base de datos (linkedin_url). */
export function usuarioAUrl(usuario) {
  return `${PREFIJO_LINKEDIN}${usuario}`;
}

/** ¿Es una URL de perfil /in/ válida? (para pintarla en la tarjeta). */
export function esUrlLinkedinValida(url) {
  if (typeof url !== 'string' || url.length > MAX_LINKEDIN_URL) return false;
  const m = url.match(URL_LINKEDIN_RE);
  return Boolean(m && LINKEDIN_RE.test(m[1]));
}

const ids = (lista) => lista.map((o) => o.id);

function esquema({ creando }) {
  return z.object({
    nombre: z
      .string()
      .trim()
      .min(1, { error: 'Escribe tu nombre' })
      .max(MAX_NOMBRE, { error: `Máximo ${MAX_NOMBRE} caracteres` }),
    estado_grupo: z.enum(ids(ESTADOS_GRUPO), { error: 'Elige cómo vienes al Camp' }),
    rol: z.enum(ids(ROLES), { error: 'Elige tu rol principal' }),
    intereses: z
      .array(z.enum(ids(INTERESES)))
      .max(MAX_INTERESES, { error: `Elige como mucho ${MAX_INTERESES} intereses` }),
    linkedin: z
      .string()
      .refine((v) => v === '' || (LINKEDIN_RE.test(v) && usuarioAUrl(v).length <= MAX_LINKEDIN_URL), {
        error: MENSAJE_LINKEDIN,
      }),
    descripcion: z
      .string()
      .trim()
      .max(MAX_DESCRIPCION, { error: `Máximo ${MAX_DESCRIPCION} caracteres` }),
    nombre_grupo: z
      .string()
      .trim()
      .max(MAX_NOMBRE_GRUPO, { error: `Máximo ${MAX_NOMBRE_GRUPO} caracteres` }),
    // El consentimiento solo se pide al crear el perfil.
    consentimiento: creando
      ? z.literal(true, { error: 'Necesitamos tu permiso para enseñar tu perfil' })
      : z.boolean(),
  });
}

/**
 * Valores del formulario a partir de lo que devuelve la base de datos:
 * textos → ids, linkedin_url → usuario y el nombre del grupo desde
 * `nombre_grupo` o `groups.nombre`. Sin perfil, todo vacío salvo el nombre.
 */
export function valoresIniciales(nombrePrecargado = '', perfil = null) {
  const intereses = (perfil?.intereses ?? []).map((t) => textoAId(INTERESES, t)).filter(Boolean);
  return {
    nombre: perfil?.nombre ?? nombrePrecargado ?? '',
    estado_grupo: textoAId(ESTADOS_GRUPO, perfil?.estado_grupo) ?? '',
    rol: textoAId(ROLES, perfil?.rol) ?? '',
    intereses,
    linkedin: perfil?.linkedin_url ? urlAUsuario(perfil.linkedin_url) : '',
    descripcion: perfil?.descripcion ?? '',
    nombre_grupo: perfil?.nombre_grupo ?? perfil?.groups?.nombre ?? '',
    consentimiento: false,
  };
}

/** Valida el formulario. Devuelve { ok, errores } con un mensaje por campo. */
export function validar(valores, { creando = false } = {}) {
  const res = esquema({ creando }).safeParse({
    ...valores,
    linkedin: urlAUsuario(valores.linkedin),
    nombre_grupo: tieneGrupo(valores.estado_grupo) ? valores.nombre_grupo : '',
  });
  if (res.success) return { ok: true, errores: {} };
  const errores = {};
  for (const issue of res.error.issues) {
    const campo = issue.path[0];
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return { ok: false, errores };
}

const textoONull = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};

/**
 * Perfil con la forma de la base de datos (brief §5): textos en vez de ids,
 * linkedin_url completa y opcionales vacíos como null. `nombre_grupo` va
 * aparte: quien conecte el back lo convierte en group_id (null con «Busco
 * grupo»). Al crear se añaden consent_at y consent_version.
 */
export function aPayload(valores, { creando = false, ahora = new Date() } = {}) {
  const usuario = urlAUsuario(valores.linkedin);
  const datos = {
    nombre: valores.nombre.trim(),
    estado_grupo: idATexto(ESTADOS_GRUPO, valores.estado_grupo) ?? null,
    rol: idATexto(ROLES, valores.rol) ?? null,
    intereses: valores.intereses.map((id) => idATexto(INTERESES, id)).filter(Boolean),
    linkedin_url: usuario ? usuarioAUrl(usuario) : null,
    descripcion: textoONull(valores.descripcion),
    nombre_grupo: tieneGrupo(valores.estado_grupo) ? textoONull(valores.nombre_grupo) : null,
  };
  if (creando) {
    datos.consent_at = ahora.toISOString();
    datos.consent_version = CONSENTIMIENTO_VERSION;
  }
  return datos;
}
