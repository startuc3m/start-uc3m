// src/App.js
import React from "react";
import Navbar from "./Components/navbar.js"
import Hero from "./Components/Hero.js";
import LogosBand from "./Components/LogosBand.js";  
import QuoteSection from "./Components/Quote.js";
import StarterSection from "./Components/StarterSection.js";
import DividerOfSections from "./Components/DividerOfSections.js";

function App() {
  return (
       <div>
      <Navbar />
      <Hero />
      <LogosBand />
      <QuoteSection />
      <DividerOfSections />
      <StarterSection />
    </div>
  );
    
}

export default App;
