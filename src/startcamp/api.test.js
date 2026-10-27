import { vi } from 'vitest';
import {
  MOCK_RETARDO_MS,
  borrarPerfil,
  cerrarSesion,
  guardarPerfil,
  leerErrorEnlace,
  obtenerPerfil,
  pedirEnlace,
  reiniciarClienteSupabase,
  reiniciarMock,
  resolverGrupo,
  traducirErrorBD,
  traducirErrorEnlace,
  usaMock,
  varianteDemo,
} from './api';
import { createClient } from '@supabase/supabase-js';

// Supabase falso: cada from(tabla) saca la siguiente respuesta de su cola y
// apunta la cadena de llamadas (método + argumentos) para comprobarla.
const sb = vi.hoisted(() => ({ auth: {}, from: null, colas: {}, consultas: [] }));

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => sb) }));

function consulta(tabla, resultado) {
  const llamadas = [];
  const q = {};
  for (const m of ['select', 'eq', 'insert', 'update', 'delete']) {
    q[m] = (...args) => (llamadas.push([m, ...args]), q);
  }
  q.maybeSingle = async () => (llamadas.push(['maybeSingle']), resultado);
  q.single = async () => (llamadas.push(['single']), resultado);
  q.then = (ok, ko) => Promise.resolve(resultado).then(ok, ko);
  sb.consultas.push({ tabla, llamadas });
  return q;
}

/** Respuestas en orden para cada tabla: { profiles: [{ data, error }], groups: [...] }. */
function respuestas(colas) {
  sb.colas = colas;
  sb.consultas = [];
  sb.from = vi.fn((tabla) => consulta(tabla, sb.colas[tabla].shift()));
}

const SESION = { user: { id: 'u-1', user_metadata: { nombre: 'Ana García' } } };

function conSesion(session = SESION) {
  sb.auth = {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    signInWithOtp: vi.fn(async () => ({ data: {}, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  };
}

const PAYLOAD = {
  nombre: 'Ana García',
  estado_grupo: 'Tengo grupo',
  rol: 'Diseño',
  intereses: ['IA'],
  linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
  descripcion: null,
  nombre_grupo: 'Pixel Club',
};
const CAMPOS_BD = {
  nombre: 'Ana García',
  estado_grupo: 'Tengo grupo',
  rol: 'Diseño',
  intereses: ['IA'],
  linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
  descripcion: null,
};

function irA(url) {
  window.history.replaceState(null, '', url);
}

/** Ejecuta una llamada del mock adelantando el retardo simulado. */
async function conMock(promesa) {
  const resultado = promesa.then(
    (v) => ({ ok: v }),
    (e) => ({ error: e.codigo ?? e })
  );
  await vi.advanceTimersByTimeAsync(MOCK_RETARDO_MS);
  return resultado;
}

beforeEach(() => {
  vi.useFakeTimers();
  reiniciarMock();
  reiniciarClienteSupabase();
  vi.mocked(createClient).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  irA('/');
});

describe('modo demo', () => {
  const loc = (host, search) => ({ hostname: host, search });

  test('se activa con ?demo= fuera de producción', () => {
    expect(usaMock(loc('localhost', '?demo=1'))).toBe(true);
    expect(usaMock(loc('start-avatares-preview.vercel.app', '?demo=con-perfil'))).toBe(true);
    expect(usaMock(loc('localhost', ''))).toBe(false);
  });

  test.each(['www.startuc3m.es', 'startuc3m.es', 'startcamp.startuc3m.es'])('nunca en %s', (host) => {
    expect(usaMock(loc(host, '?demo=1'))).toBe(false);
  });

  test('una variante desconocida cae en Entrar', () => {
    expect(varianteDemo(loc('localhost', '?demo=loquesea'))).toBe('1');
    expect(varianteDemo(loc('localhost', '?demo=sin-perfil'))).toBe('sin-perfil');
  });
});

describe('variantes del mock', () => {
  test('?demo=1: sin sesión; el enlace se manda bien', async () => {
    irA('/?demo=1');
    expect(await conMock(obtenerPerfil())).toEqual({ error: 'SIN_SESION' });
    expect(await conMock(pedirEnlace('ana@uc3m.es'))).toEqual({ ok: { ok: true } });
  });

  test('?demo=correo-no-encontrado', async () => {
    irA('/?demo=correo-no-encontrado');
    expect(await conMock(pedirEnlace('nadie@uc3m.es'))).toEqual({ error: 'CORREO_NO_ENCONTRADO' });
  });

  test('?demo=sin-perfil: crear, leer y borrar', async () => {
    irA('/?demo=sin-perfil');
    expect(await conMock(obtenerPerfil())).toEqual({ ok: { nombre: 'Alex Demo', perfil: null } });

    const datos = { nombre: 'Alex', estado_grupo: 'Busco grupo', rol: 'Otro', intereses: [], linkedin_url: null, descripcion: null, nombre_grupo: null };
    await conMock(guardarPerfil({ ...datos, consent_at: 'x', consent_version: 'v1' }, { crear: true }));
    expect((await conMock(obtenerPerfil())).ok.perfil).toEqual(datos);

    await conMock(borrarPerfil());
    expect((await conMock(obtenerPerfil())).ok.perfil).toBeNull();
  });

  test('?demo=con-perfil: perfil con grupo y forma de la base de datos', async () => {
    irA('/?demo=con-perfil');
    const { ok } = await conMock(obtenerPerfil());
    expect(ok.perfil).toMatchObject({ estado_grupo: 'Abierto a sumar gente', nombre_grupo: 'Los del fondo' });
    expect(ok.perfil.linkedin_url).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
  });

  test('?demo=error-red: guardar y borrar fallan por red', async () => {
    irA('/?demo=error-red');
    expect(await conMock(guardarPerfil({}))).toEqual({ error: 'RED' });
    expect(await conMock(borrarPerfil())).toEqual({ error: 'RED' });
  });

  test('?demo=sesion-caducada: al guardar caduca la sesión', async () => {
    irA('/?demo=sesion-caducada');
    expect((await conMock(obtenerPerfil())).ok.perfil).not.toBeNull();
    expect(await conMock(guardarPerfil({}))).toEqual({ error: 'SESION_CADUCADA' });
    expect(await conMock(obtenerPerfil())).toEqual({ error: 'SIN_SESION' });
  });

  test('cerrar sesión deja el mock sin sesión', async () => {
    irA('/?demo=con-perfil');
    await conMock(cerrarSesion());
    expect(await conMock(obtenerPerfil())).toEqual({ error: 'SIN_SESION' });
  });

  test('sin modo demo y sin variables de Supabase: se ve «Entrar»', async () => {
    irA('/');
    await expect(obtenerPerfil()).rejects.toMatchObject({ codigo: 'SIN_SESION' });
    await expect(pedirEnlace('a@b.es')).rejects.toMatchObject({ codigo: 'RED' });
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('leerErrorEnlace', () => {
  test('lee el error_code del hash y lo quita de la URL', () => {
    irA('/eventos/start-camp/avatar#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
    expect(leerErrorEnlace()).toBe('otp_expired');
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/eventos/start-camp/avatar');
  });

  test('también en la query, sin tocar el resto', () => {
    irA('/eventos/start-camp/avatar?demo=1&error=access_denied&error_code=otp_expired');
    expect(leerErrorEnlace()).toBe('otp_expired');
    expect(window.location.search).toBe('?demo=1');
  });

  test('sin error devuelve null', () => {
    irA('/eventos/start-camp/avatar');
    expect(leerErrorEnlace()).toBeNull();
  });

  test('?demo=enlace-caducado lo simula', () => {
    irA('/eventos/start-camp/avatar?demo=enlace-caducado');
    expect(leerErrorEnlace()).toBe('otp_expired');
  });
});

describe('errores de Supabase → interfaz', () => {
  test.each([
    [{ code: '23514', message: 'new row for relation "profiles" violates check constraint "profiles_descripcion_check"' }, 'INVALID_DESCRIPCION'],
    [{ code: '23514', message: 'violates check constraint "profiles_linkedin_url_check"' }, 'INVALID_LINKEDIN'],
    [{ code: '23514', message: 'violates check constraint "profiles_intereses_check"' }, 'INVALID_INTERESES'],
    [{ code: '23514', message: 'violates check constraint "profiles_estado_grupo_check"' }, 'INVALID_ESTADO_GRUPO'],
    [{ code: '23514', message: 'otra cosa' }, 'INVALID_PERFIL'],
    [{ code: '42501', message: 'new row violates row-level security policy' }, 'SESION_CADUCADA'],
    [{ status: 401, message: 'JWT expired' }, 'SESION_CADUCADA'],
    [{ message: 'Failed to fetch' }, 'RED'],
  ])('%o → %s', (error, codigo) => {
    expect(traducirErrorBD(error)).toBe(codigo);
  });

  test('correo que no está al pedir el enlace', () => {
    expect(traducirErrorEnlace({ message: 'Signups not allowed for otp', code: 'otp_disabled' })).toBe('CORREO_NO_ENCONTRADO');
    expect(traducirErrorEnlace({ message: 'Failed to fetch' })).toBe('RED');
  });
});

describe('Supabase (brief §6)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://proyecto.supabase.co');
    vi.stubEnv('PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_prueba');
    irA('/eventos/start-camp/avatar');
    conSesion();
    respuestas({ profiles: [], groups: [] });
  });

  test('crea el cliente con las variables públicas y una sola vez', async () => {
    respuestas({ profiles: [{ data: null, error: null }, { data: null, error: null }] });
    await obtenerPerfil();
    await obtenerPerfil();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith('https://proyecto.supabase.co', 'sb_publishable_prueba');
  });

  describe('pedirEnlace', () => {
    test('signInWithOtp sin crear usuarios y de vuelta a la página', async () => {
      await expect(pedirEnlace('ana@uc3m.es')).resolves.toEqual({ ok: true });
      expect(sb.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'ana@uc3m.es',
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/eventos/start-camp/avatar` },
      });
    });

    test('correo que no está → CORREO_NO_ENCONTRADO', async () => {
      sb.auth.signInWithOtp.mockResolvedValue({ error: { code: 'otp_disabled', message: 'Signups not allowed for otp' } });
      await expect(pedirEnlace('nadie@uc3m.es')).rejects.toMatchObject({ codigo: 'CORREO_NO_ENCONTRADO' });
    });

    test('si supabase-js lanza (red) → RED', async () => {
      sb.auth.signInWithOtp.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(pedirEnlace('ana@uc3m.es')).rejects.toMatchObject({ codigo: 'RED' });
    });
  });

  describe('obtenerPerfil', () => {
    test('sin sesión → SIN_SESION, sin tocar la base de datos', async () => {
      conSesion(null);
      await expect(obtenerPerfil()).rejects.toMatchObject({ codigo: 'SIN_SESION' });
      expect(sb.from).not.toHaveBeenCalled();
    });

    test('lee solo sus columnas (nunca *) con maybeSingle; sin perfil → null', async () => {
      respuestas({ profiles: [{ data: null, error: null }] });
      await expect(obtenerPerfil()).resolves.toEqual({ nombre: 'Ana García', perfil: null });
      expect(sb.consultas[0]).toEqual({
        tabla: 'profiles',
        llamadas: [
          ['select', 'nombre, estado_grupo, rol, intereses, linkedin_url, descripcion, group_id, groups(nombre)'],
          ['eq', 'user_id', 'u-1'],
          ['maybeSingle'],
        ],
      });
    });

    test('con perfil lo devuelve tal cual (grupo en groups.nombre)', async () => {
      const perfil = { ...CAMPOS_BD, group_id: 'g-1', groups: { nombre: 'Pixel Club' } };
      respuestas({ profiles: [{ data: perfil, error: null }] });
      await expect(obtenerPerfil()).resolves.toEqual({ nombre: 'Ana García', perfil });
    });

    test('sin nombre precargado → cadena vacía', async () => {
      conSesion({ user: { id: 'u-1', user_metadata: {} } });
      respuestas({ profiles: [{ data: null, error: null }] });
      await expect(obtenerPerfil()).resolves.toEqual({ nombre: '', perfil: null });
    });

    test('42501 al leer → SESION_CADUCADA', async () => {
      respuestas({ profiles: [{ data: null, error: { code: '42501', message: 'permission denied' } }] });
      await expect(obtenerPerfil()).rejects.toMatchObject({ codigo: 'SESION_CADUCADA' });
    });
  });

  describe('guardarPerfil', () => {
    const conGrupo = (perfil) => ({
      groups: [{ data: [{ id: 'g-1', nombre: 'Pixel Club' }], error: null }],
      profiles: [perfil],
    });

    test('crear: insert con user_id, group_id y consentimiento, sin pedir columnas de vuelta', async () => {
      respuestas(conGrupo({ data: null, error: null }));
      const datos = { ...PAYLOAD, consent_at: '2026-10-27T10:00:00.000Z', consent_version: 'v1' };
      await expect(guardarPerfil(datos, { crear: true })).resolves.toEqual({ ok: true });
      const alta = sb.consultas.find((c) => c.tabla === 'profiles');
      expect(alta.llamadas).toEqual([
        [
          'insert',
          { user_id: 'u-1', ...CAMPOS_BD, group_id: 'g-1', consent_at: '2026-10-27T10:00:00.000Z', consent_version: 'v1' },
        ],
      ]);
    });

    test('editar: update sin consent_* ni nombre_grupo, filtrado por user_id (no upsert)', async () => {
      respuestas(conGrupo({ data: null, error: null }));
      await guardarPerfil(PAYLOAD, { crear: false });
      const cambio = sb.consultas.find((c) => c.tabla === 'profiles');
      expect(cambio.llamadas).toEqual([
        ['update', { ...CAMPOS_BD, group_id: 'g-1' }],
        ['eq', 'user_id', 'u-1'],
      ]);
    });

    test('«Busco grupo» → group_id null sin leer groups', async () => {
      respuestas({ profiles: [{ data: null, error: null }], groups: [] });
      await guardarPerfil({ ...PAYLOAD, estado_grupo: 'Busco grupo', nombre_grupo: null });
      expect(sb.consultas.map((c) => c.tabla)).toEqual(['profiles']);
      expect(sb.consultas[0].llamadas[0][1]).toMatchObject({ estado_grupo: 'Busco grupo', group_id: null });
    });

    test('sin sesión → SESION_CADUCADA', async () => {
      conSesion(null);
      await expect(guardarPerfil(PAYLOAD)).rejects.toMatchObject({ codigo: 'SESION_CADUCADA' });
    });

    test('23514 de un campo → INVALID_<CAMPO>', async () => {
      respuestas(conGrupo({ data: null, error: { code: '23514', message: 'violates check constraint "profiles_descripcion_check"' } }));
      await expect(guardarPerfil(PAYLOAD)).rejects.toMatchObject({ codigo: 'INVALID_DESCRIPCION' });
    });

    test('error de red de PostgREST → RED', async () => {
      respuestas(conGrupo({ data: null, error: { message: 'TypeError: Failed to fetch', code: '' } }));
      await expect(guardarPerfil(PAYLOAD)).rejects.toMatchObject({ codigo: 'RED' });
    });
  });

  describe('nombre de grupo → group_id', () => {
    test('encuentra el grupo ignorando mayúsculas y espacios al final', async () => {
      respuestas({ groups: [{ data: [{ id: 'g-7', nombre: 'Pixel Club ' }], error: null }] });
      await expect(resolverGrupo(sb, 'Tengo grupo', 'pixel club   ')).resolves.toBe('g-7');
      expect(sb.consultas[0].llamadas).toEqual([['select', 'id, nombre']]);
    });

    test('si no existe lo crea con origen manual y pide solo el id', async () => {
      respuestas({ groups: [{ data: [{ id: 'g-1', nombre: 'Otro' }], error: null }, { data: { id: 'g-9' }, error: null }] });
      await expect(resolverGrupo(sb, 'Abierto a sumar gente', 'Los del fondo')).resolves.toBe('g-9');
      expect(sb.consultas[1].llamadas).toEqual([
        ['insert', { nombre: 'Los del fondo', origen: 'manual' }],
        ['select', 'id'],
        ['single'],
      ]);
    });

    test('con 23505 (otra persona lo creó a la vez) vuelve a buscarlo', async () => {
      respuestas({
        groups: [
          { data: [], error: null },
          { data: null, error: { code: '23505', message: 'duplicate key' } },
          { data: [{ id: 'g-3', nombre: 'Los del fondo' }], error: null },
        ],
      });
      await expect(resolverGrupo(sb, 'Tengo grupo', 'Los del fondo')).resolves.toBe('g-3');
      expect(sb.consultas).toHaveLength(3);
    });

    test('no se queda en bucle si el 23505 se repite', async () => {
      const vacio = { data: [], error: null };
      const dup = { data: null, error: { code: '23505' } };
      respuestas({ groups: [vacio, dup, vacio, dup, vacio, dup] });
      await expect(resolverGrupo(sb, 'Tengo grupo', 'X')).rejects.toMatchObject({ codigo: 'RED' });
    });

    test('«Busco grupo» o sin nombre → null', async () => {
      await expect(resolverGrupo(sb, 'Busco grupo', 'Pixel Club')).resolves.toBeNull();
      await expect(resolverGrupo(sb, 'Tengo grupo', null)).resolves.toBeNull();
      expect(sb.from).not.toHaveBeenCalled();
    });

    test('otro error al crear el grupo se traduce', async () => {
      respuestas({ groups: [{ data: [], error: null }, { data: null, error: { code: '42501' } }] });
      await expect(resolverGrupo(sb, 'Tengo grupo', 'X')).rejects.toMatchObject({ codigo: 'SESION_CADUCADA' });
    });
  });

  describe('borrarPerfil y cerrarSesion', () => {
    test('delete filtrado por user_id', async () => {
      respuestas({ profiles: [{ data: null, error: null }] });
      await expect(borrarPerfil()).resolves.toEqual({ ok: true });
      expect(sb.consultas[0].llamadas).toEqual([['delete'], ['eq', 'user_id', 'u-1']]);
    });

    test('borrar sin sesión → SESION_CADUCADA', async () => {
      conSesion(null);
      await expect(borrarPerfil()).rejects.toMatchObject({ codigo: 'SESION_CADUCADA' });
    });

    test('cerrar sesión llama a signOut', async () => {
      await cerrarSesion();
      expect(sb.auth.signOut).toHaveBeenCalled();
    });
  });

  test('el modo demo sigue mandando: con ?demo= no se toca Supabase', async () => {
    irA('/eventos/start-camp/avatar?demo=sin-perfil');
    vi.useFakeTimers();
    await conMock(obtenerPerfil());
    expect(createClient).not.toHaveBeenCalled();
  });
});
