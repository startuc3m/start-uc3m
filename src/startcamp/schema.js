import { z } from 'zod';
import {
  CONSENTIMIENTO_VERSION,
  ESTADOS_GRUPO,
  INTERESES,
  MAX_DESCRIPCION,
  MAX_INTERESES,
  ROLES,
  tieneGrupo,
} from './opciones.js';

// Mismas reglas que el back (contrato provisional del avatar del Start Camp).
// Las longitudes de nombre y nombre del grupo no venían en el contrato:
// cuadrarlas con el back.
export const MAX_NOMBRE = 100;
export const MAX_NOMBRE_GRUPO = 60;

export const LINKEDIN_RE = /^[A-Za-z0-9_-]{3,100}$/;
export const MENSAJE_LINKEDIN = 'Eso no parece un perfil de LinkedIn';

const URL_LINKEDIN_RE = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*linkedin\.com\/in\/([^/?#\s]*)/i;

/**
 * Deja solo el usuario de LinkedIn. Acepta el usuario suelto o la URL entera
 * (con o sin https, www, es. u otro subdominio, barra final, ?trk=…).
 */
export function extraerUsuarioLinkedin(texto) {
  const valor = String(texto ?? '').trim();
  const url = valor.match(URL_LINKEDIN_RE);
  // Sin usuario detrás de /in/ se devuelve tal cual, para que no pase por vacío.
  if (url) return url[1] || valor;
  // Usuario suelto con restos de la URL detrás (usuario/?trk=…).
  return valor.replace(/[/?#].*$/, '') || valor;
}

export function linkedinUrl(usuario) {
  return `https://www.linkedin.com/in/${usuario}`;
}

const ids = (lista) => lista.map((o) => o.id);

export const perfilSchema = z.object({
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
  linkedin: z.string().refine((v) => v === '' || LINKEDIN_RE.test(v), { error: MENSAJE_LINKEDIN }),
  descripcion: z
    .string()
    .trim()
    .max(MAX_DESCRIPCION, { error: `Máximo ${MAX_DESCRIPCION} caracteres` }),
  nombre_grupo: z
    .string()
    .trim()
    .max(MAX_NOMBRE_GRUPO, { error: `Máximo ${MAX_NOMBRE_GRUPO} caracteres` }),
  consentimiento: z.literal(true, { error: 'Necesitamos tu permiso para enseñar tu avatar' }),
});

/** Valores del formulario vacío (o a partir del perfil que devuelve el back). */
export function valoresIniciales(nombre = '', perfil = null) {
  return {
    nombre: nombre ?? '',
    estado_grupo: perfil?.estado_grupo ?? '',
    rol: perfil?.rol ?? '',
    intereses: perfil?.intereses ?? [],
    linkedin: perfil?.linkedin ?? '',
    descripcion: perfil?.descripcion ?? '',
    nombre_grupo: perfil?.nombre_grupo ?? '',
    consentimiento: false,
  };
}

/** Valida el formulario. Devuelve { ok, errores } con un mensaje por campo. */
export function validar(valores) {
  const res = perfilSchema.safeParse({
    ...valores,
    linkedin: extraerUsuarioLinkedin(valores.linkedin),
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

/**
 * Body del PUT. LinkedIn va solo como usuario. Los opcionales vacíos no se
 * envían, y el nombre del grupo solo si el estado lo admite.
 */
export function aPayload(valores) {
  const body = {
    nombre: valores.nombre.trim(),
    estado_grupo: valores.estado_grupo,
    rol: valores.rol,
    intereses: valores.intereses,
    consentimiento_version: CONSENTIMIENTO_VERSION,
  };
  const linkedin = extraerUsuarioLinkedin(valores.linkedin);
  if (linkedin) body.linkedin = linkedin;
  const descripcion = valores.descripcion.trim();
  if (descripcion) body.descripcion = descripcion;
  const grupo = valores.nombre_grupo.trim();
  if (tieneGrupo(valores.estado_grupo) && grupo) body.nombre_grupo = grupo;
  return body;
}
