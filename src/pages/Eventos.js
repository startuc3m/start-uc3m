import React, { useState, useEffect } from 'react';
import "../index.css";
import Navbar from '../components/navbar';
import Footer from '../components/Footer.js';
import "../styles/Eventos.css";
import StartXperience from '../components/StartXperience.js';

function Eventos() {
    return (
        <div>
            <Navbar />
            <StartXperience />
            <Footer />
        </div>
    );
}

export default Eventos;
