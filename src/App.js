// src/App.js
import React from "react";
import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home.js";
import Equipo from "./pages/Equipo.js";
import Eventos from "./pages/Eventos.js";
import Sponsors from "./pages/Sponsors.js";
import Resources from "./pages/Resources.js";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/patrocinadores" element={<Sponsors />} />
        <Route path="/recursos" element={<Resources />} />
      </Routes>
  );
    
}

export default App;
