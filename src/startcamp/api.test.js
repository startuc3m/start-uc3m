import { vi } from 'vitest';
import {
  MOCK_RETARDO_MS,
  borrarPerfil,
  cerrarSesion,
  guardarPerfil,
  leerErrorEnlace,
  obtenerPerfil,
  pedirEnlace,
  reiniciarMock,
  traducirErrorBD,
  traducirErrorEnlace,
  usaMock,
  varianteDemo,
} from './api';

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
});

afterEach(() => {
  vi.useRealTimers();
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

  test('sin modo demo, todavía no hay back: se ve «Entrar»', async () => {
    irA('/');
    await expect(obtenerPerfil()).rejects.toMatchObject({ codigo: 'SIN_SESION' });
    await expect(pedirEnlace('a@b.es')).rejects.toMatchObject({ codigo: 'RED' });
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
