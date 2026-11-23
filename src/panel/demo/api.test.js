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

  it('fichar da el sello una sola vez', async () => {
    const { api } = make();
    const first = await api('checkin', { stamp: 'invest' });
    expect(first.isNew).toBe(true);
    expect((await api('checkin', { stamp: 'invest' })).isNew).toBe(false);
    expect((await api('me')).me.stamps).toContain('invest');
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

  it('abrir un aviso lo marca como leído', async () => {
    const { api } = make();
    const before = (await api('notifications')).items.filter((n) => n.unread).length;
    await api('notifications.open', { id: 'n1' });
    expect((await api('notifications')).items.filter((n) => n.unread).length).toBe(before - 1);
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

  it('solo la Junta crea QR de puntos y cada persona lo escanea una vez', async () => {
    const { api } = make();
    await api('demo.settings', { viewAs: 'responsable' });
    await expect(api('pointsqr.create', { points: 10, reason: 'Montaje' })).rejects.toThrow('Solo la Junta');
    await api('demo.settings', { viewAs: 'junta' });
    const { qr } = await api('pointsqr.create', { points: 20, reason: 'Montaje del Start to Invest' });
    await api('demo.settings', { viewAs: 'starter' });
    const before = (await api('ranking')).ranking.find((x) => x.id === 'alvaro').points;
    const r = await api('pointsqr.claim', { code: qr.code });
    expect(r.points).toBe(20);
    expect((await api('ranking')).ranking.find((x) => x.id === 'alvaro').points).toBe(before + 20);
    await expect(api('pointsqr.claim', { code: qr.code })).rejects.toThrow('una vez');
    await expect(api('pointsqr.claim', { code: 'NOEXISTE' })).rejects.toThrow('no existe');
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
  it('el QR de invitación lleva al alta y da puntos a quien lo generó', async () => {
    const { api } = make();
    const info = await api('invite.info');
    expect(info).toMatchObject({ ref: 'alvaro', path: '/invita/alvaro', count: 0, earned: 0 });
    expect((await api('invite.host', { ref: 'hugo' })).host.name).toBe('Hugo Blanco');
    await expect(api('invite.host', { ref: 'nadie' })).rejects.toThrow('no es válido');
    const before = (await api('ranking')).ranking.find((x) => x.id === 'hugo').points;
    const r = await api('member.join', { plan: 'curso', email: 'nueva@alumnos.uc3m.es', ref: 'hugo' });
    expect(r.host).toMatchObject({ name: 'Hugo Blanco', points: info.perInvite });
    expect((await api('ranking')).ranking.find((x) => x.id === 'hugo').points).toBe(before + info.perInvite);
    await api('member.join', { plan: 'curso', email: 'otra@alumnos.uc3m.es', ref: 'alvaro' });
    expect(await api('invite.info')).toMatchObject({ count: 1, earned: info.perInvite });
  });
});
