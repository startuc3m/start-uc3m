import React from 'react';
import '../index.css';
import '../styles/LovableHackathon.css';

function LovableHackathon() {
    return (
        <div className='lovable-page'>
            <section className='lovable-hero'>
                <div className='lovable-hero-content'>
                    <div className='lovable-hero-copy'>
                        <p className='lovable-kicker'>Nuevo evento</p>
                        <h1>Lovable Hackathon</h1>
                        <h2>Crea tu prototipo, app o web con IA, sin programar código</h2>
                        <p className='lovable-description'>
                            Es completamente imposible que dejes pasar la oportunidad de construir desde cero tu
                            propio MVP con IA y acompañado de mentores. Una jornada pensada para pasar de la idea a
                            algo tangible en muy poco tiempo.
                        </p>

                        <div className='lovable-hero-badges'>
                            <span>Miércoles 8 de abril</span>
                            <span>Puerta de Toledo</span>
                            <span>15 equipos de 3 personas</span>
                        </div>

                        <a
                            className='lovable-cta'
                            href='https://luma.com/3t2gsopx'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Reservar plaza
                        </a>
                    </div>

                    <div className='lovable-hero-panel'>
                        <div className='lovable-panel-card accent'>
                            <span className='panel-label'>Arranque</span>
                            <strong>Masterclass de IA</strong>
                            <p>Guillermo García Cubero, fundador de Pipeline Agent.</p>
                        </div>

                        <div className='lovable-panel-card'>
                            <span className='panel-label'>Después</span>
                            <strong>Build time</strong>
                            <p>Construcción directa de vuestro MVP con Lovable.</p>
                        </div>

                        <div className='lovable-panel-card'>
                            <span className='panel-label'>Cierre</span>
                            <strong>Networking + snacks</strong>
                            <p>Tiempo para conectar, compartir ideas y enseñar resultados.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className='lovable-info'>
                <div className='lovable-section-header'>
                    <p className='lovable-section-kicker'>Qué encontrarás</p>
                    <h3>Todo pensado para construir, no para pitchear</h3>
                </div>

                <div className='lovable-grid'>
                    <article className='lovable-card'>
                        <h3>Formato</h3>
                        <ul>
                            <li>15 equipos de 3 personas</li>
                            <li>Ven con tu equipo o ven solo</li>
                            <li>Construcción guiada por mentores</li>
                        </ul>
                    </article>

                    <article className='lovable-card'>
                        <h3>Agenda</h3>
                        <ul>
                            <li>Masterclass de IA con Guillermo García Cubero</li>
                            <li>Construcción del MVP con Lovable</li>
                            <li>Networking + snacks al final</li>
                        </ul>
                    </article>

                    <article className='lovable-card'>
                        <h3>Incluye</h3>
                        <ul>
                            <li>Feedback continuo de mentores</li>
                            <li>Créditos de Lovable incluidos</li>
                            <li>3 premios sorpresa</li>
                        </ul>
                    </article>
                </div>

                <div className='lovable-highlight-band'>
                    <div className='lovable-highlight-item'>
                        <span className='highlight-number'>01</span>
                        <p>Sin necesidad de programar código</p>
                    </div>
                    <div className='lovable-highlight-item'>
                        <span className='highlight-number'>02</span>
                        <p>Feedback de mentores durante todo el proceso</p>
                    </div>
                    <div className='lovable-highlight-item'>
                        <span className='highlight-number'>03</span>
                        <p>Pensado para construir, no para presentar pitches</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LovableHackathon;
