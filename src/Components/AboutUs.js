import { motion } from "framer-motion";
import { Sprout, Users2, Rocket } from "lucide-react";
import "../styles/AboutUs.css";

/**
 * Componente reutilizable "Sección – ¿Quiénes somos?" 
 * - Estilos extraídos a ../styles/AboutUs.css
 * - Animaciones con Framer Motion.
 * - Iconos con lucide-react (opcionales).
 */
export default function QuienesSomosSection({
  id = "quienes-somos",
  className = "",
  eyebrow = "Nuestra historia",
  title = "¿Quiénes somos?",
  intro = "Hace años nos dimos cuenta de que nos faltaba algo en la universidad...",
  foundersHref = "https://startuc3m.com/equipo/viejas-glorias/",
  foundersText =
    "Javier Sánchez, Pablo Lorenzo, Aníbal Vera, Alejandro Luengo, David Arnedo y Carlos Delgado",
  eventHref = "http://alternativaemprender.com/",
  eventName = "Alternativa Emprender",
  ctaHref = "#starter-cta",
  ctaText = "Conoce nuestra comunidad",
  dateLabel = "Primavera de 2013",
  highlightTitle = "La semilla de Start UC3M",
  highlightItems = [
    "Conectar talento diverso: perfiles técnicos, diseño y negocio.",
    "Nace el evento Alternativa Emprender.",
    "Referentes emprendedores inspiran a la comunidad universitaria.",
  ],
} = {}) {
  return (
    <section id={id} className={`qs-section ${className}`} aria-labelledby={`${id}-title`}>
      {/* Decoración de fondo */}
      <div className="qs-bg" aria-hidden></div>
      <div className="qs-blob qs-blob--tr" aria-hidden></div>
      <div className="qs-blob qs-blob--bl" aria-hidden></div>
      <div className="qs-shadow" aria-hidden></div>

      <div className="qs-container">
        <div className="qs-header">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="qs-eyebrow"
          >
            <Sprout size={16} /> {eyebrow}
          </motion.span>

          <motion.h2
            id={`${id}-title`}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="qs-title"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="qs-intro"
          >
            {intro}
          </motion.p>
        </div>

        <div className="qs-grid">
          {/* Columna izquierda – narrativa */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="qs-card"
          >
            <p className="qs-p">
              Así es cómo se plantó la semilla de lo que acabaría siendo
              <span className="qs-strong"> Start UC3M</span>, en primavera de 2013, cuando {" "}
              <a
                href={foundersHref}
                target="_blank"
                rel="noreferrer"
                className="qs-link"
              >
                {foundersText}
              </a>
              , que por aquel entonces eran alumnos de ADE en la UC3M, se dieron cuenta de que en la Universidad faltaba una iniciativa con la que conectar el talento de los distintos perfiles: técnicos, de diseño, de negocio, etc.
            </p>

            <p className="qs-p">
              De esta forma se decidieron a montar la primera edición de {" "}
              <a
                href={eventHref}
                target="_blank"
                rel="noreferrer"
                className="qs-link qs-link--inline"
              >
                {eventName} <Rocket size={16} aria-hidden="true" />
              </a>
              , un evento multitudinario en el que trajeron a numerosos emprendedores que por aquel momento estaban triunfando.
            </p>

            <div className="qs-cta-wrap">
              <a href={ctaHref} className="StarterSection-cta">
                {ctaText}
              </a>
            </div>
          </motion.div>

          {/* Columna derecha – destacados */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="qs-card"
            aria-label="Hitos"
          >
            <div className="qs-aside-head">
              <div className="qs-icon-box">
                <Users2 size={24} />
              </div>
              <div>
                <p className="qs-kicker">{dateLabel}</p>
                <h3 className="qs-subtitle">{highlightTitle}</h3>
              </div>
            </div>

            <ul className="qs-list">
              {highlightItems.map((item, idx) => (
                <li key={idx} className="qs-list-item">
                  {item}
                </li>
              ))}
            </ul>

            <div className="qs-cta-wrap">
              <a href={eventHref} target="_blank" rel="noreferrer" className="StarterSection-cta">
                Ver el evento
              </a>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
