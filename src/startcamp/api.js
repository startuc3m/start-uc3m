// Llamadas al back del avatar del Start Camp (contrato provisional).
//
// Con un token real se llama a API_URL. Con los tokens de demo y fuera de
// producción se usa un mock en memoria: así funciona en local y en cualquier
// preview de Vercel sin configurar nada, y en www.startuc3m.es nunca.
//
//   ?t=demo           perfil vacío para crearlo y luego editarlo
//   ?t=demo-error     perfil relleno; al guardar falla como si no hubiera red
//   ?t=demo-invalido  responde 401 (para ver la página de enlace no válido)

/** Ruta del back. Es lo único que hay que tocar si cambia. */
export const API_URL = '/api/startcamp/perfil';

export const ENLACE_NO_VALIDO = '/eventos/start-camp/enlace-no-valido';

const HOSTS_PRODUCCION = ['www.startuc3m.es', 'startuc3m.es'];
const TOKENS_DEMO = ['demo', 'demo-error', 'demo-invalido'];
const CLAVE_TOKEN = 'startcamp-avatar-token';

/** Error con un código del contrato: INVALID_TOKEN, INVALID_<CAMPO> o RED (red o 5xx). */
export class ApiError extends Error {
  constructor(codigo) {
    super(codigo);
    this.codigo = codigo;
  }
}

export function usaMock(token, host = window.location.hostname) {
  return TOKENS_DEMO.includes(token) && !HOSTS_PRODUCCION.includes(host);
}

// ---------------------------------------------------------------- token

/**
 * Token del enlace personal. Si viene en ?t= se guarda en sessionStorage
 * (sobrevive a recargar y se borra al cerrar la pestaña) y se quita de la
 * barra de direcciones. Si no viene, se usa el guardado.
 */
export function leerToken() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('t');
  if (url.searchParams.has('t')) {
    url.searchParams.delete('t');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
  if (token) {
    try {
      sessionStorage.setItem(CLAVE_TOKEN, token);
    } catch {}
    return token;
  }
  try {
    return sessionStorage.getItem(CLAVE_TOKEN) || '';
  } catch {
    return '';
  }
}

export function olvidarToken() {
  try {
    sessionStorage.removeItem(CLAVE_TOKEN);
  } catch {}
}

// ---------------------------------------------------------------- back real

async function llamar(method, token, body) {
  let res;
  try {
    res = await fetch(API_URL, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('RED');
  }
  if (res.status >= 500) throw new ApiError('RED');
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (res.status === 401) throw new ApiError('INVALID_TOKEN');
  if (!res.ok) throw new ApiError(data?.error || 'RED');
  return data;
}

/** GET → { nombre, perfil | null } */
export function obtenerPerfil(token) {
  return usaMock(token) ? mock.obtener(token) : llamar('GET', token);
}

/** PUT → { ok: true } */
export function guardarPerfil(token, body) {
  return usaMock(token) ? mock.guardar(token, body) : llamar('PUT', token, body);
}

// ---------------------------------------------------------------- mock

export const MOCK_RETARDO_MS = 600;

/** Perfiles de ejemplo (también servirán para maquetar el directorio). */
export const PERFILES_EJEMPLO = [
  {
    nombre: 'Lucía Fernández',
    perfil: {
      estado_grupo: 'abierto',
      rol: 'tecnologia',
      intereses: ['ia', 'salud'],
      linkedin: 'lucia-fernandez',
      descripcion: 'Full-stack en tercero de Informática. Busco a alguien de negocio para validar una idea de salud mental.',
      nombre_grupo: 'Los del fondo',
    },
  },
  {
    nombre: 'Marcos Ruiz',
    perfil: {
      estado_grupo: 'busco',
      rol: 'negocio',
      intereses: ['fintech', 'sostenibilidad', 'impacto-social'],
      linkedin: '',
      descripcion: 'ADE + Derecho. Me encanta montar el pitch y hacer números.',
      nombre_grupo: '',
    },
  },
  {
    nombre: 'Irene Sanz',
    perfil: {
      estado_grupo: 'tengo',
      rol: 'diseno',
      intereses: ['educacion'],
      linkedin: 'irene_sanz',
      descripcion: '',
      nombre_grupo: 'Pixel Club',
    },
  },
];

const copia = (x) => JSON.parse(JSON.stringify(x));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const mockDb = {
  demo: { nombre: 'Alex Demo', perfil: null },
  'demo-error': copia(PERFILES_EJEMPLO[0]),
};

const mock = {
  async obtener(token) {
    await esperar(MOCK_RETARDO_MS);
    if (!mockDb[token]) throw new ApiError('INVALID_TOKEN');
    return copia(mockDb[token]);
  },
  async guardar(token, body) {
    await esperar(MOCK_RETARDO_MS);
    if (token === 'demo-error') throw new ApiError('RED');
    if (!mockDb[token]) throw new ApiError('INVALID_TOKEN');
    const { nombre, consentimiento_version, ...perfil } = body;
    mockDb[token] = {
      nombre,
      perfil: { linkedin: '', descripcion: '', nombre_grupo: '', ...copia(perfil) },
    };
    return { ok: true };
  },
};
