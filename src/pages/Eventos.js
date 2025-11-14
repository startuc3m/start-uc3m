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

    const [currentSlide, setCurrentSlide] = useState(0);
    const [nextSlide, setNextSlide] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const backgroundImages = [
        'startcamp_bg.jpg',
        'startcamp_bg_2.jpg',
        'startcamp_bg_3.jpg',
        'startcamp_bg_4.jpg'
    ];

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

    // Efecto para el slideshow automático
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setIsTransitioning(true);
            
            // Calcular el siguiente slide
            const next = (currentSlide + 1) % backgroundImages.length;
            setNextSlide(next);
            
            // Después de un pequeño delay, actualizar el slide actual
            setTimeout(() => {
                setCurrentSlide(next);
                setIsTransitioning(false);
            }, 1000); // Duración de la transición CSS
            
        }, 5000); // Cambia cada 5 segundos

        return () => clearInterval(slideInterval);
    }, [currentSlide, backgroundImages.length]);

    return (
        <div>
            <Navbar />
            <section className='camp-section'>
                {/* Slideshow de fondo */}
                <div className='slideshow-container'>
                    {backgroundImages.map((image, index) => {
                        let slideClass = 'slide';
                        
                        if (index === currentSlide && !isTransitioning) {
                            // Slide actual visible
                            slideClass += ' active';
                        } else if (index === currentSlide && isTransitioning) {
                            // Slide actual saliendo
                            slideClass += ' exiting';
                        } else if (index === nextSlide && isTransitioning) {
                            // Slide entrando
                            slideClass += ' active';
                        }
                        // Todos los demás slides permanecen con la clase base (fuera de pantalla)
                        
                        return (
                            <div
                                key={index}
                                className={slideClass}
                                style={{
                                    backgroundImage: `url(${require(`../assets/${image}`)})`
                                }}
                            />
                        );
                    })}
                </div>
                <div className='camp-header'>
                    <h1 className='camp-title'>START CAMP 2025/26</h1>
                    <div className='countdown-container'>
                        <div className='countdown-timer'>
                            <div className='countdown-item'>
                                <span className='countdown-number'>{timeLeft.days}</span>
                                <span className='countdown-label'>Días</span>
                            </div>
                            <div className='countdown-item'>
                                <span className='countdown-number'>{timeLeft.hours}</span>
                                <span className='countdown-label'>Horas</span>
                            </div>
                            <div className='countdown-item'>
                                <span className='countdown-number'>{timeLeft.minutes}</span>
                                <span className='countdown-label'>Minutos</span>
                            </div>
                            <div className='countdown-item'>
                                <span className='countdown-number'>{timeLeft.seconds}</span>
                                <span className='countdown-label'>Segundos</span>
                            </div>
                        </div>
                        <p className='countdown-date'>22 y 23 de Noviembre de 2025</p>
                        <a href="https://pci.jotform.com/form/253063919904058" target="_blank" rel="noopener noreferrer">
                            <button className='register-startcamp'>¡Últimas entradas!</button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Sección informativa debajo del slideshow */}
            <section className='what-section'>
                <div className='what-container'>
                    {/* Título principal centrado */}
                    <div className='what-row'>
                        <h2 className='what-title'>¿Qué es Startcamp?</h2>
                    </div>

                    {/* Primera fila: texto izquierda, imagen derecha */}
                    <div className='what-row'>
                        <div className='what-text'>
                            <p>
                                Startcamp es un hackathon de emprendimiento organizado por Start UC3M que cuenta con la colaboración de la UC3M. 
                                Durante un fin de semana tendrás la oportunidad de diseñar una idea de negocio con un equipo, contar con la mentoría de expertos y ganar premios.
                                Se trata de un espacio transformador en el que acercar a los jóvenes a sus sueños.
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
                            <img src={require('../assets/startcamp_info3.jpg')} alt='Ubicación La Nave Madrid' />
                        </div>
                    </div>
                    <a href="https://pci.jotform.com/form/253063919904058" target="_blank" rel="noopener noreferrer">
                            <button className='register-startcamp'>¡No lo dejes pasar!</button>
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Eventos;
