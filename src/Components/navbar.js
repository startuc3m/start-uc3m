import React, { useState } from "react";
import "../styles/Navbar.css";
import { Link} from "react-router-dom";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
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
        <li><a href="" onClick={() => setIsMenuOpen(false)}>EVENTOS</a></li>
        <li><Link to="/equipo" onClick={() => setIsMenuOpen(false)}>EQUIPO</Link></li>
        <li><a href="#quienes-somos" onClick={() => setIsMenuOpen(false)}>SOBRE NOSOTROS</a></li>
        <li><a href="#blog" onClick={() => setIsMenuOpen(false)}>BLOG</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;