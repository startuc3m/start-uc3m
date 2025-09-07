// LogosMarquee.jsx

import React from "react";
import "../styles/LogosBand.css";

// Importa tus imágenes desde la carpeta assets
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";

const logos = [
  { id: 1, src: logo1, alt: "Opinión20" },
  { id: 2, src: logo2, alt: "Shield Logo" },
  { id: 3, src: logo3, alt: "cosa" },
  { id: 4, src: logo4, alt: "ULVMAND" }
];

function LogosBand() {
  return (
    <div className="logos-marquee">
      <div className="logos-track">
        {Array(6).fill(logos).flat().map((logo, idx) => (
          <div className="logo-item" key={idx}>
            <img src={logo.src} alt={logo.alt} className="logo-img" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogosBand;
