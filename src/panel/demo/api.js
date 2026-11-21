// API falsa del prototipo. Misma firma que el cliente de la PR #87
// (`api(action, input)` → promesa con JSON o error con mensaje), así que el día
// que exista el backend se cambia este archivo y las pantallas no se tocan.
// El estado de la demo vive en localStorage para que «Me interesa», los sellos o
// el perfil sobrevivan a una recarga; «Reiniciar demo» lo borra.
import { POINTS_BASE, STARTER_OF_MONTH, VIEW_AS, canGivePoints, canManage, canPublish, positionLabel, CHANNELS, DMS, LOOKING, MESSAGES, STARTUPS, SUPPORT, TODAY, CVS, EVENTS, FEED, ME, NOTIFICATIONS, OFFERS, PEOPLE, STAMPS, COMPANIES, TYPE_COUNTS, FAMILIES, TYPE_NAMES, familyOf, levelFor } from './data.js';

const KEY = 'start-panel-demo';

export const DEMO_DEFAULTS = { latency: 'normal', empty: false, error: false, extreme: false, viewAs: 'it' };

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
    read: [],
    offers: [],
    status: {},
    going: ['canas-nov'],
    channelRead: {},
    sent: {},
    reactions: {},
    following: [],
    supported: false,
    points: [],
    applications: [],
    prefs: { notif: { anuncios: true, eventos: true, ofertas: true, canales: false, mensajes: true }, privacy: { gente: true, email: true, cv: true } },
    settings: { ...DEMO_DEFAULTS },
  };
}

export function createDemoApi({ storage = safeStorage(), wait = sleep } = {}) {
  let state = load();

  function load() {
    try {
      const raw = storage?.getItem(KEY);
      if (raw) return { ...fresh(), ...JSON.parse(raw) };
    } catch {}
    return fresh();
  }
  function save() {
    try { storage?.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  // Tú, con el cargo que se esté probando en «Ver como» (botón DEMO).
  const meNow = () => ({ ...state.me, ...(VIEW_AS[state.settings.viewAs]?.patch ?? {}) });
  const person = (id) => (id === state.me.id ? meNow() : PEOPLE.find((x) => x.id === id));
  const pointsOf = (id) => (POINTS_BASE[id] ?? 0) + state.points.filter((x) => x.person === id).reduce((n, x) => n + x.points, 0);
  const allOffers = () => [...state.offers, ...OFFERS];
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
    return { ...x, family: familyOf(x.type), typeName: TYPE_NAMES[x.type], level: levelFor(x.stamps.length), stampList: x.stamps.map((s) => STAMPS[s]), positionLabel: positionLabel(x), canManage: canManage(x), canPublish: canPublish(x) };
  };

  const decorateEvent = (e) => {
    const going = state.going.includes(e.id);
    const d = new Date(`${e.date}T12:00:00`);
    const days = Math.round((d - new Date(`${TODAY}T12:00:00`)) / 864e5);
    return {
      ...e,
      day: String(d.getDate()), month: MONTHS[d.getMonth()].slice(0, 3).toUpperCase(),
      when: `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} · ${e.time}`,
      inDays: days, relative: e.past ? 'Ya pasó' : days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`,
      isGoing: going, attended: e.past && state.me.stamps.includes(e.stamp),
      goingCount: (state.settings.extreme ? 999 : e.goingCount) + (going ? 1 : 0),
      goingPeople: e.going.slice(0, 3).map(person), stamp: STAMPS[e.stamp],
    };
  };
  const messagesOf = (id) => [...(MESSAGES[id] ?? []), ...(state.sent[id] ?? [])].map((m) => ({ ...m, person: person(m.from), mine: m.from === state.me.id, reactions: m.reactions ?? {}, myReactions: state.reactions[m.id] ?? {} }));
  const unreadOf = (id) => Math.max(0, (MESSAGES[id]?.length ?? 0) - (state.channelRead[id] ?? (id === 'podcast' || id === 'startups' ? 99 : 0)));
  const badges = () => ({ comunidad: state.settings.empty ? 0 : CHANNELS.reduce((n, c) => n + unreadOf(c.id), 0) + DMS.filter((d) => !state.channelRead[`dm:${d.id}`] && d.messages.at(-1).from !== state.me.id).length });

  const actions = {
    me: () => ({ me: { ...decoratePerson(meNow()), badges: badges(), viewAs: state.settings.viewAs } }),

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
      const nextEvent = EVENTS.map(decorateEvent).filter((e) => e.isGoing && !e.past).sort((a, b) => a.inDays - b.inDays)[0] ?? null;
      const sameCareer = PEOPLE.filter((x) => x.career === state.me.career && x.id !== state.me.id).slice(0, 3).map(decoratePerson);
      return { items, newcomers, sameCareer, nextEvent };
    },

    people: ({ q = '', filter = 'todos', type = null } = {}) => {
      if (state.settings.empty) return { people: [], total: 0 };
      const needle = normalize(q);
      const list = PEOPLE.filter((x) => (filter === 'todos' || x.role === filter.replace(/s$/, ''))
        && (!type || x.type === type)
        && (!needle || normalize(`${x.name} ${x.career}`).includes(needle))).map(decoratePerson);
      const leaders = filter === 'todos' && !needle && !type ? PEOPLE.filter((x) => x.position !== 'miembro').sort((a, b) => (a.position === 'junta' ? -1 : b.position === 'junta' ? 1 : 0)).map(decoratePerson) : [];
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
      const o = { id: `o${Date.now()}`, title, company: 'start', kind: input.kind || 'Proyecto', kindColor: 'lavender', deadline: input.deadline || 'Sin fecha', place: input.place || 'Por definir', duration: '—', hours: '—', pay: '—', cover: 'equipo', desc: input.desc || '', contact: state.me.name.split(' ')[0], interested: [], createdByMe: true };
      state.offers = [o, ...state.offers];
      save();
      return { offer: decorateOffer(o) };
    },

    // Inicio: lo tuyo y lo nuevo, en piezas cortas (cada carrusel con pocas tarjetas).
    home: () => {
      const empty = state.settings.empty;
      const events = EVENTS.map(decorateEvent).filter((e) => !e.past).sort((a, b) => a.date.localeCompare(b.date));
      const offers = allOffers().map(decorateOffer);
      const ann = messagesOf('anuncios').at(-1);
      const newcomers = PEOPLE.filter((x) => x.isNew);
      const same = PEOPLE.filter((x) => x.career === state.me.career && !x.isNew);
      const people = [...newcomers.slice(0, 3), ...same.slice(0, 2)].map((x) => ({ ...decoratePerson(x), looking: LOOKING[x.id] ?? x.bio, reason: x.isNew ? 'Nuevo en Start' : 'Estudia lo mismo que tú', isFollowing: state.following.includes(x.id) }));
      if (empty) return { counts: { planes: 0, mensajes: 0, oportunidades: 0 }, nextEvent: null, announcement: null, support: null, unread: 0, events: [], offers: [], people: [], startups: [], stamp: null };
      return {
        counts: { planes: events.length, mensajes: badges().comunidad, oportunidades: offers.filter((o) => !o.isInterested && (o.daysLeft ?? 99) >= 0).length },
        nextEvent: events.find((e) => e.isGoing) ?? null,
        announcement: { ...ann, channel: 'anuncios' },
        support: { ...SUPPORT, count: SUPPORT.count + (state.supported ? 1 : 0), supported: state.supported },
        unread: badges().comunidad,
        events: events.slice(0, 5),
        offers: offers.filter((o) => !o.isInterested && !o.isMine).sort((a, b) => b.interestedCount - a.interestedCount).slice(0, 4),
        people,
        startups: STARTUPS.map((x) => ({ ...x, founder: decoratePerson(person(x.founder)) })),
        starterOfMonth: { ...STARTER_OF_MONTH, person: decoratePerson(person(STARTER_OF_MONTH.person)) },
        stamp: { stamp: STAMPS.camp, count: 48, mine: state.me.stamps.includes('camp'), myCount: state.me.stamps.length },
      };
    },
    // Puntos del mes y Starter del mes (solo Starters; los socios no entran en el ranking).
    ranking: () => {
      const me = meNow();
      const starters = [...PEOPLE.filter((x) => x.kind === 'starter'), ...(me.kind === 'starter' ? [me] : [])]
        .map((x) => ({ ...decoratePerson(x), points: pointsOf(x.id), canGive: canGivePoints(me, x) && x.id !== me.id }))
        .sort((a, b) => b.points - a.points);
      const som = person(STARTER_OF_MONTH.person);
      return {
        month: 'noviembre', ranking: starters, myRank: starters.findIndex((x) => x.id === me.id) + 1 || null,
        starterOfMonth: { ...STARTER_OF_MONTH, person: decoratePerson(som) },
        canGive: me.position === 'junta' || me.position === 'responsable', scope: me.position === 'junta' ? 'todo el equipo' : me.department,
        log: state.points.slice(-5).reverse().map((x) => ({ ...x, person: person(x.person) })),
      };
    },
    'points.add': ({ person: pid, points, reason }) => {
      const me = meNow(), target = person(pid);
      const n = Number(points);
      if (!target || target.kind !== 'starter') throw new Error('Solo los Starters suman puntos.');
      if (!canGivePoints(me, target) || target.id === me.id) throw new Error('Solo la Junta, o el Responsable de su departamento, puede sumarle puntos.');
      if (!Number.isInteger(n) || n < 1 || n > 50) throw new Error('Puntos: entre 1 y 50.');
      if (!String(reason ?? '').trim()) throw new Error('Motivo: di qué ha hecho.');
      state.points = [...state.points, { person: pid, points: n, reason: String(reason).trim(), by: me.id, at: 'ahora' }];
      save();
      return { points: pointsOf(pid) };
    },

    'support.toggle': ({ on }) => { state.supported = on; save(); return { count: SUPPORT.count + (on ? 1 : 0), supported: on }; },
    follow: ({ id, on }) => { state.following = on ? [...new Set([...state.following, id])] : state.following.filter((x) => x !== id); save(); return { on }; },

    events: ({ tab = 'proximos' } = {}) => {
      if (state.settings.empty) return { events: [], all: [] };
      const all = EVENTS.map(decorateEvent).sort((a, b) => a.date.localeCompare(b.date));
      const list = tab === 'pasados' ? all.filter((e) => e.past).reverse() : tab === 'mias' ? all.filter((e) => e.isGoing && !e.past) : all.filter((e) => !e.past);
      return { events: list, all };
    },
    event: ({ id }) => {
      const e = EVENTS.find((x) => x.id === id);
      if (!e) throw new Error('Este evento ya no está publicado.');
      return { event: decorateEvent(e) };
    },
    'event.going': ({ id, on }) => {
      state.going = on ? [...new Set([id, ...state.going])] : state.going.filter((x) => x !== id);
      save();
      return { event: decorateEvent(EVENTS.find((x) => x.id === id)) };
    },

    channels: () => {
      if (state.settings.empty) return { channels: [], dms: [] };
      const channels = CHANNELS.map((c) => { const m = messagesOf(c.id).at(-1); return { ...c, last: m, unread: unreadOf(c.id), muted: false }; });
      const dms = DMS.map((d) => { const m = [...d.messages, ...(state.sent[`dm:${d.id}`] ?? [])].at(-1); return { id: d.id, person: decoratePerson(person(d.with)), last: { ...m, mine: m.from === state.me.id }, unread: !state.channelRead[`dm:${d.id}`] && m.from !== state.me.id ? 1 : 0 }; });
      return { channels, dms };
    },
    channel: ({ id }) => {
      const dm = id.startsWith('dm:') ? DMS.find((d) => `dm:${d.id}` === id) : null;
      const c = dm ? { id, name: person(dm.with).name, person: decoratePerson(person(dm.with)), dm: true } : CHANNELS.find((x) => x.id === id);
      if (!c) throw new Error('Este canal ya no existe.');
      const messages = dm ? [...dm.messages, ...(state.sent[id] ?? [])].map((m) => ({ ...m, person: person(m.from), mine: m.from === state.me.id, reactions: {}, myReactions: {} })) : messagesOf(id);
      state.channelRead = { ...state.channelRead, [id]: dm ? true : MESSAGES[id]?.length ?? 0 };
      save();
      return { channel: { ...c, members: dm ? 2 : c.id === 'anuncios' ? 212 : 140 + c.name.length }, messages };
    },
    'channel.send': ({ id, text }) => {
      const t = String(text ?? '').trim();
      if (!t) throw new Error('Escribe algo antes de enviar.');
      const m = { id: `m${Date.now()}`, from: state.me.id, at: 'ahora', text: t };
      state.sent = { ...state.sent, [id]: [...(state.sent[id] ?? []), m] };
      save();
      return { message: { ...m, person: state.me, mine: true, reactions: {}, myReactions: {} } };
    },
    'message.react': ({ id, emoji, on }) => {
      state.reactions = { ...state.reactions, [id]: { ...(state.reactions[id] ?? {}), [emoji]: on } };
      save();
      return { ok: true };
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

    // Fichar en un evento con el QR del carné. En la demo siempre da el sello INVEST.
    checkin: ({ stamp = 'invest' } = {}) => {
      if (state.me.stamps.includes(stamp)) return { stamp: STAMPS[stamp], isNew: false, level: levelFor(state.me.stamps.length) };
      const before = levelFor(state.me.stamps.length);
      state.me = { ...state.me, stamps: [...state.me.stamps, stamp] };
      save();
      const after = levelFor(state.me.stamps.length);
      return { stamp: STAMPS[stamp], isNew: true, level: after, levelUp: after.n > before.n };
    },

    notifications: () => ({
      items: NOTIFICATIONS.map((n) => ({
        ...n,
        unread: n.unread && !state.read.includes(n.id),
        stamp: n.stamp ? STAMPS[n.stamp] : undefined,
        company: n.offer ? COMPANIES[allOffers().find((o) => o.id === n.offer)?.company] : undefined,
        people: n.people?.map(person),
        person: n.person ? person(n.person) : undefined,
        event: n.event ? decorateEvent(EVENTS.find((e) => e.id === n.event)) : undefined,
      })),
    }),
    'notifications.open': ({ id }) => { state.read = [...new Set([...state.read, id])]; save(); return { ok: true }; },
    'notifications.read': () => { state.read = NOTIFICATIONS.map((n) => n.id); save(); return { ok: true }; },

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
