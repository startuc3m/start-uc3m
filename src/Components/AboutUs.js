import { motion } from "framer-motion";
import { Sprout, Users2, Rocket } from "lucide-react";

/**
 * Componente reutilizable "Sección – ¿Quiénes somos?" SIN Tailwind
 * - Estilos encapsulados con CSS nativo dentro del componente.
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

      {/* Estilos encapsulados */}
      <style>{`
        :root {
          --qs-bg-top: #0E1A52;
          --qs-bg-mid: #1B1464;
          --qs-text: #ffffff;
          --qs-text-muted: rgba(255,255,255,0.8);
          --qs-border: rgba(255,255,255,0.12);
          --qs-surface: rgba(255,255,255,0.06);
          --qs-shadow: 0 20px 40px rgba(0,0,0,0.25);
        }
        .qs-section { position: relative; isolation: isolate; overflow: hidden; font-family: 'Josefin Sans', Arial, sans-serif; }
        .qs-bg { position: absolute; inset: 0; background: linear-gradient(to bottom, var(--qs-bg-top), var(--qs-bg-mid), var(--qs-bg-top)); z-index: -2; }
        .qs-blob { position: absolute; filter: blur(40px); opacity: .3; border-radius: 999px; z-index: -2; }
        .qs-blob--tr { top: -6rem; right: -6rem; width: 20rem; height: 20rem; background: radial-gradient(circle at 30% 30%, #8aa4ff 0%, #7f6bff 40%, transparent 60%); }
        .qs-blob--bl { bottom: -7rem; left: -6rem; width: 24rem; height: 24rem; background: radial-gradient(circle at 70% 70%, #4ad6ff 0%, #38bdf8 40%, transparent 60%); }
        .qs-shadow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, transparent 70%); z-index: -1; pointer-events: none; }

        .qs-container { max-width: 1120px; margin: 0 auto; padding: 6rem 1.5rem; }
        @media (min-width: 768px) { .qs-container { padding: 7rem 1.5rem; } }

        .qs-header { max-width: 720px; margin: 0 auto 3rem; text-align: center; }
        .qs-eyebrow { display: inline-flex; align-items: center; gap: .5rem; padding: .25rem .6rem; border-radius: 999px; border: 1px solid var(--qs-border); background: var(--qs-surface); color: var(--qs-text-muted); font-size: .75rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; backdrop-filter: blur(6px); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .qs-title { margin: 1rem 0 0; color: var(--qs-text); font-weight: 800; font-size: clamp(2rem, 2.3rem + 1vw, 3rem); letter-spacing: -0.02em; text-shadow: 0 1px 0 rgba(0,0,0,.1); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .qs-intro { margin: .75rem auto 0; max-width: 44rem; color: var(--qs-text-muted); font-size: clamp(1rem, .96rem + .3vw, 1.125rem); line-height: 1.7; font-family: 'Josefin Sans', Arial, sans-serif; }

        .qs-grid { display: grid; gap: 2rem; align-items: start; }
        @media (min-width: 900px) { .qs-grid { grid-template-columns: 1fr 1fr; } }

        .qs-card { background: var(--qs-surface); border: 1px solid var(--qs-border); border-radius: 1rem; padding: 1.5rem; box-shadow: var(--qs-shadow); backdrop-filter: blur(6px); }
        @media (min-width: 768px) { .qs-card { padding: 2rem; border-radius: 1.25rem; } }

        .qs-p { color: rgba(255,255,255,.9); line-height: 1.75; margin: 0 0 1rem; font-family: 'Josefin Sans', Arial, sans-serif; }
        .qs-strong { font-weight: 700; }
        .qs-link { color: var(--qs-text); text-decoration: underline; text-decoration-color: rgba(255,255,255,.4); text-underline-offset: 4px; }
        .qs-link:hover { text-decoration-color: rgba(255,255,255,1); }
        .qs-link--inline { display: inline-flex; gap: .35rem; align-items: center; }

        .qs-cta-wrap { text-align: center; margin-top: 1.5rem; }

        .StarterSection-cta {
          background: #fff;
          color: #4267B2;
          font-size: 1.3rem;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 600;
          padding: 18px 80px;
          margin-top: 36px;
          border: none;
          border-radius: 40px;
          cursor: pointer;
          box-shadow: 0px 3px 40px rgba(22,33,90,0.28), 0 0 40px rgba(255,255,255,0.28);
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .StarterSection-cta:hover {
          background: #fff;
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0px 8px 60px rgba(80,105,246,0.28), 0 0 60px rgba(255,255,255,0.28);
        }

        .qs-aside-head { display: flex; align-items: center; gap: .75rem; }
        .qs-icon-box { width: 3rem; height: 3rem; display: grid; place-items: center; border-radius: .9rem; background: rgba(255,255,255,.1); color: var(--qs-text); }
        .qs-kicker { margin: 0; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .2em; font-size: .8rem; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .qs-subtitle { margin: .1rem 0 0; color: var(--qs-text); font-size: 1.25rem; font-weight: 700; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }

        .qs-list { list-style: none; padding: 0; margin: 1.25rem 0 0; display: grid; gap: .75rem; color: rgba(255,255,255,.85); }
        .qs-list-item { border: 1px solid var(--qs-border); background: var(--qs-surface); padding: .75rem; border-radius: .9rem; line-height: 1.6; font-size: .95rem; font-family: 'Josefin Sans', Arial, sans-serif; }
      `}</style>
    </section>
  );
}
