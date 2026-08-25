import React, { useEffect } from 'react';
import "../index.css";
import { useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";
import StartXperience from '../components/StartXperience.js';
import CollapsibleEvent from '../components/CollapsibleEvent.js';
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
            {/*<CollapsibleEvent id='start-tech' label='Evento anterior' title='StartTech'>
                <StartTech />
            </CollapsibleEvent>*/}
            <CollapsibleEvent
                id='startxperience'
                label='Evento anterior'
                title='StartXperience'
                defaultOpen
            >
                <StartXperience />
            </CollapsibleEvent>
            <CollapsibleEvent
                id='lovable-hackathon'
                label='Evento anterior'
                title='Lovable Hackathon'
            >
                <LovableHackathon />
            </CollapsibleEvent>
            <Footer />
        </div>
    );
}

export default Eventos;
