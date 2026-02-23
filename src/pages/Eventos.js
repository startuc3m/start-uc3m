import React, { useState, useEffect } from 'react';
import "../index.css";
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";
import location from '../assets/StartXperience/location.jpg';

function Eventos() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    const [students, setStudents] = useState(0);
    const [projects, setProjects] = useState(0);

    useEffect(() => {
        const targetDate = new Date('2025-11-22T00:00:00').getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Animación de contadores
    useEffect(() => {
        const studentsTarget = 150;
        const projectsTarget = 20;
        const duration = 2000; // 2 segundos
        const steps = 60;
        const studentsIncrement = studentsTarget / steps;
        const projectsIncrement = projectsTarget / steps;
        let currentStep = 0;

        const counterInterval = setInterval(() => {
            currentStep++;
            
            if (currentStep <= steps) {
                setStudents(Math.floor(studentsIncrement * currentStep));
                setProjects(Math.floor(projectsIncrement * currentStep));
            } else {
                setStudents(studentsTarget);
                setProjects(projectsTarget);
                clearInterval(counterInterval);
            }
        }, duration / steps);

        return () => clearInterval(counterInterval);
    }, []);

    return (
        <div>
            <Navbar />
            <section className='camp-section'>
                <div className='camp-header'>
                    <h1 className='camp-title'>StartXperience</h1>
                    <h2 className='camp-subtitle'>En colaboración con Racks</h2>
                    <div className='countdown-container'>
                        <p className='countdown-date'>12 de marzo de 2026</p>
                        <a href='https://www.google.com/maps/place/TeamLabs%2F+Madrid/@40.4182068,-3.7070443,1088m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd42262860feda0b:0xa48c5345fe9381e6!8m2!3d40.4182068!4d-3.7070443!16s%2Fg%2F1q64fqg9_?entry=ttu&g_ep=EgoyMDI2MDIxMC4wIKXMDSoASAFQAw%3D%3D' target='_blank' rel='noopener noreferrer' className='countdown-location'>TeamLabs Madrid</a>
                        <div className='stats-container'>
                            <div className='stat-item'>
                                <span className='stat-number'>+{students}</span>
                                <span className='stat-label'>Estudiantes estimados</span>
                            </div>
                            <div className='stat-item'>
                                <span className='stat-number'>+{projects}</span>
                                <span className='stat-label'>Proyectos expuestos en stands</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className='what-section'>
                <div className='what-container'>
                    <div className='what-row'>
                        <h2 className='what-title'>¿Qué es StartXperience?</h2>
                    </div>

                    <div className='what-row'>
                        <div className='what-text full-width'>
                            <p>
                                StartXperience es un evento presencial de un día que reúne astartups en fase presseed, 
                                empresas y profesionales delecosistema emprendedor. Además de contar con la presencia deinversores,
                                lanzaderas, incubadoras, etc.  
                                Se trata de un formatoinnovador que recoge todas las iniciativas relacionadas con elemprendimiento que
                                se están desarrollando en Madrid.
                            </p>
                        </div>
                    </div>

                    <div className='what-row objectives-row'>
                        <div className='objectives-column'>
                            <h3 className='objectives-title'>Un espacio donde:</h3>
                            <ul className='objectives-list highlighted'>
                                <li>Los proyectos se exponen de forma real</li>
                                <li>Los asistentes reciben formación práctica</li>
                                <li>Profesionales conectan con talento joven</li>
                                <li>Se genera comunidad, visibilidad y oportunidades</li>
                            </ul>
                        </div>
                        <div className='objectives-column'>
                            <h3 className='objectives-title'>Objetivo del evento:</h3>
                            <ul className='objectives-list'>
                                <li>Impulsar proyectos universitarios en fase temprana</li>
                                <li>Dar visibilidad a ideas con potencial real</li>
                                <li>Conectar estudiantes con empresas y referentes</li>
                                <li>Crear un evento de referencia para emprendedores en madrid</li>
                            </ul>
                        </div>
                    </div>

                    <div className='what-row speakers-section'>
                        <div className='what-text full-width'>
                            <h1>Ponentes confirmados</h1>
                            
                            <div className='speakers-grid'>
                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/carlos-adams/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/carlos_adams.jpg')} alt='Carlos Adams' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Carlos Adams</h4>
                                    <p className='speaker-role'>CEO de Racks</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/nacho-senda/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/Nacho_Senda.jpg')} alt='Nacho Sánchez' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Nacho Sánchez</h4>
                                    <p className='speaker-role'>Early-Stage Investor</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/borjavv/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/borja_vega.jpg')} alt='Borja Vega' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Borja Vega</h4>
                                    <p className='speaker-role'>Mentor & Investor</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/joaquinwulin/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/joaquin_wu_ling.jpg')} alt='Joaquín Wu Ling' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Joaquín Wu Lin</h4>
                                    <p className='speaker-role'>Program Manager at Tetuan Valley</p>
                                </div>

                                {/*<div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/pablo-recuenco-pizarro-36716b36/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/pablo_recuenco.jpg')} alt='Pablo Recuenco' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Pablo Recuenco</h4>
                                    <p className='speaker-role'>CEO Morrison Shoes</p>
                                </div>*/}

                                {/*<div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/martina-capel-mart%C3%ADnez-89649a224/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/martina_capel.jpg')} alt='Martina Capel' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Martina Capel</h4>
                                    <p className='speaker-role'>CEO One Dilema</p>
                                </div>*/}

                                {/*<div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/rociobotella/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/Rocio-botella.jpg')} alt='Rocío Botella' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Rocío Botella</h4>
                                    <p className='speaker-role'>Founder at THE-ARE</p>
                                </div>*/}
                            </div>
                        </div>
                    </div>

                    <div className='what-row second-section'>
                        <div className='what-text full-width'>
                            <h3>Estructura del programa</h3>
                            
                            <div className='program-structure'>
                                <div className='program-block'>
                                    <div className='program-number'>01.</div>
                                    <div className='program-content'>
                                        <h4>10:30 - Apertura institucional</h4>
                                        <p>Bienvenida por parte de la asociación, TeamLabs y discurso de inaguración</p>
                                        <ul>
                                            <li>Angel Niño</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>02.</div>
                                    <div className='program-content'>
                                        <h4>11:00 - 1º Ponencia</h4>
                                        <p>Inteligencia Artificial aplicada a Startups</p>
                                        <ul>
                                            <li>CEO de Racks: Carlos Adams</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>03.</div>
                                    <div className='program-content'>
                                        <h4>13:30 - Mesa redonda</h4>
                                        <p>Retos actuales del emprendimiento</p>
                                        <ul>
                                            <li>Nacho Sánchez (Early-Stage Investor)</li>
                                            <li>Borja Vega (Mentor e Inversor)</li>
                                            <li>Joaquín Wu Lin (Program Manager at Tetuán Valley)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>04.</div>
                                    <div className='program-content'>
                                        <h4>16:30 - Mesa redonda</h4>
                                        <p>Emprendimiento en el sector de la moda</p>
                                        <ul>
                                            <li>Pablo Recuenco (CEO de Morrison Shoes)</li>
                                            <li>Martina Capel (CEO de One Dilema)</li>
                                            <li>Rocío Botellas (Founder The-Are)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>05.</div>
                                    <div className='program-content'>
                                        <h4>18:00 - Madrid Start-Up Bar</h4>
                                        <ul>
                                            <li>3-5 pitch decks de Start-Ups</li>
                                            <li>Presentación final ante jurado/inversores</li>
                                            <li>Feedback real y oportunidades posteriores</li>
                                            <li>Agradecimientos</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>06.</div>
                                    <div className='program-content'>
                                        <h4>19:30 - Cierre Oficial</h4>
                                        <ul>
                                            <li>Networking final</li>
                                            <li>Despedidas</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='event-location'>
                        <h1 className='location-title'>¿Dónde será?</h1>
                        <div className='event-location-content'>
                            <div className='location-text'>
                                <p>TeamLabs/ Madrid</p>
                                <p>Dirección: Plaza de San Martín, 1</p>
                                <p>TeamLabs es un Laboratorio de Aprendizaje Radical referente por su metodología innovadora. Además, es un espacio para eventos en Madrid, abierto a personas y organizaciones que quieran impulsar la creación disruptiva transversal artística, cultural, científica, tecnológica, social y medioambiental, junto a nuestra comunidad emprendedora.</p>
                            </div>
                            <div className='location-photo'>
                                <img src={location} alt="Location"></img>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Eventos;
