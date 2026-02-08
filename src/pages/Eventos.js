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
                    <h2 className='camp-subtitle'>En colaboración con Racks (y otros partners)</h2>
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

            {/* Sección informativa debajo del slideshow */}
            <section className='what-section'>
                <div className='what-container'>
                    {/* Título principal centrado */}
                    <div className='what-row'>
                        <h2 className='what-title'>¿Qué es StartXperience?</h2>
                    </div>

                    {/* Primera fila: texto izquierda, imagen derecha */}
                    <div className='what-row'>
                        <div className='what-text'>
                            <p>
                                StartXperience es un evento presencial de un día que reúne a startups universitarias, 
                                estudiantes con ideas de negocio, empresas y profesionales del ecosistema emprendedor.
                            </p>
                            <p>
                                Puedes traer tu propia idea y formar equipo o unirte al proyecto que más te guste de los disponibles.
                                Ciertos profesionales de renombre también nos complacen con ponencias que hacen la experiencia todavía mejor si cabe.
                                Estos dos intensos días están repletos de oportunidades de networking con otros jóvenes inquietos.
                            </p>
                            <p>
                                Es una experiencia inolvidable en la que aprender y dar un paso más en el camino hacia tu futuro.
                            </p>
                        </div>
                        <div className='what-image'>
                            <img src={require('../assets/startcamp_info1.jpg')} alt='Startcamp evento' />
                        </div>
                    </div>

                    {/* Segunda fila: texto izquierda, imagen derecha */}
                    <div className='what-row second-section'>
                        <div className='what-image'>
                            <img src={require('../assets/startcamp_info2.jpg')} alt='Qué necesito para Startcamp' />
                        </div>
                        <div className='what-text'>
                            <h3>¿Qué necesito?</h3>
                            <p>
                                Será necesario presentar tu entrada al llegar.
                                El desayuno y la comida serán servidos los dos días, por lo que no será necesario que traigáis comida.
                                Es recomendable traer ordenador o el dispositivo en el que más cómodos os sintáis trabajando.
                                Tendréis materiales diversos para trabajar en el evento, como bolígrafos y blocs de notas. Aún así, sois bienvenidos a traer aquello que prefiráis a la hora de trabajar en equipo en el desarrollo de un proyecto.
                            </p>
                            <p>
                                Por último, lo más importante es traer ilusión y ganas de trabajar.
                            </p>
                        </div>
                    </div>

                    {/* Tercera fila: texto izquierda, imagen derecha */}
                    <div className='what-row'>
                        <div className='what-text'>
                            <h3>¿Dónde está Startcamp?</h3>
                            <p>
                                La Nave. <br />
                                Calle Cifuentes, 5, 28021, Madrid.<br />
                                El metro más cercano es VILLAVERDE BAJO-CRUCE
                            </p>
                        </div>
                        <div className='what-image'>
                            <img src={require('../assets/startcamp_info3.png')} alt='Ubicación La Nave Madrid' />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Eventos;
