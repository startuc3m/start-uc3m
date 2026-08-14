import React from 'react';
import '../styles/StartTech.css';

function StartTech() {
    return (
        <div className='starttech-page'>
            <section className='starttech-hero'>
                <div className='starttech-hero__content'>
                    <div className='starttech-hero__copy'>
                        <p className='starttech-kicker'>Ideatón tecnológica</p>
                        <h1>Start Tech</h1>
                        <h2>La ideatón tecnológica de Start UC3M</h2>
                        <p className='starttech-meta'>25 y 26 de abril de 2026</p>
                        <p className='starttech-description'>
                            Un evento diseñado para llevar el emprendimiento al mundo de la ingeniería.
                            Mismo espíritu, nueva dimensión: un reto tech real, equipos multidisciplinares,
                            MVP funcional y pitch final ante jurado.
                        </p>
                        <p className='starttech-description'>
                            <a className='starttech-dossier-link' href='/StartTech_Slides.pdf' download='StartTech_Slides.pdf'>Descarga el dossier completo</a>
                        </p>

                        <div className='starttech-badges'>
                            <span>17€ entrada</span>
                            <span>30-40 participantes</span>
                            <span>Comida y materiales incluidos</span>
                        </div>

                        <a className='starttech-cta' href='https://www.neonpass.es/event/39d6a31e-6944-45bd-aff4-78d5167cd51b' target='_blank' rel='noopener noreferrer'>
                            Compra tu entrada ya
                        </a>
                    </div>

                    <div className='starttech-hero__panel'>
                        <div className='starttech-panel-card accent'>
                            <span className='panel-label'>El gap</span>
                            <strong>La barrera inicial</strong>
                            <p>El emprendimiento se percibe como “cosa de ADE”. Muchos ingenieros no se acercan porque creen que no es para ellos.</p>
                        </div>

                        <div className='starttech-panel-card'>
                            <span className='panel-label'>La oportunidad</span>
                            <strong>Ingeniería + negocio</strong>
                            <p>Los mejores productos tech los crean ingenieros que entienden de negocio. Start Tech abre esa puerta.</p>
                        </div>

                        <div className='starttech-panel-card'>
                            <span className='panel-label'>La solución</span>
                            <strong>Evento diseñado para ellos</strong>
                            <p>Reto tech real, ponentes ingenieros que emprendieron y equipos multidisciplinares para construir un MVP.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className='starttech-info'>
                <div className='starttech-section-header'>
                    <p className='starttech-section-kicker'>¿Qué es el Start Tech?</p>
                    <h3>Reto real, equipos, MVP y pitch</h3>
                </div>

                <div className='starttech-grid starttech-grid--two'>
                    <article className='starttech-card'>
                        <h3>Reto real</h3>
                        <ul>
                            <li>Un representante de la empresa presenta un problema vivido de verdad.</li>
                            <li>Los equipos compiten para resolverlo.</li>
                            <li>La propuesta conecta ingeniería y negocio.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>Equipos multidisciplinares</h3>
                        <ul>
                            <li>Equipos diseñados por la organización.</li>
                            <li>Ingenieros + perfiles de negocio trabajando juntos.</li>
                            <li>Acompañamiento de mentores durante todo el proceso.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>MVP</h3>
                        <ul>
                            <li>Cada equipo debe construir un prototipo mínimo.</li>
                            <li>La meta es demostrar que la solución funciona.</li>
                            <li>Se prioriza una salida tangible y realista.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>Pitch final</h3>
                        <ul>
                            <li>El domingo cada equipo presenta su solución.</li>
                            <li>La audiencia incluye fundadores, inversores y perfiles tech.</li>
                            <li>El feedback final ayuda a validar el potencial del proyecto.</li>
                        </ul>
                    </article>
                </div>

                <div className='starttech-section-header starttech-section-header--spaced'>
                    <p className='starttech-section-kicker'>El fin de semana</p>
                    <h3>Agenda del evento</h3>
                </div>

                <div className='starttech-schedule'>
                    <article className='starttech-schedule-card'>
                        <span className='schedule-day'>Sábado 25 de abril</span>
                        <ul>
                            <li>Bienvenida</li>
                            <li>Lanzamiento del reto por el representante de la empresa partner</li>
                            <li>Sesiones de trabajo con mentores asignados</li>
                            <li>Ponencias específicas al reto planteado</li>
                            <li>Construcción del MVP</li>
                            <li>Cena en grupo</li>
                        </ul>
                    </article>

                    <article className='starttech-schedule-card accent'>
                        <span className='schedule-day'>Domingo 26 de abril</span>
                        <ul>
                            <li>Sprint final y preparación del pitch</li>
                            <li>Taller de preparación del pitch</li>
                            <li>Presentaciones ante jurado</li>
                            <li>Entrega de premios</li>
                        </ul>
                    </article>
                </div>
                <a className='starttech-cta starttech-cta--center' href='https://www.neonpass.es/event/39d6a31e-6944-45bd-aff4-78d5167cd51b' target='_blank' rel='noopener noreferrer'>
                    ¿A qué estás esperando?
                </a>

                <div className='starttech-section-header starttech-section-header--spaced'>
                    <p className='starttech-section-kicker'>Mentores y jurado</p>
                    <h3>Acompañamiento y feedback profundo</h3>
                </div>

                <div className='starttech-grid starttech-grid--two'>
                    <article className='starttech-card'>
                        <h3>Mentores</h3>
                        <ul>
                            <li>Acompañan a 3 equipos durante todo el fin de semana.</li>
                            <li>Hay 2 mentores por cada 3 equipos asignados.</li>
                            <li>El objetivo es ofrecer feedback profundo.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>Jurado</h3>
                        <ul>
                            <li>Evalúa los pitches finales del domingo.</li>
                            <li>Cada equipo tiene 5 min de presentación + 3 min de preguntas.</li>
                            <li>Participan perfiles técnicos que han dado el salto al emprendimiento.</li>
                        </ul>
                    </article>
                </div>

                <div className='starttech-section-header starttech-section-header--spaced'>
                    <p className='starttech-section-kicker'>Empresas y partners</p>
                    <h3>Conectar con talento tech universitario</h3>
                </div>

                <div className='starttech-grid'>
                    <article className='starttech-card'>
                        <h3>Partner principal</h3>
                        <ul>
                            <li>Lanza el reto con un problema real de su empresa.</li>
                            <li>Máxima visibilidad durante el evento.</li>
                            <li>Acceso a los equipos ganadores y posibilidad de reclutar talento.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>Valor para la empresa</h3>
                        <ul>
                            <li>Captación de talento universitario con mentalidad emprendedora.</li>
                            <li>Ideas frescas trabajadas durante todo un fin de semana.</li>
                            <li>Visibilidad de marca en materiales, RRSS y comunicaciones.</li>
                        </ul>
                    </article>

                    <article className='starttech-card'>
                        <h3>Networking</h3>
                        <ul>
                            <li>Conexión con el ecosistema emprendedor de la UC3M y universidades de Madrid.</li>
                            <li>Relación con perfiles técnicos y de negocio.</li>
                            <li>Espacio para colaboración y oportunidades futuras.</li>
                        </ul>
                    </article>
                </div>

                <div className='starttech-section-header starttech-section-header--spaced'>
                    <p className='starttech-section-kicker'>Datos clave</p>
                    <h3>Lo esencial del evento</h3>
                </div>

                <div className='starttech-highlights'>
                    <div className='starttech-highlight-item'>
                        <span className='highlight-number'>01</span>
                        <p>Un fin de semana donde equipos resuelven un problema real y crean una idea de negocio viable.</p>
                    </div>
                    <div className='starttech-highlight-item'>
                        <span className='highlight-number'>02</span>
                        <p>Los mejores productos tech nacen de ingenieros que entienden de negocio.</p>
                    </div>
                    <div className='starttech-highlight-item'>
                        <span className='highlight-number'>03</span>
                        <p>Start Tech conecta universidad, tecnología y emprendimiento en un formato práctico y real.</p>
                    </div>
                </div>                
                <a className='starttech-cta starttech-cta--center' href='https://www.neonpass.es/event/39d6a31e-6944-45bd-aff4-78d5167cd51b' target='_blank' rel='noopener noreferrer'>
                    ¡Última oportunidad!
                </a>
            </section>
        </div>
    );
}

export default StartTech;