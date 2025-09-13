import React from "react";
import "../styles/Navbar.css";
import { Link} from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <Link to="/" className="navbar-logo">
          <img src={require("../assets/logohome.png")} alt="start_ EMPRENDEDORES | UC3M Logo" className="navbar__logo-img" />
        </Link>
      </div>
      <ul className="navbar__links">
        <li><a href="">EVENTOS</a></li>
        <li> <Link to="/equipo">EQUIPO</Link> </li>
        <li><a href="#quienes-somos">SOBRE NOSOTROS</a></li>
        <li><a href="#blog">BLOG</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;