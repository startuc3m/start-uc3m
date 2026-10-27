// Listas del perfil del Start Camp 2026, en un único sitio.
//
// Cada opción tiene:
//   id     interno del front (radios, chips, tests)
//   label  lo que se ve
//   db     texto EXACTO que guarda la base de datos, tildes incluidas. Si no
//          coincide carácter por carácter, la base de datos rechaza el perfil.

export const ESTADOS_GRUPO = [
  { id: 'busco', label: 'Busco grupo', db: 'Busco grupo', ayuda: 'Vengo solo o sola y quiero encontrar equipo.' },
  { id: 'tengo', label: 'Tengo grupo', db: 'Tengo grupo', ayuda: 'Ya tengo equipo cerrado.' },
  { id: 'abierto', label: 'Abierto a sumar gente', db: 'Abierto a sumar gente', ayuda: 'Tengo equipo, pero cabe alguien más.' },
];

// PENDIENTE: roles provisionales (los cuatro del spec).
export const ROLES = [
  { id: 'negocio', label: 'Negocio', db: 'Negocio' },
  { id: 'tecnologia', label: 'Tecnología', db: 'Tecnología' },
  { id: 'diseno', label: 'Diseño', db: 'Diseño' },
  { id: 'otro', label: 'Otro', db: 'Otro' },
];

// PENDIENTE: cerrar con organización StartCamp
export const INTERESES = [
  { id: 'ia', label: 'IA', db: 'IA' },
  { id: 'datos', label: 'Datos', db: 'Datos' },
  { id: 'fintech', label: 'Fintech', db: 'Fintech' },
  { id: 'salud', label: 'Salud', db: 'Salud' },
  { id: 'sostenibilidad', label: 'Sostenibilidad', db: 'Sostenibilidad' },
  { id: 'educacion', label: 'Educación', db: 'Educación' },
  { id: 'impacto-social', label: 'Impacto social', db: 'Impacto social' },
  { id: 'videojuegos', label: 'Videojuegos', db: 'Videojuegos' },
  { id: 'hardware-robotica', label: 'Hardware y robótica', db: 'Hardware y robótica' },
  { id: 'marketing-consumo', label: 'Marketing y consumo', db: 'Marketing y consumo' },
  { id: 'movilidad', label: 'Movilidad', db: 'Movilidad' },
  { id: 'ciberseguridad', label: 'Ciberseguridad', db: 'Ciberseguridad' },
];

export const MAX_INTERESES = 3;
export const MAX_DESCRIPCION = 280;

// Versión del texto de consentimiento. Si cambia el texto, sube la versión.
export const CONSENTIMIENTO_VERSION = 'v1';

// Absoluta: la página de perfil vive en startcamp.startuc3m.es, donde /privacidad no existe.
export const URL_PRIVACIDAD = 'https://www.startuc3m.es/privacidad';

/** Con estos estados tiene sentido pedir el nombre del grupo. */
export function tieneGrupo(estado) {
  return estado === 'tengo' || estado === 'abierto';
}

/** id del front → texto de la base de datos (undefined si no existe). */
export function idATexto(lista, id) {
  return lista.find((o) => o.id === id)?.db;
}

/** Texto de la base de datos → id del front (undefined si no existe). */
export function textoAId(lista, texto) {
  return lista.find((o) => o.db === texto)?.id;
}

/** id → texto visible. */
export function etiqueta(lista, id) {
  return lista.find((o) => o.id === id)?.label;
}
