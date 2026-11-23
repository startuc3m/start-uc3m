// Datos de ejemplo del prototipo. Todo es inventado: personas, empresas (marcadas
// «(ejemplo)») y cifras. Cuando exista el backend, estos datos los da `api.js`
// del servidor con la misma forma (ver docs/panel-contrato.md).

export const FAMILIES = [
  { id: 'analistas', name: 'Analistas', color: 'lavender', codes: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { id: 'diplomaticos', name: 'Diplomáticos', color: 'lime', codes: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { id: 'centinelas', name: 'Centinelas', color: 'cyan', codes: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { id: 'exploradores', name: 'Exploradores', color: 'yellow', codes: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];

export const TYPE_NAMES = {
  INTJ: 'Arquitecto', INTP: 'Lógico', ENTJ: 'Comandante', ENTP: 'Innovador',
  INFJ: 'Abogado', INFP: 'Mediador', ENFJ: 'Protagonista', ENFP: 'Activista',
  ISTJ: 'Logista', ISFJ: 'Defensor', ESTJ: 'Ejecutivo', ESFJ: 'Cónsul',
  ISTP: 'Virtuoso', ISFP: 'Aventurero', ESTP: 'Emprendedor', ESFP: 'Animador',
};

export const familyOf = (code) => FAMILIES.find((f) => f.codes.includes(code));

// Cuántas personas hay de cada tipo en toda la comunidad (el mapa).
export const TYPE_COUNTS = {
  INTJ: 3, INTP: 5, ENTJ: 4, ENTP: 6,
  INFJ: 2, INFP: 7, ENFJ: 5, ENFP: 9,
  ISTJ: 3, ISFJ: 2, ESTJ: 4, ESFJ: 3,
  ISTP: 1, ISFP: 2, ESTP: 4, ESFP: 3,
};

// Sellos: uno por evento. Llega 24 h después del evento si Eventos, RRHH o la Junta confirman que asististe.
export const STAMPS = {
  ventas: { id: 'ventas', label: 'VENTAS', name: 'Taller de ventas', date: 'NOV 26', color: 'cyan' },
  camp: { id: 'camp', label: 'CAMP', name: 'Start Camp', date: 'NOV 26', color: 'lime' },
  build: { id: 'build', label: 'BUILD', name: 'Buildathon', date: 'SEP 26', color: 'cyan' },
  skills: { id: 'skills', label: 'SKILLS', name: 'Start Skills', date: 'OCT 26', color: 'lavender' },
  canas: { id: 'canas', label: 'CAÑAS', name: 'Cañas de bienvenida', date: 'OCT 26', color: 'yellow' },
  pitch: { id: 'pitch', label: 'PITCH', name: 'Noche de pitch', date: 'OCT 26', color: 'lime' },
  rural: { id: 'rural', label: 'RURAL', name: 'Casa rural', date: 'OCT 26', color: 'cyan' },
  next: { id: 'next', label: 'NEXT', name: 'Next Gen Summit', date: 'MAR 26', color: 'lavender' },
  invest: { id: 'invest', label: 'INVEST', name: 'Start to Invest', date: 'NOV 26', color: 'yellow' },
  canasNov: { id: 'canasNov', label: 'CAÑAS', name: 'Cañas de noviembre', date: 'NOV 26', color: 'yellow' },
  podcast: { id: 'podcast', label: 'PODCAST', name: 'Podcast en directo', date: 'DIC 26', color: 'cyan' },
  cena: { id: 'cena', label: 'CENA', name: 'Cena de Navidad', date: 'DIC 26', color: 'lavender' },
  rural27: { id: 'rural27', label: 'RURAL', name: 'Casa rural', date: 'ENE 27', color: 'lime' },
  feria: { id: 'feria', label: 'FERIA', name: 'Feria de empleo', date: 'NOV 26', color: 'cyan' },
  notion: { id: 'notion', label: 'SKILLS', name: 'Start Skills: Notion', date: 'NOV 26', color: 'lavender' },
  cafe: { id: 'cafe', label: 'CAFÉ', name: 'Café con founders', date: 'DIC 26', color: 'yellow' },
  pitchDic: { id: 'pitchDic', label: 'PITCH', name: 'Noche de pitch', date: 'DIC 26', color: 'lime' },
  after: { id: 'after', label: 'AFTER', name: 'Afterwork', date: 'DIC 26', color: 'cyan' },
};

// Niveles: se sube con sellos.
export const LEVELS = [
  { n: 1, name: 'Recién llegado', from: 0 },
  { n: 2, name: 'Starter activo', from: 3 },
  { n: 3, name: 'Imprescindible', from: 8 },
  { n: 4, name: 'Leyenda de Start', from: 14 },
];

export const levelFor = (count) => {
  const i = LEVELS.findLastIndex((l) => count >= l.from);
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  return { ...cur, next, count, progress: next ? (count - cur.from) / (next.from - cur.from) : 1 };
};

// Cada persona sigue el modelo de roles de la PR #87 (docs/panel-roles.md):
// kind (socio | starter), department (solo starters), position (miembro | responsable | junta)
// y manage_users. `role` y `dept` son alias de kind y department para las pantallas.
// Universidades de la Comunidad de Madrid (opciones del campo «Universidad»).
export const UNIVERSIDADES = [
  { grupo: 'Públicas', nombres: [
    'Universidad Autónoma de Madrid',
    'Universidad Carlos III de Madrid',
    'Universidad Complutense de Madrid',
    'Universidad de Alcalá',
    'Universidad Nacional de Educación a Distancia (UNED)',
    'Universidad Politécnica de Madrid',
    'Universidad Rey Juan Carlos',
  ] },
  { grupo: 'Privadas', nombres: [
    'CUNEF Universidad',
    'ESIC Universidad',
    'Universidad a Distancia de Madrid (UDIMA)',
    'Universidad Alfonso X el Sabio',
    'Universidad Antonio de Nebrija',
    'Universidad Camilo José Cela',
    'Universidad CEU San Pablo',
    'Universidad Europea de Madrid',
    'Universidad Francisco de Vitoria',
    'Universidad Pontificia Comillas',
    'Universidad Villanueva',
    'UNIE Universidad',
  ] },
  { grupo: 'Otra', nombres: ['Otra universidad'] },
];
export const UNIVERSIDAD_POR_DEFECTO = 'Universidad Carlos III de Madrid';

const p = (id, name, career, course, role, dept, type, stamps, bio, extra = {}) => ({
  id, name, initials: name.split(' ').map((w) => w[0]).slice(0, 2).join(''),
  university: UNIVERSIDAD_POR_DEFECTO, career, course, role, dept, type, stamps, bio, linkedin: `https://www.linkedin.com/in/${id}-ejemplo`,
  kind: role, department: dept, position: 'miembro', manage_users: false, permissions: [], ...extra,
});

export const PEOPLE = [
  p('lucia', 'Lucía Martín', 'ADE', '3.º', 'starter', 'Marketing', 'ENFJ', ['camp', 'build', 'skills', 'canas', 'pitch', 'rural', 'next'], 'Me interesan el growth y las marcas que empiezan.', { isNew: false }),
  p('pablo', 'Pablo Herrera', 'Ing. Informática', '2.º', 'socio', null, 'INTP', ['camp', 'build'], 'Backend, bots y cualquier cosa con datos.'),
  p('marta', 'Marta Gil', 'Derecho', '4.º', 'starter', 'Legal', 'ISTJ', ['camp', 'canas', 'skills'], 'Contratos de startups y propiedad intelectual.', { position: 'responsable' }),
  p('diego', 'Diego Romero', 'Economía', '3.º', 'socio', null, 'ESTP', ['camp', 'canas', 'pitch', 'invest'], 'Inversión early stage. Siempre en las cañas.'),
  p('sara', 'Sara Núñez', 'Diseño', '1.º', 'socio', null, 'INFP', ['camp'], 'Ilustración, branding y tipografía.', { isNew: true, university: 'Universidad Complutense de Madrid' }),
  p('hugo', 'Hugo Blanco', 'Ing. Industrial', '4.º', 'starter', 'Eventos', 'ENTJ', ['camp', 'build', 'canas', 'pitch', 'rural'], 'Montando el Start Camp desde el primer día.', { position: 'responsable' }),
  p('nora', 'Nora Prieto', 'Periodismo', '2.º', 'socio', null, 'ENFP', [], 'Recién llegada. Quiero aprender a contar startups.', { isNew: true }),
  p('ivan', 'Iván Soler', 'Matemáticas', '1.º', 'socio', null, 'INTJ', [], 'Modelos, finanzas y ajedrez.', { isNew: true, university: 'Universidad Autónoma de Madrid' }),
  p('elena', 'Elena Vidal', 'ADE + Derecho', '2.º', 'socio', null, 'ESFJ', ['canas'], 'Me encanta organizar cosas con gente.', { isNew: true }),
  p('mario', 'Mario Ortega', 'Ing. Telemática', '3.º', 'socio', null, 'ISTP', [], 'Hardware y prototipos rápidos.', { isNew: true }),
  p('paula', 'Paula Torres', 'Marketing', '1.º', 'socio', null, 'ENFP', [], 'Contenido y redes.', { isNew: true }),
  p('carla', 'Carla Ruiz', 'Ing. Informática', '2.º', 'starter', 'IT', 'ENTP', ['camp', 'build', 'skills'], 'Front y diseño de producto.'),
  p('gema', 'Gema Castro', 'Publicidad', '3.º', 'starter', 'Marketing', 'ISFJ', ['camp', 'canas', 'skills', 'pitch'], 'Fotos de todos los eventos (sí, también tuyas).', { position: 'responsable' }),
  p('andres', 'Andrés León', 'Comunicación', '2.º', 'starter', 'RRHH', 'ESFP', ['camp', 'canas'], 'Entrevistas y bienvenida a la gente nueva.', { position: 'responsable', permissions: ['startskills'] }),
  p('lidia', 'Lidia Wang', 'Bellas Artes', '4.º', 'starter', 'Junta', 'INFJ', ['camp', 'build', 'skills', 'canas', 'pitch', 'rural', 'next', 'invest'], 'Brand kit 26/27. Si ves algo lima, fui yo.', { position: 'junta', permissions: ['startskills', 'eventos', 'blog'] }),
  p('jorge', 'Jorge Vela', 'Ing. Informática', '4.º', 'socio', null, 'ENTP', ['camp', 'build'], 'Fundando mi primera startup de edtech.'),
  p('ines', 'Inés Ramos', 'Física', '3.º', 'socio', null, 'ENTP', ['skills'], 'Deep tech y energía.'),
];

export const ME = {
  id: 'alvaro', name: 'Álvaro Carpintero', initials: 'AC', university: UNIVERSIDAD_POR_DEFECTO, career: 'Ing. Informática', course: '3.º',
  role: 'starter', dept: 'IT', kind: 'starter', department: 'IT', position: 'miembro', manage_users: true, permissions: ['startskills'], public_consent: true, photo: true,
  type: 'ENTP', number: 42, stamps: ['camp', 'build', 'canas', 'skills', 'pitch'],
  bio: 'Construyo la web y el área de socios de Start.', linkedin: 'https://www.linkedin.com/in/ejemplo',
  interests: ['growth', 'astro'], onboarded: true,
  cv: { name: 'CV-Alvaro-Carpintero.pdf', size: '184 KB', updated: '12 nov' },
  links: { linkedin: 'alvarocarpintero', instagram: 'alvaro.cp', email: 'alvaro.carpintero@alumnos.uc3m.es', web: '' },
  member: { season: '26/27', until: '31 ago 2027', since: 2025 },
};

// CV de ejemplo de cada persona (privado: solo lo ve quien publica una oferta a la que se apunta).
export const CVS = {
  lucia: '2 págs · actualizado 3 nov', pablo: '1 pág · actualizado 20 oct', marta: '1 pág · actualizado 8 nov',
  diego: '2 págs · actualizado 1 nov', sara: '1 pág · actualizado 15 nov', hugo: '1 pág · actualizado 30 oct',
  carla: '1 pág · actualizado 11 nov', gema: '2 págs · actualizado 5 nov', andres: '1 pág · actualizado 2 nov',
  lidia: '2 págs · actualizado 9 nov', jorge: '1 pág · actualizado 14 nov', ines: '1 pág · actualizado 6 nov',
  ivan: '1 pág · actualizado 16 nov', elena: '1 pág · actualizado 17 nov',
};

export const COMPANIES = {
  fundacion: { name: 'Fundación Impulso', note: 'Becas', initial: 'F', color: '#9A5B00' },
  racks: { name: 'Racks Labs', note: 'IA', initial: 'R', color: '#12123A' },
  lumen: { name: 'Lumen Labs', note: 'Startup de marketing', initial: 'L', color: '#FF6B35' },
  start: { name: 'Start UC3M', note: 'IT', initial: 's_', color: '#333399', isStart: true },
  arrayan: { name: 'Fondo Arrayán', note: 'Venture capital', initial: 'A', color: '#1D7A4F' },
  kilo: { name: 'Kilo Robotics', note: 'Hardware', initial: 'K', color: '#12123A' },
};

export const OFFERS = [
  {
    id: 'growth', posted: '2026-11-18', closes: '2026-12-05', title: 'Prácticas de growth', company: 'lumen', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 5 dic',
    place: 'Híbrida · Madrid', duration: '6 meses', hours: '20 h/semana', pay: 'Remunerada', cover: 'oficina',
    desc: 'Buscan a alguien de ADE, Marketing o Economía para el equipo de crecimiento: campañas, análisis de datos y pruebas A/B. 20 h a la semana, remunerado y compatible con clases.',
    contact: 'Hugo', interested: ['lucia', 'diego', 'sara', 'hugo', 'marta', 'pablo', 'gema', 'andres', 'carla', 'jorge', 'ines', 'lidia'], isNew: true,
  },
  {
    id: 'astro', posted: '2026-11-20', closes: '2026-12-10', title: 'Desarrollo web con Astro', company: 'start', kind: 'Proyecto', kindColor: 'lavender', deadline: 'Hasta el 10 dic',
    place: 'Remoto', duration: '3 meses', hours: '5 h/semana', pay: 'Voluntario', cover: 'equipo',
    desc: 'Ayúdanos con la web de Start: páginas nuevas, rendimiento y el área de socios. Aprendes Astro, React y a trabajar con PRs revisadas.',
    contact: 'Álvaro', interested: ['pablo', 'carla', 'jorge', 'ines'], mine: true,
  },
  {
    id: 'analista', posted: '2026-11-02', closes: '2026-12-15', title: 'Analista de inversión junior', company: 'arrayan', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 15 dic',
    place: 'Presencial · Madrid', duration: '6 meses', hours: '25 h/semana', pay: 'Remunerada', cover: 'pitch',
    desc: 'Análisis de startups en fase semilla: due diligence, modelos financieros y seguimiento de cartera. Perfil de Economía, ADE o Matemáticas.',
    contact: 'Diego', interested: ['hugo', 'ines', 'jorge', 'diego', 'ivan', 'marta', 'pablo', 'lucia', 'elena'],
  },
  {
    id: 'invest', posted: '2026-11-16', closes: '2026-11-30', title: 'Voluntariado Start to Invest', company: 'start', kind: 'Voluntariado', kindColor: 'yellow', deadline: '30 nov',
    place: 'Campus de Getafe', duration: '1 día', hours: '6 h', pay: 'Sello INVEST', cover: 'sala',
    desc: 'Recepción, acreditaciones y apoyo en las mesas del Start to Invest. Comida incluida y sello del evento.',
    contact: 'Lidia', interested: ['gema', 'andres', 'elena', 'hugo', 'lucia', 'sara', 'paula'],
  },
  {
    id: 'hardware', posted: '2026-10-28', closes: '2026-12-20', title: 'Prototipado de hardware', company: 'kilo', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 20 dic',
    place: 'Leganés', duration: '4 meses', hours: '20 h/semana', pay: 'Remunerada', cover: 'portatiles',
    desc: 'Electrónica, impresión 3D y pruebas de campo con un equipo de cinco personas.',
    contact: 'Mario', interested: ['mario', 'pablo'],
  },
  {
    id: 'hack-ia', posted: '2026-11-19', closes: '2027-02-01', title: 'Hackathon de IA para el bien común', company: 'racks', kind: 'Hackathon', kindColor: 'lime', deadline: 'Hasta el 1 feb',
    place: 'Campus de Leganés', duration: '2 días', hours: '13–14 feb', pay: 'Premios', cover: 'portatiles',
    desc: 'Equipos de 3 a 5 personas, retos de ONG reales y mentores de la industria. No hace falta saber programar: también se buscan perfiles de negocio y diseño.',
    contact: 'Pablo', interested: ['pablo', 'carla', 'lucia'],
  },
  {
    id: 'beca-mvp', posted: '2026-10-20', closes: '2027-01-15', title: 'Ayuda para tu primer MVP', company: 'fundacion', kind: 'Beca', kindColor: 'yellow', deadline: 'Hasta el 15 ene',
    place: 'Remoto', duration: '3 meses', hours: 'Libre', pay: '500 € + mentoría', cover: 'oficina',
    desc: 'Para socios con una idea en marcha: 500 € para construir la primera versión y tres sesiones con un mentor.',
    contact: 'Lidia', interested: ['jorge', 'ines'],
  },
];
export const OFFER_KINDS = ['Prácticas', 'Proyecto', 'Voluntariado', 'Hackathon', 'Beca'];

// Eventos con fecha real (la demo vive en noviembre de 2026). `stamp` es el sello que se
// da 24 h después del evento a quien Eventos, RRHH o la Junta confirmen como asistente (junto con
// los puntos del evento). La app no apunta a nadie: solo informa y enlaza a las entradas (`ticketUrl`).
// `going` son los apuntados (vienen de la plataforma de entradas).
export const TODAY = '2026-11-21';
// «Ahora» en la demo: para saber si ya han pasado las 24 h de un evento.
export const NOW = '2026-11-21T12:00:00';
export const EVENTS = [
  { id: 'canas-nov', points: 10, posted: '2026-11-17', title: 'Cañas de noviembre', date: '2026-11-27', time: '19:30', where: 'La Oficina, Getafe', kind: 'Social', price: 'Gratis', stamp: 'canasNov', cover: 'equipo', going: ['jorge', 'pablo', 'lucia', 'diego'], goingCount: 35,
    desc: 'Las cañas de cada mes: llega quien quiera, se presenta la gente nueva y se cuenta en qué anda cada uno. Ficha con tu QR en la puerta.' },
  { id: 'invest', ticketUrl: 'https://www.eventbrite.es/e/start-to-invest-ejemplo', points: 20, posted: '2026-11-05', title: 'Start to Invest', date: '2026-11-30', time: '10:00', where: 'Campus de Getafe', kind: 'Formación', price: 'Gratis para socios', stamp: 'invest', cover: 'sala', going: ['lucia', 'pablo', 'sara', 'diego', 'hugo'], goingCount: 23,
    desc: 'Una mañana con fondos y business angels: cómo se decide una inversión, qué miran en un pitch y ronda de preguntas. Plazas limitadas.' },
  { id: 'podcast-38', posted: '2026-11-19', title: 'Podcast en directo', date: '2026-12-03', time: '18:00', where: 'Campus Puerta de Toledo', kind: 'Podcast', price: 'Gratis', stamp: 'podcast', cover: 'pitch', going: ['gema', 'andres', 'jorge'], goingCount: 49,
    desc: 'Grabamos un episodio con público. Al final hay turno de preguntas para la invitada.' },
  { id: 'cena', ticketUrl: 'https://entradas.startuc3m.es/cena-navidad-ejemplo', posted: '2026-11-10', title: 'Cena de Navidad', date: '2026-12-18', time: '21:00', where: 'Madrid centro', kind: 'Social', price: '25 € socios', membersOnly: true, stamp: 'cena', cover: 'equipo', going: ['lidia', 'gema', 'jorge'], goingCount: 64,
    desc: 'Cerramos el cuatrimestre todos juntos. Solo socios; la entrada se paga al apuntarte.' },
  { id: 'rural', ticketUrl: 'https://entradas.startuc3m.es/casa-rural-ejemplo', points: 30, posted: '2026-10-30', title: 'Casa rural', date: '2027-01-22', end: '2027-01-24', time: '17:00', where: 'Sierra de Gredos', kind: 'Viaje', price: '79 € socios', membersOnly: true, few: 'Quedan 18 plazas', stamp: 'rural27', cover: 'portatiles', going: ['hugo', 'gema', 'pablo'], goingCount: 22,
    desc: 'Tres días fuera con la gente de Start: talleres por la mañana, monte por la tarde y cena todos juntos.' },
  { id: 'notion', points: 10, posted: '2026-11-15', title: 'Start Skills: Notion para equipos', date: '2026-11-25', time: '18:00', where: 'Campus de Getafe', kind: 'Formación', price: 'Gratis', stamp: 'notion', cover: 'portatiles', going: ['carla', 'pablo', 'gema'], goingCount: 28,
    desc: 'Dos horas para montar el Notion de tu equipo: tareas, documentos y bases de datos que se usan de verdad.' },
  { id: 'cafe', points: 10, posted: '2026-11-12', title: 'Café con founders', date: '2026-12-01', time: '10:00', where: 'Cafetería de Leganés', kind: 'Networking', price: 'Gratis', stamp: 'cafe', cover: 'oficina', going: ['jorge', 'ines'], goingCount: 14,
    desc: 'Desayuno informal con tres founders que salieron de la UC3M. Pregunta lo que quieras.' },
  { id: 'pitch-dic', ticketUrl: 'https://www.eventbrite.es/e/noche-de-pitch-ejemplo', points: 20, posted: '2026-11-20', title: 'Noche de pitch', date: '2026-12-10', time: '19:00', where: 'Campus Puerta de Toledo', kind: 'Pitch', price: 'Gratis', stamp: 'pitchDic', cover: 'pitch', going: ['diego', 'lucia', 'hugo'], goingCount: 41,
    desc: 'Cinco proyectos de socios presentan en tres minutos y el público vota. Al final, cervezas.' },
  { id: 'after', posted: '2026-11-11', title: 'Afterwork de diciembre', date: '2026-12-12', time: '20:00', where: 'Madrid centro', kind: 'Social', price: 'Gratis', stamp: 'after', cover: 'equipo', going: ['gema', 'andres'], goingCount: 33,
    desc: 'Para cerrar la semana con la gente de Start antes de los exámenes.' },
  { id: 'taller-ventas', points: 10, posted: '2026-11-12', title: 'Taller de ventas para founders', date: '2026-11-20', time: '18:00', where: 'Campus de Getafe', kind: 'Formación', price: 'Gratis', stamp: 'ventas', cover: 'sala', going: ['lucia', 'diego', 'sara', 'nora', 'ivan', 'alvaro'], goingCount: 31, past: true,
    desc: 'Cómo vender tu idea en cinco minutos: estructura, objeciones y práctica por parejas.' },
  { id: 'feria', posted: '2026-10-15', title: 'Feria de empleo UC3M', date: '2026-11-06', time: '10:00', where: 'Campus de Leganés', kind: 'Empleo', price: 'Gratis', stamp: 'feria', cover: 'oficina', going: ['marta', 'lucia'], goingCount: 52, past: true,
    desc: 'Stand de Start en la feria de empleo de la universidad.' },
  { id: 'camp', photosUrl: 'https://drive.google.com/drive/folders/start-camp-2026-ejemplo', points: 30, posted: '2026-10-01', title: 'Start Camp', date: '2026-11-13', end: '2026-11-15', time: '09:00', where: 'Campus de Leganés', kind: 'Hackathon', price: 'Gratis', stamp: 'camp', cover: 'pitch', going: ['lucia', 'hugo', 'carla'], goingCount: 60, past: true,
    desc: 'Tres días para pasar de una idea a una demo. 14 proyectos presentados.' },
  { id: 'canas-oct', posted: '2026-09-25', title: 'Cañas de bienvenida', date: '2026-10-08', time: '19:30', where: 'La Oficina, Getafe', kind: 'Social', price: 'Gratis', stamp: 'canas', cover: 'equipo', going: ['diego', 'gema'], goingCount: 71, past: true,
    desc: 'Las primeras cañas del curso.' },
  { id: 'build', points: 20, posted: '2026-09-10', title: 'Buildathon', date: '2026-09-26', time: '10:00', where: 'Campus de Leganés', kind: 'Hackathon', price: 'Gratis', stamp: 'build', cover: 'sala', going: ['pablo', 'carla', 'jorge'], goingCount: 40, past: true,
    desc: 'Un día construyendo con IA.' },
];


// El feed «Para ti» se genera solo: eventos, ofertas nuevas, sellos y altas. Nadie
// tiene que escribirlo, así que nunca se queda viejo.
export const FEED = [
  { kind: 'event', id: 'f1', event: 'invest' },
  { kind: 'offer', id: 'f2', offer: 'growth' },
  { kind: 'stamp', id: 'f3', stamp: 'camp', count: 48 },
  { kind: 'joined', id: 'f4', people: ['nora', 'ivan', 'elena', 'mario', 'paula'] },
  { kind: 'offer', id: 'f5', offer: 'analista' },
];

export const NOTIFICATIONS = [
  { id: 'n1', kind: 'stamp', stamp: 'pitch', text: 'Has conseguido el sello <b>PITCH</b> en la Noche de pitch.', when: 'hace 2 días', at: 'hoy', unread: true, href: '#/perfil' },
  { id: 'n2', kind: 'offer', offer: 'growth', text: '<b>Lumen Labs</b> ha publicado <b>Prácticas de growth</b>. 12 de Start ya se han apuntado.', when: 'hace 3 días', at: 'semana', unread: true, href: '#/oferta/growth' },
  { id: 'n3', kind: 'interested', offer: 'astro', people: ['ines', 'jorge'], text: '<b>Inés</b> y <b>Jorge</b> se han apuntado a tu oferta <b>Desarrollo web con Astro</b>.', when: 'hace 4 días', at: 'semana', unread: false, href: '#/oferta/astro/interesados' },
  { id: 'n4', kind: 'event', event: 'invest', text: '<b>Start to Invest</b> es el 30 nov. Entradas en su enlace; si vas, te llevas el sello.', when: 'hace 5 días', at: 'semana', unread: false, href: '#/evento/invest' },
  { id: 'n5', kind: 'joined', person: 'nora', text: '<b>Nora Prieto</b> ha entrado en Start. Es ENFP, como 9 más.', when: 'hace 6 días', at: 'antes', unread: false, href: '#/persona/nora' },
];

// Startups de socios (inventadas): las enseña Inicio para que la gente se conozca por lo que hace.
export const STARTUPS = [
  { id: 'repaso', name: 'Repaso', pitch: 'Tus apuntes convertidos en tests para el examen, por asignatura.', founder: 'jorge', tag: 'Busca gente', sector: 'Edtech', color: '#333399' },
  { id: 'ruta', name: 'Ruta Campus', pitch: 'Coche compartido entre estudiantes para llegar a Getafe y Leganés.', founder: 'ines', tag: 'Abre la beta', sector: 'Movilidad', color: '#1D7A4F' },
  { id: 'brote', name: 'Brote', pitch: 'Huertos en azoteas de oficinas, con sensores que avisan cuándo regar.', founder: 'mario', tag: 'Busca cofundador/a', sector: 'Agro', color: '#9A5B00' },
  { id: 'eco', name: 'Eco', pitch: 'Un agente que resume las actas de las asociaciones de la uni.', founder: 'pablo', tag: 'Busca gente', sector: 'IA', color: '#12123A' },
];

// Petición de apoyo en redes que la Junta destaca en Inicio.

// Qué busca u ofrece cada persona (lo enseña «Gente para ti»).
export const LOOKING = {
  nora: 'Busca: aprender cómo se monta una startup', ivan: 'Primer año. Modelos, finanzas y ajedrez.', elena: 'Busca: equipo para el próximo Start Camp',
  mario: 'Ofrece: prototipos de hardware rápidos', paula: 'Ofrece: contenido para redes', carla: 'Tu equipo · Front y diseño de producto',
  pablo: 'Ofrece: bots y backend', jorge: 'Busca: cofundador/a de negocio',
};

// Mismas reglas que src/panel/model.js de la PR #87. Si cambian allí, se cambian aquí.
export const canManage = (m) => m?.position === 'junta' || (m?.department === 'IT' && m?.manage_users === true);
export const canPublish = (m) => ['junta', 'responsable'].includes(m?.position);
// Puntos por QR: solo la Junta crea QR de puntos; cada persona escanea cada QR una sola vez.
export const canCreatePointsQr = (m) => m?.position === 'junta';
// Cuántos puntos da asistir a un evento (0 = solo el sello): solo la Junta lo decide.
export const canSetEventPoints = (m) => m?.position === 'junta';
export const EVENT_POINT_OPTIONS = [0, 5, 10, 20, 30];
// Ven a los apuntados y marcan «Asistió»: los departamentos de Eventos y RRHH, y la Junta.
export const ATTENDANCE_DEPTS = ['Eventos', 'RRHH'];
export const canManageAttendance = (m) => ATTENDANCE_DEPTS.includes(m?.department) || m?.position === 'junta';
// Asistencia ya confirmada en la demo (eventos cuyos puntos ya se dieron).
export const ATTENDANCE_SEED = { camp: ['lucia', 'hugo', 'carla', 'alvaro'] };
export const positionLabel = (x) => (x.kind !== 'starter' ? 'Socio'
  : x.position === 'junta' ? 'Junta'
    : x.position === 'responsable' ? `Responsable de ${x.department}`
      : `Starter · ${x.department}`);
// Los permisos de editar la web (startskills, eventos, blog: panel_permissions en #87) son del
// gestor de contenidos de la web, no de la app: la demo no los enseña.

// «Ver como» del botón DEMO: la misma persona con otro cargo, para enseñar qué cambia.
export const VIEW_AS = {
  it: { label: 'IT autorizado', patch: {} },
  socio: { label: 'Socio', patch: { role: 'socio', kind: 'socio', dept: null, department: null, position: 'miembro', manage_users: false, permissions: [] } },
  starter: { label: 'Starter', patch: { manage_users: false, permissions: [] } },
  responsable: { label: 'Responsable RRHH', patch: { dept: 'RRHH', department: 'RRHH', position: 'responsable', manage_users: false, permissions: ['startskills'] } },
  eventos: { label: 'Eventos', patch: { dept: 'Eventos', department: 'Eventos', position: 'miembro', manage_users: false, permissions: [] } },
  junta: { label: 'Junta', patch: { dept: 'Junta', department: 'Junta', position: 'junta', manage_users: false, permissions: ['startskills', 'eventos', 'blog'] } },
};

// Puntos del mes: los de cada evento al que asistes (si vale algo; lo decide la Junta, y llegan
// 24 h después), más los QR de puntos que crea la Junta.
// Puntos para quien trae a un socio nuevo con su QR de invitación.
export const REFERRAL_POINTS = 25;
export const POINTS_BASE = { hugo: 85, lucia: 70, lidia: 55, gema: 60, alvaro: 50, carla: 45, andres: 40, marta: 30, jorge: 20 };
export const STARTER_OF_MONTH = { month: 'octubre', person: 'hugo', points: 120 };

// Correos autorizados (en el backend real: panel_members, los que IT o la Junta han invitado).
export const AUTHORIZED = ['nora.prieto@alumnos.uc3m.es', 'ivan.soler@alumnos.uc3m.es', 'alvaro.carpintero@alumnos.uc3m.es', 'elena.vidal@alumnos.uc3m.es'];
export const DEMO_CODE = '482913';
