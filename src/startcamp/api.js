// Datos del perfil del Start Camp.
//
// La interfaz solo usa las funciones de este archivo. Hablan directamente con
// Supabase (supabase-js + clave publishable; la seguridad la pone RLS) con
// las llamadas del brief del perfil, §6. Sin PUBLIC_SUPABASE_URL o
// PUBLIC_SUPABASE_PUBLISHABLE_KEY: obtenerPerfil dice que no hay sesión (se
// ve «Entrar») y el resto falla como error de red.
//
// Modo demo: con ?demo=<variante>, y nunca en los hosts de producción, todo
// funciona contra un mock en memoria. Variantes en VARIANTES_DEMO.

/** Ruta de la página. Hay que registrarla en Supabase como URL de vuelta del enlace. */
export const RUTA_PERFIL = '/eventos/start-camp/avatar';

const HOSTS_PRODUCCION = ['www.startuc3m.es', 'startuc3m.es', 'startcamp.startuc3m.es'];

/**
 * Códigos de error que entiende la interfaz:
 *   SIN_SESION            no hay sesión → pantalla «Entrar»
 *   SESION_CADUCADA       «Tu sesión ha caducado. Pide otro enlace»
 *   CORREO_NO_ENCONTRADO  «No encontramos tu entrada…»
 *   INVALID_<CAMPO>       la base de datos rechaza ese campo
 *   RED                   red o 5xx: «No se ha podido guardar…»
 */
export class ApiError extends Error {
  constructor(codigo) {
    super(codigo);
    this.codigo = codigo;
  }
}

// ---------------------------------------------------------------- modo demo

export const VARIANTES_DEMO = [
  { id: '1', label: 'Entrar' },
  { id: 'correo-no-encontrado', label: 'Correo no encontrado' },
  { id: 'enlace-caducado', label: 'Enlace caducado' },
  { id: 'sin-perfil', label: 'Sin perfil' },
  { id: 'con-perfil', label: 'Con perfil y grupo' },
  { id: 'error-red', label: 'Error de red' },
  { id: 'sesion-caducada', label: 'Sesión caducada' },
];

/** Variante del mock activa, o null si no hay modo demo (o es producción). */
export function varianteDemo(loc = window.location) {
  const valor = new URLSearchParams(loc.search).get('demo');
  if (!valor || HOSTS_PRODUCCION.includes(loc.hostname)) return null;
  return VARIANTES_DEMO.some((v) => v.id === valor) ? valor : '1';
}

export function usaMock(loc = window.location) {
  return varianteDemo(loc) !== null;
}

// ---------------------------------------------------------------- Supabase

/** Columnas del perfil propio. Nunca select('*'): da error de permisos. */
const COLUMNAS_PERFIL = 'nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id, groups(nombre)';

/** Texto de la base de datos para «Busco grupo»: sin grupo, group_id null. */
const BUSCO_GRUPO = 'Busco grupo';

/** Veces que se vuelve a buscar el grupo si otra persona lo crea a la vez (23505). */
const INTENTOS_GRUPO = 3;

let clienteSupabase = null;

/**
 * Cliente de Supabase, o null si faltan las variables de entorno. Se carga
 * al primer uso: el modo demo y la pantalla de carga no lo descargan. Al
 * crearse lee la sesión que trae la URL al volver del enlace del correo.
 */
function supabase() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const clave = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) return Promise.resolve(null);
  clienteSupabase ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(url, clave));
  return clienteSupabase;
}

/** Olvida el cliente de Supabase (tests). */
export function reiniciarClienteSupabase() {
  clienteSupabase = null;
}

async function sesionActual(sb) {
  const { data } = await sb.auth.getSession();
  return data?.session ?? null;
}

/** Ejecuta `fn`; lo que no sea un ApiError (red, excepciones) sale como RED. */
async function llamar(fn) {
  try {
    return await fn();
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError('RED');
  }
}

const normalizarGrupo = (nombre) => String(nombre ?? '').trimEnd().toLowerCase();

/**
 * Nombre del grupo → group_id (brief §6): null con «Busco grupo» (o sin
 * nombre); si no, se busca en groups ignorando mayúsculas y espacios al
 * final; si no está, se inserta con origen 'manual'. Si el insert choca
 * (23505, otra persona lo ha creado a la vez), se vuelve a buscar.
 */
export async function resolverGrupo(sb, estadoGrupo, nombreGrupo) {
  if (estadoGrupo === BUSCO_GRUPO) return null;
  const nombre = String(nombreGrupo ?? '').trimEnd();
  if (!nombre) return null;
  const buscado = normalizarGrupo(nombre);

  for (let intento = 0; intento < INTENTOS_GRUPO; intento++) {
    const { data: grupos, error } = await sb.from('groups').select('id, nombre');
    if (error) throw new ApiError(traducirErrorBD(error));
    const existente = (grupos ?? []).find((g) => normalizarGrupo(g.nombre) === buscado);
    if (existente) return existente.id;

    const { data: nuevo, error: errorAlta } = await sb
      .from('groups')
      .insert({ nombre, origen: 'manual' })
      .select('id')
      .single();
    if (!errorAlta) return nuevo.id;
    if (errorAlta.code !== '23505') throw new ApiError(traducirErrorBD(errorAlta));
  }
  throw new ApiError('RED');
}

// ---------------------------------------------------------------- interfaz

/** Manda el enlace de acceso al correo. */
export async function pedirEnlace(email) {
  if (usaMock()) return mock.pedirEnlace(email);
  return llamar(async () => {
    const sb = await supabase();
    if (!sb) throw new ApiError('RED');
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + RUTA_PERFIL },
    });
    if (error) throw new ApiError(traducirErrorEnlace(error));
    return { ok: true };
  });
}

/**
 * Perfil de la sesión abierta: { nombre, perfil | null }. `nombre` es el
 * precargado (user_metadata.nombre); `perfil` va con la forma de la base de
 * datos y el nombre del grupo en `groups.nombre` (el mock usa `nombre_grupo`).
 * Sin sesión lanza SIN_SESION.
 */
export async function obtenerPerfil() {
  if (usaMock()) return mock.obtenerPerfil();
  return llamar(async () => {
    const sb = await supabase();
    if (!sb) throw new ApiError('SIN_SESION');
    const session = await sesionActual(sb);
    if (!session) throw new ApiError('SIN_SESION');
    const { data: perfil, error } = await sb
      .from('profiles')
      .select(COLUMNAS_PERFIL)
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) throw new ApiError(traducirErrorBD(error));
    return { nombre: session.user.user_metadata?.nombre ?? '', perfil: perfil ?? null };
  });
}

/**
 * Guarda el perfil. `datos` sale de aPayload (schema.js). Con `crear`,
 * insert con consent_at y consent_version; si no, update sin consent_* (no
 * upsert: falla). Ninguno pide columnas de vuelta.
 */
export async function guardarPerfil(datos, { crear = false } = {}) {
  if (usaMock()) return mock.guardarPerfil(datos, { crear });
  return llamar(async () => {
    const sb = await supabase();
    if (!sb) throw new ApiError('RED');
    const session = await sesionActual(sb);
    if (!session) throw new ApiError('SESION_CADUCADA');

    const group_id = await resolverGrupo(sb, datos.estado_grupo, datos.nombre_grupo);
    const { nombre, estado_grupo, rol, intereses, linkedin_url, descripcion } = datos;
    const campos = { nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id };

    const { error } = crear
      ? await sb.from('profiles').insert({
          user_id: session.user.id,
          ...campos,
          consent_at: datos.consent_at,
          consent_version: datos.consent_version,
        })
      : await sb.from('profiles').update(campos).eq('user_id', session.user.id);
    if (error) throw new ApiError(traducirErrorBD(error));
    return { ok: true };
  });
}

/** Borra el perfil de la sesión abierta. */
export async function borrarPerfil() {
  if (usaMock()) return mock.borrarPerfil();
  return llamar(async () => {
    const sb = await supabase();
    if (!sb) throw new ApiError('RED');
    const session = await sesionActual(sb);
    if (!session) throw new ApiError('SESION_CADUCADA');
    const { error } = await sb.from('profiles').delete().eq('user_id', session.user.id);
    if (error) throw new ApiError(traducirErrorBD(error));
    return { ok: true };
  });
}

/** Cierra la sesión. */
export async function cerrarSesion() {
  if (usaMock()) return mock.cerrarSesion();
  return llamar(async () => {
    const sb = await supabase();
    if (sb) await sb.auth.signOut();
  });
}

/**
 * Si se vuelve de un enlace caducado o ya usado, Supabase añade a la URL
 * `#error=access_denied&error_code=otp_expired…` (o en la query). Devuelve el
 * error_code (o null) y lo quita de la barra de direcciones.
 */
export function leerErrorEnlace(loc = window.location) {
  if (varianteDemo(loc) === 'enlace-caducado') return 'otp_expired';
  const hash = new URLSearchParams(loc.hash.replace(/^#/, ''));
  const query = new URLSearchParams(loc.search);
  const codigo =
    hash.get('error_code') || hash.get('error') || query.get('error_code') || query.get('error');
  if (!codigo) return null;
  for (const p of ['error', 'error_code', 'error_description']) query.delete(p);
  const search = query.toString();
  window.history.replaceState(window.history.state, '', loc.pathname + (search ? `?${search}` : ''));
  return codigo;
}

// ---------------------------------------------------------------- errores de Supabase

/**
 * Error de la base de datos → código de la interfaz (brief §7). El 23505
 * de groups lo resuelve resolverGrupo antes de llegar aquí.
 *   23514 + profiles_<campo>_check → INVALID_<CAMPO>
 *   42501 (o 401)                  → SESION_CADUCADA
 *   lo demás                       → RED
 */
export function traducirErrorBD(error) {
  if (!error) return null;
  if (error.code === '42501' || error.status === 401) return 'SESION_CADUCADA';
  if (error.code === '23514') {
    const m = `${error.message ?? ''} ${error.details ?? ''}`.match(/profiles_([a-z_]+?)_check/);
    if (!m) return 'INVALID_PERFIL';
    const campo = m[1] === 'linkedin_url' ? 'linkedin' : m[1];
    return `INVALID_${campo.toUpperCase()}`;
  }
  return 'RED';
}

/** Error de signInWithOtp → código de la interfaz. Con shouldCreateUser: false, un correo que no está da «Signups not allowed». */
export function traducirErrorEnlace(error) {
  if (!error) return null;
  const texto = `${error.code ?? ''} ${error.message ?? ''}`;
  if (/otp_disabled|user_not_found|signups not allowed/i.test(texto)) return 'CORREO_NO_ENCONTRADO';
  return 'RED';
}

// ---------------------------------------------------------------- mock

export const MOCK_RETARDO_MS = 600;

/** Perfiles de ejemplo con la forma de la base de datos (también para maquetar el directorio). */
export const PERFILES_EJEMPLO = [
  {
    nombre: 'Lucía Fernández',
    estado_grupo: 'Abierto a sumar gente',
    rol: 'Tecnología',
    intereses: ['IA', 'Salud'],
    linkedin_url: 'https://www.linkedin.com/in/lucia-fernandez',
    descripcion: 'Full-stack en tercero de Informática. Busco a alguien de negocio para validar una idea de salud mental.',
    nombre_grupo: 'Los del fondo',
  },
  {
    nombre: 'Marcos Ruiz',
    estado_grupo: 'Busco grupo',
    rol: 'Negocio',
    intereses: ['Fintech', 'Sostenibilidad', 'Impacto social'],
    linkedin_url: null,
    descripcion: 'ADE + Derecho. Me encanta montar el pitch y hacer números.',
    nombre_grupo: null,
  },
  {
    nombre: 'Irene Sanz',
    estado_grupo: 'Tengo grupo',
    rol: 'Diseño',
    intereses: ['Educación'],
    linkedin_url: 'https://www.linkedin.com/in/irene_sanz',
    descripcion: null,
    nombre_grupo: 'Pixel Club',
  },
];

const copia = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const esperar = () => new Promise((r) => setTimeout(r, MOCK_RETARDO_MS));

const CON_SESION = ['sin-perfil', 'con-perfil', 'error-red', 'sesion-caducada'];
const CON_PERFIL = ['con-perfil', 'error-red', 'sesion-caducada'];

let estadoMock = null;

function estado() {
  const variante = varianteDemo();
  if (!estadoMock || estadoMock.variante !== variante) {
    const conPerfil = CON_PERFIL.includes(variante);
    estadoMock = {
      variante,
      sesion: CON_SESION.includes(variante),
      nombre: conPerfil ? PERFILES_EJEMPLO[0].nombre : 'Alex Demo',
      perfil: conPerfil ? copia(PERFILES_EJEMPLO[0]) : null,
    };
  }
  return estadoMock;
}

/** Vuelve a dejar el mock como al cargar la página (tests). */
export function reiniciarMock() {
  estadoMock = null;
}

const mock = {
  async pedirEnlace() {
    await esperar();
    if (estado().variante === 'correo-no-encontrado') throw new ApiError('CORREO_NO_ENCONTRADO');
    return { ok: true };
  },
  async obtenerPerfil() {
    await esperar();
    const e = estado();
    if (!e.sesion) throw new ApiError('SIN_SESION');
    return { nombre: e.nombre, perfil: copia(e.perfil) };
  },
  async guardarPerfil(datos) {
    await esperar();
    const e = estado();
    if (!e.sesion) throw new ApiError('SESION_CADUCADA');
    if (e.variante === 'error-red') throw new ApiError('RED');
    if (e.variante === 'sesion-caducada') {
      e.sesion = false;
      throw new ApiError('SESION_CADUCADA');
    }
    const { consent_at, consent_version, ...perfil } = datos;
    e.perfil = copia(perfil);
    return { ok: true };
  },
  async borrarPerfil() {
    await esperar();
    const e = estado();
    if (!e.sesion) throw new ApiError('SESION_CADUCADA');
    if (e.variante === 'error-red') throw new ApiError('RED');
    e.perfil = null;
    return { ok: true };
  },
  async cerrarSesion() {
    await esperar();
    estado().sesion = false;
  },
};
