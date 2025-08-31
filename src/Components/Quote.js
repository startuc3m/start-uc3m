// QuoteSection.jsx

import React from "react";
import "./QuoteSection.css";

function QuoteSection() {
  return (
    <section className="quote-section">
      <blockquote className="quote-text">
        “Start UC3M, una organización estudiantil que pretende acercar la innovación, el emprendimiento y el inconformismo a otros jóvenes”
      </blockquote>
      <p className="quote-author">EFE EMPRENDE</p>
    </section>
  );
}

export default QuoteSection;
