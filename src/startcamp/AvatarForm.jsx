import React, { useCallback, useEffect, useRef, useState } from 'react';
import AvatarCard from './AvatarCard.jsx';
import {
  ENLACE_NO_VALIDO,
  guardarPerfil,
  leerToken,
  obtenerPerfil,
  olvidarToken,
} from './api.js';
import {
  ESTADOS_GRUPO,
  INTERESES,
  MAX_DESCRIPCION,
  MAX_INTERESES,
  ROLES,
  tieneGrupo,
} from './opciones.js';
import {
  MAX_NOMBRE,
  MAX_NOMBRE_GRUPO,
  MENSAJE_LINKEDIN,
  aPayload,
  extraerUsuarioLinkedin,
  validar,
  valoresIniciales,
} from './schema.js';

export const MENSAJE_RED = 'No se ha podido guardar. Revisa tu conexión e inténtalo otra vez.';
const MENSAJE_CARGA = 'No hemos podido cargar tu avatar. Revisa tu conexión e inténtalo otra vez.';

// Orden de los campos: el foco va al primero con error.
const CAMPOS = ['nombre', 'estado_grupo', 'rol', 'intereses', 'linkedin', 'descripcion', 'nombre_grupo', 'consentimiento'];

// Una URL de LinkedIn completa (con algo detrás del usuario) se recorta al vuelo.
const URL_COMPLETA_RE = /linkedin\.com\/in\/[^/?#\s]+[/?#]/i;

function irAEnlaceNoValido() {
  window.location.replace(ENLACE_NO_VALIDO);
}

const inputCls =
  'w-full rounded-brand border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-cobalt focus:ring-2 focus:ring-cobalt/25 aria-[invalid=true]:border-red-600';
const labelCls = 'mono mb-2 block text-ink/70';
const opcionalCls = 'normal-case tracking-normal text-ink/50';

function ErrorCampo({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 text-sm font-semibold text-red-700">
      {children}
    </p>
  );
}

/** Tarjeta grande que es un radio de verdad (teclado: Tab y flechas). */
function OpcionRadio({ name, opcion, checked, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col gap-1 rounded-brand border-2 border-line bg-white p-4 transition-colors hover:border-cobalt has-[:checked]:border-cobalt has-[:checked]:bg-cobalt has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cobalt">
      <input
        type="radio"
        className="sr-only"
        id={`av-${name}-${opcion.id}`}
        name={name}
        value={opcion.id}
        checked={checked}
        onChange={() => onChange(opcion.id)}
      />
      <span className="text-lg font-semibold leading-tight">{opcion.label}</span>
      {opcion.ayuda && <span className="text-sm leading-snug opacity-80">{opcion.ayuda}</span>}
    </label>
  );
}

/**
 * Formulario del avatar del Start Camp (crear y editar). Se entra con el
 * enlace personal /eventos/start-camp/avatar?t=<token>.
 */
export default function AvatarForm({ onEnlaceInvalido = irAEnlaceNoValido }) {
  const [token] = useState(leerToken);

  const [carga, setCarga] = useState('cargando'); // cargando | error | lista
  const [valores, setValores] = useState(() => valoresIniciales());
  const [teniaPerfil, setTeniaPerfil] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const enviando = useRef(false);

  const enlaceInvalido = useCallback(() => {
    olvidarToken();
    onEnlaceInvalido();
  }, [onEnlaceInvalido]);

  const cargar = useCallback(async () => {
    if (!token) {
      enlaceInvalido();
      return;
    }
    setCarga('cargando');
    try {
      const data = await obtenerPerfil(token);
      setValores(valoresIniciales(data.nombre, data.perfil));
      setTeniaPerfil(Boolean(data.perfil));
      setCarga('lista');
    } catch (err) {
      if (err.codigo === 'INVALID_TOKEN') enlaceInvalido();
      else setCarga('error');
    }
  }, [token, enlaceInvalido]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
    setGuardado(false);
    setErrorEnvio(null);
  }

  function alternarInteres(id) {
    const actuales = valores.intereses;
    if (actuales.includes(id)) cambiar('intereses', actuales.filter((i) => i !== id));
    else if (actuales.length < MAX_INTERESES) cambiar('intereses', [...actuales, id]);
  }

  function cambiarLinkedin(texto) {
    cambiar('linkedin', URL_COMPLETA_RE.test(texto) ? extraerUsuarioLinkedin(texto) : texto);
  }

  function salirLinkedin() {
    const usuario = extraerUsuarioLinkedin(valores.linkedin);
    if (usuario !== valores.linkedin) setValores((v) => ({ ...v, linkedin: usuario }));
    const { errores: e } = validar({ ...valores, linkedin: usuario });
    setErrores((prev) => ({ ...prev, linkedin: e.linkedin }));
  }

  function enfocar(campo) {
    let el = document.getElementById(`av-${campo}`);
    if (campo === 'estado_grupo' || campo === 'rol') {
      el =
        document.querySelector(`input[name="${campo}"]:checked`) ||
        document.querySelector(`input[name="${campo}"]`);
    }
    if (campo === 'intereses') el = document.querySelector('input[name="intereses"]');
    el?.focus();
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando.current) return;

    const res = validar(valores);
    if (!res.ok) {
      setErrores(res.errores);
      enfocar(CAMPOS.find((c) => res.errores[c]));
      return;
    }

    enviando.current = true;
    setGuardando(true);
    setGuardado(false);
    setErrorEnvio(null);
    try {
      const body = aPayload(valores);
      await guardarPerfil(token, body);
      setValores((v) => ({ ...v, linkedin: body.linkedin ?? '' }));
      setTeniaPerfil(true);
      setGuardado(true);
    } catch (err) {
      const codigo = err?.codigo ?? 'RED';
      if (codigo === 'INVALID_TOKEN') {
        enlaceInvalido();
      } else if (codigo.startsWith('INVALID_')) {
        let campo = codigo.slice('INVALID_'.length).toLowerCase();
        if (campo === 'consentimiento_version') campo = 'consentimiento';
        if (CAMPOS.includes(campo)) {
          setErrores({ [campo]: campo === 'linkedin' ? MENSAJE_LINKEDIN : 'Revisa este campo.' });
          enfocar(campo);
        }
        setErrorEnvio('Hay algo que revisar en el formulario.');
      } else {
        setErrorEnvio(MENSAJE_RED);
      }
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }

  if (carga === 'cargando') {
    return (
      <p className="py-16 text-center text-lg text-ink/70" role="status">
        Cargando tu avatar…
      </p>
    );
  }

  if (carga === 'error') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg" role="alert">
          {MENSAJE_CARGA}
        </p>
        <button type="button" className="btn btn-primary mt-6" onClick={cargar}>
          Reintentar
        </button>
      </div>
    );
  }

  const conGrupo = tieneGrupo(valores.estado_grupo);
  const llenos = valores.intereses.length >= MAX_INTERESES;
  const err = (campo) => (errores[campo] ? `av-${campo}-error` : undefined);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <form onSubmit={enviar} noValidate className="flex min-w-0 flex-col gap-8" aria-label="Tu avatar">
        <div>
          <label htmlFor="av-nombre" className={labelCls}>
            Nombre
          </label>
          <input
            id="av-nombre"
            className={inputCls}
            type="text"
            autoComplete="name"
            maxLength={MAX_NOMBRE}
            value={valores.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={err('nombre')}
          />
          <ErrorCampo id="av-nombre-error">{errores.nombre}</ErrorCampo>
        </div>

        <fieldset aria-describedby={err('estado_grupo')}>
          <legend className={labelCls}>¿Cómo vienes?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {ESTADOS_GRUPO.map((o) => (
              <OpcionRadio
                key={o.id}
                name="estado_grupo"
                opcion={o}
                checked={valores.estado_grupo === o.id}
                onChange={(v) => cambiar('estado_grupo', v)}
              />
            ))}
          </div>
          <ErrorCampo id="av-estado_grupo-error">{errores.estado_grupo}</ErrorCampo>
        </fieldset>

        {conGrupo && (
          <div>
            <label htmlFor="av-nombre_grupo" className={labelCls}>
              Nombre del grupo <span className={opcionalCls}>(opcional)</span>
            </label>
            <input
              id="av-nombre_grupo"
              className={inputCls}
              type="text"
              maxLength={MAX_NOMBRE_GRUPO}
              value={valores.nombre_grupo}
              onChange={(e) => cambiar('nombre_grupo', e.target.value)}
              aria-invalid={Boolean(errores.nombre_grupo)}
              aria-describedby={err('nombre_grupo')}
            />
            <ErrorCampo id="av-nombre_grupo-error">{errores.nombre_grupo}</ErrorCampo>
          </div>
        )}

        <fieldset aria-describedby={err('rol')}>
          <legend className={labelCls}>Tu rol principal</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROLES.map((o) => (
              <OpcionRadio
                key={o.id}
                name="rol"
                opcion={o}
                checked={valores.rol === o.id}
                onChange={(v) => cambiar('rol', v)}
              />
            ))}
          </div>
          <ErrorCampo id="av-rol-error">{errores.rol}</ErrorCampo>
        </fieldset>

        <fieldset aria-describedby={`av-intereses-contador${errores.intereses ? ' av-intereses-error' : ''}`}>
          <legend className={labelCls}>
            Intereses <span className={opcionalCls}>(opcional, hasta {MAX_INTERESES})</span>
          </legend>
          <p id="av-intereses-contador" className="mono -mt-1 mb-3 text-ink/70" aria-live="polite">
            {valores.intereses.length}/{MAX_INTERESES}
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESES.map((o) => {
              const marcado = valores.intereses.includes(o.id);
              return (
                <label
                  key={o.id}
                  className="cursor-pointer rounded-full border-2 border-line bg-white px-4 py-2 font-semibold transition-colors hover:border-cobalt has-[:checked]:border-cobalt has-[:checked]:bg-cobalt has-[:checked]:text-white has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40 has-[:disabled]:hover:border-line has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cobalt"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    name="intereses"
                    value={o.id}
                    checked={marcado}
                    disabled={!marcado && llenos}
                    onChange={() => alternarInteres(o.id)}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
          <ErrorCampo id="av-intereses-error">{errores.intereses}</ErrorCampo>
        </fieldset>

        <div>
          <label htmlFor="av-linkedin" className={labelCls}>
            LinkedIn <span className={opcionalCls}>(opcional)</span>
          </label>
          <div className="flex items-stretch rounded-brand border border-line bg-white transition-colors focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/25 has-[[aria-invalid=true]]:border-red-600">
            <span className="flex select-none items-center pl-4 font-mono text-sm text-ink/50" aria-hidden="true">
              linkedin.com/in/
            </span>
            <input
              id="av-linkedin"
              className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-base text-ink outline-none"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="tu-usuario"
              value={valores.linkedin}
              onChange={(e) => cambiarLinkedin(e.target.value)}
              onBlur={salirLinkedin}
              aria-invalid={Boolean(errores.linkedin)}
              aria-describedby={`av-linkedin-ayuda${errores.linkedin ? ' av-linkedin-error' : ''}`}
            />
          </div>
          <p id="av-linkedin-ayuda" className="mt-2 text-sm text-ink/60">
            Solo tu usuario. Si pegas el enlace entero, nos quedamos con el usuario.
          </p>
          <ErrorCampo id="av-linkedin-error">{errores.linkedin}</ErrorCampo>
        </div>

        <div>
          <label htmlFor="av-descripcion" className={labelCls}>
            Sobre ti <span className={opcionalCls}>(opcional)</span>
          </label>
          <textarea
            id="av-descripcion"
            className={`${inputCls} min-h-28 resize-y`}
            rows={4}
            maxLength={MAX_DESCRIPCION}
            placeholder="Qué estudias, qué se te da bien, qué idea te ronda…"
            value={valores.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            aria-invalid={Boolean(errores.descripcion)}
            aria-describedby={`av-descripcion-contador${errores.descripcion ? ' av-descripcion-error' : ''}`}
          />
          <p id="av-descripcion-contador" className="mono mt-2 text-right text-ink/60">
            {valores.descripcion.length}/{MAX_DESCRIPCION}
          </p>
          <ErrorCampo id="av-descripcion-error">{errores.descripcion}</ErrorCampo>
        </div>

        <div>
          <div className="flex items-start gap-3">
            <input
              id="av-consentimiento"
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-cobalt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              checked={valores.consentimiento}
              onChange={(e) => cambiar('consentimiento', e.target.checked)}
              aria-invalid={Boolean(errores.consentimiento)}
              aria-describedby={err('consentimiento')}
            />
            <label htmlFor="av-consentimiento" className="leading-snug">
              Acepto que mi avatar (nombre, rol, intereses, LinkedIn y descripción) se enseñe al resto de
              asistentes del Start Camp 2026 para formar equipos. Más información en la{' '}
              <a href="/privacidad" target="_blank" rel="noreferrer" className="font-semibold text-cobalt underline underline-offset-2">
                política de privacidad
              </a>
              .
            </label>
          </div>
          <ErrorCampo id="av-consentimiento-error">{errores.consentimiento}</ErrorCampo>
        </div>

        <div className="flex flex-col gap-4">
          <button type="submit" className="btn btn-primary self-start disabled:cursor-wait disabled:opacity-70" disabled={guardando}>
            {guardando ? 'Guardando…' : teniaPerfil ? 'Guardar cambios' : 'Guardar mi avatar'}
          </button>

          {errorEnvio && (
            <p className="rounded-brand border border-red-600 bg-white p-4 font-semibold text-red-700" role="alert">
              {errorEnvio}
            </p>
          )}

          <div role="status">
            {guardado && (
              <p className="rounded-brand bg-lime p-4 font-semibold text-ink">
                Guardado. Tu avatar ya está listo; vuelve a este enlace cuando quieras cambiarlo.
              </p>
            )}
          </div>
        </div>
      </form>

      <aside aria-labelledby="av-vista-previa" className="lg:sticky lg:top-24 lg:self-start">
        <h2 id="av-vista-previa" className="eyebrow mb-4 text-ink/70">
          Así te verán los demás
        </h2>
        <AvatarCard {...valores} linkedin={extraerUsuarioLinkedin(valores.linkedin)} preview />
      </aside>
    </div>
  );
}
