import React, { useState, useEffect } from "react";
import "../styles/Banner.css";
import { Link } from "react-router-dom";

// Evento que anuncia el banner. Al cambiar de evento basta con tocar esto.
const EVENTO = {
    titulo: "Buildathon Pitchless y NomuLabs",
    fecha: "2026-09-17T18:00:00",
    enlace: "/eventos#buildathon-welcome-start",
};

const FECHA_EVENTO = new Date(EVENTO.fecha).getTime();

// Devuelve null cuando el evento ya ha pasado, para no dejar una cuenta atras a cero.
function getTimeLeft() {
    const difference = FECHA_EVENTO - Date.now();

    if (difference <= 0) {
        return null;
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
}

function Banner() {
    // Se calcula ya en el primer render: si no, el banner parpadea con ceros un segundo.
    const [timeLeft, setTimeLeft] = useState(getTimeLeft);

    const [isClosed, setIsClosed] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const controlNavbarVisibility = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsNavbarVisible(false);
                } else {
                    setIsNavbarVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlNavbarVisibility);

            return () => {
                window.removeEventListener('scroll', controlNavbarVisibility);
            };
        }
    }, [lastScrollY]);

    const closeBanner = () => {
        setIsClosed(true);
    };

    if (!timeLeft) {
        return null;
    }

    return (
        <div className={`event-banner ${isClosed ? 'event-banner--hidden' : ''} ${!isNavbarVisible ? 'event-banner--top' : ''}`}>
            <button className="close-banner" onClick={closeBanner} aria-label="Cerrar aviso del evento">×</button>
            <div className="banner-content">
                <h2 className="banner-title">{EVENTO.titulo}</h2>
                <div className="banner-countdown">
                    <div className="banner-countdown-item">
                        <span className="banner-number">{timeLeft.days}</span>
                        <span className="banner-label">Días</span>
                    </div>
                    <div className="banner-countdown-item">
                        <span className="banner-number">{timeLeft.hours}</span>
                        <span className="banner-label">Horas</span>
                    </div>
                    <div className="banner-countdown-item">
                        <span className="banner-number">{timeLeft.minutes}</span>
                        <span className="banner-label">Min</span>
                    </div>
                    <div className="banner-countdown-item">
                        <span className="banner-number">{timeLeft.seconds}</span>
                        <span className="banner-label">Seg</span>
                    </div>
                </div>
                <Link to={EVENTO.enlace} className="banner-cta">
                    ¡Quiero saber más! →
                </Link>
            </div>
        </div>
    );
};

export default Banner;
