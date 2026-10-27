import React from 'react';
import { ETIQUETA_ESTADO, ETIQUETA_INTERES, ETIQUETA_ROL, tieneGrupo } from './opciones.js';
import { LINKEDIN_RE, linkedinUrl } from './schema.js';

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

/**
 * Tarjeta de un asistente del Start Camp: la vista previa del formulario y,
 * más adelante, cada ficha del directorio. Solo pinta: no tiene estado.
 *
 * `preview` rellena los huecos vacíos con textos de ejemplo.
 */
export default function AvatarCard({
  nombre,
  estado_grupo,
  rol,
  intereses = [],
  linkedin,
  descripcion,
  nombre_grupo,
  preview = false,
}) {
  const nombreVisible = nombre?.trim() || (preview ? 'Tu nombre' : '');
  const linkedinValido = linkedin && LINKEDIN_RE.test(linkedin);
  const grupo = tieneGrupo(estado_grupo) && nombre_grupo?.trim();
  const texto = descripcion?.trim();

  return (
    <article
      className="overflow-hidden rounded-brand border border-line bg-white text-ink shadow-sm"
      aria-label={nombreVisible ? `Avatar de ${nombreVisible}` : 'Avatar'}
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
            <p className={`eyebrow mt-1 text-lavender ${rol ? '' : 'opacity-60'}`}>
              {rol ? ETIQUETA_ROL[rol] : 'Tu rol'}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {estado_grupo ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`mono rounded-full px-3 py-1 text-[11px] ${COLOR_ESTADO[estado_grupo]}`}>
              {ETIQUETA_ESTADO[estado_grupo]}
            </span>
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
            {intereses.map((id) => (
              <li key={id} className="rounded-full border border-line px-3 py-1 text-sm">
                {ETIQUETA_INTERES[id] ?? id}
              </li>
            ))}
          </ul>
        )}

        {linkedinValido && (
          <a
            href={linkedinUrl(linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm font-semibold text-cobalt underline underline-offset-2"
          >
            linkedin.com/in/{linkedin} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
