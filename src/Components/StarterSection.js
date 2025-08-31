// StarterSection.jsx

import React from "react";
import "./StarterSection.css";
import starterImage from "../assets/starter-image.jpg"; // Reemplaza con la ruta real de la imagen

function StarterSection() {
  return (
    <>
 <div className="starter-section-separator"></div>     
  <section className="starter-section">
        <h2 className="starter-title">Qué es un starter?</h2>
        <div className="starter-content">
          <div className="starter-image-container">
            <img src={starterImage} alt="Starter" className="starter-image" />
          </div>
          <div className="starter-text">
            <p>
              Un starter es un miembro de la comunidad que comparte y respeta
              nuestros valores, un embajador de nuestra marca.
            </p>
            <p>
              De mente inquieta, con ganas de cambiar las cosas, comprometido con
              la sociedad y con el emprendimiento como forma de generar un impacto
              positivo, que quiere estar al día de lo que hacemos.
            </p>
          </div>
        </div>
       
      </section>
    </>
  );
}

export default StarterSection;
