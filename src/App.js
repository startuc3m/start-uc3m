// src/App.js
import React from "react";
import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home.js";
import Equipo from "./pages/Equipo.js";
import Eventos from "./pages/Eventos.js";
import Sponsors from "./pages/Sponsors.js";
import Resources from "./pages/Resources.js";
import Socios from "./pages/Socios.js";
import SociosGracias from "./pages/SociosGracias.js";
import NoEncontrada from "./pages/NoEncontrada.js";
import Privacidad from "./pages/Privacidad.js";
import SociosTelefono from "./pages/SociosTelefono.js";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/patrocinadores" element={<Sponsors />} />
        <Route path="/recursos" element={<Resources />} />
        <Route path="/socios" element={<Socios />} />
        <Route path="/socios/gracias" element={<SociosGracias />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/socios/telefono" element={<SociosTelefono />} />
        {/* Cualquier otra URL: sin esto no se pinta nada y queda a la
            vista el fondo del body, una pantalla morada vacia. */}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
  );
    
}

export default App;
