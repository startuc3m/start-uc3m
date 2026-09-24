import React from "react";
import "../styles/Hero.css";

function Hero() {
  return (
   <section className="hero-section">
      <div className="hero-content">
        <h2 className="hero-title">Piensa diferente,</h2>
        <h1 className="hero-highlight">Actúa con propósito</h1>
        <p className="hero-subtitle">
          Asociación de emprendedores de la Universidad Carlos III de Madrid
        </p>
        <p className="hero-badge hero-badge--closed">
          <span className="hero-badge-dot" aria-hidden="true"></span>
          Inscripciones cerradas · Curso 2026/27
        </p>
        <button className="hero-cta hero-cta--closed" type="button" disabled>
          Plazas completas
        </button>
        <p className="hero-cta-note">
          Las plazas de este curso ya están cubiertas. Síguenos para no perderte la próxima convocatoria.
        </p>
      </div>
    </section>
  );
}

export default Hero;
