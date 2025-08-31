import React from "react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <img src={require("../assets/logohome.png")} alt="start_ EMPRENDEDORES | UC3M Logo" className="navbar__logo-img" />
      </div>
      <ul className="navbar__links">
        <li><a href="#events">EVENTS</a></li>
        <li><a href="#community">COMMUNITY</a></li>
        <li><a href="#about">ABOUT US</a></li>
        <li><a href="#blog">BLOG</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;