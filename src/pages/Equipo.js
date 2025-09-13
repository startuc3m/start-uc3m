import React, { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import "../styles/Equipo.css";
import perfil from "../assets/profile-pic.png"

const teamMembers = [
    {id: 1, nombre: "Iñigo Estebaranz", cargo: "Presidente", departamento: "Junta", foto: perfil, linkedin: "https://www.linkedin.com/in/inigo-estebaranz-rosillo-8a2520295/"},
    {id: 2, nombre: "Miguel Arnáiz", cargo: "Vicepresidente", departamento: "Junta", foto: perfil, linkedin: "https://www.linkedin.com/in/miguel-arn%C3%A1iz/"},
    {id: 3, nombre: "Ioana Nedelcu", cargo: "Responsable de IT", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/ioananedelcu/"},
    {id: 4, nombre: "Carla Martínez", cargo: "Responsable de Marketing", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/carla-mart%C3%ADnez-s%C3%A1nchez-670442293?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"},
    {id: 5, nombre: "Javier Fernández", cargo: "Responsable de financiación", departamento: "Finanzas", foto: perfil, linkedin: "https://www.linkedin.com/in/javierfern%C3%A1ndezmu%C3%B1oz/"},
    {id: 6, nombre: "Pedro Bueno", cargo: "Responsable de comunicaciones", departamento: "Comunicaciones", foto: perfil, linkedin: "https://www.linkedin.com/in/pedrobuenoruiz/"},
    {id: 7, nombre: "Marcos Varez", cargo: "Responsable legal", departamento: "Legal", foto: perfil, linkedin: "https://www.linkedin.com/in/marcos-varez-s%C3%A1nchez-518410268/"},
    {id: 8, nombre: "Sebastián Escobar", cargo: "Responsable de RRHH", departamento: "RRHH", foto: perfil, linkedin: "https://www.linkedin.com/in/sebastian-escobar-v/"}
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
                <h3>Texto de prueba</h3>
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