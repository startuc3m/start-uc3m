import React from 'react';
import '../styles/Footer.css'
import { footer } from 'framer-motion/client';
import logo from '../assets/logohome.png'
import linkedin from '../assets/linkedin logo.png'
import tiktok from '../assets/Tiktok_blanco.png'
import instagram from '../assets/instagram.webp'
import youtube from '../assets/youtube-app-white-icon.webp'

const Footer = () => {
    return (
        <footer className='footer'>
            <div className='footer-logo'>
                <img src={logo} className='footer-img' alt='Logo'/>
            </div>
            <div className='footer-email'>
                <p>info@startuc3m.org</p>
            </div>
            <div className='footer-content'>
                <a href="https://www.linkedin.com/company/start-uc3m/" target='_blank'>
                    <img src={linkedin} className='footer-rrss'/>
                </a>
                <a href='https://www.tiktok.com/@startuc3m' target='_blank'>
                    <img src={tiktok} className='footer-rrss'/>
                </a>
                <a href='https://www.instagram.com/startuc3m/?hl=es' target='_blank'>
                    <img src={instagram} className='footer-rrss'/>
                </a>
                <a href='https://www.youtube.com/@StartUC3MG' target='_blank'>
                    <img src={youtube} className='footer-rrss youtube'/>
                </a>
            </div>
        </footer>
    );
};

export default Footer