import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../index.css';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import '../styles/Socios.css';

const PRIVACY_URL = '/privacidad';
const EMAIL_DEBOUNCE_MS = 600;

const ERROR_MESSAGES = {
  ALREADY_MEMBER: 'Este email ya está dado de alta como socio de Start.',
  PREMIUM_NOT_INVITED: 'La modalidad premium es solo por invitación y este email no está en la lista.',
  PREMIUM_CLOSED: 'La modalidad premium no está abierta ahora mismo.',
  PRIVACY_NOT_ACCEPTED: 'Tienes que aceptar la política de privacidad para continuar.',
  INVALID_EMAIL: 'Revisa el email: no parece una dirección válida.',
  INVALID_NAME: 'Escribe tu nombre completo.',
  RATE_LIMITED: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.',
  SERVER_ERROR: 'No hemos podido abrir el pago. Inténtalo de nuevo en un momento.',
};

function formatEuros(cents) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function optionKey(option) {
  return option.plan === 'premium' ? 'premium' : 'standard-' + option.tier;
}

function optionTitle(option) {
  if (option.plan === 'premium') return 'Socio Starter';
  if (option.tier === 1) return 'Socio · plazas 1 a 10';
  if (option.tier === 2) return 'Socio · plazas 11 a 30';
  return 'Socio · plaza 31 en adelante';
}

function optionNote(option, premiumEligible) {
  if (option.plan === 'premium') {
    if (option.state === 'closed') return 'No disponible ahora mismo';
    return premiumEligible ? 'Disponible para tu email' : 'Solo por invitación de Start';
  }
  if (option.state === 'sold_out') return 'Agotado';
  if (option.state === 'coming_soon') return 'Cuando se agote el tramo anterior';
  if (option.remaining !== null && option.remaining !== undefined) {
    return option.remaining === 1
      ? 'Queda 1 plaza a este precio'
      : 'Quedan ' + option.remaining + ' plazas a este precio';
  }
  return 'Precio actual';
}

function isSelectable(option, premiumEligible) {
  if (option.plan === 'premium') return option.state === 'invite_only' && premiumEligible;
  return option.state === 'available';
}

export default function Socios() {
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [selected, setSelected] = useState(null);

  const [premiumEligible, setPremiumEligible] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  const debounceRef = useRef(null);
  const cancelledRef = useRef(false);

  const loadAvailability = useCallback(async () => {
    try {
      const response = await fetch('/api/membership/availability');
      if (!response.ok) throw new Error('availability ' + response.status);
      const data = await response.json();
      setOptions(data.options || []);
      setLoadError(null);
      return data.options || [];
    } catch (err) {
      setLoadError('No hemos podido cargar las modalidades. Recarga la página.');
      return [];
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability().then((loaded) => {
      // Preseleccionamos el tramo vigente para ahorrar un toque en movil.
      const current = loaded.find((o) => o.plan === 'standard' && o.state === 'available');
      if (current) setSelected(optionKey(current));
    });
  }, [loadAvailability]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // La elegibilidad premium se consulta al dejar de teclear, no en cada tecla.
  const schedulePremiumCheck = useCallback((value) => {
    clearTimeout(debounceRef.current);
    const trimmed = value.trim().toLowerCase();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setPremiumEligible(false);
      setCheckingPremium(false);
      return;
    }

    setCheckingPremium(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/membership/premium-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await response.json();
        setPremiumEligible(Boolean(data.eligible));
      } catch (err) {
        setPremiumEligible(false);
      } finally {
        setCheckingPremium(false);
      }
    }, EMAIL_DEBOUNCE_MS);
  }, []);

  function handleEmailChange(event) {
    const value = event.target.value;
    setEmail(value);
    setError(null);
    schedulePremiumCheck(value);
  }

  // Si el premium deja de estar disponible, no puede quedar seleccionado.
  useEffect(() => {
    if (selected === 'premium' && !premiumEligible) setSelected(null);
  }, [premiumEligible, selected]);

  const selectedOption = options.find((o) => optionKey(o) === selected) || null;

  async function startCheckout(confirmedPriceCents) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          plan: selected === 'premium' ? 'premium' : 'standard',
          acceptedPrivacy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(ERROR_MESSAGES[data.error] || ERROR_MESSAGES.SERVER_ERROR);
        await loadAvailability();
        return;
      }

      // El servidor manda sobre el precio. Si el tramo cambio mientras el
      // usuario rellenaba el formulario, se le avisa antes de redirigir.
      const shown = confirmedPriceCents !== undefined
        ? confirmedPriceCents
        : selectedOption && selectedOption.priceCents;

      if (shown !== undefined && shown !== null && data.priceCents !== shown) {
        setPriceChange({ shownCents: shown, actualCents: data.priceCents, url: data.url });
        await loadAvailability();
        return;
      }

      cancelledRef.current = false;
      window.location.href = data.url;
    } catch (err) {
      setError(ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selected) {
      setError('Elige una modalidad para continuar.');
      return;
    }
    if (!acceptedPrivacy) {
      setError(ERROR_MESSAGES.PRIVACY_NOT_ACCEPTED);
      return;
    }
    startCheckout();
  }

  const canSubmit =
    !submitting && name.trim().length >= 2 && email.trim().length > 3 && selected && acceptedPrivacy;

  return (
    <div>
      <Navbar />

      <main className="socios">
        <header className="socios__intro">
          <p className="socios__eyebrow">Hazte socio</p>
          <h1 className="socios__title">
            Forma parte de <span>Start UC3M</span>
          </h1>
          <p className="socios__lead">
            Una cuota al año. Cuanto antes te apuntes, menos pagas: las primeras plazas tienen
            el precio más bajo y el tramo sube según se van ocupando.
          </p>
        </header>

        <form className="socios__form" onSubmit={handleSubmit} noValidate>
          <div className="socios__fields">
            <div className="socios__field">
              <label htmlFor="socios-nombre">Nombre completo</label>
              <input
                id="socios-nombre"
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
              <label htmlFor="socios-email">Email</label>
              <input
                id="socios-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={() => schedulePremiumCheck(email)}
                placeholder="tu@alumnos.uc3m.es"
                aria-describedby="socios-email-ayuda"
              />
              <p id="socios-email-ayuda" className="socios__hint" aria-live="polite">
                {checkingPremium
                  ? 'Comprobando tu email…'
                  : premiumEligible
                  ? 'Tienes invitación para la modalidad premium.'
                  : 'Te enviaremos aquí tu número de socio.'}
              </p>
            </div>
          </div>

          <fieldset className="socios__modalidades">
            <legend>Elige tu modalidad</legend>

            {loadingOptions && <p className="socios__cargando">Cargando modalidades…</p>}
            {loadError && (
              <p className="socios__error" role="alert">
                {loadError}
              </p>
            )}

            {options.map((option) => {
              const key = optionKey(option);
              const selectable = isSelectable(option, premiumEligible);
              const checked = selected === key;

              return (
                <label
                  key={key}
                  className={
                    'socios__opcion' +
                    (selectable ? '' : ' socios__opcion--bloqueada') +
                    (checked ? ' socios__opcion--activa' : '')
                  }
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value={key}
                    checked={checked}
                    disabled={!selectable}
                    onChange={() => {
                      setSelected(key);
                      setError(null);
                    }}
                  />
                  <span className="socios__opcion-texto">
                    <span className="socios__opcion-titulo">{optionTitle(option)}</span>
                    <span className="socios__opcion-nota">{optionNote(option, premiumEligible)}</span>
                  </span>
                  <span
                    className={
                      'socios__opcion-precio' +
                      (option.state === 'sold_out' ? ' socios__opcion-precio--tachado' : '')
                    }
                  >
                    {formatEuros(option.priceCents)}
                  </span>
                </label>
              );
            })}
          </fieldset>

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
              y el tratamiento de mis datos para gestionar mi alta como socio.
            </span>
          </label>

          {error && (
            <p className="socios__error" role="alert">
              {error}
            </p>
          )}

          {priceChange && (
            <div className="socios__aviso" role="alert">
              <p>
                Mientras rellenabas el formulario se agotó el tramo que habías visto. El precio
                que se te cobrará es <strong>{formatEuros(priceChange.actualCents)}</strong> en
                lugar de {formatEuros(priceChange.shownCents)}.
              </p>
              <div className="socios__aviso-acciones">
                <button
                  type="button"
                  className="socios__boton"
                  onClick={() => {
                    window.location.href = priceChange.url;
                  }}
                >
                  Continuar al pago
                </button>
                <button
                  type="button"
                  className="socios__boton socios__boton--secundario"
                  onClick={() => setPriceChange(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!priceChange && (
            <button type="submit" className="socios__boton" disabled={!canSubmit}>
              {submitting ? 'Abriendo el pago…' : 'Pagar y hacerme socio'}
            </button>
          )}

          <p className="socios__legal">
            El pago se hace a través de Stripe. Start no guarda los datos de tu tarjeta.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
