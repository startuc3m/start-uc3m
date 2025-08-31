import React from "react";
import "./Hero.css";

function Hero() {
  return (
   <section className="hero-section">
      <div className="hero-content">
        <h2 className="hero-title">Piensa diferente,</h2>
        <h1 className="hero-highlight">Actúa con propósito</h1>
        <p className="hero-subtitle">
          Asociación de emprendedores de la Universidad Carlos III de Madrid
        </p>
        <button className="hero-cta">
          Quiero convertirme en starter
        </button>
      </div>
    </section>
  );
}

export default Hero;