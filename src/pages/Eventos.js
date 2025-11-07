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

    return (
        <div>
            <Navbar />
            <section className='eventos-section'>
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
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default Eventos;
