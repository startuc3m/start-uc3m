// Descripción breve de cada departamento, mostrada en la página de equipo
// al seleccionar su filtro.
//
// Las claves se normalizan (minúsculas, sin espacios sobrantes) para que el
// nombre que se escriba en el campo `departamento` de cada miembro siga
// encontrando su descripción aunque cambie la capitalización.
const descripciones = {
    "junta directiva": "Marca el rumbo de Start UC3M. Define los objetivos del curso, coordina el trabajo de todos los departamentos y representa a la asociación ante la universidad y el resto del ecosistema emprendedor. También toma las decisiones que afectan al conjunto y vela por que cada área tenga lo que necesita para funcionar.",
    "it": "Construye y mantiene todo lo que la asociación necesita en lo técnico. Desarrolla y actualiza la web, resuelve las incidencias que van surgiendo y se ocupa de las herramientas internas que el equipo usa en el día a día. También apoya al resto de departamentos en cualquier proyecto con componente tecnológica.",
    "marketing": "Se encarga de cómo se ve Start UC3M desde fuera. Diseña las campañas de cada evento, cuida la identidad visual de la asociación y crea los materiales gráficos que acompañan a todo lo que se publica. También analiza qué funciona en cada convocatoria para afinar la siguiente.",
    "comunicación": "Da voz a Start UC3M. Gestiona las redes sociales, escribe los contenidos que se publican y cubre los eventos con fotografía y vídeo para que quede constancia de lo que se hace. También mantiene el contacto con los medios y con el resto de la comunidad universitaria.",
    "legal": "Se ocupa del marco jurídico de la asociación. Revisa los convenios con empresas y patrocinadores, mantiene al día los estatutos y la documentación oficial, y se asegura de que cada actividad cumple con la normativa de la universidad. También resuelve las dudas legales que le llegan del resto de departamentos.",
    "rrhh": "Se encarga de las personas que forman Start. Elige a quién entra, acompaña a los nuevos durante sus primeros meses y se ocupa de que cada uno sepa qué se espera de él. También organiza las formaciones del curso y las actividades internas que mantienen unido al equipo.",
    "partnerships": "Construye la relación con las empresas que apoyan a Start UC3M. Busca nuevos patrocinadores, negocia las condiciones de cada colaboración y mantiene el contacto con los socios a lo largo del curso. También se encarga de que cada empresa reciba lo acordado y quiera repetir al año siguiente.",
    "eventos": "Da forma a todo lo que la asociación organiza. Diseña el calendario del curso, coordina los espacios, los ponentes y los materiales de cada convocatoria, y se ocupa de que el día del evento todo salga según lo previsto. También recoge el feedback de los asistentes para mejorar el siguiente.",
};

const normalizar = (departamento) => (departamento || "").trim().toLowerCase();

export const descripcionDe = (departamento) => descripciones[normalizar(departamento)];

export const esJuntaDirectiva = (departamento) => normalizar(departamento) === "junta directiva";
