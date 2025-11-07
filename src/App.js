// src/App.js
import React from "react";
import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home.js";
import Equipo from "./pages/Equipo.js";
import Eventos from "./pages/Eventos.js";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/equipo" element={<Equipo />} />
      </Routes>
  );
    
}

export default App;
