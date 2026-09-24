// StarterSection.jsx

import React from "react";
import "../styles/StarterSection.css";
import starterImage from "../assets/starter-image.jpg"; // Reemplaza con la ruta real de la imagen

function StarterSection() {
  return (
    <>
 <div className="starter-section-separator"></div>     
  <section className="starter-section">
        <h2 className="starter-title">Qué es un starter?</h2>
        <div className="starter-content">
          <div className="starter-text">
            <p>Un starter no se nace, se hace</p>
          </div>
          <div className="starter-image-container">
            <img src={starterImage} alt="Starter" className="starter-image" />
          </div>
          <div className="starter-text">
            <p>Un starter no es solo alguien que forma parte de Start</p>
            <p>
              Es una persona con iniciativa, curiosidad y ganas reales de implicarse. Alguien que aporta
              ideas, energía y actitud a la comunidad, y que entiende que el valor de Start lo construimos
              entre todos.
            </p>
            <p>
              En Start UC3M buscamos perfiles comprometidos, con mentalidad abierta y espíritu
              colaborativo. La participación activa y la fidelidad a la asociación marcan la diferencia:
              cuanto más aportas, más crece tu recorrido dentro, y fuera de Start.
            </p>
            <p className="starter-badge starter-badge--closed">
              <span className="starter-badge-dot" aria-hidden="true"></span>
              Inscripciones cerradas
            </p>
            <button className="StarterSection-cta StarterSection-cta--closed" type="button" disabled>
              Plazas completas
            </button>
            <p className="starter-closed-note">
              El proceso de entrada de este curso ya está cerrado. Abriremos de nuevo en la próxima convocatoria.
            </p>
          </div>
        </div>
        
       
      </section>
    </>
  );
}

export default StarterSection;
