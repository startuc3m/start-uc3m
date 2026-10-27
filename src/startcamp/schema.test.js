import {
  aPayload,
  esUrlLinkedinValida,
  urlAUsuario,
  usuarioAUrl,
  validar,
  valoresIniciales,
} from './schema';
import { ESTADOS_GRUPO, INTERESES, ROLES, idATexto, textoAId } from './opciones';

describe('ids ↔ textos de la base de datos', () => {
  test.each([
    [ESTADOS_GRUPO, 'busco', 'Busco grupo'],
    [ESTADOS_GRUPO, 'tengo', 'Tengo grupo'],
    [ESTADOS_GRUPO, 'abierto', 'Abierto a sumar gente'],
    [ROLES, 'negocio', 'Negocio'],
    [ROLES, 'tecnologia', 'Tecnología'],
    [ROLES, 'diseno', 'Diseño'],
    [ROLES, 'otro', 'Otro'],
    [INTERESES, 'hardware-robotica', 'Hardware y robótica'],
    [INTERESES, 'educacion', 'Educación'],
  ])('%#: %s ↔ %s', (lista, id, texto) => {
    expect(idATexto(lista, id)).toBe(texto);
    expect(textoAId(lista, texto)).toBe(id);
  });

  test('todas las opciones van y vuelven', () => {
    for (const lista of [ESTADOS_GRUPO, ROLES, INTERESES]) {
      for (const o of lista) expect(textoAId(lista, idATexto(lista, o.id))).toBe(o.id);
    }
  });

  test('los intereses son los del brief', () => {
    expect(INTERESES.map((o) => o.db)).toEqual([
      'IA', 'Datos', 'Fintech', 'Salud', 'Sostenibilidad', 'Educación', 'Impacto social',
      'Videojuegos', 'Hardware y robótica', 'Marketing y consumo', 'Movilidad', 'Ciberseguridad',
    ]);
  });

  test('un texto que no está (o sin tilde) no se convierte', () => {
    expect(textoAId(ROLES, 'Tecnologia')).toBeUndefined();
    expect(idATexto(ROLES, 'inventado')).toBeUndefined();
  });
});

describe('LinkedIn: usuario ↔ URL', () => {
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
    ['ana-garcia/?trk=public_profile', 'ana-garcia'],
  ])('%s → %s', (entrada, usuario) => {
    expect(urlAUsuario(entrada)).toBe(usuario);
  });

  test('usuario → URL de la base de datos y vuelta', () => {
    expect(usuarioAUrl('ana-garcia')).toBe('https://www.linkedin.com/in/ana-garcia');
    expect(urlAUsuario(usuarioAUrl('ana-garcia'))).toBe('ana-garcia');
  });

  test('solo se da por buena una URL de perfil /in/', () => {
    expect(esUrlLinkedinValida('https://www.linkedin.com/in/ana-garcia')).toBe(true);
    expect(esUrlLinkedinValida('https://www.linkedin.com/company/start')).toBe(false);
    expect(esUrlLinkedinValida('https://www.linkedin.com/in/ab')).toBe(false);
    expect(esUrlLinkedinValida(null)).toBe(false);
  });
});

describe('validar', () => {
  const base = { ...valoresIniciales('Ana García'), estado_grupo: 'busco', rol: 'negocio' };

  test('al editar, un perfil mínimo es válido sin consentimiento', () => {
    expect(validar(base)).toEqual({ ok: true, errores: {} });
  });

  test('al crear, el consentimiento es obligatorio', () => {
    expect(validar(base, { creando: true }).errores.consentimiento).toBe(
      'Necesitamos tu permiso para enseñar tu perfil'
    );
    expect(validar({ ...base, consentimiento: true }, { creando: true }).ok).toBe(true);
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

  test('nombre de 1 a 80 caracteres', () => {
    expect(validar({ ...base, nombre: 'a'.repeat(80) }).ok).toBe(true);
    expect(validar({ ...base, nombre: 'a'.repeat(81) }).errores.nombre).toBeDefined();
    expect(validar({ ...base, nombre: '   ' }).errores.nombre).toBe('Escribe tu nombre');
  });

  test('exige estado y rol', () => {
    const res = validar(valoresIniciales('Ana'));
    expect(Object.keys(res.errores).sort()).toEqual(['estado_grupo', 'rol']);
  });

  test('máximo 3 intereses y 280 caracteres de descripción', () => {
    const res = validar({ ...base, intereses: ['ia', 'salud', 'fintech', 'datos'], descripcion: 'x'.repeat(281) });
    expect(res.errores.intereses).toBeDefined();
    expect(res.errores.descripcion).toBeDefined();
  });
});

describe('aPayload: forma de la base de datos', () => {
  const ahora = new Date('2026-11-01T10:00:00.000Z');

  test('textos en vez de ids y LinkedIn como URL', () => {
    const datos = aPayload({
      ...valoresIniciales('  Ana García '),
      estado_grupo: 'tengo',
      rol: 'diseno',
      intereses: ['ia', 'hardware-robotica'],
      linkedin: 'https://es.linkedin.com/in/ana-garcia/?trk=x',
      descripcion: ' Hola ',
      nombre_grupo: ' Pixel Club ',
    });
    expect(datos).toEqual({
      nombre: 'Ana García',
      estado_grupo: 'Tengo grupo',
      rol: 'Diseño',
      intereses: ['IA', 'Hardware y robótica'],
      linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
      descripcion: 'Hola',
      nombre_grupo: 'Pixel Club',
    });
  });

  test('los opcionales vacíos van como null', () => {
    const datos = aPayload({ ...valoresIniciales('Ana'), estado_grupo: 'abierto', rol: 'otro', descripcion: '   ' });
    expect(datos.linkedin_url).toBeNull();
    expect(datos.descripcion).toBeNull();
    expect(datos.nombre_grupo).toBeNull();
    expect(datos.intereses).toEqual([]);
  });

  test('con «Busco grupo» el nombre del grupo es null aunque haya algo escrito', () => {
    const datos = aPayload({ ...valoresIniciales('Ana'), estado_grupo: 'busco', rol: 'otro', nombre_grupo: 'De antes' });
    expect(datos.nombre_grupo).toBeNull();
  });

  test('el consentimiento solo se manda al crear', () => {
    const v = { ...valoresIniciales('Ana'), estado_grupo: 'busco', rol: 'otro', consentimiento: true };
    expect(aPayload(v)).not.toHaveProperty('consent_at');
    expect(aPayload(v)).not.toHaveProperty('consent_version');
    expect(aPayload(v, { creando: true, ahora })).toMatchObject({
      consent_at: '2026-11-01T10:00:00.000Z',
      consent_version: 'v1',
    });
  });
});

describe('valoresIniciales: desde la base de datos', () => {
  test('sin perfil: todo vacío salvo el nombre precargado', () => {
    expect(valoresIniciales('Ana', null)).toEqual({
      nombre: 'Ana',
      estado_grupo: '',
      rol: '',
      intereses: [],
      linkedin: '',
      descripcion: '',
      nombre_grupo: '',
      consentimiento: false,
    });
  });

  test('con perfil: textos → ids, URL → usuario, null → vacío y grupo desde groups.nombre', () => {
    const v = valoresIniciales('Precargado', {
      nombre: 'Ana García',
      estado_grupo: 'Abierto a sumar gente',
      rol: 'Tecnología',
      intereses: ['IA', 'Salud', 'Ya no existe'],
      linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
      descripcion: null,
      group_id: 7,
      groups: { nombre: 'Los del fondo' },
    });
    expect(v).toEqual({
      nombre: 'Ana García',
      estado_grupo: 'abierto',
      rol: 'tecnologia',
      intereses: ['ia', 'salud'],
      linkedin: 'ana-garcia',
      descripcion: '',
      nombre_grupo: 'Los del fondo',
      consentimiento: false,
    });
  });

  test('ida y vuelta: lo que se guarda se vuelve a leer igual', () => {
    const v = {
      ...valoresIniciales('Ana'),
      estado_grupo: 'tengo',
      rol: 'negocio',
      intereses: ['fintech'],
      linkedin: 'ana',
      descripcion: 'Hola',
      nombre_grupo: 'Pixel',
    };
    expect(valoresIniciales('', aPayload(v))).toEqual({ ...v, linkedin: 'ana' });
  });
});
