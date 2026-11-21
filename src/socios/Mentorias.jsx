import React, { useState } from 'react';
import './Socios.css';

// Pago de mentorías en Mad Tech Campus. Mismo aspecto que el alta de socio
// (Socios.css) pero sin modalidades: un precio fijo que decide el servidor.
const PRIVACY_URL = '/privacidad';
const PRICE_LABEL = '15,00 €'; // Informativo: lo que se cobra lo fija api/_lib/mentorias.mjs

const ERROR_MESSAGES = {
  PRIVACY_NOT_ACCEPTED: 'Tienes que aceptar la política de privacidad para continuar.',
  INVALID_EMAIL: 'Revisa el email: no parece una dirección válida.',
  INVALID_NAME: 'Escribe tu nombre completo.',
  INVALID_PHONE: 'Revisa el teléfono: escribe 9 cifras, o el número con su prefijo si es de fuera de España.',
  RATE_LIMITED: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.',
  SERVER_ERROR: 'No hemos podido abrir el pago. Inténtalo de nuevo en un momento.',
};

export default function Mentorias() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!acceptedPrivacy) {
      setError(ERROR_MESSAGES.PRIVACY_NOT_ACCEPTED);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/mentorias/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          acceptedPrivacy,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(ERROR_MESSAGES[data.error] || ERROR_MESSAGES.SERVER_ERROR);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const phoneParece = phone.replace(/[^0-9]/g, '').length >= 9;
  const canSubmit =
    !submitting && name.trim().length >= 2 && email.trim().length > 3 && phoneParece && acceptedPrivacy;

  return (
    <section className="socios">
      <div className="socios__grid">
        <header className="socios__intro">
          <p className="socios__eyebrow">Mentorías · Mad Tech Campus</p>
          <h2 className="socios__title">Reserva tu mentoría</h2>
          <p className="socios__lead">Pago único de {PRICE_LABEL}. En un par de minutos queda hecho.</p>
          <ol className="socios__pasos">
            <li>
              <span className="socios__paso-num" aria-hidden="true">01</span>
              <span>
                <strong>Rellenas tus datos.</strong> Nombre, email y teléfono.
              </span>
            </li>
            <li>
              <span className="socios__paso-num" aria-hidden="true">02</span>
              <span>
                <strong>Pagas con Stripe.</strong> {PRICE_LABEL}, tarjeta o métodos de pago habituales.
              </span>
            </li>
            <li>
              <span className="socios__paso-num" aria-hidden="true">03</span>
              <span>
                <strong>Te llega la confirmación.</strong> Un correo nuestro y el recibo de Stripe.
              </span>
            </li>
          </ol>
        </header>

        <form className="socios__form" onSubmit={handleSubmit} noValidate>
          <div className="socios__fields">
            <div className="socios__field">
              <label htmlFor="mentoria-nombre">Nombre completo</label>
              <input
                id="mentoria-nombre"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Ana García Pérez"
              />
            </div>
            <div className="socios__field">
              <label htmlFor="mentoria-email">Email</label>
              <input
                id="mentoria-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="tu@alumnos.uc3m.es"
                aria-describedby="mentoria-email-ayuda"
              />
              <p id="mentoria-email-ayuda" className="socios__hint">
                Te enviaremos aquí la confirmación.
              </p>
            </div>
            <div className="socios__field">
              <label htmlFor="mentoria-telefono">Teléfono</label>
              <input
                id="mentoria-telefono"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                placeholder="666 12 34 56"
                aria-describedby="mentoria-telefono-ayuda"
              />
              <p id="mentoria-telefono-ayuda" className="socios__hint">
                Por si tenemos que avisarte de algún cambio.
              </p>
            </div>
          </div>

          <div className="socios__modalidades">
            <div className="socios__opcion socios__opcion--activa" style={{ cursor: 'default' }}>
              <span className="socios__opcion-texto">
                <span className="socios__opcion-titulo">Mentoría</span>
                <span className="socios__opcion-nota">Mad Tech Campus · pago único</span>
              </span>
              <span className="socios__opcion-precio">{PRICE_LABEL}</span>
            </div>
          </div>

          <label className="socios__rgpd">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked);
                setError(null);
              }}
              required
            />
            <span>
              He leído y acepto la{' '}
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
                política de privacidad
              </a>{' '}
              y el tratamiento de mis datos para gestionar mi mentoría.
            </span>
          </label>

          {error && (
            <p className="socios__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="socios__boton" disabled={!canSubmit}>
            {submitting ? 'Abriendo el pago…' : 'Pagar ' + PRICE_LABEL}
            <span className="socios__boton-flecha" aria-hidden="true">→</span>
          </button>

          <p className="socios__legal">
            El pago se hace a través de Stripe. Start no guarda los datos de tu tarjeta.
          </p>
        </form>
      </div>
    </section>
  );
}
