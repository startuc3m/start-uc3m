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
            <section className='eventos-section'>
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
                <div className='eventos-header'>
                    <h1 className='eventos-title'>START CAMP 2025/26</h1>
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
                            <button className='register-startcamp'>¡Apúntate ya!</button>
                        </a>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default Eventos;
