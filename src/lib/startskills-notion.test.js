import { describe, it, expect } from 'vitest';
import { slugify, parseTitulo, mapBloque, mapPersona, ordenarPersonas, fechaISO } from '../../scripts/startskills-notion.mjs';

const rt = (s) => ({ type: 'rich_text', rich_text: s ? [{ plain_text: s }] : [] });
const title = (s) => ({ type: 'title', title: s ? [{ plain_text: s }] : [] });

describe('slugify / parseTitulo', () => {
  it('quita tildes', () => expect(slugify('Proyéctate')).toBe('proyectate'));
  it('separa número y título', () => {
    expect(parseTitulo('Bloque 3: Gestiona')).toEqual({ numero: 3, titulo: 'Gestiona' });
    expect(parseTitulo('Gestiona')).toEqual({ numero: null, titulo: 'Gestiona' });
  });
});

describe('mapBloque', () => {
  const fecha = { type: 'date', date: { start: '2027-02-13T10:00:00.000+01:00' } };
  const base = { Nombre: title('Bloque 3: Gestiona'), Fecha: fecha, Tema: rt('Tiempo y prioridades') };

  it('mapea título, slug y fecha', () => {
    const b = mapBloque({ properties: base });
    expect(b).toMatchObject({
      numero: 3,
      titulo: 'Gestiona',
      slug: 'gestiona',
      fecha: '2027-02-13',
      tema: 'Tiempo y prioridades',
      hora: null,
      formador: null,
    });
  });

  it('empareja columnas renombradas', () => {
    const b = mapBloque({
      properties: {
        Nombre: title('Bloque 3: Gestiona'),
        Orden: { type: 'number', number: 4 },
        'Día del evento': fecha,
        'Descripción': rt('Otro tema'),
        Ponente: rt('Ana Pérez'),
        'Cargo del ponente': rt('Directora'),
        Sitio: rt('Aula 2'),
        LinkedIn: { type: 'url', url: 'https://linkedin.com/in/ana' },
        'Foto ponente': { type: 'files', files: [{ type: 'file', file: { url: 'https://x/a.jpg' } }] },
      },
    });
    expect(b.numero).toBe(4);
    expect(b.tema).toBe('Otro tema');
    expect(b.lugar).toBe('Aula 2');
    expect(b.formador).toEqual({
      nombre: 'Ana Pérez',
      cargo: 'Directora',
      linkedin: 'https://linkedin.com/in/ana',
      fotoUrl: 'https://x/a.jpg',
    });
  });

  it('salta ocultos y sin título', () => {
    expect(mapBloque({ properties: { ...base, Oculto: { type: 'checkbox', checkbox: true } } })).toBeNull();
    expect(mapBloque({ properties: { ...base, Borrador: { type: 'checkbox', checkbox: true } } })).toBeNull();
    expect(mapBloque({ properties: { ...base, Oculto: { type: 'checkbox', checkbox: false } } })).not.toBeNull();
    expect(mapBloque({ properties: { Nombre: title('') } })).toBeNull();
  });

  it('fechaISO sin fecha', () => expect(fechaISO({ date: null })).toBeNull());
});

describe('mapPersona', () => {
  it('lee asociación, linkedin, foto y relación', () => {
    const p = mapPersona({
      properties: {
        Nombre: title('Belén de Mollinedo'),
        Asociación: { type: 'select', select: { name: 'Start Comillas' } },
        LinkedIn: { type: 'url', url: null },
        Foto: { type: 'files', files: [{ type: 'external', external: { url: 'https://x/b.png' } }] },
        Bloques: { type: 'relation', relation: [{ id: 'abc' }] },
      },
    });
    expect(p).toEqual({
      nombre: 'Belén de Mollinedo',
      asociacion: 'Start Comillas',
      linkedin: null,
      fotoUrl: 'https://x/b.png',
      bloqueIds: ['abc'],
    });
  });

  it('ordena en español', () => {
    const orden = ordenarPersonas([{ nombre: 'Óscar' }, { nombre: 'Ana' }, { nombre: 'Zoe' }]);
    expect(orden.map((x) => x.nombre)).toEqual(['Ana', 'Óscar', 'Zoe']);
  });
});

import { urlSegura } from '../../scripts/startskills-notion.mjs';

describe('urlSegura', () => {
  it('acepta https y http', () => {
    expect(urlSegura('https://www.linkedin.com/in/ana')).toBe('https://www.linkedin.com/in/ana');
    expect(urlSegura('http://linkedin.com/in/ana')).toBe('http://linkedin.com/in/ana');
  });
  it('completa enlaces sin esquema', () => expect(urlSegura('linkedin.com/in/ana')).toBe('https://linkedin.com/in/ana'));
  it('rechaza esquemas peligrosos y texto suelto', () => {
    expect(urlSegura('javascript:alert(1)')).toBeNull();
    expect(urlSegura('data:text/html,hola')).toBeNull();
    expect(urlSegura('ana en linkedin')).toBeNull();
    expect(urlSegura('')).toBeNull();
    expect(urlSegura(null)).toBeNull();
  });
});
