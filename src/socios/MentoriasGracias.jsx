import React from 'react';
import './Socios.css';

// Vuelta desde Stripe. Como en socios, no consulta el pago: lo confirma el webhook.
export default function MentoriasGracias() {
  return (
    <div>
      <div className="socios-gracias">
        <div className="socios-gracias__icono" aria-hidden="true">
          ✓
        </div>
        <h1>Pago recibido</h1>
        <p>
          Gracias por reservar tu mentoría. Estamos confirmando el pago: en cuanto esté listo te
          llega un correo nuestro, y el recibo de Stripe por separado.
        </p>
        <p>Suele tardar menos de un minuto. Si no ves nada, revisa la carpeta de spam antes de escribirnos.</p>
        <a href="/" className="socios-gracias__volver">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
