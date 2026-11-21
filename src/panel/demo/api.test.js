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
});
