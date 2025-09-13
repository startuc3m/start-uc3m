// src/App.js
import React from "react";
import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home.js";
import Equipo from "./pages/Equipo.js";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/equipo" element={<Equipo />} />
      </Routes>
  );
    
}

export default App;
