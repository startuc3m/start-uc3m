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
        <a href="https://tally.so/r/wz9GQg" target="_blank" rel="noopener noreferrer">
          <button className="hero-cta">
            Quiero convertirme en starter
          </button>
        </a>
      </div>
    </section>
  );
}

export default Hero;