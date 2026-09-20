import React from 'react';
import { Link } from 'react-router-dom';
import '../index.css';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import '../styles/NoEncontrada.css';

/**
 * Cualquier ruta que no exista.
 *
 * Sin esto, React Router no pinta nada y queda a la vista el fondo del
 * body: una pantalla morada vacia, sin ninguna pista de que ha pasado ni
 * como volver.
 */
export default function NoEncontrada() {
  return (
    <div>
      <Navbar />

      <main className="no-encontrada">
        <p className="no-encontrada__codigo">404</p>
        <h1>Esta página no existe</h1>
        <p>
          El enlace puede estar mal escrito o apuntar a algo que ya hemos movido.
        </p>

        <div className="no-encontrada__acciones">
          <Link to="/" className="no-encontrada__boton">
            Ir al inicio
          </Link>
          <Link to="/eventos" className="no-encontrada__boton no-encontrada__boton--secundario">
            Ver eventos
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
