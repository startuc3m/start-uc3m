import React, { useEffect } from 'react';
import "../index.css";
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";
import StartTech from '../components/StartTech.js';
import StartXperience from '../components/StartXperience.js';
import EventSectionDivider from '../components/EventSectionDivider.js';
import LovableHackathon from '../components/LovableHackathon.js';

function Eventos() {
    const location = useLocation();

    useEffect(() => {
        if (!location.hash) {
            return;
        }

        const targetId = location.hash.replace('#', '');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash]);

    return (
        <div>
            <Navbar />
            <section id='start-tech' className='event-anchor-section'>
                <StartTech />
            </section>
            <EventSectionDivider
                label= 'Evento anterior'
                title='StartXperience'
                subtitle=''
            />
            <section id='startxperience' className='event-anchor-section'>
                <StartXperience />
            </section>
            <EventSectionDivider
                label='Evento anterior'
                title='Lovable Hackathon'
                subtitle=''
            />
            <section id='lovable-hackathon' className='event-anchor-section'>
                <LovableHackathon />
            </section>
            <Footer />
        </div>
    );
}

export default Eventos;
