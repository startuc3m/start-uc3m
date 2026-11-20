// Start Skills: programa de liderazgo (5 bloques). Los datos de cada bloque
// vienen de Notion en el build (scripts/sync-startskills.mjs escribe
// src/data/startskills.generated.json y baja las fotos a public/startskills/).
// Sin credenciales de Notion se usa la semilla versionada, src/data/startskills.seed.json.
// Ver docs/12-start-skills.md.

export type Persona = {
  nombre: string;
  asociacion: string | null;
  linkedin: string | null;
  /** Ruta pública (/startskills/...) o null: se muestran las iniciales. */
  foto: string | null;
};

export type Formador = {
  nombre: string;
  cargo: string | null;
  linkedin: string | null;
  foto: string | null;
};

export type Foto = {
  /** Alta resolución (JPG de hasta 2400 px), para descargar. */
  src: string;
  /** Versión reducida para la cuadrícula (800 px). */
  thumb: string;
  /** Versión de 400 px para móvil. */
  small?: string;
  ancho: number;
  alto: number;
};

export type Bloque = {
  /** URL: /eventos/start-skills/<slug> */
  slug: string;
  numero: number;
  titulo: string;
  /** Texto del tema; puede estar vacío hasta que RRHH lo escriba. */
  tema: string;
  /** YYYY-MM-DD */
  fecha: string;
  hora: string | null;
  lugar: string | null;
  formador: Formador | null;
  participantes: Persona[];
  fotos: Foto[];
  /** Todas las fotos del bloque en un .zip, o null si no hay fotos. */
  zip: { src: string; bytes: number } | null;
};

export type StartSkillsData = {
  fuente: 'notion' | 'seed';
  /** ISO de cuándo se generó. */
  actualizado: string;
  bloques: Bloque[];
};

export type EstadoBloque = 'celebrado' | 'proximo' | 'por-llegar';

// Textos fijos del programa: cambian una vez por curso, van en código.
export const programa = {
  titulo: 'Start Skills',
  curso: '2026/27',
  intro:
    'Cinco sábados para trabajar lo que no se aprende en clase: conocerte, conectar con gente, gestionar tu tiempo, liderar un equipo y saber hacia dónde vas.',
  // Las fijas; las que vengan en los participantes de Notion se suman solas.
  asociaciones: ['Start UC3M', 'Start Comillas', 'BIC', 'Business Club Zaragoza'],
};

const generated = import.meta.glob<StartSkillsData>('../data/startskills.generated.json', { eager: true, import: 'default' });
const seed = import.meta.glob<StartSkillsData>('../data/startskills.seed.json', { eager: true, import: 'default' });

// Segunda barrera (la primera está en el sync): aunque alguien edite el JSON a mano,
// a la página solo llegan enlaces http(s) y ficheros propios de /startskills/.
const web = (u: string | null | undefined) => (u && /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : null);
const propio = (u: string | null | undefined) => (u && /^\/startskills\/[\w./-]+$/.test(u) && !u.includes('..') ? u : null);

function limpiar(b: Bloque): Bloque {
  return {
    ...b,
    formador: b.formador && { ...b.formador, linkedin: web(b.formador.linkedin), foto: propio(b.formador.foto) },
    participantes: b.participantes.map((p) => ({ ...p, linkedin: web(p.linkedin), foto: propio(p.foto) })),
    fotos: b.fotos.filter((f) => propio(f.src) && propio(f.thumb)).map((f) => ({ ...f, small: propio(f.small) ?? undefined })),
    zip: b.zip && propio(b.zip.src) ? b.zip : null,
  };
}

export function getStartSkills(): StartSkillsData {
  const data = Object.values(generated)[0] ?? Object.values(seed)[0];
  if (!data) throw new Error('Faltan los datos de Start Skills (src/data/startskills.seed.json)');
  return { ...data, bloques: data.bloques.map(limpiar).sort((a, b) => a.numero - b.numero) };
}

/** Celebrado si la fecha ya pasó; el primero que no ha pasado es el próximo. */
/**
 * Estado de cada bloque según el día en Madrid (no en UTC: un build de madrugada no se adelanta).
 * El día de la sesión el bloque sigue como "próximo"; pasa a "celebrado" al día siguiente.
 */
export function estados(bloques: Bloque[], hoy = new Date()): Map<string, EstadoBloque> {
  const dia = hoy.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }); // YYYY-MM-DD
  const proximo = bloques.find((b) => b.fecha >= dia);
  return new Map(bloques.map((b) => [b.slug, b.fecha < dia ? 'celebrado' : b === proximo ? 'proximo' : 'por-llegar']));
}

export function fechaLarga(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function fechaCorta(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

export function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter((w) => /^\p{Lu}/u.test(w)).slice(0, 2).map((w) => w[0]).join('') || nombre[0];
}

// Como en las tarjetas (es-ES abrevia septiembre como «sept»). Se muestran en mayúsculas por la tipografía.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

/** "Oct–Abr" a partir de la primera y la última fecha. */
export function rangoMeses(bloques: Bloque[]): string {
  if (!bloques.length) return '';
  const mes = (f: string) => MESES[Number(f.slice(5, 7)) - 1];
  const a = mes(bloques[0].fecha), b = mes(bloques[bloques.length - 1].fecha);
  return a === b ? a : `${a}–${b}`;
}

export function megas(bytes: number): string {
  // MB decimales, como los muestra el sistema: "1,4 MB"; con una cifra decimal por debajo de 10.
  const mb = bytes / 1e6;
  return `${mb < 10 ? Math.max(0.1, mb).toFixed(1).replace(".", ",") : Math.round(mb)}\u00a0MB`;
}

/** Asociaciones fijas más las que aparezcan entre los participantes de cualquier bloque. */
export function asociacionesDelPrograma(bloques: Bloque[]): string[] {
  const deDatos = bloques.flatMap((b) => b.participantes.map((p) => p.asociacion)).filter((a): a is string => !!a);
  return [...new Set([...programa.asociaciones, ...deDatos])];
}

/** Intro del programa con el número de asociaciones al día. */
export function introPrograma(bloques: Bloque[]): string {
  return `${programa.intro} Con formadores profesionales y estudiantes de ${asociacionesDelPrograma(bloques).length} asociaciones.`;
}
