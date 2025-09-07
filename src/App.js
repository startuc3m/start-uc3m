// src/App.js
import React from "react";
import Navbar from "./components/navbar.js"
import Hero from "./components/Hero.js";
import LogosBand from "./components/LogosBand.js";  
import QuoteSection from "./components/Quote.js";
import StarterSection from "./components/StarterSection.js";
import DividerOfSections from "./components/DividerOfSections.js";
import QuienesSomos from "./components/AboutUs.js";
import Quote2 from "./components/Quote2.js";
import PodcastEmbed from "./components/Podcast.js";

function App() {
  return (
       <div>
      <Navbar />
      <Hero />
      <LogosBand />
      <QuoteSection />
      <DividerOfSections />
      <StarterSection />
      <DividerOfSections />
      <Quote2 />
      <QuienesSomos />
      <DividerOfSections />
      <PodcastEmbed />
      <DividerOfSections />
    </div>
  );
    
}

export default App;
