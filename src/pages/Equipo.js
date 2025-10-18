import React, { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import "../styles/Equipo.css";
import perfil from "../assets/profile-pic.png"
import Ioana from "../assets/members/ioana_nedelcu.jpg"
import Carla from "../assets/members/carla_martinez.jpg"
import Miguel from "../assets/members/miguel_arnaiz.jpg"
import Sebastian from "../assets/members/sebatian_escobar.jpg"
import Iñigo from "../assets/members/iñigo_estebaranz.jpeg"
import Javier from "../assets/members/javier_fernandez.jpeg"
import Pedro from "../assets/members/pedro_bueno.jpeg"
import Marcos from "../assets/members/marcos_varez.jpeg"

const teamMembers = [
    {id: 1, nombre: "Iñigo Estebaranz", cargo: "Presidente", departamento: "Junta Directiva", foto: Iñigo, linkedin: "https://www.linkedin.com/in/inigo-estebaranz-rosillo-8a2520295/"},
    {id: 2, nombre: "Miguel Arnáiz", cargo: "Vicepresidente", departamento: "Junta Directiva", foto: Miguel, linkedin: "https://www.linkedin.com/in/miguel-arn%C3%A1iz/"},
    {id: 3, nombre: "Ioana Nedelcu", cargo: "Responsable", departamento: "IT", foto: Ioana, linkedin: "https://www.linkedin.com/in/ioananedelcu/"},
    {id: 4, nombre: "Carla Martínez", cargo: "Responsable", departamento: "Marketing", foto: Carla, linkedin: "https://www.linkedin.com/in/carla-mart%C3%ADnez-s%C3%A1nchez-670442293?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"},
    {id: 5, nombre: "Javier Fernández", cargo: "Responsable", departamento: "Finanzas", foto: Javier, linkedin: "https://www.linkedin.com/in/javierfern%C3%A1ndezmu%C3%B1oz/"},
    {id: 6, nombre: "Pedro Bueno", cargo: "Responsable", departamento: "Comunicaciones", foto: Pedro, linkedin: "https://www.linkedin.com/in/pedrobuenoruiz/"},
    {id: 7, nombre: "Marcos Varez", cargo: "Responsable", departamento: "Legal", foto: Marcos, linkedin: "https://www.linkedin.com/in/marcos-varez-s%C3%A1nchez-518410268/"},
    {id: 8, nombre: "Sebastián Escobar", cargo: "Responsable", departamento: "RRHH", foto: Sebastian, linkedin: "https://www.linkedin.com/in/sebastian-escobar-v/"},
    {id: 9, nombre: "Gonzalo Renes", cargo: "Responsable", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/gon-renes-sanchez/"},
    {id: 10, nombre: "Ana Giménez", cargo: "Responsable", departamento: "Eventos", foto: perfil, linkedin: "http://www.linkedin.com/in/ana-gimenez-de-luis-93a528293"},
    {id: 11, nombre: "Lucía Pan Zhu", cargo: "Asociada", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/lucia-pan-zhu-5013b328a/"},
    {id: 12, nombre: "Juan García", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/juan-garc%C3%ADa-rodr%C3%ADguez-a088292b0/"},
    {id: 13, nombre: "Alejandro Ausina", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/alejandro-ausina/"},
    {id: 14, nombre: "Henry Ringstmeyer", cargo: "Asociado", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/henry-ringstmeyer-404b70311"},

];

const MemberCard = ({nombre, cargo, departamento, foto, linkedin}) => {
    return (
        <div className="member-card">
            <a href={linkedin} target="_blank" rel="noopener noreferrer">
                <img src={foto} alt={nombre} className="member-photo" />
            </a>
            <div className="member-info">
                <h3 className="member-name">{nombre}</h3>
                <p className="member-position">{cargo}</p>
                <p className="member-department">{departamento}</p>
            </div>
        </div>
    );
};

function Equipo() {
    const [selectedDepartment, setSelectedDepartment] = useState("Todos");
    const filteredMembers = selectedDepartment === "Todos"
        ? teamMembers
        : teamMembers.filter(member => member.departamento === selectedDepartment);
    const departments = ["Todos", ...new Set(teamMembers.map(member => member.departamento))];

    return (
        <div>
            <Navbar />
            <section className="team-section">
                <h1>CONOCE A NUESTRO EQUIPO</h1>
                <h3>Una asociación sin un equipo, no es nada.
                    <br />
                    Detrás de Start UC3M hay un grupo de personas con ganas de cambiar las cosas. ¡Conócelos!
                </h3>
                <div className="filtro-buttons">
                    {departments.map(department => (
                        <button key={department} className={`filtro-btn ${selectedDepartment === department ? 'active' : ''}`}
                            onClick={() => setSelectedDepartment(department)}>{department}</button>
                    ))}
                </div>
                <div className="team-container">
                    {filteredMembers.map(member => (
                        <MemberCard
                            key={member.id}
                            nombre={member.nombre}
                            cargo={member.cargo}
                            departamento={member.departamento}
                            foto={member.foto}
                            linkedin={member.linkedin}
                        />
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default Equipo;