import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../index.css";
import Navbar from "../components/navbar";
import Hero from "../components/Hero";
import LogosBand from "../components/LogosBand";
import QuoteSection from "../components/Quote";
import StarterSection from "../components/StarterSection.js";
import DividerOfSections from "../components/DividerOfSections.js";
import QuienesSomos from "../components/AboutUs.js";
import Quote2 from "../components/Quote2.js";
import PodcastEmbed from "../components/Podcast.js";
import Contact from "../components/Contacto.js"
import Footer from "../components/Footer.js"

function Home() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    const [isClosed, setIsClosed] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const targetDate = new Date('2026-03-12T00:00:00').getTime();

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

    useEffect(() => {
        const controlNavbarVisibility = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    // Scrolling down and past 100px - navbar is hidden
                    setIsNavbarVisible(false);
                } else {
                    // Scrolling up - navbar is visible
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

    return (
        <div>
            <Navbar />
            <div className={`event-banner ${isClosed ? 'event-banner--hidden' : ''} ${!isNavbarVisible ? 'event-banner--top' : ''}`}>
                <button className="close-banner" onClick={closeBanner}>×</button>
                <div className="banner-content">
                    <h2 className="banner-title">StartXperience</h2>
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
                    <Link to="/eventos" className="banner-cta">
                        ¡Quiero saber más! →
                    </Link>
                </div>
            </div>
            <Hero />
            <LogosBand />
    
            <StarterSection />
            <DividerOfSections />
            <Quote2 />
            <QuienesSomos />
            <DividerOfSections />
            <PodcastEmbed />
            <DividerOfSections />
            <Contact />
            <QuoteSection />
            <DividerOfSections />
            <Footer />
        </div>
    );
};

export default Home;