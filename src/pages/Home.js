import React from "react";
import "../index.css";
import Navbar from "../components/navbar";
import Hero from "../components/Hero";
import LogosBand from "../components/LogosBand";
import QuoteSection from "../components/Quote";
import StarterSection from "../components/StarterSection.js";
import DividerOfSections from "../components/DividerOfSections.js";
import QuienesSomos from "../components/AboutUs.js";
import Quote2 from "../components/Quote2.js";
import PodcastEmbed from "../components/Podcast.js";
import Contact from "../components/Contacto.js"
import Footer from "../components/Footer.js"

function Home() {
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
            <Contact />
            <Footer />
        </div>
    );
};

export default Home;