import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import "../styles/Equipo.css";
import TeamIntro from "../components/TeamIntro";
import TeamMembers from "../components/TeamMembers";


function Equipo() {
    return (
        <div>
            <Navbar />
            <TeamIntro />
            <TeamMembers />
            <Footer />
        </div>
    );
};

export default Equipo;