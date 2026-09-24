import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../index.css';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import '../styles/Socios.css';

const ERRORES = {
  INVALID_PHONE:
    'Revisa el número: escribe las 9 cifras, o el número con su prefijo si es de fuera de España.',
  INVALID_TOKEN: 'Este enlace no es válido.',
  RATE_LIMITED: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.',
  SERVER_ERROR: 'No hemos podido guardarlo. Inténtalo de nuevo en un momento.',
};

/**
 * Pagina del enlace personal que reciben los socios dados de alta antes
 * de que el telefono se pidiera en el formulario.
 *
 * El token de la URL identifica al socio, asi que solo tiene que escribir
 * el numero: ni email, ni nombre, ni recordar su numero de socio.
 */
export default function SociosTelefono() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';

  const [socio, setSocio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);

  const [phone, setPhone] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!token) {
      setEnlaceInvalido(true);
      setCargando(false);
      return;
    }
    try {
      const res = await fetch('/api/membership/telefono?t=' + encodeURIComponent(token));
      if (!res.ok) {
        setEnlaceInvalido(true);
        return;
      }
      const data = await res.json();
      setSocio(data);
      if (data.phone) setPhone(data.phone);
    } catch (err) {
      setError(ERRORES.SERVER_ERROR);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleSubmit(event) {
    event.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const res = await fetch('/api/membership/telefono', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(ERRORES[data.error] || ERRORES.SERVER_ERROR);
        return;
      }

      setPhone(data.phone);
      setGuardado(true);
    } catch (err) {
      setError(ERRORES.SERVER_ERROR);
    } finally {
      setGuardando(false);
    }
  }

  const puedeGuardar = !guardando && phone.replace(/[^0-9]/g, '').length >= 9;

  return (
    <div>
      <Navbar />

      <main className="socios socios--estrecho">
        {cargando && <p className="socios__cargando">Cargando…</p>}

        {!cargando && enlaceInvalido && (
          <div className="socios__intro">
            <h1 className="socios__title">Este enlace no vale</h1>
            <p className="socios__lead">
              Puede que esté incompleto o que sea de otra persona. Abre el enlace directamente
              desde el correo que te enviamos, sin copiarlo a mano.
            </p>
            <p className="socios__lead">
              Si sigue sin funcionar, escríbenos a{' '}
              <a href="mailto:startuc3m@gmail.com">startuc3m@gmail.com</a> y lo arreglamos.
            </p>
          </div>
        )}

        {!cargando && socio && !guardado && (
          <>
            <header className="socios__intro">
              <p className="socios__eyebrow">Socio nº {socio.memberNumber}</p>
              <h1 className="socios__title">
                Hola, <span>{socio.name.split(' ')[0]}</span>
              </h1>
              <p className="socios__lead">
                Estamos montando el grupo de WhatsApp de socios y nos falta tu número.
                Déjanoslo aquí y te añadimos.
              </p>
            </header>

            <form className="socios__form" onSubmit={handleSubmit} noValidate>
              <div className="socios__field">
                <label htmlFor="telefono">Tu teléfono</label>
                <input
                  id="telefono"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  placeholder="666 12 34 56"
                />
                <p className="socios__hint">
                  {socio.phone
                    ? 'Ya nos habías dejado este número. Puedes cambiarlo si quieres.'
                    : 'Si es de fuera de España, escríbelo con su prefijo.'}
                </p>
              </div>

              {error && (
                <p className="socios__error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="socios__boton" disabled={!puedeGuardar}>
                {guardando ? 'Guardando…' : 'Guardar mi teléfono'}
              </button>

              <p className="socios__legal">
                Solo lo usaremos para el grupo de WhatsApp y los avisos de socios. Puedes
                consultar la{' '}
                <a href="/privacidad" target="_blank" rel="noreferrer">
                  política de privacidad
                </a>
                .
              </p>
            </form>
          </>
        )}

        {guardado && (
          <div className="socios__intro">
            <div className="socios-gracias__icono" aria-hidden="true">
              ✓
            </div>
            <h1 className="socios__title">Guardado</h1>
            <p className="socios__lead">
              Gracias, {socio.name.split(' ')[0]}. Te añadiremos al grupo de WhatsApp en{' '}
              <strong>{phone}</strong>.
            </p>
            <p className="socios__lead">
              Si te has equivocado, vuelve a abrir el enlace del correo y escríbelo otra vez.
            </p>
            <p className="socios__legal">
              <Link to="/">Volver al inicio</Link>
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
