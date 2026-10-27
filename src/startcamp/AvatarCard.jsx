// Tarjeta de un asistente del Start Camp: vista previa del formulario y ficha
// del directorio. Solo pinta (todo como texto, nunca como HTML).
//
// Props, con la forma de la base de datos (tabla profiles):
//   nombre        string
//   estado_grupo  'Busco grupo' | 'Tengo grupo' | 'Abierto a sumar gente'
//   rol           'Negocio' | 'Tecnología' | 'Diseño' | 'Otro'
//   intereses     string[] con los textos de INTERESES (opciones.js)
//   linkedin_url  'https://www.linkedin.com/in/<usuario>' | null
//   descripcion   string | null
//   nombre_grupo  string | null   (o `groups: { nombre }`, como lo da el select)
//   preview       true en el formulario: rellena huecos con textos de ejemplo
import React from 'react';
import { ESTADOS_GRUPO, textoAId } from './opciones.js';
import { esUrlLinkedinValida, urlAUsuario } from './schema.js';

// Color del distintivo según el estado de grupo (tokens del brand kit).
const COLOR_ESTADO = {
  busco: 'bg-lime text-ink',
  abierto: 'bg-cyan text-ink',
  tengo: 'bg-paper-2 text-ink',
};

export function iniciales(nombre) {
  return (nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function AvatarCard({
  nombre,
  estado_grupo,
  rol,
  intereses = [],
  linkedin_url,
  descripcion,
  nombre_grupo,
  groups,
  preview = false,
}) {
  const nombreVisible = nombre?.trim() || (preview ? 'Tu nombre' : '');
  const estado = textoAId(ESTADOS_GRUPO, estado_grupo);
  const grupo = estado !== 'busco' && (nombre_grupo ?? groups?.nombre)?.trim();
  const texto = descripcion?.trim();
  const linkedin = esUrlLinkedinValida(linkedin_url) ? linkedin_url : null;

  return (
    <article
      className="overflow-hidden rounded-brand border border-line bg-white text-ink shadow-sm"
      aria-label={nombreVisible ? `Perfil de ${nombreVisible}` : 'Perfil'}
    >
      <div className="flex items-center gap-4 bg-cobalt p-5 text-white">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white font-display text-2xl text-cobalt"
          aria-hidden="true"
        >
          {iniciales(nombreVisible) || '?'}
        </div>
        <div className="min-w-0">
          <p className={`display break-words text-[28px] ${nombre?.trim() ? '' : 'opacity-60'}`}>{nombreVisible}</p>
          {(rol || preview) && (
            <p className={`eyebrow mt-1 text-lavender ${rol ? '' : 'opacity-60'}`}>{rol || 'Tu rol'}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {estado ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`mono rounded-full px-3 py-1 text-[11px] ${COLOR_ESTADO[estado]}`}>{estado_grupo}</span>
            {grupo && <span className="text-sm font-semibold">{grupo}</span>}
          </div>
        ) : (
          preview && <p className="mono text-[11px] text-ink/40">¿Buscas grupo?</p>
        )}

        {texto ? (
          <p className="whitespace-pre-line break-words leading-snug">{texto}</p>
        ) : (
          preview && <p className="leading-snug text-ink/40">Cuéntales en una frase qué te mueve.</p>
        )}

        {intereses.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Intereses">
            {intereses.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        )}

        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm font-semibold text-cobalt underline underline-offset-2"
          >
            linkedin.com/in/{urlAUsuario(linkedin)} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
