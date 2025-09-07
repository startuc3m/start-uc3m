// QuoteSection.jsx

import React from "react";
import "../styles/QuoteSection.css";

function QuoteSection() {
  return (
    <section className="quote-section">
      <blockquote className="quote-text">
        "Start UC3M, una iniciativa creada por alumnos que organiza eventos, conferencias, talleres y otras actividades para fomentar la vocación emprendedora desde la universidad"
      </blockquote>
      <p className="quote-author">EXPANSIÓN</p>
    </section>
  );
}

export default QuoteSection;
