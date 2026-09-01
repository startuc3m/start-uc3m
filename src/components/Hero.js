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
        <p className="hero-badge">
          <span className="hero-badge-dot" aria-hidden="true"></span>
          Inscripciones abiertas · Curso 2026/27
        </p>
        <a href="https://tally.so/r/5BAxX6" target="_blank" rel="noopener noreferrer">
          <button className="hero-cta">
            Apúntate ya
          </button>
        </a>
        <p className="hero-cta-note">Plazas limitadas — únete a la comunidad Start</p>
      </div>
    </section>
  );
}

export default Hero;