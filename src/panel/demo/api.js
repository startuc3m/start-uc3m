// API falsa del prototipo. Misma firma que el cliente de la PR #87
// (`api(action, input)` → promesa con JSON o error con mensaje), así que el día
// que exista el backend se cambia este archivo y las pantallas no se tocan.
// El estado de la demo vive en localStorage para que «Me interesa», los sellos o
// el perfil sobrevivan a una recarga; «Reiniciar demo» lo borra.
import { CVS, EVENTS, FEED, ME, NOTIFICATIONS, OFFERS, PEOPLE, STAMPS, COMPANIES, TYPE_COUNTS, FAMILIES, TYPE_NAMES, familyOf, levelFor } from './data.js';

const KEY = 'start-panel-demo';

export const DEMO_DEFAULTS = { latency: 'normal', empty: false, error: false, extreme: false };

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
    going: [],
    read: [],
    offers: [],
    status: {},
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

  const person = (id) => (id === state.me.id ? state.me : PEOPLE.find((x) => x.id === id));
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
      isMine: Boolean(o.mine || o.createdByMe),
    };
  };
  const decoratePerson = (x0) => {
    const x = state.settings.extreme ? extremePerson(x0) : x0;
    return { ...x, family: familyOf(x.type), typeName: TYPE_NAMES[x.type], level: levelFor(x.stamps.length), stampList: x.stamps.map((s) => STAMPS[s]) };
  };

  const actions = {
    me: () => ({ me: decoratePerson(state.me) }),

    feed: () => {
      if (state.settings.empty) return { items: [], newcomers: [] };
      const items = FEED.map((f) => {
        if (f.kind === 'event') {
          const e = EVENTS.find((x) => x.id === f.event);
          const going = state.going.includes(e.id);
          return { ...f, event: { ...e, isGoing: going, goingCount: e.goingCount + (going ? 1 : 0), goingPeople: e.going.slice(0, 3).map(person), stamp: STAMPS[e.stamp] } };
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
      const list = PEOPLE.filter((x) => (filter === 'todos' || x.role === filter.replace(/s$/, ''))
        && (!type || x.type === type)
        && (!needle || normalize(`${x.name} ${x.career}`).includes(needle))).map(decoratePerson);
      return { people: list, total: list.length };
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

    offers: ({ tab = 'todas' } = {}) => {
      if (state.settings.empty) return { offers: [], counts: { todas: 0, interesan: 0, mias: 0 } };
      const all = allOffers().map(decorateOffer);
      const list = tab === 'interesan' ? all.filter((o) => o.isInterested) : tab === 'mias' ? all.filter((o) => o.isMine) : all;
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

    'event.going': ({ id, on }) => {
      state.going = on ? [...new Set([id, ...state.going])] : state.going.filter((x) => x !== id);
      save();
      return { going: on };
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
        event: n.event ? EVENTS.find((e) => e.id === n.event) : undefined,
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
    'onboarding.done': () => { state.me = { ...state.me, onboarded: true }; save(); return actions.me(); },

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function safeStorage() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
