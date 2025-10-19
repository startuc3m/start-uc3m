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
import Pedro from "../assets/members/pedro_bueno.jpeg"
import Marcos from "../assets/members/marcos_varez.jpeg"
import Alejandro from "../assets/members/alejandro_ausina.jpg"

const teamMembers = [
    {id: 1, nombre: "Iñigo Estebaranz", cargo: "Presidente", departamento: "Junta Directiva", foto: Iñigo, linkedin: "https://www.linkedin.com/in/inigo-estebaranz-rosillo-8a2520295/"},
    {id: 2, nombre: "Miguel Arnáiz", cargo: "Vicepresidente", departamento: "Junta Directiva", foto: Miguel, linkedin: "https://www.linkedin.com/in/miguel-arn%C3%A1iz/"},
    {id: 3, nombre: "Ioana Nedelcu", cargo: "Responsable", departamento: "IT", foto: Ioana, linkedin: "https://www.linkedin.com/in/ioananedelcu/"},
    {id: 4, nombre: "Carla Martínez", cargo: "Responsable", departamento: "Marketing", foto: Carla, linkedin: "https://www.linkedin.com/in/carla-mart%C3%ADnez-s%C3%A1nchez-670442293/"},
    {id: 5, nombre: "Pedro Bueno", cargo: "Responsable", departamento: "Comunicación", foto: Pedro, linkedin: "https://www.linkedin.com/in/pedrobuenoruiz/"},
    {id: 6, nombre: "Marcos Varez", cargo: "Responsable", departamento: "Legal", foto: Marcos, linkedin: "https://www.linkedin.com/in/marcos-varez-s%C3%A1nchez-518410268/"},
    {id: 7, nombre: "Sebastián Escobar", cargo: "Responsable", departamento: "RRHH", foto: Sebastian, linkedin: "https://www.linkedin.com/in/sebastian-escobar-v/"},
    {id: 8, nombre: "Gonzalo Renes", cargo: "Responsable", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/gon-renes-sanchez/"},
    {id: 9, nombre: "Ana Giménez", cargo: "Responsable", departamento: "Eventos", foto: perfil, linkedin: "http://www.linkedin.com/in/ana-gimenez-de-luis-93a528293"},
    {id: 10, nombre: "Lucía Pan Zhu", cargo: "Asociada", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/lucia-pan-zhu-5013b328a/"},
    {id: 11, nombre: "Juan García", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/juan-garc%C3%ADa-rodr%C3%ADguez-a088292b0/"},
    {id: 12, nombre: "Alejandro Ausina", cargo: "Asociado", departamento: "IT", foto: Alejandro, linkedin: "https://www.linkedin.com/in/alejandro-ausina/"},
    {id: 13, nombre: "Henry Ringstmeyer", cargo: "Asociado", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/henry-ringstmeyer-404b70311"},
    {id: 14, nombre: "Lidia Wang", cargo: "Asociado", departamento: "Marketing", foto: perfil, linkedin: "http://www.linkedin.com/in/lidia-wang-058433389"},
    {id: 15, nombre: "Marina Sarti", cargo: "Asociado", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/marina-sarti-pineda-27211b29b/"},
    {id: 16, nombre: "Pablo Morales", cargo: "Asociado", departamento: "Marketing", foto: perfil, linkedin: "https://www.linkedin.com/in/pablo-morales-de-lorenzo-290745258/"},
    {id: 17, nombre: "Laura Navas", cargo: "Asociado", departamento: "RRHH", foto: perfil, linkedin: "https://www.linkedin.com/in/laura-mar%C3%ADa-navas-moreno-69a76b280/"},
    {id: 18, nombre: "María Aguilar", cargo: "Asociado", departamento: "RRHH", foto: perfil, linkedin: ""},
    {id: 19, nombre: "Adrián Gonzáles", cargo: "Asociado", departamento: "RRHH", foto: perfil, linkedin: ""},
    {id: 20, nombre: "Irene Ibáñez", cargo: "Asociado", departamento: "RRHH", foto: perfil, linkedin: "https://www.linkedin.com/in/ireneibanezcasao/"},
    {id: 21, nombre: "Gonzalo Torrijos", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: ""},
    {id: 22, nombre: "Carlos Pindado", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: "https://www.linkedin.com/in/carlos-pindado-buend%C3%ADa-10445232b/"},
    {id: 23, nombre: "Elenka Vidal", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: ""},
    {id: 24, nombre: "Alicia Gascón", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: "https://www.linkedin.com/in/alicia-gasc%C3%B3n-valero-41a828387/"},
    {id: 25, nombre: "Alejandro Verde", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: "https://www.linkedin.com/in/alejandro-verde-bethencourt-395838389/"},
    {id: 26, nombre: "Alberto Fernández", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: ""},
    {id: 27, nombre: "Nicolas Sánchez", cargo: "Asociado", departamento: "Eventos", foto: perfil, linkedin: "https://www.linkedin.com/in/nicol%C3%A1s-s%C3%A1nchez-delgado-928258332/"},
    {id: 28, nombre: "Carlos Moreno", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: ""},
    {id: 29, nombre: "Pablo Presa", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/pablo-presa-carrera-422232280/"},
    {id: 30, nombre: "Juan Vicente Zerpa", cargo: "Asociado", departamento: "IT", foto: perfil, linkedin: "https://www.linkedin.com/in/juan-vicente-zerpa/"},
    {id: 31, nombre: "Clara Mayoral", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: ""},
    {id: 32, nombre: "Uxio López", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: ""},
    {id: 33, nombre: "Nicholas Bergquist", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: "https://www.linkedin.com/in/nicholas-bergquist-recio-148ab126a/"},
    {id: 34, nombre: "Andrea Sánchez", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: "https://www.linkedin.com/in/andrea-s%C3%A1nchez-galera-6a420b37b/"},
    {id: 35, nombre: "Xabier Pérez", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: "https://www.linkedin.com/in/xabierperezfernandez/"},
    {id: 36, nombre: "Juan Figueira", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: ""},
    {id: 37, nombre: "Julen", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: ""},
    {id: 38, nombre: "Irantzu Ortega", cargo: "Asociado", departamento: "Comunicación", foto: perfil, linkedin: "https://www.linkedin.com/in/irantzu-ortega-/"},
    {id: 39, nombre: "Pablo Juan", cargo: "Asociado", departamento: "Legal", foto: perfil, linkedin: ""},
    {id: 40, nombre: "María Martin", cargo: "Asociado", departamento: "Legal", foto: perfil, linkedin: ""},
    {id: 41, nombre: "Sonia García", cargo: "Asociado", departamento: "Legal", foto: perfil, linkedin: ""},
    {id: 42, nombre: "Gonzalo Renes", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/gon-renes-sanchez/"},
    {id: 43, nombre: "Ingrid Estrada", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/ingrid-estrada1/"},
    {id: 44, nombre: "Pedro Rodríguez", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/pedro-rodr%C3%ADguez-ramos-2bb75a292/"},
    {id: 45, nombre: "Nicolás López", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/nicol%C3%A1s-l%C3%B3pez-miranda-0365232b1/"},
    {id: 46, nombre: "Sophia Valbuena", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/sophia-v-a0474633b/"},
    {id: 47, nombre: "Juan González", cargo: "Asociado", departamento: "Colaboraciones", foto: perfil, linkedin: "https://www.linkedin.com/in/juangonzaleztaboda/"},

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