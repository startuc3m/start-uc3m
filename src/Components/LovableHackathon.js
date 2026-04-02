import React from 'react';
import '../index.css';
import '../styles/LovableHackathon.css';

function LovableHackathon() {
    return (
        <div>
            <section className='lovable-hero'>
                <div className='lovable-hero-content'>
                    <p className='lovable-kicker'>Nuevo evento</p>
                    <h1>Lovable Hackathon</h1>
                    <h2>Construye, lanza y valida en 24 horas</h2>
                    <p className='lovable-date'>8 de abril de 2026 · Campus Puerta de Toledo UC3M</p>
                    <p className='lovable-description'>
                        Un hackathon diseñado para estudiantes que quieren convertir ideas en productos reales.
                        Equipos multidisciplinares, mentoría continua y una demo final ante profesionales del ecosistema.
                    </p>
                    <a
                        className='lovable-cta'
                        href='https://luma.com/3t2gsopx'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Quiero participar
                    </a>
                </div>
            </section>

            <section className='lovable-info'>
                <div className='lovable-grid'>
                    <article className='lovable-card'>
                        <h3>Formato</h3>
                        <ul>
                            <li>Equipos de 3 a 5 personas</li>
                            <li>Retos reales propuestos por partners</li>
                            <li>Sprints con entregables por fases</li>
                        </ul>
                    </article>

                    <article className='lovable-card'>
                        <h3>Incluye</h3>
                        <ul>
                            <li>Mentorías de producto y negocio</li>
                            <li>Workshops express de validación</li>
                            <li>Networking con founders e inversores</li>
                        </ul>
                    </article>

                    <article className='lovable-card'>
                        <h3>Premios</h3>
                        <ul>
                            <li>Acceso a programa de incubación</li>
                            <li>Créditos de herramientas digitales</li>
                            <li>Seguimiento para pilotos con empresas</li>
                        </ul>
                    </article>
                </div>
            </section>
        </div>
    );
}

export default LovableHackathon;
