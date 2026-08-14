import React, { useState } from "react";
import "../styles/Equipo.css";
import perfil from "../assets/profile-pic.png"
import Ioana from "../assets/members/ioana_nedelcu.jpeg"
import Carla from "../assets/members/carla_martinez.jpg"
import Miguel from "../assets/members/miguel_arnaiz.jpg"
import Sebastian from "../assets/members/sebatian_escobar.jpg"
import Iñigo from "../assets/members/iñigo_estebaranz.jpg"
import Pedro from "../assets/members/pedro_bueno.jpg"
import Marcos from "../assets/members/marcos_varez.jpeg"
import Alejandro from "../assets/members/alejandro_ausina.jpg"
import Pablo from "../assets/members/pablo_morales.jpg"
import Nicholas from "../assets/members/nicholas_bergquist.png"
import Uxio from "../assets/members/uxio_lopez.png"
import Juan from "../assets/members/juan_garcia.jpg"
import Julen from "../assets/members/julen_sagasta.jpg"
import Xabier from "../assets/members/xabier_perez.png"
import Nicolas from "../assets/members/nicolas_lopez.jpg"
import Pablo_presa from "../assets/members/pablo_presa.jpg"
import Carlos from "../assets/members/carlos_pindado.jpg"
import Juan_f from "../assets/members/juan_figueira.jpg"
import Pedro_r from "../assets/members/pedro_rodriguez.jpg"
import Nicolas_s from "../assets/members/nicolas_sanchez.jpg"
import Marina from "../assets/members/marina_sarti.jpg"
import Ingrid from "../assets/members/ingrid_estrada.jpg"
import Andrea from "../assets/members/andrea_sanchez.jpeg"
import Alejandro_v from "../assets/members/alejandro_verde.jpg"
import Elena from "../assets/members/elena_vidal.jpeg"
import Mariia from "../assets/members/mariia_deviatko.jpg"
import Andres from "../assets/members/andres_delgado.jpg"
import Ana from "../assets/members/ana_gimenez.jpg"
import Irene from "../assets/members/irene_ibañez.jpeg"
import Lidia from "../assets/members/lidia_wang.jpg"
import Alicia from "../assets/members/alicia_gascon.jpg"
import Adrian from "../assets/members/adrian_gonzalez.jpg"
import Laura from "../assets/members/laura_navas.jpg"
import Clara from "../assets/members/clara_mayoral.jpeg"
import Juan_vicente from "../assets/members/juan_vicente.jpg"
import Lucia_p from "../assets/members/lucia_pan.jpg"
import Carlos_m from "../assets/members/carlos_moreno.jpg"
import Irantzu from "../assets/members/irantzu_ortega.jpg"
import Pablo_juan from "../assets/members/pablo_juan.jpg"
import Maria_m from "../assets/members/maria_martin.jpg"
import Andrea_s from "../assets/members/andrea_sanchez_galera.jpeg"
import Gonzalo_t from "../assets/members/gonzalo_torrijos.jpeg"
import Henry from "../assets/members/henry_ringstmeyer.jpg"

const teamMembers = [
    {id: 1, nombre: "Iñigo Estebaranz", cargo: "Presidente", departamento: "Junta Directiva", foto: Iñigo, linkedin: "https://www.linkedin.com/in/inigo-estebaranz-rosillo-8a2520295/"},
    {id: 2, nombre: "Miguel Arnáiz", cargo: "Vicepresidente", departamento: "Junta Directiva", foto: Miguel, linkedin: "https://www.linkedin.com/in/miguel-arn%C3%A1iz/"},
    {id: 3, nombre: "Ioana Nedelcu", cargo: "Responsable", departamento: "IT", foto: Ioana, linkedin: "https://www.linkedin.com/in/ioananedelcu/"},
    {id: 4, nombre: "Carla Martínez", cargo: "Responsable", departamento: "Marketing", foto: Carla, linkedin: "https://www.linkedin.com/in/carla-mart%C3%ADnez-s%C3%A1nchez-670442293/"},
    {id: 5, nombre: "Pedro Bueno", cargo: "Responsable", departamento: "Comunicación", foto: Pedro, linkedin: "https://www.linkedin.com/in/pedrobuenoruiz/"},
    {id: 6, nombre: "Marcos Varez", cargo: "Responsable", departamento: "Legal", foto: Marcos, linkedin: "https://www.linkedin.com/in/marcos-varez-s%C3%A1nchez-518410268/"},
    {id: 7, nombre: "Sebastián Escobar", cargo: "Responsable", departamento: "RRHH", foto: Sebastian, linkedin: "https://www.linkedin.com/in/sebastian-escobar-v/"},
    {id: 8, nombre: "Nicolás López", cargo: "Responsable", departamento: "Partnerships", foto: Nicolas, linkedin: "https://www.linkedin.com/in/nicol%C3%A1s-l%C3%B3pez-miranda-0365232b1/"},
    {id: 9, nombre: "Ana Giménez", cargo: "Responsable", departamento: "Eventos", foto: Ana, linkedin: "http://www.linkedin.com/in/ana-gimenez-de-luis-93a528293"},
    {id: 10, nombre: "Lucía Pan Zhu", cargo: "Asociada", departamento: "Marketing", foto: Lucia_p, linkedin: "https://www.linkedin.com/in/lucia-pan-zhu-5013b328a/"},
    {id: 11, nombre: "Juan García", cargo: "Asociado", departamento: "IT", foto: Juan, linkedin: "https://www.linkedin.com/in/juan-garc%C3%ADa-rodr%C3%ADguez-a088292b0/"},
    {id: 12, nombre: "Alejandro Ausina", cargo: "Asociado", departamento: "IT", foto: Alejandro, linkedin: "https://www.linkedin.com/in/alejandro-ausina/"},
    {id: 13, nombre: "Henry Ringstmeyer", cargo: "Asociado", departamento: "Marketing", foto: Henry, linkedin: "https://www.linkedin.com/in/henry-ringstmeyer-404b70311"},
    {id: 14, nombre: "Lidia Wang", cargo: "Asociada", departamento: "Marketing", foto: Lidia, linkedin: "http://www.linkedin.com/in/lidia-wang-058433389"},
    {id: 15, nombre: "Marina Sarti", cargo: "Asociada", departamento: "Marketing", foto: Marina, linkedin: "https://www.linkedin.com/in/marina-sarti-pineda-27211b29b/"},
    {id: 16, nombre: "Pablo Morales", cargo: "Asociado", departamento: "Marketing", foto: Pablo, linkedin: "https://www.linkedin.com/in/pablo-morales-de-lorenzo-290745258/"},
    {id: 17, nombre: "Laura Navas", cargo: "Asociada", departamento: "RRHH", foto: Laura, linkedin: "https://www.linkedin.com/in/laura-mar%C3%ADa-navas-moreno-69a76b280/"},
    {id: 18, nombre: "María Aguilar", cargo: "Asociada", departamento: "RRHH", foto: perfil, linkedin: ""},
    {id: 19, nombre: "Adrián González", cargo: "Asociado", departamento: "RRHH", foto: Adrian, linkedin: "https://www.linkedin.com/in/adri%C3%A1n-gonz%C3%A1lez-t-a98062332/"},
    {id: 20, nombre: "Irene Ibáñez", cargo: "Asociada", departamento: "RRHH", foto: Irene, linkedin: "https://www.linkedin.com/in/ireneibanezcasao/"},
    {id: 21, nombre: "Gonzalo Torrijos", cargo: "Asociado", departamento: "Eventos", foto: Gonzalo_t, linkedin: "https://www.linkedin.com/in/gonzalo-torrijos/"},
    {id: 22, nombre: "Carlos Pindado", cargo: "Asociado", departamento: "Eventos", foto: Carlos, linkedin: "https://www.linkedin.com/in/carlos-pindado-buend%C3%ADa-10445232b/"},
    {id: 23, nombre: "Elena Vidal", cargo: "Asociada", departamento: "Eventos", foto: Elena, linkedin: ""},
    {id: 24, nombre: "Alicia Gascón", cargo: "Asociada", departamento: "Eventos", foto: Alicia, linkedin: "https://www.linkedin.com/in/alicia-gasc%C3%B3n-valero-41a828387/"},
    {id: 25, nombre: "Alejandro Verde", cargo: "Asociado", departamento: "Eventos", foto: Alejandro_v, linkedin: "https://www.linkedin.com/in/alejandro-verde-bethencourt-395838389/"},
    {id: 26, nombre: "Nicolas Sánchez", cargo: "Asociado", departamento: "Eventos", foto: Nicolas_s, linkedin: "https://www.linkedin.com/in/nicol%C3%A1s-s%C3%A1nchez-delgado-928258332/"},
    {id: 27, nombre: "Carlos Moreno", cargo: "Asociado", departamento: "IT", foto: Carlos_m, linkedin: ""},
    {id: 28, nombre: "Pablo Presa", cargo: "Asociado", departamento: "IT", foto: Pablo_presa, linkedin: "https://www.linkedin.com/in/pablo-presa-carrera-422232280/"},
    {id: 29, nombre: "Juan Vicente Zerpa", cargo: "Asociado", departamento: "IT", foto: Juan_vicente, linkedin: "https://www.linkedin.com/in/juan-vicente-zerpa/"},
    {id: 30, nombre: "Clara Mayoral", cargo: "Asociada", departamento: "Comunicación", foto: Clara, linkedin: "https://www.linkedin.com/in/clara-mayoral-ab6aba279/"},
    {id: 31, nombre: "Uxio López", cargo: "Asociado", departamento: "Comunicación", foto: Uxio, linkedin: "https://www.linkedin.com/in/uxio-lopez-0b6a09386/"},
    {id: 32, nombre: "Nicholas Bergquist", cargo: "Asociado", departamento: "Comunicación", foto: Nicholas, linkedin: "https://www.linkedin.com/in/nicholas-bergquist-recio-148ab126a/"},
    {id: 33, nombre: "Andrea Sánchez", cargo: "Asociada", departamento: "Comunicación", foto: Andrea, linkedin: "https://www.linkedin.com/in/andrea-s%C3%A1nchez-galera-6a420b37b/"},
    {id: 34, nombre: "Xabier Pérez", cargo: "Asociado", departamento: "Comunicación", foto: Xabier, linkedin: "https://www.linkedin.com/in/xabierperezfernandez/"},
    {id: 35, nombre: "Juan Figueira", cargo: "Asociado", departamento: "Comunicación", foto: Juan_f, linkedin: "https://www.linkedin.com/in/juan-figueira-trujillo-7aa1b2297/"},
    {id: 36, nombre: "Julen Sagasta", cargo: "Asociado", departamento: "Comunicación", foto: Julen, linkedin: "https://www.linkedin.com/in/julen-sagasta-ram%C3%ADrez-b937b8330/"},
    {id: 37, nombre: "Irantzu Ortega", cargo: "Asociada", departamento: "Comunicación", foto: Irantzu, linkedin: "https://www.linkedin.com/in/irantzu-ortega-/"},
    {id: 38, nombre: "Pablo Juan", cargo: "Asociado", departamento: "Legal", foto: Pablo_juan, linkedin: "https://www.linkedin.com/in/pablo-juan-conde/"},
    {id: 39, nombre: "María Martin", cargo: "Asociada", departamento: "Legal", foto: Maria_m, linkedin: "https://www.linkedin.com/in/maria-martin-dominguez-9569332a6/"},
    {id: 40, nombre: "Ingrid Estrada", cargo: "Asociada", departamento: "Partnerships", foto: Ingrid, linkedin: "https://www.linkedin.com/in/ingrid-estrada1/"},
    {id: 41, nombre: "Pedro Rodríguez", cargo: "Asociado", departamento: "Partnerships", foto: Pedro_r, linkedin: "https://www.linkedin.com/in/pedro-rodr%C3%ADguez-ramos-2bb75a292/"},
    {id: 42, nombre: "Juan González", cargo: "Asociado", departamento: "Partnerships", foto: perfil, linkedin: "https://www.linkedin.com/in/juangonzaleztaboda/"},
    {id: 43, nombre: "Andrea Sánchez", cargo: "Asociada", departamento: "Partnerships", foto: Andrea_s, linkedin: ""},
    {id: 44, nombre: "Mariia Deviatko", cargo: "Asociada", departamento: "Partnerships", foto: Mariia, linkedin: "https://www.linkedin.com/in/mariia-deviatko/"},
    {id: 45, nombre: "Andrés Delgado", cargo: "Asociado", departamento: "Eventos", foto: Andres, linkedin: ""},

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

function TeamMembers() {
        const [selectedDepartment, setSelectedDepartment] = useState("Todos");
        const filteredMembers = selectedDepartment === "Todos"
            ? teamMembers
            : teamMembers.filter(member => member.departamento === selectedDepartment);
        const departments = ["Todos", ...new Set(teamMembers.map(member => member.departamento))];

        return (
            <div className="team-section">
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
            </div>
        );
};

export default TeamMembers;