import React, { useState, useEffect } from 'react';
import "../index.css";
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";
import StartXperience from '../components/StartXperience.js';

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
            <StartXperience />
            <Footer />
        </div>
    );
}

export default Eventos;
