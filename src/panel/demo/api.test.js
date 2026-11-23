import { createDemoApi } from './api.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};
const make = (storage = memory()) => createDemoApi({ storage, wait: async () => {} });

describe('api de la demo', () => {
  it('devuelve tu perfil con nivel y sellos', async () => {
    const { api } = make();
    const { me } = await api('me');
    expect(me.name).toBe('Álvaro Carpintero');
    expect(me.level.n).toBe(2);
    expect(me.stampList).toHaveLength(5);
  });

  it('marca y desmarca «Me interesa» y lo guarda entre recargas', async () => {
    const storage = memory();
    const { api } = make(storage);
    const before = (await api('offer', { id: 'hardware' })).offer;
    expect(before.isInterested).toBe(false);
    const { offer } = await api('offer.interest', { id: 'hardware', on: true });
    expect(offer.isInterested).toBe(true);
    expect(offer.interestedCount).toBe(before.interestedCount + 1);
    const again = make(storage);
    expect((await again.api('offer', { id: 'hardware' })).offer.isInterested).toBe(true);
    await again.api('offer.interest', { id: 'hardware', on: false });
    expect((await again.api('offers', { tab: 'interesan' })).offers.map((o) => o.id)).not.toContain('hardware');
  });

  it('filtra la comunidad por rol y por texto sin acentos', async () => {
    const { api } = make();
    const socios = (await api('people', { filter: 'socios' })).people;
    expect(socios.every((x) => x.role === 'socio')).toBe(true);
    expect((await api('people', { q: 'lucia' })).people[0].name).toBe('Lucía Martín');
  });

  it('Eventos confirma la asistencia y a las 24 h llegan los puntos y el sello', async () => {
    const { api } = make();
    await expect(api('event.attendees', { id: 'taller-ventas' })).rejects.toThrow('Solo la Junta, los responsables, Eventos y RRHH');
    await api('demo.settings', { viewAs: 'responsable' }); // Responsable de RRHH
    expect((await api('event.attendees', { id: 'taller-ventas' })).people.length).toBeGreaterThan(0);
    await api('demo.settings', { viewAs: 'socio' });
    await expect(api('event.attendance', { id: 'taller-ventas', person: 'lucia', on: true })).rejects.toThrow('Solo la Junta, los responsables, Eventos y RRHH');
    await api('demo.settings', { viewAs: 'eventos' });
    const { people } = await api('event.attendees', { id: 'taller-ventas' });
    expect(people.map((x) => x.id)).toContain('lucia');
    await expect(api('event.attendance', { id: 'cena', person: 'gema', on: true })).rejects.toThrow('día del evento');
    await expect(api('event.attendance', { id: 'camp', person: 'lucia', on: false })).rejects.toThrow('cerrada');
    const r = await api('event.attendance', { id: 'taller-ventas', person: 'lucia', on: true });
    expect(r.people.find((x) => x.id === 'lucia').confirmed).toBe(true);
    expect(r.event.pointsGiven).toBe(false);
    expect(r.event.pointsAt).toBe('sáb 21 nov · 18:00');
    // Camp: asistencia confirmada y pasadas las 24 h → Álvaro tiene sus puntos y su sello.
    const camp = (await api('event', { id: 'camp' })).event;
    expect([camp.pointsGiven, camp.attended, camp.hasStamp]).toEqual([true, true, true]);
  });

  it('valida el perfil antes de guardar', async () => {
    const { api } = make();
    await expect(api('profile.update', { name: '  ' })).rejects.toThrow('Nombre');
    await expect(api('profile.update', { name: 'Álvaro', linkedin: 'linkedin.com/x' })).rejects.toThrow('LinkedIn');
    expect((await api('profile.update', { name: 'Álvaro Pérez' })).me.initials).toBe('ÁP');
  });

  it('simula vacío, error y reinicio', async () => {
    const { api } = make();
    await api('demo.settings', { empty: true });
    expect((await api('offers')).offers).toEqual([]);
    await api('demo.settings', { empty: false, error: true });
    await expect(api('feed')).rejects.toThrow('No hay conexión');
    await api('demo.reset');
    expect((await api('feed')).items.length).toBeGreaterThan(0);
  });

  it('rechaza acciones que no existen', async () => {
    const { api } = make();
    await expect(api('borrar-todo')).rejects.toThrow('Acción desconocida');
  });

  it('el CV es privado: solo aparece en los interesados de una oferta', async () => {
    const { api } = make();
    const { people } = await api('offer.interested', { id: 'astro' });
    expect(people.every((x) => 'cv' in x && x.status === 'nuevo')).toBe(true);
    expect((await api('person', { id: 'pablo' })).person.cv).toBeUndefined();
    await api('applicant.status', { offer: 'astro', person: 'pablo', status: 'contactado' });
    expect((await api('offer.interested', { id: 'astro' })).people.find((x) => x.id === 'pablo').status).toBe('contactado');
  });

  it('sube y quita tu CV', async () => {
    const { api } = make();
    expect((await api('cv.remove')).me.cv).toBeNull();
    expect((await api('cv.upload', { name: 'cv.pdf', size: '90 KB' })).me.cv.name).toBe('cv.pdf');
  });

  it('con datos extremos los textos se alargan pero la forma no cambia', async () => {
    const { api } = make();
    await api('demo.settings', { extreme: true });
    const { offers } = await api('offers');
    expect(offers[0].interestedCount).toBe(999);
    expect((await api('person', { id: 'lucia' })).person.name.length).toBeGreaterThan(40);
  });
});

describe('roles y puntos (modelo de la PR #87)', () => {
  it('«Ver como» cambia el cargo y los permisos', async () => {
    const { api } = make();
    expect((await api('me')).me.canManage).toBe(true);
    await api('demo.settings', { viewAs: 'socio' });
    const { me } = await api('me');
    expect([me.canManage, me.canPublish, me.positionLabel]).toEqual([false, false, 'Socio']);
    await api('demo.settings', { viewAs: 'responsable' });
    expect((await api('me')).me.positionLabel).toBe('Responsable de RRHH');
  });

  it('la Junta pone el enlace de las entradas de un evento', async () => {
    const { api } = make();
    expect((await api('event', { id: 'invest' })).event.ticketUrl).toMatch(/^https:/);
    await expect(api('event.link', { id: 'cena', url: 'https://x.es/e' })).rejects.toThrow('Solo la Junta');
    await api('demo.settings', { viewAs: 'junta' });
    await expect(api('event.link', { id: 'cena', url: 'entradas.com' })).rejects.toThrow('https://');
    expect((await api('event.link', { id: 'cena', url: 'https://entradas.ejemplo.es/cena' })).event.ticketUrl).toBe('https://entradas.ejemplo.es/cena');
    expect((await api('event.link', { id: 'cena', url: '' })).event.ticketUrl).toBeNull();
  });

  it('la Junta cambia la foto del evento y pone el enlace a la carpeta de fotos', async () => {
    const { api } = make();
    expect((await api('event', { id: 'camp' })).event.photosUrl).toMatch(/^https:/);
    await expect(api('event.album', { id: 'feria', url: 'https://drive.google.com/x' })).rejects.toThrow('Solo la Junta');
    await api('demo.settings', { viewAs: 'junta' });
    expect((await api('event.photo', { id: 'feria', cover: 'pitch' })).event.cover).toBe('pitch');
    await expect(api('event.album', { id: 'feria', url: 'drive.google.com' })).rejects.toThrow('https://');
    expect((await api('event.album', { id: 'feria', url: 'https://drive.google.com/fotos' })).event.photosUrl).toBe('https://drive.google.com/fotos');
  });

  it('si Junta o un responsable marcan «Asistió», a las 24 h se suman los puntos', async () => {
    const { api } = make();
    const pts = async (id) => (await api('ranking')).ranking.find((x) => x.id === id)?.points;
    const before = { lucia: await pts('lucia'), alvaro: await pts('alvaro'), hugo: await pts('hugo') };
    await api('demo.settings', { viewAs: 'responsable' });
    await api('event.attendance', { id: 'taller-ventas', person: 'lucia', on: true });
    await api('demo.settings', { viewAs: 'junta' });
    await api('event.attendance', { id: 'taller-ventas', person: 'alvaro', on: true });
    // Antes de las 24 h: confirmados, pero sin puntos todavía.
    expect(await pts('lucia')).toBe(before.lucia);
    expect((await api('event', { id: 'taller-ventas' })).event.pointsGiven).toBe(false);
    // Pasadas las 24 h: +10 a cada confirmado (y su sello); a los demás, nada.
    await api('demo.settings', { later: true });
    expect((await api('event', { id: 'taller-ventas' })).event.pointsGiven).toBe(true);
    expect(await pts('lucia')).toBe(before.lucia + 10);
    expect(await pts('alvaro')).toBe(before.alvaro + 10);
    expect(await pts('hugo')).toBe(before.hugo);
    expect((await api('me')).me.stamps).toContain('ventas');
    await expect(api('event.attendance', { id: 'taller-ventas', person: 'diego', on: true })).rejects.toThrow('cerrada');
  });

  it('quien no va sin cancelar con 24 h pierde 10 puntos; cancelar a tiempo no penaliza', async () => {
    const { api } = make();
    const pts = async (id) => (await api('ranking')).ranking.find((x) => x.id === id)?.points;
    await api('demo.settings', { viewAs: 'junta' });
    const before = { lucia: await pts('lucia'), alvaro: await pts('alvaro') };
    const { people } = await api('event.attendees', { id: 'taller-ventas' });
    expect(people.find((x) => x.id === 'nora').cancel).toBe('a-tiempo');
    expect(people.find((x) => x.id === 'ivan').cancel).toBe('tarde');
    await expect(api('event.attendance', { id: 'taller-ventas', person: 'nora', on: true })).rejects.toThrow('canceló a tiempo');
    await api('event.attendance', { id: 'taller-ventas', person: 'lucia', on: true });
    await api('demo.settings', { later: true });
    expect(await pts('lucia')).toBe(before.lucia + 10); // vino
    expect(await pts('alvaro')).toBe(before.alvaro - 10); // apuntado, no vino, no canceló
    const after = (await api('event.attendees', { id: 'taller-ventas' })).people;
    expect(after.find((x) => x.id === 'ivan').penalized).toBe(true); // canceló tarde
    expect(after.find((x) => x.id === 'nora').penalized).toBe(false); // canceló a tiempo
    expect((await api('event', { id: 'taller-ventas' })).event.penalized).toBe(true);
  });

  it('si nadie pasa lista no se penaliza a nadie', async () => {
    const { api } = make();
    const pts = async (id) => (await api('ranking')).ranking.find((x) => x.id === id)?.points;
    const before = await pts('alvaro');
    await api('demo.settings', { later: true });
    expect(await pts('alvaro')).toBe(before);
  });

  it('los responsables tienen los mismos permisos que la Junta', async () => {
    const { api } = make();
    await api('demo.settings', { viewAs: 'responsable' });
    expect((await api('event.points', { id: 'cena', points: 10 })).event.points).toBe(10);
    expect((await api('event.link', { id: 'cena', url: 'https://entradas.ejemplo.es/c' })).event.ticketUrl).toBe('https://entradas.ejemplo.es/c');
    expect((await api('event.album', { id: 'camp', url: 'https://drive.google.com/f' })).event.photosUrl).toBe('https://drive.google.com/f');
    expect((await api('me')).me.canPublish).toBe(true);
  });

  it('la Junta decide cuántos puntos da asistir a cada evento', async () => {
    const { api } = make();
    await expect(api('event.points', { id: 'invest', points: 5 })).rejects.toThrow('Solo la Junta');
    await api('demo.settings', { viewAs: 'junta' });
    expect((await api('event', { id: 'invest' })).event.points).toBe(20);
    expect((await api('event.points', { id: 'invest', points: 30 })).event.points).toBe(30);
    expect((await api('event.points', { id: 'cena', points: 0 })).event.points).toBe(0);
    const before = (await api('ranking')).ranking.find((x) => x.id === 'alvaro').points;
    await api('event.points', { id: 'camp', points: 50 });
    expect((await api('ranking')).ranking.find((x) => x.id === 'alvaro').points).toBe(before + 20);
  });

  it('pagar la cuota no da acceso: queda pendiente', async () => {
    const { api } = make();
    expect((await api('member.join', { plan: 'curso' })).status).toBe('pendiente');
  });
});

describe('acceso solo con correos autorizados', () => {
  it('pide código solo a correos invitados y comprueba el código', async () => {
    const { api } = make();
    await expect(api('auth.request', { email: 'cualquiera@gmail.com' })).rejects.toThrow('no tiene invitación');
    const { demoCode } = await api('auth.request', { email: 'Nora.Prieto@alumnos.uc3m.es ' });
    await expect(api('auth.verify', { email: 'nora.prieto@alumnos.uc3m.es', code: '000000' })).rejects.toThrow('incorrecto');
    expect((await api('auth.verify', { email: 'nora.prieto@alumnos.uc3m.es', code: demoCode })).ok).toBe(true);
    await expect(api('auth.google', { email: 'nora@gmail.com' })).rejects.toThrow('no está autorizada');
  });
});
