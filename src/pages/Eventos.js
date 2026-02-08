import React, { useState, useEffect } from 'react';
import "../index.css";
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";

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
        const studentsTarget = 200;
        const projectsTarget = 30;
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
                        <p className='countdown-date'>7 de marzo de 2026</p>
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
                                StartXperience es un evento presencial de un día que reúne a startups universitarias, 
                                estudiantes con ideas de negocio, empresas y profesionales del ecosistema emprendedor.
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
                            <h1>Ponentes</h1>
                            
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
                                    <a href='https://www.linkedin.com/in/fernandomirallescoll/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/fer_miralles.jpg')} alt='Fernando Miralles' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Fernando Miralles</h4>
                                    <p className='speaker-role'>Campeón de España en Oratoria</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/borja-vazquez-49a05b13/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/borja_vazquez.png')} alt='Borja Vázquez' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Borja Vázquez</h4>
                                    <p className='speaker-role'>CEO de Scalpers</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/pablo-recuenco-pizarro-36716b36/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/pablo_recuenco.jpg')} alt='Pablo Recuenco' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Pablo Recuenco</h4>
                                    <p className='speaker-role'>CEO Morrison Shoes</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/martina-capel-mart%C3%ADnez-89649a224/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/martina_capel.jpg')} alt='Martina Capel' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Martina Capel</h4>
                                    <p className='speaker-role'>CEO One Dilema</p>
                                </div>

                                <div className='speaker-card'>
                                    <a href='https://www.linkedin.com/in/jorgebranger/' target='_blank' rel='noopener noreferrer' className='speaker-photo-link'>
                                        <div className='speaker-photo'>
                                            <img src={require('../assets/StartXperience/ponentes/jorge_branger.jpg')} alt='Jorge Branger' />
                                        </div>
                                    </a>
                                    <h4 className='speaker-name'>Jorge Branger</h4>
                                    <p className='speaker-role'>Voz más joven de Linkedin</p>
                                </div>
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
                                        <h4>Apertura institucional</h4>
                                        <p>Intervención de responsable del ámbito universitario o emprendedor para la apertura del evento</p>
                                        <ul>
                                            <li>Angel Niño</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>02.</div>
                                    <div className='program-content'>
                                        <h4>Bloque 1</h4>
                                        <p>Ponencia sobre Inteligencia Artificial aplicada a Startups</p>
                                        <ul>
                                            <li>CEO de Racks: Carlos Adams</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>03.</div>
                                    <div className='program-content'>
                                        <h4>Bloque 2</h4>
                                        <p>Ponencia de oratoria y pitch</p>
                                        <ul>
                                            <li>Campeón de España en Oratoria: Fernando Miralles</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>04.</div>
                                    <div className='program-content'>
                                        <h4>Bloque 3</h4>
                                        <p>Mesa redonda con referentes del sector de moda</p>
                                        <ul>
                                            <li>CEO de Scalpers: Borja Vázquez</li>
                                            <li>CEO Morrison Shoes: Pablo Recuenco</li>
                                            <li>CEO One Dilema: Martina Capel</li>
                                            <li>Yuxus, Scuffers, Nude project, eme studios</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>05.</div>
                                    <div className='program-content'>
                                        <h4>Bloque 4</h4>
                                        <p>Taller de Linkedin, comunicación o captación de clientes</p>
                                        <ul>
                                            <li>Voz más joven de Linkedin de habla hispana: Jorge Branger</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className='program-block'>
                                    <div className='program-number'>06.</div>
                                    <div className='program-content'>
                                        <h4>Cierre</h4>
                                        <ul>
                                            <li>Anuncio de los 5 proyectos más votados</li>
                                            <li>Presentación final ante jurado/inversores</li>
                                            <li>Feedback real y oportunidades posteriores</li>
                                            <li>Agradecimientos</li>
                                        </ul>
                                    </div>
                                </div>
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
