import React, { useCallback, useEffect, useRef, useState } from 'react';
import AvatarCard, { iniciales } from './AvatarCard.jsx';
import { lanzarConfeti } from './confeti.js';
import { ErrorFoto, MENSAJES_FOTO, procesarFoto } from './foto.js';
import {
  VARIANTES_DEMO,
  VARIANTE_DEMO_FOTO,
  borrarPerfil,
  cerrarSesion,
  fotosActivas,
  guardarPerfil,
  leerErrorEnlace,
  obtenerPerfil,
  pedirEnlace,
  quitarFoto,
  subirFoto,
  varianteDemo,
} from './api.js';
import {
  EMAIL_CONTACTO,
  ESTADOS_GRUPO,
  INTERESES,
  MAILTO_ENTRADA_NO_ENCONTRADA,
  MAX_DESCRIPCION,
  MAX_INTERESES,
  ROLES,
  TIPOS_FOTO,
  URL_PRIVACIDAD,
  tieneGrupo,
} from './opciones.js';
import {
  MAX_NOMBRE,
  MAX_NOMBRE_GRUPO,
  MENSAJE_LINKEDIN,
  aPayload,
  urlAUsuario,
  validar,
  valoresIniciales,
} from './schema.js';

export const MENSAJES = {
  red: 'No se ha podido guardar. Revisa tu conexión e inténtalo otra vez.',
  carga: 'No hemos podido cargar tu perfil. Revisa tu conexión e inténtalo otra vez.',
  sesionCaducada: 'Tu sesión ha caducado. Pide otro enlace',
  enlaceEnviado:
    'Revisa tu correo (te llega en unos minutos). El enlace caduca en 1 hora; si no lo ves, mira en spam o correo no deseado.',
  guardado: 'Guardado. Puedes volver cuando quieras; te pediremos tu correo.',
  borrado: 'Tu perfil se ha borrado. Ya no apareces en el directorio.',
  confirmarBorrado: 'Se borrará tu perfil y dejarás de aparecer en el directorio',
  borrarRed: 'No se ha podido borrar. Revisa tu conexión e inténtalo otra vez.',
  // Solo con las fotos activas.
  foto: 'No se ha podido subir la foto. Prueba con otra imagen.',
  avisoFoto: 'Tu foto solo la verán otros asistentes con sesión iniciada y se borra con tu perfil.',
};

// Lo que enseña el perfil, en el texto del consentimiento.
const DATOS_CONSENTIMIENTO = 'nombre, estado de grupo, rol, intereses, LinkedIn, descripción y nombre del grupo';
const DATOS_CONSENTIMIENTO_FOTOS =
  'nombre, foto (si la subes), estado de grupo, rol, intereses, LinkedIn, descripción y nombre del grupo';

// Foto en el formulario: `url` es lo que se ve (URL firmada o de objeto),
// `nueva` el Blob que falta subir y `guardada` si hay foto en Storage.
const SIN_FOTO = { url: null, nueva: null, guardada: false };

// Orden de los campos: el foco va al primero con error.
const CAMPOS = ['nombre', 'estado_grupo', 'rol', 'intereses', 'linkedin', 'descripcion', 'nombre_grupo', 'consentimiento'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  'w-full rounded-brand border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-cobalt focus:ring-2 focus:ring-cobalt/25 aria-[invalid=true]:border-red-600';
const labelCls = 'mono mb-2 block text-ink/70';
const opcionalCls = 'normal-case tracking-normal text-ink/50';
const focoCls = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt';

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
 * Solo en modo demo: enlaces para saltar entre variantes del mock. Con las
 * fotos activas añade «Con foto» y los enlaces siguen con &fotos=1.
 */
function BarraDemo({ variante, conFotos }) {
  const variantes = conFotos ? [...VARIANTES_DEMO, VARIANTE_DEMO_FOTO] : VARIANTES_DEMO;
  return (
    <nav
      aria-label="Modo demo"
      className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-brand border border-dashed border-cobalt/40 bg-paper-2 px-4 py-3"
    >
      <span className="mono text-cobalt">Modo demo</span>
      {variantes.map((v) => (
        <a
          key={v.id}
          href={`?demo=${v.id}${conFotos && v.id !== VARIANTE_DEMO_FOTO.id ? '&fotos=1' : ''}`}
          aria-current={v.id === variante ? 'page' : undefined}
          className={`text-sm underline-offset-2 hover:underline ${focoCls} ${
            v.id === variante ? 'font-semibold text-cobalt underline' : 'text-ink/70'
          }`}
        >
          {v.label}
        </a>
      ))}
    </nav>
  );
}

/** Por qué puede no aparecer una entrada y qué hacer en cada caso. */
export const CAUSAS_NO_ENCONTRADO = [
  {
    causa: 'Usaste otro correo en NeonPass.',
    solucion: 'Búscalo en el correo de confirmación de tu entrada y prueba con ese.',
  },
  {
    causa: 'Has comprado hace poco.',
    solucion: 'Tu entrada puede tardar hasta un día en aparecer. Cuando esté lista, te llegará un correo para crear tu perfil; no tienes que hacer nada más.',
  },
];

/** El correo no está entre las entradas: causas, soluciones y contacto. */
function PantallaNoEncontrado({ correo, onProbarOtro, tituloRef }) {
  return (
    <section className="mx-auto max-w-lg" aria-labelledby="av-no-encontrado-titulo">
      <h2 id="av-no-encontrado-titulo" ref={tituloRef} tabIndex={-1} className="display text-[40px] outline-none">
        No encontramos tu entrada_
      </h2>
      <p className="mt-4 text-lg leading-snug text-ink/80">
        Hemos buscado <strong className="break-all font-semibold text-ink">{correo}</strong> y no aparece entre las
        entradas del Start Camp. Suele ser por una de estas dos cosas:
      </p>
      <ol className="mt-6 flex flex-col gap-3">
        {CAUSAS_NO_ENCONTRADO.map(({ causa, solucion }, i) => (
          <li key={causa} className="rounded-brand border border-line bg-white p-5">
            <span className="mono text-cobalt" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}_
            </span>
            <p className="mt-2 text-lg font-semibold leading-snug text-ink">{causa}</p>
            <p className="mt-1 leading-snug text-ink/80">{solucion}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 leading-snug text-ink/80">
        ¿Sigue sin funcionar? Escríbenos a <strong className="font-semibold text-ink">{EMAIL_CONTACTO}</strong> con el
        nombre y el correo de tu entrada y lo miramos.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className={`btn btn-primary ${focoCls}`} onClick={onProbarOtro}>
          Probar con otro correo
        </button>
        <a href={MAILTO_ENTRADA_NO_ENCONTRADA} className={`btn btn-outline text-cobalt ${focoCls}`}>
          Escribirnos
        </a>
      </div>
    </section>
  );
}

// HEIC por extensión también: hay navegadores que no le dan tipo.
const ACEPTA_FOTO = [...TIPOS_FOTO, '.heic', '.heif'].join(',');

/** Foto opcional (solo con las fotos activas): subir, cambiar y quitar, con vista previa redonda. */
function CampoFoto({ foto, nombre, procesando, error, onElegir, onQuitar, botonRef }) {
  const campo = useRef(null);
  const [rota, setRota] = useState(null); // URL que no ha cargado: se ven las iniciales
  const url = foto.url && foto.url !== rota ? foto.url : null;
  const describe = `av-foto-ayuda${error ? ' av-foto-error' : ''}`;

  return (
    <div>
      <span id="av-foto-etiqueta" className={labelCls}>
        Foto <span className={opcionalCls}>(opcional)</span>
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-line bg-white font-display text-2xl text-cobalt">
          {url ? (
            <img src={url} alt="Vista previa de tu foto" className="h-full w-full object-cover" onError={() => setRota(url)} />
          ) : (
            <span aria-hidden="true">{iniciales(nombre) || '?'}</span>
          )}
        </div>
        <input
          ref={campo}
          id="av-foto"
          type="file"
          accept={ACEPTA_FOTO}
          className="hidden"
          tabIndex={-1}
          aria-labelledby="av-foto-etiqueta"
          onChange={onElegir}
        />
        <div className="flex flex-wrap gap-3">
          <button
            ref={botonRef}
            type="button"
            className={`btn btn-outline px-5 py-3 text-cobalt aria-busy:cursor-wait aria-busy:opacity-70 ${focoCls}`}
            onClick={() => !procesando && campo.current?.click()}
            aria-busy={procesando || undefined}
            aria-describedby={describe}
          >
            {procesando ? 'Preparando la foto…' : foto.url ? 'Cambiar' : 'Subir foto'}
          </button>
          {foto.url && !procesando && (
            <button
              type="button"
              className={`rounded-brand border border-line px-5 py-3 text-[15px] font-semibold text-ink/70 hover:border-red-600 hover:text-red-700 ${focoCls}`}
              onClick={onQuitar}
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      <p id="av-foto-ayuda" className="mt-2 text-sm text-ink/60">
        {MENSAJES.avisoFoto}
      </p>
      <ErrorCampo id="av-foto-error">{error}</ErrorCampo>
    </div>
  );
}

/** Pantalla «Entrar»: se pide el correo y se manda el enlace de acceso. */
function PantallaEntrar() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // enviado | no-encontrado | red
  const [correoBuscado, setCorreoBuscado] = useState('');
  const campoCorreo = useRef(null);
  const tituloNoEncontrado = useRef(null);
  const volverAlCampo = useRef(false);

  // «No encontramos tu entrada»: el foco va al título. «Probar con otro
  // correo»: vuelve al campo, con el correo aún escrito.
  useEffect(() => {
    if (resultado === 'no-encontrado') tituloNoEncontrado.current?.focus();
    else if (volverAlCampo.current) {
      volverAlCampo.current = false;
      campoCorreo.current?.focus();
    }
  }, [resultado]);

  function probarOtroCorreo() {
    volverAlCampo.current = true;
    setResultado(null);
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError('Escribe un correo válido');
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      await pedirEnlace(email.trim());
      setResultado('enviado');
    } catch (err) {
      if (err?.codigo === 'CORREO_NO_ENCONTRADO') setCorreoBuscado(email.trim());
      setResultado(err?.codigo === 'CORREO_NO_ENCONTRADO' ? 'no-encontrado' : 'red');
    } finally {
      setEnviando(false);
    }
  }

  if (resultado === 'no-encontrado') {
    return <PantallaNoEncontrado correo={correoBuscado} onProbarOtro={probarOtroCorreo} tituloRef={tituloNoEncontrado} />;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="display text-[40px]">Entra con tu correo_</h2>
      <p className="mt-4 text-lg leading-snug text-ink/80">
        Escribe el correo con el que compraste la entrada y te mandamos un enlace para entrar. No hace falta contraseña.
      </p>
      <form onSubmit={enviar} noValidate className="mt-8 flex flex-col gap-4" aria-label="Entrar">
        <div>
          <label htmlFor="av-email" className={labelCls}>
            Tu correo
          </label>
          <input
            id="av-email"
            ref={campoCorreo}
            className={inputCls}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'av-email-error' : undefined}
          />
          <ErrorCampo id="av-email-error">{error}</ErrorCampo>
        </div>
        <button type="submit" className="btn btn-primary self-start disabled:cursor-wait disabled:opacity-70" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar enlace'}
        </button>
        <div role="status">
          {resultado === 'enviado' && (
            <p className="rounded-brand bg-lime p-4 font-semibold text-ink">{MENSAJES.enlaceEnviado}</p>
          )}
        </div>
        {resultado === 'red' && (
          <p className="rounded-brand border border-red-600 bg-white p-4 font-semibold text-red-700" role="alert">
            No hemos podido mandar el enlace. Revisa tu conexión e inténtalo otra vez.
          </p>
        )}
      </form>
    </div>
  );
}

/** Enlace caducado o ya usado: mismo contenido que la página «Enlace no válido». */
function PantallaEnlaceCaducado({ onPedirOtro }) {
  return (
    <section className="rounded-brand bg-cobalt p-8 text-white md:p-12" aria-labelledby="av-enlace-titulo">
      <span className="eyebrow text-lavender">Enlace no válido</span>
      <h2 id="av-enlace-titulo" className="display mt-4 text-[clamp(48px,9vw,120px)]">
        ¿Te has perdido?_
      </h2>
      <p className="mt-6 max-w-md text-xl text-lavender">
        Este enlace ha caducado o no es correcto. Esta es nuestra web; creemos que querías ir aquí:
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className={`btn btn-on-blue ${focoCls}`} onClick={onPedirOtro}>
          Pedir otro enlace
        </button>
        <a href="https://www.startuc3m.es/" className="btn btn-outline text-white">
          Ir a startuc3m.es <span className="font-mono">→</span>
        </a>
      </div>
    </section>
  );
}

/**
 * Página de perfil del Start Camp: entrar con el correo, crear y editar el
 * perfil, borrarlo y cerrar sesión. Con ?demo=… funciona contra el mock.
 */
export default function AvatarForm({ onSesionCerrada }) {
  const [variante] = useState(() => varianteDemo());
  const [conFotos] = useState(() => fotosActivas());

  const [pantalla, setPantalla] = useState('cargando'); // cargando | entrar | enlace-caducado | error-carga | formulario
  const [nombrePrecargado, setNombrePrecargado] = useState('');
  const [valores, setValores] = useState(() => valoresIniciales());
  const [teniaPerfil, setTeniaPerfil] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // guardado | borrado
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [sesionCaducada, setSesionCaducada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [saliendoGrupo, setSaliendoGrupo] = useState(false); // «Salir del grupo» pulsado, falta guardar
  const [foto, setFoto] = useState(SIN_FOTO); // solo con las fotos activas
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState(null);
  const enviando = useRef(false);
  const confirmacion = useRef(null);
  const botonBorrar = useRef(null);
  const focoABorrar = useRef(false);
  const botonFoto = useRef(null);
  const urlLocal = useRef(null); // URL de objeto de la vista previa, para soltarla

  const soltarUrlLocal = useCallback(() => {
    if (urlLocal.current) URL.revokeObjectURL(urlLocal.current);
    urlLocal.current = null;
  }, []);

  useEffect(() => soltarUrlLocal, [soltarUrlLocal]);

  const cargar = useCallback(async () => {
    setPantalla('cargando');
    try {
      const data = await obtenerPerfil();
      setNombrePrecargado(data.nombre ?? '');
      setValores(valoresIniciales(data.nombre, data.perfil));
      setTeniaPerfil(Boolean(data.perfil));
      if (conFotos) {
        soltarUrlLocal();
        setFoto({ url: data.perfil?.foto_url ?? null, nueva: null, guardada: Boolean(data.perfil?.foto_path) });
        setErrorFoto(null);
      }
      setErrores({});
      setAviso(null);
      setErrorEnvio(null);
      setSesionCaducada(false);
      setConfirmando(false);
      setSaliendoGrupo(false);
      setPantalla('formulario');
    } catch (err) {
      const codigo = err?.codigo;
      setPantalla(codigo === 'SIN_SESION' || codigo === 'SESION_CADUCADA' ? 'entrar' : 'error-carga');
    }
  }, [conFotos, soltarUrlLocal]);

  useEffect(() => {
    if (leerErrorEnlace()) setPantalla('enlace-caducado');
    else cargar();
  }, [cargar]);

  // El foco va a la confirmación al abrirla y vuelve al botón al cancelar.
  useEffect(() => {
    if (confirmando) confirmacion.current?.focus();
    else if (focoABorrar.current) {
      focoABorrar.current = false;
      botonBorrar.current?.focus();
    }
  }, [confirmando]);

  function cambiar(campo, valor) {
    setValores((v) => {
      const nuevo = { ...v, [campo]: valor };
      // Quien busca grupo no tiene grupo: se vacía el nombre.
      if (campo === 'estado_grupo' && !tieneGrupo(valor)) nuevo.nombre_grupo = '';
      return nuevo;
    });
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
    setAviso(null);
    setErrorEnvio(null);
    if (campo === 'estado_grupo') setSaliendoGrupo(false);
  }

  // Deja el formulario en «Busco grupo» sin nombre de grupo. Se aplica al
  // guardar (group_id null). El foco pasa a «Busco grupo», porque el botón
  // desaparece con el campo del grupo.
  function salirDelGrupo() {
    cambiar('estado_grupo', 'busco');
    setSaliendoGrupo(true);
    document.getElementById('av-estado_grupo-busco')?.focus();
  }

  // La foto se prepara al elegirla (recorte, 400x400, sin EXIF) y se sube al guardar.
  async function elegirFoto(event) {
    const archivo = event.target.files?.[0];
    event.target.value = ''; // para poder volver a elegir el mismo archivo
    if (!archivo) return;
    setErrorFoto(null);
    setAviso(null);
    setErrorEnvio(null);
    setProcesandoFoto(true);
    try {
      const blob = await procesarFoto(archivo);
      soltarUrlLocal();
      urlLocal.current = URL.createObjectURL(blob);
      setFoto((f) => ({ ...f, url: urlLocal.current, nueva: blob }));
    } catch (err) {
      setErrorFoto(err instanceof ErrorFoto ? err.message : MENSAJES_FOTO.lectura);
    } finally {
      setProcesandoFoto(false);
    }
  }

  // Se aplica al guardar (quitarFoto). El foco se queda en «Subir foto».
  function quitarFotoElegida() {
    soltarUrlLocal();
    setFoto((f) => ({ ...f, url: null, nueva: null }));
    setErrorFoto(null);
    setAviso(null);
    setErrorEnvio(null);
    botonFoto.current?.focus();
  }

  function alternarInteres(id) {
    const actuales = valores.intereses;
    if (actuales.includes(id)) cambiar('intereses', actuales.filter((i) => i !== id));
    else if (actuales.length < MAX_INTERESES) cambiar('intereses', [...actuales, id]);
  }

  // Al pegar la URL entera se queda solo el usuario. Si se teclea, se recorta
  // al salir del campo (recortar a mitad de escritura rompe lo que se teclea).
  function pegarLinkedin(event) {
    const texto = event.clipboardData?.getData('text');
    if (!texto || !/linkedin\.com\//i.test(texto)) return;
    event.preventDefault();
    cambiar('linkedin', urlAUsuario(texto));
  }

  function salirLinkedin() {
    const usuario = urlAUsuario(valores.linkedin);
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

  function irAEntrar() {
    setSesionCaducada(false);
    setPantalla('entrar');
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando.current) return;

    const creando = !teniaPerfil;
    const res = validar(valores, { creando });
    if (!res.ok) {
      setErrores(res.errores);
      enfocar(CAMPOS.find((c) => res.errores[c]));
      return;
    }

    enviando.current = true;
    setGuardando(true);
    setAviso(null);
    setErrorEnvio(null);
    setSesionCaducada(false);
    try {
      const datos = aPayload(valores, { creando, fotos: conFotos });
      if (conFotos && foto.nueva) {
        // Primero el archivo; su ruta va en el mismo insert/update del perfil.
        datos.foto_path = (await subirFoto(foto.nueva)).foto_path;
      } else if (conFotos && foto.guardada && !foto.url) {
        await quitarFoto();
        setFoto((f) => ({ ...f, guardada: false }));
      }
      await guardarPerfil(datos, { crear: creando });
      if (conFotos) setFoto((f) => ({ ...f, nueva: null, guardada: Boolean(f.url) }));
      setValores((v) => ({ ...v, linkedin: urlAUsuario(v.linkedin) }));
      setTeniaPerfil(true);
      setSaliendoGrupo(false);
      setAviso('guardado');
      if (creando) lanzarConfeti();
    } catch (err) {
      const codigo = err?.codigo ?? 'RED';
      if (codigo === 'SESION_CADUCADA' || codigo === 'SIN_SESION') {
        setSesionCaducada(true);
      } else if (codigo.startsWith('INVALID_')) {
        const campo = codigo.slice('INVALID_'.length).toLowerCase();
        if (CAMPOS.includes(campo)) {
          setErrores({ [campo]: campo === 'linkedin' ? MENSAJE_LINKEDIN : 'Revisa este campo.' });
          enfocar(campo);
        }
        setErrorEnvio('Hay algo que revisar en el formulario.');
      } else if (codigo === 'FOTO') {
        setErrorEnvio(MENSAJES.foto);
      } else {
        setErrorEnvio(MENSAJES.red);
      }
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (borrando) return;
    setBorrando(true);
    setErrorBorrado(null);
    try {
      await borrarPerfil();
      if (conFotos) {
        soltarUrlLocal();
        setFoto(SIN_FOTO);
        setErrorFoto(null);
      }
      setValores(valoresIniciales(valores.nombre.trim() || nombrePrecargado));
      setTeniaPerfil(false);
      setConfirmando(false);
      setErrores({});
      setErrorEnvio(null);
      setAviso('borrado');
    } catch (err) {
      if (err?.codigo === 'SESION_CADUCADA' || err?.codigo === 'SIN_SESION') {
        setConfirmando(false);
        setSesionCaducada(true);
      } else {
        setErrorBorrado(MENSAJES.borrarRed);
      }
    } finally {
      setBorrando(false);
    }
  }

  function cancelarBorrado() {
    focoABorrar.current = true;
    setConfirmando(false);
    setErrorBorrado(null);
  }

  async function salir() {
    setCerrando(true);
    try {
      await cerrarSesion();
    } catch {
      // Aunque falle, se vuelve a «Entrar»: la sesión caducará sola.
    } finally {
      setCerrando(false);
      setPantalla('entrar');
      onSesionCerrada?.();
    }
  }

  const barra = variante && <BarraDemo variante={variante} conFotos={conFotos} />;

  if (pantalla === 'cargando') {
    return (
      <>
        {barra}
        <p className="py-16 text-center text-lg text-ink/70" role="status">
          Cargando tu perfil…
        </p>
      </>
    );
  }

  if (pantalla === 'entrar') {
    return (
      <>
        {barra}
        <PantallaEntrar />
      </>
    );
  }

  if (pantalla === 'enlace-caducado') {
    return (
      <>
        {barra}
        <PantallaEnlaceCaducado onPedirOtro={irAEntrar} />
      </>
    );
  }

  if (pantalla === 'error-carga') {
    return (
      <>
        {barra}
        <div className="mx-auto max-w-md py-16 text-center">
          <p className="text-lg" role="alert">
            {MENSAJES.carga}
          </p>
          <button type="button" className="btn btn-primary mt-6" onClick={cargar}>
            Reintentar
          </button>
        </div>
      </>
    );
  }

  const creando = !teniaPerfil;
  const conGrupo = tieneGrupo(valores.estado_grupo);
  const llenos = valores.intereses.length >= MAX_INTERESES;
  const err = (campo) => (errores[campo] ? `av-${campo}-error` : undefined);

  return (
    <>
      {barra}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          className={`mono text-ink/60 underline underline-offset-4 hover:text-cobalt disabled:opacity-60 ${focoCls}`}
          onClick={salir}
          disabled={cerrando}
        >
          {cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-10">
          <form onSubmit={enviar} noValidate className="flex flex-col gap-8" aria-label="Tu perfil">
            {conFotos && (
              <CampoFoto
                foto={foto}
                nombre={valores.nombre}
                procesando={procesandoFoto}
                error={errorFoto}
                onElegir={elegirFoto}
                onQuitar={quitarFotoElegida}
                botonRef={botonFoto}
              />
            )}

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
              <div role="status">
                {saliendoGrupo && (
                  <p className="mt-3 text-sm font-semibold text-cobalt">Guarda los cambios para salir del grupo.</p>
                )}
              </div>
            </fieldset>

            {conGrupo && (
              <div>
                <label htmlFor="av-nombre_grupo" className={labelCls}>
                  Nombre del grupo <span className={opcionalCls}>(opcional)</span>
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
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
                  {!creando && valores.nombre_grupo.trim() && (
                    <button
                      type="button"
                      className={`btn btn-outline shrink-0 self-start px-5 py-3 text-cobalt ${focoCls}`}
                      onClick={salirDelGrupo}
                    >
                      Salir del grupo
                    </button>
                  )}
                </div>
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
                  onChange={(e) => cambiar('linkedin', e.target.value)}
                  onPaste={pegarLinkedin}
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

            {creando && (
              <div>
                <div className="flex items-start gap-3">
                  <input
                    id="av-consentimiento"
                    type="checkbox"
                    className={`mt-1 h-5 w-5 shrink-0 accent-cobalt ${focoCls}`}
                    checked={valores.consentimiento}
                    onChange={(e) => cambiar('consentimiento', e.target.checked)}
                    aria-invalid={Boolean(errores.consentimiento)}
                    aria-describedby={err('consentimiento')}
                  />
                  {/* PENDIENTE: texto de Legal (con fotos, versión CONSENTIMIENTO_VERSION_FOTOS) */}
                  <label htmlFor="av-consentimiento" className="leading-snug">
                    Acepto que Start UC3M use mi perfil ({conFotos ? DATOS_CONSENTIMIENTO_FOTOS : DATOS_CONSENTIMIENTO}) para el Start Camp 2026 y para formar grupos. Solo lo verán otros asistentes, se borrará al acabar el
                    Start Camp y puedo borrarlo antes con el botón «Borrar mi perfil». Más información en la{' '}
                    <a
                      href={URL_PRIVACIDAD}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cobalt underline underline-offset-2"
                    >
                      política de privacidad
                    </a>
                    .
                  </label>
                </div>
                <ErrorCampo id="av-consentimiento-error">{errores.consentimiento}</ErrorCampo>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                className="btn btn-primary self-start disabled:cursor-wait disabled:opacity-70"
                disabled={guardando || procesandoFoto}
              >
                {guardando ? 'Guardando…' : creando ? 'Guardar mi perfil' : 'Guardar cambios'}
              </button>

              {errorEnvio && (
                <p className="rounded-brand border border-red-600 bg-white p-4 font-semibold text-red-700" role="alert">
                  {errorEnvio}
                </p>
              )}

              {sesionCaducada && (
                <div className="flex flex-col items-start gap-3 rounded-brand border border-red-600 bg-white p-4" role="alert">
                  <p className="font-semibold text-red-700">{MENSAJES.sesionCaducada}</p>
                  <button type="button" className="btn btn-primary px-5 py-3" onClick={irAEntrar}>
                    Pedir otro enlace
                  </button>
                </div>
              )}

              {/* relative z-40: por encima del confeti (confeti.js) */}
              <div role="status" className="relative z-40">
                {aviso && (
                  <p className="rounded-brand bg-lime p-4 font-semibold text-ink">
                    {aviso === 'guardado' ? MENSAJES.guardado : MENSAJES.borrado}
                  </p>
                )}
              </div>
            </div>
          </form>

          {teniaPerfil && (
            <div className="border-t border-line pt-8">
              {!confirmando ? (
                <button
                  ref={botonBorrar}
                  type="button"
                  className={`rounded-brand border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:border-red-600 hover:text-red-700 ${focoCls}`}
                  onClick={() => setConfirmando(true)}
                >
                  Borrar mi perfil
                </button>
              ) : (
                <div
                  ref={confirmacion}
                  tabIndex={-1}
                  role="group"
                  aria-labelledby="av-borrar-titulo"
                  className={`flex flex-col gap-4 rounded-brand border-2 border-red-600 bg-white p-5 ${focoCls}`}
                >
                  <p id="av-borrar-titulo" className="font-semibold">
                    {MENSAJES.confirmarBorrado}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={`rounded-brand bg-red-700 px-5 py-3 text-[15px] font-semibold text-white disabled:opacity-70 ${focoCls}`}
                      onClick={confirmarBorrado}
                      disabled={borrando}
                    >
                      {borrando ? 'Borrando…' : 'Sí, borrar mi perfil'}
                    </button>
                    <button
                      type="button"
                      className={`rounded-brand border border-line px-5 py-3 text-[15px] font-semibold ${focoCls}`}
                      onClick={cancelarBorrado}
                      disabled={borrando}
                    >
                      Cancelar
                    </button>
                  </div>
                  {errorBorrado && (
                    <p className="font-semibold text-red-700" role="alert">
                      {errorBorrado}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <aside aria-labelledby="av-vista-previa" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="av-vista-previa" className="eyebrow mb-4 text-ink/70">
            Así te verán los demás
          </h2>
          <AvatarCard {...aPayload(valores)} foto_url={conFotos ? foto.url : undefined} preview />
        </aside>
      </div>
    </>
  );
}
