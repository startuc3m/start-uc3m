import React from 'react';
import { Link } from 'react-router-dom';
import '../index.css';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import '../styles/Socios.css';

/**
 * Pagina de vuelta desde Stripe.
 *
 * Deliberadamente no consulta el estado del pago: quien lo confirma es el
 * webhook, y puede tardar unos segundos. Mostrar aqui "pago confirmado"
 * leyendo la sesion seria adelantarse a la unica fuente de verdad.
 */
export default function SociosGracias() {
  return (
    <div>
      <Navbar />

      <main className="socios-gracias">
        <div className="socios-gracias__icono" aria-hidden="true">
          ✓
        </div>

        <h1>Pago recibido</h1>

        <p>
          Gracias por hacerte socio de Start UC3M. Estamos confirmando el pago: en cuanto
          esté listo te llega un correo con tu <strong>número de socio</strong>.
        </p>

        <p>
          Suele tardar menos de un minuto. Si pasados unos minutos no ves nada, revisa la
          carpeta de spam antes de escribirnos.
        </p>

        <Link to="/" className="socios-gracias__volver">
          Volver al inicio
        </Link>
      </main>

      <Footer />
    </div>
  );
}
