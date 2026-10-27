import { aPayload, extraerUsuarioLinkedin, linkedinUrl, validar, valoresIniciales } from './schema';
import { CONSENTIMIENTO_VERSION } from './opciones';

describe('extraerUsuarioLinkedin', () => {
  test.each([
    ['ana-garcia', 'ana-garcia'],
    ['  ana_garcia  ', 'ana_garcia'],
    ['https://www.linkedin.com/in/ana-garcia/', 'ana-garcia'],
    ['https://www.linkedin.com/in/ana-garcia/?trk=public_profile', 'ana-garcia'],
    ['http://linkedin.com/in/ana-garcia', 'ana-garcia'],
    ['linkedin.com/in/ana-garcia', 'ana-garcia'],
    ['www.linkedin.com/in/ana-garcia', 'ana-garcia'],
    ['https://es.linkedin.com/in/ana-garcia', 'ana-garcia'],
    ['es.linkedin.com/in/ana-garcia?originalSubdomain=es', 'ana-garcia'],
    ['HTTPS://WWW.LINKEDIN.COM/in/AnaGarcia#experiencia', 'AnaGarcia'],
  ])('%s → %s', (entrada, usuario) => {
    expect(extraerUsuarioLinkedin(entrada)).toBe(usuario);
  });

  test('la URL completa se monta al mostrarla', () => {
    expect(linkedinUrl('ana-garcia')).toBe('https://www.linkedin.com/in/ana-garcia');
  });
});

describe('validar', () => {
  const base = {
    ...valoresIniciales('Ana García'),
    estado_grupo: 'busco',
    rol: 'negocio',
    consentimiento: true,
  };

  test('un perfil mínimo es válido', () => {
    expect(validar(base)).toEqual({ ok: true, errores: {} });
  });

  test.each(['ana-garcia', 'ana_garcia', 'abc', 'a'.repeat(100), 'https://es.linkedin.com/in/ana-123/'])(
    'LinkedIn válido: %s',
    (linkedin) => {
      expect(validar({ ...base, linkedin }).ok).toBe(true);
    }
  );

  test.each(['ab', 'a'.repeat(101), 'ana garcia', 'ana.garcia', 'josé', 'https://twitter.com/ana', 'linkedin.com/in/'])(
    'LinkedIn inválido: %s',
    (linkedin) => {
      const res = validar({ ...base, linkedin });
      expect(res.ok).toBe(false);
      expect(res.errores.linkedin).toBe('Eso no parece un perfil de LinkedIn');
    }
  );

  test('exige nombre, estado, rol y consentimiento', () => {
    const res = validar(valoresIniciales(''));
    expect(Object.keys(res.errores).sort()).toEqual(['consentimiento', 'estado_grupo', 'nombre', 'rol']);
  });

  test('máximo 3 intereses y 280 caracteres de descripción', () => {
    const res = validar({ ...base, intereses: ['ia', 'salud', 'fintech', 'deporte'], descripcion: 'x'.repeat(281) });
    expect(res.errores.intereses).toBeDefined();
    expect(res.errores.descripcion).toBeDefined();
  });

  test('intereses fuera de la lista no valen', () => {
    expect(validar({ ...base, intereses: ['inventado'] }).ok).toBe(false);
  });
});

describe('aPayload', () => {
  test('envía solo el usuario de LinkedIn y la versión del consentimiento', () => {
    const body = aPayload({
      ...valoresIniciales('  Ana García '),
      estado_grupo: 'tengo',
      rol: 'diseno',
      intereses: ['ia'],
      linkedin: 'https://www.linkedin.com/in/ana-garcia/?trk=x',
      descripcion: ' Hola ',
      nombre_grupo: ' Los de diseño ',
      consentimiento: true,
    });
    expect(body).toEqual({
      nombre: 'Ana García',
      estado_grupo: 'tengo',
      rol: 'diseno',
      intereses: ['ia'],
      linkedin: 'ana-garcia',
      descripcion: 'Hola',
      nombre_grupo: 'Los de diseño',
      consentimiento_version: CONSENTIMIENTO_VERSION,
    });
    expect(body).not.toHaveProperty('consentimiento');
  });

  test('omite opcionales vacíos y el nombre del grupo si busca grupo', () => {
    const body = aPayload({
      ...valoresIniciales('Ana'),
      estado_grupo: 'busco',
      rol: 'otro',
      nombre_grupo: 'Se quedó de antes',
      consentimiento: true,
    });
    expect(body).not.toHaveProperty('linkedin');
    expect(body).not.toHaveProperty('descripcion');
    expect(body).not.toHaveProperty('nombre_grupo');
  });
});
