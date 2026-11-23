// API falsa del prototipo. Misma firma que el cliente de la PR #87
// (`api(action, input)` → promesa con JSON o error con mensaje), así que el día
// que exista el backend se cambia este archivo y las pantallas no se tocan.
// El estado de la demo vive en localStorage para que «Me interesa», los sellos o
// el perfil sobrevivan a una recarga; «Reiniciar demo» lo borra.
import { AUTHORIZED, DEMO_CODE, POINTS_BASE, STARTER_OF_MONTH, VIEW_AS, canSetEventPoints, canManageAttendance, ATTENDANCE_SEED, NOW, canManage, canPublish, positionLabel, LOOKING, STARTUPS, TODAY, CVS, EVENTS, FEED, ME, OFFERS, PEOPLE, STAMPS, COMPANIES, TYPE_COUNTS, FAMILIES, TYPE_NAMES, familyOf, levelFor } from './data.js';

const KEY = 'start-panel-demo';

export const DEMO_DEFAULTS = { latency: 'normal', empty: false, error: false, extreme: false, viewAs: 'it', later: false };

// «Datos extremos»: para ver dónde se rompe la interfaz con contenido real feo.
const extremePerson = (x) => ({
  ...x,
  name: x.id === 'lucia' ? 'María de los Ángeles Fernández-Villaverde Rodríguez' : `${x.name} de la Concepción`,
  career: 'Doble Grado en Ingeniería Informática y Administración de Empresas',
  dept: x.dept ? `${x.dept} y Comunicación Corporativa` : x.dept,
  bio: 'Me interesan el growth, las marcas que empiezan, la inversión de impacto y conocer a gente con ganas de montar cosas de verdad.',
});

function fresh() {
  return {
    me: { ...ME },
    interests: OFFERS.filter((o) => o.id === 'growth' || o.id === 'analista').map((o) => o.id),
    offers: [],
    status: {},
    points: [],
    eventPoints: {}, // puntos de evento cambiados por la Junta: { [id]: n }
    eventLinks: {}, // enlace de entradas cambiado por la Junta: { [id]: url | null }
    eventPhotos: {}, // miniatura (una sola) del evento cambiada por la Junta: { [id]: clave de foto o URL }
    eventAlbums: {}, // enlace a la carpeta de fotos (después del evento): { [id]: url | null }
    attendance: { ...ATTENDANCE_SEED }, // { [evento]: [personas] } asistencia confirmada por Eventos, RRHH o la Junta
    applications: [],
    changes: {},
    prefs: { privacy: { gente: true, email: true, cv: true } },
    settings: { ...DEMO_DEFAULTS },
  };
}

export function createDemoApi({ storage = safeStorage(), wait = sleep } = {}) {
  let state = load();
  // ?como=socio|starter|responsable|it|junta abre la demo con esa jerarquía (enlaces para enseñarla).
  try {
    const como = new URLSearchParams(globalThis.location?.search ?? '').get('como');
    if (como && VIEW_AS[como]) state = { ...state, settings: { ...state.settings, viewAs: como } };
  } catch {}

  function load() {
    try {
      const raw = storage?.getItem(KEY);
      // Los campos nuevos del perfil (p. ej. la universidad) se rellenan aunque la demo guardada sea anterior.
      if (raw) { const saved = JSON.parse(raw); const base = fresh(); return { ...base, ...saved, me: { ...base.me, ...saved.me } }; }
    } catch {}
    return fresh();
  }
  function save() {
    try { storage?.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  // Tú, con el cargo que se esté probando en «Ver como» (botón DEMO).
  const meNow = () => {
    const me = { ...state.me, ...(VIEW_AS[state.settings.viewAs]?.patch ?? {}) };
    const extra = awardedFor(me.id).map((e) => e.stamp).filter((st) => !me.stamps.includes(st));
    return extra.length ? { ...me, stamps: [...me.stamps, ...extra] } : me;
  };
  const person = (id) => {
    if (id === state.me.id) return meNow();
    const x = PEOPLE.find((y) => y.id === id);
    return x && state.changes[id] ? { ...x, ...state.changes[id] } : x;
  };
  const people = () => PEOPLE.map((x) => person(x.id));
  const pointsOf = (id) => (POINTS_BASE[id] ?? 0) + state.points.filter((x) => x.person === id).reduce((n, x) => n + x.points, 0)
    + awardedFor(id).reduce((n, e) => n + eventPointsOf(e), 0);
  const allOffers = () => [...state.offers, ...OFFERS];
  // «Lo nuevo en Start»: solo lo publicado la última semana en Oportunidades y Eventos.
  const DAY = 86400000;
  const daysAgo = (iso) => Math.round((new Date(TODAY) - new Date(iso ?? '2000-01-01')) / DAY);
  const agoLabel = (n) => (n <= 0 ? 'hoy' : n === 1 ? 'ayer' : `hace ${n} días`);
  const news = (events, offers) => [
    ...offers.filter((o) => daysAgo(o.posted) <= 7).map((o) => ({ kind: 'offer', id: o.id, href: `#/oferta/${o.id}`, title: o.title, by: `${o.company.name} · ${o.kind}`, company: o.company, days: daysAgo(o.posted) })),
    ...events.filter((e) => daysAgo(e.posted) <= 7).map((e) => ({ kind: 'event', id: e.id, href: `#/evento/${e.id}`, title: e.title, by: `${e.when} · ${e.where}`, days: daysAgo(e.posted) })),
  ].sort((a, b) => a.days - b.days).map((x) => ({ ...x, ago: agoLabel(x.days) }));
  const decorateOffer = (o) => {
    const mine = state.interests.includes(o.id);
    const interested = o.interested.filter((id) => id !== state.me.id);
    const all = mine ? [state.me.id, ...interested] : interested;
    const X = state.settings.extreme;
    const company = COMPANIES[o.company] ?? o.company;
    return {
      ...o,
      ...(X ? { title: `${o.title} para el equipo internacional de producto y crecimiento`, deadline: 'Hasta el 31 de diciembre de 2026', place: 'Híbrida · Madrid, Barcelona y remoto' } : {}),
      company: X ? { ...company, name: `${company.name} International Ventures Group` } : company,
      interestedCount: X ? 999 : all.length,
      interestedPeople: all.slice(0, 3).map(person).filter(Boolean),
      isInterested: mine,
      daysLeft: o.closes ? Math.round((new Date(`${o.closes}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / 864e5) : null,
      isMine: Boolean(o.mine || o.createdByMe),
    };
  };
  const decoratePerson = (x0) => {
    const x = state.settings.extreme ? extremePerson(x0) : x0;
    return { ...x, points: pointsOf(x.id), family: familyOf(x.type), typeName: TYPE_NAMES[x.type], level: levelFor(x.stamps.length), stampList: x.stamps.map((s) => STAMPS[s]), positionLabel: positionLabel(x), canManage: canManage(x), canPublish: canPublish(x) };
  };

  const eventPointsOf = (e) => state.eventPoints[e.id] ?? e.points ?? 0;
  // Asistencia: Eventos confirma quién vino; 24 h después del evento llegan sus puntos y su sello.
  const startOf = (e) => new Date(`${e.date}T${e.time}:00`);
  const awardAt = (e) => new Date(new Date(`${e.end ?? e.date}T${e.time}:00`).getTime() + 864e5);
  // «Ahora» de la demo; con «+24 h» en el panel DEMO se adelanta un día para ver cómo llegan los puntos.
  const nowDate = () => new Date(new Date(NOW).getTime() + (state.settings.later ? 864e5 : 0));
  const pointsGiven = (e) => awardAt(e) <= nowDate();
  const attendeesOf = (id) => state.attendance[id] ?? [];
  const dateLabel = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  // Eventos cuyos puntos y sello ya se dieron a una persona (asistencia confirmada y pasadas las 24 h).
  const awardedFor = (pid) => EVENTS.filter((e) => pointsGiven(e) && attendeesOf(e.id).includes(pid));
  const decorateEvent = (e) => {
    const d = new Date(`${e.date}T12:00:00`);
    const days = Math.round((d - new Date(`${TODAY}T12:00:00`)) / 864e5);
    return {
      ...e,
      points: eventPointsOf(e), canSetPoints: canSetEventPoints(meNow()),
      ticketUrl: e.id in state.eventLinks ? state.eventLinks[e.id] : (e.ticketUrl ?? null), // dónde se compran o reservan las entradas (fuera de la app)
      cover: state.eventPhotos[e.id] ?? e.cover, // una sola foto: clave de `photos` o una URL
      photosUrl: e.id in state.eventAlbums ? state.eventAlbums[e.id] : (e.photosUrl ?? null), // carpeta de fotos, después del evento
      canSeeAttendees: canManageAttendance(meNow()), signupCount: (e.going ?? []).length,
      started: startOf(e) <= nowDate(), pointsGiven: pointsGiven(e), pointsAt: dateLabel(awardAt(e)),
      attended: attendeesOf(e.id).includes(state.me.id),
      day: String(d.getDate()), month: MONTHS[d.getMonth()].slice(0, 3).toUpperCase(),
      when: `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} · ${e.time}`,
      inDays: days, relative: e.past ? 'Ya pasó' : days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`,
      hasStamp: meNow().stamps.includes(e.stamp), stamp: STAMPS[e.stamp],
    };
  };

  const actions = {
    me: () => ({ me: { ...decoratePerson(meNow()), viewAs: state.settings.viewAs } }),

    feed: () => {
      if (state.settings.empty) return { items: [], newcomers: [] };
      const items = FEED.map((f) => {
        if (f.kind === 'event') {
          return { ...f, event: decorateEvent(EVENTS.find((x) => x.id === f.event)) };
        }
        if (f.kind === 'offer') return { ...f, offer: decorateOffer(allOffers().find((o) => o.id === f.offer)) };
        if (f.kind === 'stamp') return { ...f, stamp: STAMPS[f.stamp], mine: state.me.stamps.includes(f.stamp), myCount: state.me.stamps.length };
        if (f.kind === 'joined') return { ...f, people: f.people.map(person) };
        return f;
      }).filter((f) => f.kind !== 'joined');
      const newcomers = PEOPLE.filter((x) => x.isNew).map(decoratePerson);
      const sameCareer = PEOPLE.filter((x) => x.career === state.me.career && x.id !== state.me.id).slice(0, 3).map(decoratePerson);
      return { items, newcomers, sameCareer };
    },

    people: ({ q = '', filter = 'todos', type = null } = {}) => {
      if (state.settings.empty) return { people: [], total: 0 };
      const needle = normalize(q);
      const list = people().filter((x) => x.active !== false && (filter === 'todos' || x.role === filter.replace(/s$/, ''))
        && (!type || x.type === type)
        && (!needle || normalize(`${x.name} ${x.career}`).includes(needle))).map(decoratePerson);
      const leaders = filter === 'todos' && !needle && !type ? people().filter((x) => x.position !== 'miembro').sort((a, b) => (a.position === 'junta' ? -1 : b.position === 'junta' ? 1 : 0)).map(decoratePerson) : [];
      return { people: list, total: list.length, leaders };
    },

    person: ({ id }) => {
      const x = person(id);
      if (!x) throw new Error('Esa persona ya no está en Start.');
      const team = x.dept ? PEOPLE.filter((y) => y.dept === x.dept && y.id !== x.id).map(decoratePerson) : [];
      const sameType = PEOPLE.filter((y) => y.type === x.type && y.id !== x.id).map(decoratePerson);
      return { person: decoratePerson(x), team, sameType };
    },

    map: () => ({
      myType: state.me.type,
      families: FAMILIES.map((f) => ({
        ...f,
        total: f.codes.reduce((n, c) => n + TYPE_COUNTS[c], 0),
        types: f.codes.map((c) => ({ code: c, name: TYPE_NAMES[c], count: TYPE_COUNTS[c], faces: PEOPLE.filter((y) => y.type === c).slice(0, 3) })),
      })),
    }),

    offers: ({ tab = 'todas', kind = null, q = '' } = {}) => {
      if (state.settings.empty) return { offers: [], counts: { todas: 0, interesan: 0, mias: 0 } };
      const all = allOffers().map(decorateOffer);
      const needle = normalize(q);
      const list = (tab === 'interesan' ? all.filter((o) => o.isInterested) : tab === 'mias' ? all.filter((o) => o.isMine) : all)
        .filter((o) => (!kind || o.kind === kind) && (!needle || normalize(`${o.title} ${o.company.name} ${o.kind}`).includes(needle)));
      return { offers: list, counts: { todas: all.length, interesan: all.filter((o) => o.isInterested).length, mias: all.filter((o) => o.isMine).length } };
    },

    offer: ({ id }) => {
      const o = allOffers().find((x) => x.id === id);
      if (!o) throw new Error('Esta oferta ya no está publicada.');
      return { offer: decorateOffer(o) };
    },

    'offer.interest': ({ id, on }) => {
      const firstTime = on && state.interests.length === 0;
      state.interests = on ? [...new Set([id, ...state.interests])] : state.interests.filter((x) => x !== id);
      save();
      return { offer: actions.offer({ id }).offer, firstTime };
    },

    // Solo para quien publicó la oferta: interesados con su CV (privado) y en qué punto está cada uno.
    'offer.interested': ({ id }) => {
      const o = allOffers().find((x) => x.id === id);
      if (!o) throw new Error('Esta oferta ya no está publicada.');
      const people = o.interested.map(person).filter(Boolean).map((x) => ({
        ...decoratePerson(x),
        cv: x.id === state.me.id ? state.me.cv : CVS[x.id] ? { name: `CV-${x.name.replace(/ /g, '-')}.pdf`, meta: CVS[x.id] } : null,
        status: state.status[`${id}:${x.id}`] ?? 'nuevo',
      }));
      return { offer: decorateOffer(o), people };
    },
    'applicant.status': ({ offer, person: pid, status }) => {
      state.status = { ...state.status, [`${offer}:${pid}`]: status };
      save();
      return { status };
    },
    'cv.upload': ({ name = 'Mi-CV.pdf', size = '160 KB' } = {}) => {
      state.me = { ...state.me, cv: { name, size, updated: 'hoy' } };
      save();
      return actions.me();
    },
    'cv.remove': () => { state.me = { ...state.me, cv: null }; save(); return actions.me(); },

    'offer.create': (input) => {
      const title = String(input.title ?? '').trim();
      if (!title) throw new Error('Ponle un título a la oferta.');
      const o = { id: `o${Date.now()}`, posted: TODAY, title, company: 'start', kind: input.kind || 'Proyecto', kindColor: 'lavender', deadline: input.deadline || 'Sin fecha', place: input.place || 'Por definir', duration: '—', hours: '—', pay: '—', cover: 'equipo', desc: input.desc || '', contact: state.me.name.split(' ')[0], interested: [], createdByMe: true };
      state.offers = [o, ...state.offers];
      save();
      return { offer: decorateOffer(o) };
    },

    // Inicio: lo tuyo y lo nuevo, en piezas cortas (cada carrusel con pocas tarjetas).
    home: () => {
      const empty = state.settings.empty;
      const events = EVENTS.map(decorateEvent).filter((e) => !e.past).sort((a, b) => a.date.localeCompare(b.date));
      const offers = allOffers().map(decorateOffer);
      const newcomers = PEOPLE.filter((x) => x.isNew);
      const same = PEOPLE.filter((x) => x.career === state.me.career && !x.isNew);
      const people = [...newcomers.slice(0, 3), ...same.slice(0, 2)].map((x) => ({ ...decoratePerson(x), looking: LOOKING[x.id] ?? x.bio, reason: x.isNew ? 'Nuevo en Start' : 'Estudia lo mismo que tú' }));
      if (empty) return { counts: { planes: 0, gente: 0, oportunidades: 0 }, news: [], events: [], offers: [], people: [], startups: [] };
      return {
        counts: { planes: events.length, gente: PEOPLE.filter((x) => x.active !== false).length + 1, oportunidades: offers.filter((o) => !o.isInterested && (o.daysLeft ?? 99) >= 0).length },
        news: news(events, offers),
        events: events.slice(0, 5),
        offers: offers.filter((o) => !o.isInterested && !o.isMine).sort((a, b) => b.interestedCount - a.interestedCount).slice(0, 4),
        people,
        startups: STARTUPS.map((x) => ({ ...x, founder: decoratePerson(person(x.founder)) })),
        starterOfMonth: { ...STARTER_OF_MONTH, person: decoratePerson(person(STARTER_OF_MONTH.person)) },
      };
    },
    // Acceso solo para correos autorizados: pides un código y te llega al correo (6 cifras).
    'auth.request': ({ email = '' } = {}) => {
      const e = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('Escribe tu correo completo.');
      if (!AUTHORIZED.includes(e)) throw new Error('Este correo no tiene invitación. Entra con el correo con el que te invitaron.');
      return { sent: true, email: e, demoCode: DEMO_CODE };
    },
    'auth.verify': ({ email = '', code = '' } = {}) => {
      if (!AUTHORIZED.includes(String(email).trim().toLowerCase())) throw new Error('Este correo no tiene invitación.');
      if (String(code).trim() !== DEMO_CODE) throw new Error('Código incorrecto. Revisa el correo o pide otro.');
      return { ok: true };
    },
    'auth.google': ({ email = '' } = {}) => {
      if (!AUTHORIZED.includes(String(email).toLowerCase())) throw new Error('Esa cuenta de Google no está autorizada. Entra con el correo con el que te invitaron.');
      return { ok: true };
    },

    // Gestión › resumen: las cifras que le importan a tu cargo.
    'gestion.summary': () => {
      const me = meNow();
      const mine = allOffers().map(decorateOffer).filter((o) => o.isMine);
      return {
        offers: canPublish(me) ? { published: mine.length, interested: mine.reduce((n, o) => n + o.interestedCount, 0), fresh: 2 } : null,
        attendance: canManageAttendance(me) ? { open: EVENTS.filter((e) => startOf(e) <= nowDate() && !pointsGiven(e)).length } : null,
      };
    },


    // Puntos del mes y Starter del mes (solo Starters; los socios no entran en el ranking).
    ranking: () => {
      const me = meNow();
      const starters = [...people().filter((x) => x.kind === 'starter'), ...(me.kind === 'starter' ? [me] : [])]
        .map((x) => ({ ...decoratePerson(x), points: pointsOf(x.id) }))
        .sort((a, b) => b.points - a.points);
      const som = person(STARTER_OF_MONTH.person);
      return {
        month: 'noviembre', ranking: starters, myRank: starters.findIndex((x) => x.id === me.id) + 1 || null,
        starterOfMonth: { ...STARTER_OF_MONTH, person: decoratePerson(som) },
        log: state.points.slice(-5).reverse().map((x) => ({ ...x, person: person(x.person) })),
      };
    },


    events: ({ tab = 'proximos' } = {}) => {
      if (state.settings.empty) return { events: [], all: [] };
      const all = EVENTS.map(decorateEvent).sort((a, b) => a.date.localeCompare(b.date));
      const list = tab === 'pasados' ? all.filter((e) => e.past).reverse() : all.filter((e) => !e.past);
      return { events: list, all };
    },
    event: ({ id }) => {
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Este evento ya no está publicado.');
      return { event: decorateEvent(e) };
    },


    prefs: () => ({ prefs: state.prefs }),
    'prefs.update': ({ group, key, value }) => {
      state.prefs = { ...state.prefs, [group]: { ...state.prefs[group], [key]: value } };
      save();
      return { prefs: state.prefs };
    },
    // Hacerse socio desde la pantalla de acceso. En la demo el pago siempre sale bien.
    // Pagar no da acceso: queda pendiente hasta que IT o la Junta autoricen e inviten (regla 4.6 de #87).
    'member.join': ({ plan = 'curso', email = '' } = {}) => {
      state.applications = [...state.applications, { plan, email, at: 'ahora', status: 'pendiente' }];
      save();
      return { status: 'pendiente' };
    },


    // Apuntados de un evento (vienen de la plataforma de entradas) y quién asistió. Solo Eventos y Junta.
    'event.attendees': ({ id }) => {
      if (!canManageAttendance(meNow())) throw new Error('Solo la Junta, los responsables, Eventos y RRHH ven a los apuntados.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      const confirmed = attendeesOf(id);
      return { people: (e.going ?? []).map(person).filter(Boolean).map((x) => ({ ...decoratePerson(x), confirmed: confirmed.includes(x.id) })) };
    },
    // Marcar (o desmarcar) que alguien asistió. Se puede desde que empieza el evento hasta que se dan los puntos (24 h después).
    'event.attendance': ({ id, person: pid, on }) => {
      if (!canManageAttendance(meNow())) throw new Error('Solo la Junta, los responsables, Eventos y RRHH confirman la asistencia.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      if (startOf(e) > nowDate()) throw new Error('Podrás confirmar la asistencia el día del evento.');
      if (pointsGiven(e)) throw new Error('Ya se dieron los puntos: la asistencia está cerrada.');
      if (!(e.going ?? []).includes(pid)) throw new Error('Esa persona no está apuntada.');
      const cur = attendeesOf(id);
      state.attendance = { ...state.attendance, [id]: on ? [...new Set([...cur, pid])] : cur.filter((x) => x !== pid) };
      save();
      return { event: decorateEvent(e), ...actions['event.attendees']({ id }) };
    },
    // La foto del evento (una sola, la de la miniatura y la ficha). Solo la Junta y los responsables.
    'event.photo': ({ id, cover }) => {
      if (!canSetEventPoints(meNow())) throw new Error('Solo la Junta y los responsables cambian la miniatura del evento.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      if (!cover || typeof cover !== 'string') throw new Error('Elige una foto.');
      state.eventPhotos = { ...state.eventPhotos, [id]: cover };
      save();
      return { event: decorateEvent(e) };
    },
    // Enlace a la carpeta de fotos (Drive, etc.), para después del evento. Junta y responsables; vacío lo quita.
    'event.album': ({ id, url = '' } = {}) => {
      if (!canSetEventPoints(meNow())) throw new Error('Solo la Junta y los responsables ponen el enlace de las fotos.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      const u = String(url ?? '').trim();
      if (u && !/^https:\/\/\S+\.\S+$/.test(u)) throw new Error('Enlace: pega la dirección completa, empezando por https://');
      state.eventAlbums = { ...state.eventAlbums, [id]: u || null };
      save();
      return { event: decorateEvent(e) };
    },
    // La Junta pone (o quita) el enlace de las entradas de un evento. La app no vende ni apunta: solo enlaza.
    'event.link': ({ id, url = '' } = {}) => {
      if (!canSetEventPoints(meNow())) throw new Error('Solo la Junta y los responsables cambian el enlace de las entradas.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      const u = String(url ?? '').trim();
      if (u && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(u)) throw new Error('Enlace: pega la dirección completa, empezando por https://');
      state.eventLinks = { ...state.eventLinks, [id]: u || null };
      save();
      return { event: decorateEvent(e) };
    },
    // La Junta decide cuántos puntos da asistir a un evento (0 = solo el sello).
    'event.points': ({ id, points }) => {
      if (!canSetEventPoints(meNow())) throw new Error('Solo la Junta y los responsables deciden los puntos de un evento.');
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Ese evento no existe.');
      const n = Number(points);
      if (!Number.isInteger(n) || n < 0 || n > 50) throw new Error('Puntos: entre 0 y 50.');
      state.eventPoints = { ...state.eventPoints, [id]: n };
      save();
      return { event: decorateEvent(e) };
    },


    'profile.update': (input) => {
      const name = String(input.name ?? '').trim();
      if (!name) throw new Error('Nombre: revisa este campo.');
      if (input.linkedin && !/^https:\/\/(www\.)?linkedin\.com\//.test(input.linkedin)) throw new Error('LinkedIn: pega el enlace completo de tu perfil.');
      state.me = { ...state.me, ...input, name, initials: name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() };
      save();
      return actions.me();
    },
    // Solo los perfiles completos salen en Gente y en el mapa: nombre, carrera, curso y foto son obligatorios.
    'photo.upload': () => { state.me = { ...state.me, photo: true }; save(); return actions.me(); },
    'onboarding.done': () => {
      const m = state.me;
      const missing = [!m.photo && 'foto', !String(m.career ?? '').trim() && 'carrera', !m.course && 'curso'].filter(Boolean);
      if (missing.length) throw new Error(`Falta: ${missing.join(', ')}.`);
      state.me = { ...m, onboarded: true }; save(); return actions.me();
    },

    // Ajustes del panel «Demo» (no existen en el backend real).
    'demo.settings': (input) => { state.settings = { ...state.settings, ...input }; save(); return { settings: state.settings }; },
    'demo.reset': () => { state = fresh(); save(); return { ok: true }; },
    'demo.signout': () => { state.me = { ...state.me, onboarded: false }; save(); return { ok: true }; },
  };

  async function api(action, input = {}) {
    const fn = actions[action];
    if (!fn) throw new Error(`Acción desconocida: ${action}`);
    const isDemo = action.startsWith('demo.');
    if (!isDemo) await wait(delayFor(state.settings.latency));
    if (!isDemo && state.settings.error && action !== 'me') throw new Error('No hay conexión. Revisa tu red y vuelve a intentarlo.');
    return structuredClone(fn(input));
  }

  return { api, getSettings: () => ({ ...state.settings }) };
}

function delayFor(latency) {
  if (latency === 'none') return 0;
  if (latency === 'slow') return 1600 + Math.random() * 600;
  return 180 + Math.random() * 260;
}
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function safeStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
