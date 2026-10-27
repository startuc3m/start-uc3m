// Listas del avatar del Start Camp 2026. Las ids son las que viajan al back:
// si cambian aquí, tienen que cambiar también allí.

export const ESTADOS_GRUPO = [
  { id: 'busco', label: 'Busco grupo', ayuda: 'Vengo solo o sola y quiero encontrar equipo.' },
  { id: 'tengo', label: 'Tengo grupo', ayuda: 'Ya tengo equipo cerrado.' },
  { id: 'abierto', label: 'Abierto a sumar gente', ayuda: 'Tengo equipo, pero cabe alguien más.' },
];

export const ROLES = [
  { id: 'negocio', label: 'Negocio' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'diseno', label: 'Diseño' },
  { id: 'otro', label: 'Otro' },
];

// PENDIENTE: cerrar con organización StartCamp
export const INTERESES = [
  { id: 'ia', label: 'IA' },
  { id: 'sostenibilidad', label: 'Sostenibilidad' },
  { id: 'salud', label: 'Salud' },
  { id: 'educacion', label: 'Educación' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'impacto-social', label: 'Impacto social' },
  { id: 'movilidad', label: 'Movilidad' },
  { id: 'ocio', label: 'Ocio y cultura' },
  { id: 'deporte', label: 'Deporte' },
  { id: 'hardware', label: 'Hardware' },
];

export const MAX_INTERESES = 3;
export const MAX_DESCRIPCION = 280;

// Versión del texto de consentimiento que acepta la persona. Si cambia el
// texto de la casilla, sube la versión.
export const CONSENTIMIENTO_VERSION = 'startcamp-2026-v1';

/** Con estos estados tiene sentido pedir el nombre del grupo. */
export function tieneGrupo(estado) {
  return estado === 'tengo' || estado === 'abierto';
}

const porId = (lista) => Object.fromEntries(lista.map((o) => [o.id, o.label]));
export const ETIQUETA_ESTADO = porId(ESTADOS_GRUPO);
export const ETIQUETA_ROL = porId(ROLES);
export const ETIQUETA_INTERES = porId(INTERESES);
