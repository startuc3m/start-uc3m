import React, { useState } from "react";
import "../styles/Equipo.css";
import { descripcionDe, esJuntaDirectiva } from "../data/departamentos";
import perfil from "../assets/profile-pic.png"
import Ioana from "../assets/members/ioana_nedelcu.jpeg"
import Alejandro from "../assets/members/alejandro_ausina.jpg"
import Uxio from "../assets/members/uxio_lopez.png"
import Pedro_r from "../assets/members/pedro_rodriguez.jpg"
import Ingrid from "../assets/members/ingrid_estrada.jpg"
import Ana from "../assets/members/ana_gimenez.jpg"
import Irene from "../assets/members/irene_ibañez.jpeg"
import Lidia from "../assets/members/lidia_wang.jpg"
import Alicia from "../assets/members/alicia_gascon.jpg"
import Juan_vicente from "../assets/members/juan_vicente.jpg"
import Carlos_m from "../assets/members/carlos_moreno.jpg"
import Pablo_juan from "../assets/members/pablo_juan.jpg"
import Maria_m from "../assets/members/maria_martin.jpg"
import Gonzalo_t from "../assets/members/gonzalo_torrijos.jpeg"

const teamMembers = [
    {id: 1, nombre: "Ioana Nedelcu", cargo: "Presidenta", departamento: "Junta directiva", foto: Ioana, linkedin: "https://www.linkedin.com/in/ioananedelcu/"},
    {id: 2, nombre: "Ana Giménez", cargo: "Vicepresidenta", departamento: "Junta directiva", foto: Ana, linkedin: "http://www.linkedin.com/in/ana-gimenez-de-luis-93a528293"},
    {id: 3, nombre: "Alejandro Ausina", cargo: "Responsable", departamento: "IT", foto: Alejandro, linkedin: "https://www.linkedin.com/in/alejandro-ausina/"},
    {id: 4, nombre: "Lidia Wang", cargo: "Responsable", departamento: "Marketing", foto: Lidia, linkedin: "http://www.linkedin.com/in/lidia-wang-058433389"},
    {id: 5, nombre: "Irene Ibáñez", cargo: "Responsable", departamento: "RRHH", foto: Irene, linkedin: "https://www.linkedin.com/in/ireneibanezcasao/"},
    {id: 6, nombre: "Alicia Gascón", cargo: "Responsable", departamento: "Eventos", foto: Alicia, linkedin: "https://www.linkedin.com/in/alicia-gasc%C3%B3n-valero-41a828387/"},
    {id: 7, nombre: "Carlos Moreno", cargo: "Asociado", departamento: "IT", foto: Carlos_m, linkedin: ""},
    {id: 8, nombre: "Juan Vicente Zerpa", cargo: "Asociado", departamento: "IT", foto: Juan_vicente, linkedin: "https://www.linkedin.com/in/juan-vicente-zerpa/"},
    {id: 9, nombre: "Uxio López", cargo: "Responsable", departamento: "Comunicación", foto: Uxio, linkedin: "https://www.linkedin.com/in/uxio-lopez-0b6a09386/"},
    {id: 10, nombre: "María Martin", cargo: "Responsable", departamento: "Legal", foto: Maria_m, linkedin: "https://www.linkedin.com/in/maria-martin-dominguez-9569332a6/"},
    {id: 11, nombre: "Pedro Rodríguez", cargo: "Responsable", departamento: "Partnerships", foto: Pedro_r, linkedin: "https://www.linkedin.com/in/pedro-rodr%C3%ADguez-ramos-2bb75a292/"},
    {id: 12, nombre: "María Aguilar", cargo: "Asociada", departamento: "RRHH", foto: perfil, linkedin: ""},
    {id: 13, nombre: "Gonzalo Torrijos", cargo: "Asociado", departamento: "Eventos", foto: Gonzalo_t, linkedin: "https://www.linkedin.com/in/gonzalo-torrijos/"},
    {id: 14, nombre: "Pablo Juan", cargo: "Asociado", departamento: "Legal", foto: Pablo_juan, linkedin: "https://www.linkedin.com/in/pablo-juan-conde/"},
    {id: 15, nombre: "Ingrid Estrada", cargo: "Asociada", departamento: "Partnerships", foto: Ingrid, linkedin: "https://www.linkedin.com/in/ingrid-estrada1/"},

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
            : esJuntaDirectiva(selectedDepartment)
                ? teamMembers.filter(member => esJuntaDirectiva(member.departamento) || member.cargo === "Responsable")
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
                {selectedDepartment !== "Todos" && descripcionDe(selectedDepartment) && (
                    <div
                        className="department-description"
                        data-testid="department-description"
                        key={selectedDepartment}
                    >
                        <h2 className="department-description-title">{selectedDepartment}</h2>
                        <p className="department-description-text">{descripcionDe(selectedDepartment)}</p>
                    </div>
                )}
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