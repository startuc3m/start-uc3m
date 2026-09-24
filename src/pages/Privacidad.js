import React from 'react';
import { Link } from 'react-router-dom';
import '../index.css';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import '../styles/Privacidad.css';

/**
 * Politica de privacidad enlazada desde la casilla obligatoria de /socios.
 *
 * Los datos de tratamiento (que se recoge, con quien se comparte, cuanto
 * dura) describen lo que el codigo hace de verdad y estan comprobados
 * contra la implementacion.
 *
 * Lo que falta son los datos legales de la asociacion, marcados con
 * PENDIENTE. Son decisiones de la junta, no tecnicas.
 *
 * NO DESPLEGAR con los PENDIENTE sin rellenar: la web pediria el
 * consentimiento apoyandose en un texto incompleto.
 */

// Datos facilitados por la junta. Si algo queda en null, la pagina avisa.
const ENTIDAD = {
  nombre: 'Start UC3M Emprendedores',
  nif: 'G86907300',
  direccion: 'Calle Madrid 126, despacho 6.0.01, 28903 Getafe',
  email: 'startuc3m@gmail.com',
};

const PENDIENTES = Object.entries(ENTIDAD)
  .filter(([, v]) => !v)
  .map(([k]) => k);

function Dato({ children }) {
  if (children) return <>{children}</>;
  return <mark className="privacidad__pendiente">PENDIENTE</mark>;
}

export default function Privacidad() {
  return (
    <div>
      <Navbar />

      <main className="privacidad">
        <header className="privacidad__intro">
          <h1>Política de privacidad</h1>
          <p className="privacidad__fecha">Última actualización: 24 de septiembre de 2026</p>
        </header>

        {PENDIENTES.length > 0 && (
          <div className="privacidad__aviso" role="alert">
            <strong>Borrador sin terminar.</strong> Faltan por rellenar los datos de la
            asociación ({PENDIENTES.join(', ')}). No publiquéis la web con este aviso
            visible: editad <code>ENTIDAD</code> en <code>src/pages/Privacidad.js</code>.
          </div>
        )}

        <section>
          <h2>Quién trata tus datos</h2>
          <p>
            El responsable del tratamiento es <Dato>{ENTIDAD.nombre}</Dato>, con NIF{' '}
            <Dato>{ENTIDAD.nif}</Dato> y domicilio en <Dato>{ENTIDAD.direccion}</Dato>.
            Puedes escribirnos en cualquier momento a{' '}
            <a href={'mailto:' + ENTIDAD.email}>{ENTIDAD.email}</a>.
          </p>
        </section>

        <section>
          <h2>Qué datos recogemos</h2>
          <p>Al hacerte socio te pedimos únicamente:</p>
          <ul>
            <li>
              <strong>Nombre completo</strong>, para identificarte como socio.
            </li>
            <li>
              <strong>Dirección de correo electrónico</strong>, para enviarte tu número de
              socio y las comunicaciones de la asociación.
            </li>
            <li>
              <strong>Número de teléfono</strong>, para añadirte al grupo de WhatsApp de
              socios y avisarte de las actividades.
            </li>
          </ul>
          <p>
            Además guardamos la <strong>fecha y el importe</strong> de tu cuota y una
            referencia del pago. <strong>No recogemos ni almacenamos los datos de tu
            tarjeta</strong>: el cobro lo gestiona Stripe íntegramente y nosotros nunca
            llegamos a verlos.
          </p>
        </section>

        <section>
          <h2>Para qué los usamos y con qué legitimación</h2>
          <ul>
            <li>
              <strong>Gestionar tu alta como socio y cobrar la cuota.</strong> La base
              legal es la ejecución de la relación de socio que solicitas al pagar.
            </li>
            <li>
              <strong>Enviarte información sobre las actividades de Start.</strong> La base
              legal es tu consentimiento, que puedes retirar cuando quieras.
            </li>
            <li>
              <strong>Añadirte al grupo de WhatsApp de socios.</strong> La base legal es tu
              consentimiento. Ten en cuenta que, al entrar en un grupo, el resto de
              participantes verá tu número: si prefieres no aparecer, no nos lo facilites o
              dinos que te demos de baja del grupo.
            </li>
            <li>
              <strong>Cumplir nuestras obligaciones contables.</strong> La base legal es el
              cumplimiento de una obligación legal.
            </li>
          </ul>
        </section>

        <section>
          <h2>Quién más ve tus datos</h2>
          <p>
            No vendemos tus datos ni los cedemos con fines comerciales. Para poder
            funcionar, nos apoyamos en estos proveedores, que los tratan por cuenta nuestra:
          </p>
          <div className="privacidad__tabla-envoltorio">
            <table className="privacidad__tabla">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Para qué</th>
                  <th>Dónde</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stripe</td>
                  <td>Cobro de la cuota</td>
                  <td>UE / EE. UU.</td>
                </tr>
                <tr>
                  <td>Neon</td>
                  <td>Base de datos de socios</td>
                  <td>UE (Londres)</td>
                </tr>
                <tr>
                  <td>Resend</td>
                  <td>Envío del correo de bienvenida</td>
                  <td>UE / EE. UU.</td>
                </tr>
                <tr>
                  <td>Notion</td>
                  <td>Gestión interna del listado de socios</td>
                  <td>EE. UU.</td>
                </tr>
                <tr>
                  <td>Vercel</td>
                  <td>Alojamiento de la web</td>
                  <td>UE / EE. UU.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Las transferencias fuera de la UE se amparan en las cláusulas contractuales
            tipo aprobadas por la Comisión Europea.
          </p>
        </section>

        <section>
          <h2>Cuánto los conservamos</h2>
          <p>
            Mantenemos tus datos mientras seas socio. Después los conservamos solo el
            tiempo necesario para atender posibles responsabilidades legales y contables, y
            luego los eliminamos.
          </p>
        </section>

        <section>
          <h2>Tus derechos</h2>
          <p>
            Puedes pedirnos <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>,{' '}
            <strong>suprimirlos</strong>, <strong>limitar</strong> u <strong>oponerte</strong>{' '}
            a su tratamiento, y solicitar su <strong>portabilidad</strong>. También puedes{' '}
            <strong>retirar tu consentimiento</strong> en cualquier momento, sin que eso
            afecte a lo hecho antes.
          </p>
          <p>
            Para ejercerlos, escríbenos a{' '}
            <a href={'mailto:' + ENTIDAD.email}>{ENTIDAD.email}</a>. Si crees que no hemos
            atendido tu solicitud como debíamos, puedes reclamar ante la{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
              Agencia Española de Protección de Datos
            </a>
            .
          </p>
        </section>

        <p className="privacidad__volver">
          <Link to="/socios">Volver al formulario de socio</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
