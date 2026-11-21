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

// Sellos: uno por evento al que se ha ido (se ficha con el QR del carné).
export const STAMPS = {
  camp: { id: 'camp', label: 'CAMP', name: 'Start Camp', date: 'NOV 26', color: 'lime' },
  build: { id: 'build', label: 'BUILD', name: 'Buildathon', date: 'SEP 26', color: 'cyan' },
  skills: { id: 'skills', label: 'SKILLS', name: 'Start Skills', date: 'OCT 26', color: 'lavender' },
  canas: { id: 'canas', label: 'CAÑAS', name: 'Cañas de bienvenida', date: 'OCT 26', color: 'yellow' },
  pitch: { id: 'pitch', label: 'PITCH', name: 'Noche de pitch', date: 'OCT 26', color: 'lime' },
  rural: { id: 'rural', label: 'RURAL', name: 'Casa rural', date: 'OCT 26', color: 'cyan' },
  next: { id: 'next', label: 'NEXT', name: 'Next Gen Summit', date: 'MAR 26', color: 'lavender' },
  invest: { id: 'invest', label: 'INVEST', name: 'Start to Invest', date: 'NOV 26', color: 'yellow' },
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

const p = (id, name, career, course, role, dept, type, stamps, bio, extra = {}) => ({
  id, name, initials: name.split(' ').map((w) => w[0]).slice(0, 2).join(''),
  career, course, role, dept, type, stamps, bio, linkedin: `https://www.linkedin.com/in/${id}-ejemplo`, ...extra,
});

export const PEOPLE = [
  p('lucia', 'Lucía Martín', 'ADE', '3.º', 'starter', 'Marketing', 'ENFJ', ['camp', 'build', 'skills', 'canas', 'pitch', 'rural', 'next'], 'Me interesan el growth y las marcas que empiezan.', { isNew: false }),
  p('pablo', 'Pablo Herrera', 'Ing. Informática', '2.º', 'socio', null, 'INTP', ['camp', 'build'], 'Backend, bots y cualquier cosa con datos.'),
  p('marta', 'Marta Gil', 'Derecho', '4.º', 'starter', 'Legal', 'ISTJ', ['camp', 'canas', 'skills'], 'Contratos de startups y propiedad intelectual.'),
  p('diego', 'Diego Romero', 'Economía', '3.º', 'socio', null, 'ESTP', ['camp', 'canas', 'pitch', 'invest'], 'Inversión early stage. Siempre en las cañas.'),
  p('sara', 'Sara Núñez', 'Diseño', '1.º', 'socio', null, 'INFP', ['camp'], 'Ilustración, branding y tipografía.', { isNew: true }),
  p('hugo', 'Hugo Blanco', 'Ing. Industrial', '4.º', 'starter', 'Eventos', 'ENTJ', ['camp', 'build', 'canas', 'pitch', 'rural'], 'Montando el Start Camp desde el primer día.'),
  p('nora', 'Nora Prieto', 'Periodismo', '2.º', 'socio', null, 'ENFP', [], 'Recién llegada. Quiero aprender a contar startups.', { isNew: true }),
  p('ivan', 'Iván Soler', 'Matemáticas', '1.º', 'socio', null, 'INTJ', [], 'Modelos, finanzas y ajedrez.', { isNew: true }),
  p('elena', 'Elena Vidal', 'ADE + Derecho', '2.º', 'socio', null, 'ESFJ', ['canas'], 'Me encanta organizar cosas con gente.', { isNew: true }),
  p('mario', 'Mario Ortega', 'Ing. Telemática', '3.º', 'socio', null, 'ISTP', [], 'Hardware y prototipos rápidos.', { isNew: true }),
  p('paula', 'Paula Torres', 'Marketing', '1.º', 'socio', null, 'ENFP', [], 'Contenido y redes.', { isNew: true }),
  p('carla', 'Carla Ruiz', 'Ing. Informática', '2.º', 'starter', 'Marketing', 'ENTP', ['camp', 'build', 'skills'], 'Front y diseño de producto.'),
  p('gema', 'Gema Castro', 'Publicidad', '3.º', 'starter', 'Marketing', 'ISFJ', ['camp', 'canas', 'skills', 'pitch'], 'Fotos de todos los eventos (sí, también tuyas).'),
  p('andres', 'Andrés León', 'Comunicación', '2.º', 'starter', 'Marketing', 'ESFP', ['camp', 'canas'], 'Vídeo y reels.'),
  p('lidia', 'Lidia Wang', 'Bellas Artes', '4.º', 'starter', 'Marketing', 'INFJ', ['camp', 'build', 'skills', 'canas', 'pitch', 'rural', 'next', 'invest'], 'Brand kit 26/27. Si ves algo lima, fui yo.'),
  p('jorge', 'Jorge Vela', 'Ing. Informática', '4.º', 'socio', null, 'ENTP', ['camp', 'build'], 'Fundando mi primera startup de edtech.'),
  p('ines', 'Inés Ramos', 'Física', '3.º', 'socio', null, 'ENTP', ['skills'], 'Deep tech y energía.'),
];

export const ME = {
  id: 'alvaro', name: 'Álvaro Carpintero', initials: 'AC', career: 'Ing. Informática', course: '3.º',
  role: 'starter', dept: 'IT', type: 'ENTP', number: 42, stamps: ['camp', 'build', 'canas', 'skills', 'pitch'],
  bio: 'Construyo la web y el área de socios de Start.', linkedin: 'https://www.linkedin.com/in/ejemplo',
  interests: ['growth', 'astro'], canPublish: true, canManage: true, onboarded: true,
  cv: { name: 'CV-Alvaro-Carpintero.pdf', size: '184 KB', updated: '12 nov' },
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
  lumen: { name: 'Lumen Labs', note: 'Startup de marketing', initial: 'L', color: '#FF6B35' },
  start: { name: 'Start UC3M', note: 'IT', initial: 's_', color: '#333399', isStart: true },
  arrayan: { name: 'Fondo Arrayán', note: 'Venture capital', initial: 'A', color: '#1D7A4F' },
  kilo: { name: 'Kilo Robotics', note: 'Hardware', initial: 'K', color: '#12123A' },
};

export const OFFERS = [
  {
    id: 'growth', title: 'Prácticas de growth', company: 'lumen', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 5 dic',
    place: 'Híbrida · Madrid', duration: '6 meses', hours: '20 h/semana', pay: 'Remunerada', cover: 'oficina',
    desc: 'Buscan a alguien de ADE, Marketing o Economía para el equipo de crecimiento: campañas, análisis de datos y pruebas A/B. 20 h a la semana, remunerado y compatible con clases.',
    contact: 'Hugo', interested: ['lucia', 'diego', 'sara', 'hugo', 'marta', 'pablo', 'gema', 'andres', 'carla', 'jorge', 'ines', 'lidia'], isNew: true,
  },
  {
    id: 'astro', title: 'Desarrollo web con Astro', company: 'start', kind: 'Proyecto', kindColor: 'lavender', deadline: 'Hasta el 10 dic',
    place: 'Remoto', duration: '3 meses', hours: '5 h/semana', pay: 'Voluntario', cover: 'equipo',
    desc: 'Ayúdanos con la web de Start: páginas nuevas, rendimiento y el área de socios. Aprendes Astro, React y a trabajar con PRs revisadas.',
    contact: 'Álvaro', interested: ['pablo', 'carla', 'jorge', 'ines'], mine: true,
  },
  {
    id: 'analista', title: 'Analista de inversión junior', company: 'arrayan', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 15 dic',
    place: 'Presencial · Madrid', duration: '6 meses', hours: '25 h/semana', pay: 'Remunerada', cover: 'pitch',
    desc: 'Análisis de startups en fase semilla: due diligence, modelos financieros y seguimiento de cartera. Perfil de Economía, ADE o Matemáticas.',
    contact: 'Diego', interested: ['hugo', 'ines', 'jorge', 'diego', 'ivan', 'marta', 'pablo', 'lucia', 'elena'],
  },
  {
    id: 'invest', title: 'Voluntariado Start to Invest', company: 'start', kind: 'Voluntariado', kindColor: 'yellow', deadline: '30 nov',
    place: 'Campus de Getafe', duration: '1 día', hours: '6 h', pay: 'Sello INVEST', cover: 'sala',
    desc: 'Recepción, acreditaciones y apoyo en las mesas del Start to Invest. Comida incluida y sello del evento.',
    contact: 'Lidia', interested: ['gema', 'andres', 'elena', 'hugo', 'lucia', 'sara', 'paula'],
  },
  {
    id: 'hardware', title: 'Prototipado de hardware', company: 'kilo', kind: 'Prácticas', kindColor: 'cyan', deadline: 'Hasta el 20 dic',
    place: 'Leganés', duration: '4 meses', hours: '20 h/semana', pay: 'Remunerada', cover: 'portatiles',
    desc: 'Electrónica, impresión 3D y pruebas de campo con un equipo de cinco personas.',
    contact: 'Mario', interested: ['mario', 'pablo'],
  },
];

export const EVENTS = [
  { id: 'invest', title: 'Start to Invest', day: '30', month: 'NOV', where: 'Campus de Getafe', stamp: 'invest', cover: 'sala', going: ['lucia', 'pablo', 'sara', 'diego', 'hugo'], goingCount: 23 },
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
  { id: 'n4', kind: 'event', event: 'invest', text: '<b>Start to Invest</b> es el 30 nov. Lleva tu carné para fichar.', when: 'hace 5 días', at: 'semana', unread: false, href: '#/comunidad' },
  { id: 'n5', kind: 'joined', person: 'nora', text: '<b>Nora Prieto</b> ha entrado en Start. Es ENFP, como 9 más.', when: 'hace 6 días', at: 'antes', unread: false, href: '#/persona/nora' },
];
