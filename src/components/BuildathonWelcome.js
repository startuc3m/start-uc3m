import React from 'react';
import '../index.css';
import '../styles/BuildathonWelcome.css';

const INSCRIPCION_URL = 'https://luma.com/csfo45ov';

// Para añadir un logo: dejar el archivo en public/Logos/ y poner la ruta en `logo`.
// Si `logo` es null se pinta un hueco reservado con el nombre.
// `hasOwnBackground` para logos que ya vienen con su propio fondo: se muestran
// tal cual, sin el chip blanco que necesitan los logos en negro sobre transparente.
const PATROCINADORES = [
    { name: 'NomuLabs', logo: '/Logos/Nomu_labs.png' },
    { name: 'Pitchless', logo: '/Logos/pitchless_events_logo.jpg', hasOwnBackground: true },
];

function BuildathonWelcome() {
    return (
        <div className='buildathon-page'>
            <section className='buildathon-hero'>
                <div className='buildathon-hero-content'>
                    <div className='buildathon-hero-copy'>
                        <p className='buildathon-kicker'>Próximo evento · Arranque de temporada</p>

                        <h1>Buildathon Pitchless y NomuLabs</h1>
                        <h2>Construye tu primer prototipo con IA en una tarde y conoce Start desde dentro</h2>

                        <p className='buildathon-description'>
                            Abrimos el curso construyendo. Vienes con una idea (o sin ella), te juntas con un equipo
                            y sales con algo que funciona y se puede enseñar. Sin saber programar y sin presentaciones
                            interminables: solo build. Y de paso descubres quiénes somos y cómo se entra en Start.
                        </p>

                        <div className='buildathon-hero-badges'>
                            <span>Jueves 17 de septiembre</span>
                            <span>18:00</span>
                            <span>Campus Puerta de Toledo</span>
                            <span>Abierto a toda la UC3M</span>
                            <span>Sangriada al terminar</span>
                        </div>

                        <div className='buildathon-cta-row'>
                            <a
                                className='buildathon-cta'
                                href={INSCRIPCION_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Reservar plaza
                            </a>
                            <a className='buildathon-cta-secondary' href='#buildathon-reclutamiento'>
                                Quiero entrar en Start
                            </a>
                        </div>

                        <div className='buildathon-sponsors'>
                            <p className='buildathon-sponsors-title'>Con el apoyo de</p>
                            <div className='buildathon-sponsors-logos'>
                                {PATROCINADORES.map(({ name, logo, hasOwnBackground }) =>
                                    logo ? (
                                        <img
                                            key={name}
                                            src={logo}
                                            alt={name}
                                            className={hasOwnBackground ? 'has-own-background' : undefined}
                                        />
                                    ) : (
                                        <span key={name} className='buildathon-sponsor-slot'>
                                            {name}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='buildathon-hero-panel'>
                        <div className='buildathon-panel-card accent'>
                            <span className='panel-label'>18:00 · Arranque</span>
                            <strong>Bienvenida + reto</strong>
                            <p>Qué es Start, qué hacemos este año y cuál es el reto de la tarde.</p>
                        </div>

                        <div className='buildathon-panel-card'>
                            <span className='panel-label'>18:30 · Build time</span>
                            <strong>A construir</strong>
                            <p>Equipos de 3, herramientas de IA y mentores dando vueltas por las mesas.</p>
                        </div>

                        <div className='buildathon-panel-card'>
                            <span className='panel-label'>21:00 · Cierre</span>
                            <strong>Demos + sangriada</strong>
                            <p>Enseñamos lo construido, premios sorpresa y nos quedamos de sangriada para seguir la noche.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className='buildathon-info'>
                <div className='buildathon-section-header'>
                    <p className='buildathon-section-kicker'>Qué encontrarás</p>
                    <h3>Una tarde para construir, no para escuchar</h3>
                </div>

                <div className='buildathon-grid'>
                    <article className='buildathon-card'>
                        <h3>Formato</h3>
                        <ul>
                            <li>Equipos de 3 personas</li>
                            <li>Ven con tu equipo o te lo montamos allí</li>
                            <li>Construcción guiada por mentores</li>
                        </ul>
                    </article>

                    <article className='buildathon-card'>
                        <h3>Agenda</h3>
                        <ul>
                            <li>Bienvenida de Start y reto de la tarde</li>
                            <li>Build time con herramientas de IA</li>
                            <li>Demos, premios y sangriada para cerrar</li>
                        </ul>
                    </article>

                    <article className='buildathon-card'>
                        <h3>Incluye</h3>
                        <ul>
                            <li>Feedback continuo de mentores</li>
                            <li>Acceso directo al proceso de entrada a Start</li>
                            <li>Snacks, premios sorpresa y sangriada después</li>
                        </ul>
                    </article>
                </div>

                <div className='buildathon-highlight-band'>
                    <div className='buildathon-highlight-item'>
                        <span className='highlight-number'>01</span>
                        <p>No hace falta saber programar</p>
                    </div>
                    <div className='buildathon-highlight-item'>
                        <span className='highlight-number'>02</span>
                        <p>No hace falta traer idea ni equipo</p>
                    </div>
                    <div className='buildathon-highlight-item'>
                        <span className='highlight-number'>03</span>
                        <p>Sales con un prototipo hecho el mismo día</p>
                    </div>
                </div>
            </section>

            <section className='buildathon-join' id='buildathon-reclutamiento'>
                <div className='buildathon-join-content'>
                    <p className='buildathon-section-kicker'>Nueva temporada</p>
                    <h3>Este año puedes estar del otro lado</h3>
                    <p className='buildathon-join-text'>
                        El Buildathon es también nuestra puerta de entrada. Buscamos gente nueva para todos los
                        departamentos de Start: si te lo pasas bien construyendo, esta es la forma más fácil de
                        conocernos antes de dar el paso. Y en la sangriada de después es donde se habla de todo
                        esto sin prisa.
                    </p>

                    <div className='buildathon-join-steps'>
                        <div className='buildathon-join-step'>
                            <span>1</span>
                            <p>Vienes al Buildathon y nos conoces trabajando</p>
                        </div>
                        <div className='buildathon-join-step'>
                            <span>2</span>
                            <p>Hablamos de los departamentos y de qué te encaja</p>
                        </div>
                        <div className='buildathon-join-step'>
                            <span>3</span>
                            <p>Te abrimos el proceso de entrada de este curso</p>
                        </div>
                    </div>

                    <a
                        className='buildathon-cta'
                        href={INSCRIPCION_URL}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Apuntarme al Buildathon
                    </a>
                </div>
            </section>
        </div>
    );
}

export default BuildathonWelcome;
