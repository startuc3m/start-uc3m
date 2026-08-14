import React, { useState, useEffect } from "react";
import "../styles/Navbar.css";
import { Link} from "react-router-dom";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down and past 100px
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);

      // cleanup function
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${isVisible ? 'navbar--visible' : 'navbar--hidden'}`}>
        <div className="navbar__logo">
          <Link to="/" className="navbar-logo">
            <img src={require("../assets/logohome.png")} alt="start_ EMPRENDEDORES | UC3M Logo" className="navbar__logo-img" />
          </Link>
        </div>
        
        <button className="navbar__toggle" onClick={toggleMenu}>
          <span className="navbar__toggle-bar"></span>
          <span className="navbar__toggle-bar"></span>
          <span className="navbar__toggle-bar"></span>
        </button>

        <ul className={`navbar__links ${isMenuOpen ? 'navbar__links--active' : ''}`}>
          <li className="navbar__events-item">
            <Link to="/eventos" onClick={closeMenu}>EVENTOS</Link>
            <ul className="navbar__events-menu">
              <li>
                <Link to="/eventos#startxperience" onClick={closeMenu}>StartXperience</Link>
              </li>
              <li>
                <Link to="/eventos#lovable-hackathon" onClick={closeMenu}>Lovable Hackathon</Link>
              </li>
            </ul>
          </li>
          <li><Link to="/equipo" onClick={closeMenu}>EQUIPO</Link></li>
          <li><Link to="/patrocinadores" onClick={closeMenu}>PATROCINADORES</Link></li>
          <li><Link to="/recursos" onClick={closeMenu}>RECURSOS</Link></li>
        </ul>
      </nav>
      
      {/* Mobile overlay */}
      <div 
        className={`navbar__overlay ${isMenuOpen ? 'navbar__overlay--active' : ''}`}
        onClick={closeMenu}
      />
    </>
  );
}

export default Navbar;