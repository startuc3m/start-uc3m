import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarForm, { MENSAJES } from './AvatarForm';
import * as api from './api.js';
import confetti from 'canvas-confetti';

// Las funciones de datos se sustituyen por espías; el resto (ApiError,
// varianteDemo…) es el real.
vi.mock('./api.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    pedirEnlace: vi.fn(),
    obtenerPerfil: vi.fn(),
    guardarPerfil: vi.fn(),
    borrarPerfil: vi.fn(),
    cerrarSesion: vi.fn(),
    leerErrorEnlace: vi.fn(),
  };
});

// La librería del confeti se sustituye por un espía (jsdom no tiene canvas).
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const { ApiError } = api;

const PERFIL_BD = {
  nombre: 'Ana García',
  estado_grupo: 'Abierto a sumar gente',
  rol: 'Tecnología',
  intereses: ['IA', 'Salud'],
  linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
  descripcion: 'Me gusta programar.',
  nombre_grupo: 'Los del fondo',
};

function irA(url) {
  window.history.replaceState(null, '', url);
}

/** Pinta la página con una sesión abierta (con o sin perfil). */
function renderConSesion(perfil = null) {
  api.obtenerPerfil.mockResolvedValue({ nombre: 'Ana García', perfil });
  render(<AvatarForm />);
}

const cargado = () => screen.findByLabelText('Nombre');
const botonGuardar = () => screen.getByRole('button', { name: /^Guardar|Guardando/ });

/**
 * Pegar como en el navegador. userEvent.paste (v13) inserta el texto aunque
 * el componente haga preventDefault; un navegador no, así que se dispara el
 * evento a mano.
 */
function pegar(input, texto) {
  input.focus();
  fireEvent.paste(input, { clipboardData: { getData: () => texto } });
}

function rellenarMinimo({ consentir = true } = {}) {
  userEvent.click(screen.getByRole('radio', { name: /Busco grupo/ }));
  userEvent.click(screen.getByRole('radio', { name: 'Negocio' }));
  if (consentir) userEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }));
}

beforeEach(() => {
  irA('/eventos/start-camp/avatar');
  vi.resetAllMocks();
  api.leerErrorEnlace.mockReturnValue(null);
  api.guardarPerfil.mockResolvedValue({ ok: true });
  api.borrarPerfil.mockResolvedValue({ ok: true });
  api.cerrarSesion.mockResolvedValue(undefined);
  api.pedirEnlace.mockResolvedValue({ ok: true });
});

describe('Entrar', () => {
  beforeEach(() => {
    api.obtenerPerfil.mockRejectedValue(new ApiError('SIN_SESION'));
  });

  test('sin sesión se pide el correo; al enviarlo, «Revisa tu correo»', async () => {
    render(<AvatarForm />);
    const correo = await screen.findByLabelText('Tu correo');
    userEvent.type(correo, 'ana@uc3m.es');
    userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByText(MENSAJES.enlaceEnviado)).toBeInTheDocument();
    expect(api.pedirEnlace).toHaveBeenCalledWith('ana@uc3m.es');
  });

  test('correo que no está: «No encontramos tu entrada…»', async () => {
    api.pedirEnlace.mockRejectedValue(new ApiError('CORREO_NO_ENCONTRADO'));
    render(<AvatarForm />);
    userEvent.type(await screen.findByLabelText('Tu correo'), 'nadie@uc3m.es');
    userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.correoNoEncontrado);
  });

  test('un correo mal escrito no se envía', async () => {
    render(<AvatarForm />);
    userEvent.type(await screen.findByLabelText('Tu correo'), 'ana@');
    userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(screen.getByText('Escribe un correo válido')).toBeInTheDocument();
    expect(api.pedirEnlace).not.toHaveBeenCalled();
  });

  test('ya no se usa ?t=: sin sesión no se redirige a ningún sitio', async () => {
    irA('/eventos/start-camp/avatar?t=algo');
    render(<AvatarForm />);
    await screen.findByLabelText('Tu correo');
    expect(window.location.pathname).toBe('/eventos/start-camp/avatar');
  });
});

describe('enlace caducado', () => {
  test('muestra «Enlace no válido» y «Pedir otro enlace» lleva a Entrar', async () => {
    api.leerErrorEnlace.mockReturnValue('otp_expired');
    render(<AvatarForm />);
    expect(screen.getByText('Enlace no válido')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¿Te has perdido?_' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir a startuc3m\.es/ })).toHaveAttribute('href', 'https://www.startuc3m.es/');
    expect(api.obtenerPerfil).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Pedir otro enlace' }));
    expect(screen.getByLabelText('Tu correo')).toBeInTheDocument();
  });
});

describe('carga del perfil', () => {
  test('sin perfil: formulario vacío salvo el nombre y con consentimiento', async () => {
    renderConSesion(null);
    await cargado();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana García');
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('maxLength', '80');
    screen.getAllByRole('radio').forEach((r) => expect(r).not.toBeChecked());
    expect(screen.getByRole('checkbox', { name: /Acepto/ })).not.toBeChecked();
    expect(botonGuardar()).toHaveTextContent('Guardar mi perfil');
    expect(screen.queryByRole('button', { name: 'Borrar mi perfil' })).not.toBeInTheDocument();
  });

  test('con perfil (forma de la base de datos): formulario relleno y sin consentimiento', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    expect(screen.getByRole('radio', { name: /Abierto a sumar gente/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tecnología' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'IA' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Salud' })).toBeChecked();
    expect(screen.getByLabelText(/^LinkedIn/)).toHaveValue('ana-garcia');
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('Me gusta programar.');
    expect(screen.getByLabelText(/Nombre del grupo/)).toHaveValue('Los del fondo');
    expect(screen.queryByRole('checkbox', { name: /Acepto/ })).not.toBeInTheDocument();
    expect(botonGuardar()).toHaveTextContent('Guardar cambios');
  });

  test('si la carga falla por red, deja reintentar', async () => {
    api.obtenerPerfil
      .mockRejectedValueOnce(new ApiError('RED'))
      .mockResolvedValueOnce({ nombre: 'Ana', perfil: null });
    render(<AvatarForm />);
    userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await cargado();
    expect(api.obtenerPerfil).toHaveBeenCalledTimes(2);
  });
});

describe('campos', () => {
  test('el nombre del grupo solo aparece con grupo, y «Busco grupo» lo vacía', async () => {
    renderConSesion(null);
    await cargado();
    expect(screen.queryByLabelText(/Nombre del grupo/)).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: /Tengo grupo/ }));
    userEvent.type(screen.getByLabelText(/Nombre del grupo/), 'Pixel Club');
    userEvent.click(screen.getByRole('radio', { name: /Busco grupo/ }));
    expect(screen.queryByLabelText(/Nombre del grupo/)).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: /Abierto a sumar gente/ }));
    expect(screen.getByLabelText(/Nombre del grupo/)).toHaveValue('');
  });

  test('como mucho 3 intereses: contador y el resto deshabilitados', async () => {
    renderConSesion(null);
    await cargado();
    expect(screen.getByText('0/3')).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: 'IA' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'Datos' }));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: 'Videojuegos' }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Ciberseguridad' })).toBeDisabled();
    userEvent.click(screen.getByRole('checkbox', { name: 'IA' }));
    expect(screen.getByRole('checkbox', { name: 'Ciberseguridad' })).toBeEnabled();
  });

  test('la descripción tiene contador y tope de 280', async () => {
    renderConSesion(null);
    await cargado();
    const desc = screen.getByLabelText(/Sobre ti/);
    expect(desc).toHaveAttribute('maxLength', '280');
    userEvent.type(desc, 'Hola');
    expect(screen.getByText('4/280')).toBeInTheDocument();
  });

  test('el consentimiento enlaza a la política de privacidad absoluta', async () => {
    renderConSesion(null);
    await cargado();
    const label = screen.getByText(/Acepto que Start UC3M use mi perfil/);
    expect(within(label).getByRole('link', { name: 'política de privacidad' })).toHaveAttribute(
      'href',
      'https://www.startuc3m.es/privacidad'
    );
    expect(label).toHaveTextContent(/solo lo verán otros asistentes/i);
    expect(label).toHaveTextContent(/se borrará al acabar/i);
    expect(label).toHaveTextContent(/Borrar mi perfil/);
  });
});

describe('LinkedIn', () => {
  test('al pegar la URL entera se queda solo el usuario', async () => {
    renderConSesion(null);
    await cargado();
    const input = screen.getByLabelText(/^LinkedIn/);
    pegar(input, 'https://www.linkedin.com/in/ana-garcia/?trk=public_profile');
    expect(input).toHaveValue('ana-garcia');
  });

  test.each(['es.linkedin.com/in/ana-garcia', 'https://www.linkedin.com/in/ana-garcia/?trk=public_profile'])(
    'una URL tecleada entera (%s) se recorta al salir del campo',
    async (url) => {
      renderConSesion(null);
      await cargado();
      const input = screen.getByLabelText(/^LinkedIn/);
      userEvent.type(input, url);
      expect(input).toHaveValue(url);
      userEvent.tab();
      expect(input).toHaveValue('ana-garcia');
    }
  );

  test('un perfil inválido avisa y no deja guardar', async () => {
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    const input = screen.getByLabelText(/^LinkedIn/);
    userEvent.type(input, 'ana garcia');
    userEvent.tab();
    expect(screen.getByText('Eso no parece un perfil de LinkedIn')).toBeInTheDocument();
    userEvent.click(botonGuardar());
    expect(api.guardarPerfil).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
  });
});

describe('guardar', () => {
  test('al crear sin consentimiento no se envía', async () => {
    renderConSesion(null);
    await cargado();
    rellenarMinimo({ consentir: false });
    userEvent.click(botonGuardar());
    expect(screen.getByText('Necesitamos tu permiso para enseñar tu perfil')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Acepto/ })).toHaveFocus();
    expect(api.guardarPerfil).not.toHaveBeenCalled();
  });

  test('al crear se manda la forma de la base de datos con el consentimiento', async () => {
    renderConSesion(null);
    await cargado();
    userEvent.click(screen.getByRole('radio', { name: /Tengo grupo/ }));
    userEvent.type(screen.getByLabelText(/Nombre del grupo/), 'Pixel Club');
    userEvent.click(screen.getByRole('radio', { name: 'Diseño' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'Hardware y robótica' }));
    pegar(screen.getByLabelText(/^LinkedIn/), 'https://es.linkedin.com/in/ana-garcia/');
    userEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }));
    userEvent.click(botonGuardar());

    expect(await screen.findByText(MENSAJES.guardado)).toBeInTheDocument();
    const [datos, opciones] = api.guardarPerfil.mock.calls[0];
    expect(opciones).toEqual({ crear: true });
    expect(datos).toEqual({
      nombre: 'Ana García',
      estado_grupo: 'Tengo grupo',
      rol: 'Diseño',
      intereses: ['Hardware y robótica'],
      linkedin_url: 'https://www.linkedin.com/in/ana-garcia',
      descripcion: null,
      nombre_grupo: 'Pixel Club',
      consent_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      consent_version: 'v1',
    });
    // Ya creado: no se vuelve a pedir el consentimiento.
    expect(screen.queryByRole('checkbox', { name: /Acepto/ })).not.toBeInTheDocument();
    expect(botonGuardar()).toHaveTextContent('Guardar cambios');
  });

  test('al editar no se pide ni se manda el consentimiento', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(screen.getByRole('radio', { name: /Busco grupo/ }));
    userEvent.click(botonGuardar());
    await screen.findByText(MENSAJES.guardado);
    const [datos, opciones] = api.guardarPerfil.mock.calls[0];
    expect(opciones).toEqual({ crear: false });
    expect(datos).not.toHaveProperty('consent_at');
    expect(datos).not.toHaveProperty('consent_version');
    expect(datos).toMatchObject({ estado_grupo: 'Busco grupo', nombre_grupo: null });
  });

  test('mientras guarda: «Guardando…», botón deshabilitado y sin doble envío', async () => {
    let terminar;
    api.guardarPerfil.mockImplementation(() => new Promise((r) => (terminar = r)));
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    userEvent.click(botonGuardar());

    const boton = await screen.findByRole('button', { name: 'Guardando…' });
    expect(boton).toBeDisabled();
    userEvent.click(boton);
    expect(api.guardarPerfil).toHaveBeenCalledTimes(1);

    terminar({ ok: true });
    expect(await screen.findByText(MENSAJES.guardado)).toBeInTheDocument();
  });

  test('error de red: avisa y conserva lo escrito', async () => {
    api.guardarPerfil.mockRejectedValue(new ApiError('RED'));
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    userEvent.type(screen.getByLabelText(/Sobre ti/), 'No lo pierdas');
    userEvent.click(botonGuardar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.red);
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('No lo pierdas');
    expect(screen.getByRole('radio', { name: 'Negocio' })).toBeChecked();
  });

  test('sesión caducada al guardar: aviso y botón a Entrar', async () => {
    api.guardarPerfil.mockRejectedValue(new ApiError('SESION_CADUCADA'));
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(botonGuardar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.sesionCaducada);
    userEvent.click(screen.getByRole('button', { name: 'Pedir otro enlace' }));
    expect(screen.getByLabelText('Tu correo')).toBeInTheDocument();
  });

  test('un INVALID_<CAMPO> de la base de datos se marca en ese campo', async () => {
    api.guardarPerfil.mockRejectedValue(new ApiError('INVALID_DESCRIPCION'));
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(botonGuardar());
    expect(await screen.findByText('Revisa este campo.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Sobre ti/)).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('confeti', () => {
  // El confeti se carga con import() después del guardado: se da margen
  // antes de comprobar que no ha salido.
  const dejarPasar = () => new Promise((r) => setTimeout(r, 50));

  test('sale al crear el perfil', async () => {
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    userEvent.click(botonGuardar());
    await screen.findByText(MENSAJES.guardado);
    await waitFor(() => expect(confetti).toHaveBeenCalled());
  });

  test('no sale al editar', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(botonGuardar());
    await screen.findByText(MENSAJES.guardado);
    await dejarPasar();
    expect(confetti).not.toHaveBeenCalled();
  });

  test('no sale si el guardado falla', async () => {
    api.guardarPerfil.mockRejectedValue(new ApiError('RED'));
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    userEvent.click(botonGuardar());
    await screen.findByRole('alert');
    await dejarPasar();
    expect(confetti).not.toHaveBeenCalled();
  });

  test('si la librería falla, el guardado y el mensaje siguen igual', async () => {
    confetti.mockImplementation(() => {
      throw new Error('sin canvas');
    });
    renderConSesion(null);
    await cargado();
    rellenarMinimo();
    userEvent.click(botonGuardar());
    expect(await screen.findByText(MENSAJES.guardado)).toBeInTheDocument();
    await waitFor(() => expect(confetti).toHaveBeenCalled());
    expect(botonGuardar()).toHaveTextContent('Guardar cambios');
  });
});

describe('borrar mi perfil', () => {
  test('pide confirmación; al confirmar queda sin perfil', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(screen.getByRole('button', { name: 'Borrar mi perfil' }));

    const confirmacion = screen.getByRole('group', { name: MENSAJES.confirmarBorrado });
    expect(confirmacion).toHaveFocus();
    expect(api.borrarPerfil).not.toHaveBeenCalled();

    userEvent.click(within(confirmacion).getByRole('button', { name: 'Sí, borrar mi perfil' }));
    expect(await screen.findByText(MENSAJES.borrado)).toBeInTheDocument();
    expect(api.borrarPerfil).toHaveBeenCalledTimes(1);

    // Estado «sin perfil»: vacío salvo el nombre, y vuelve el consentimiento.
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana García');
    screen.getAllByRole('radio').forEach((r) => expect(r).not.toBeChecked());
    expect(screen.getByRole('checkbox', { name: /Acepto/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Borrar mi perfil' })).not.toBeInTheDocument();
    expect(botonGuardar()).toHaveTextContent('Guardar mi perfil');
  });

  test('cancelar no borra y devuelve el foco al botón', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(screen.getByRole('button', { name: 'Borrar mi perfil' }));
    userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(api.borrarPerfil).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Borrar mi perfil' })).toHaveFocus());
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('Me gusta programar.');
  });

  test('si falla por red, avisa y no borra nada del formulario', async () => {
    api.borrarPerfil.mockRejectedValue(new ApiError('RED'));
    renderConSesion(PERFIL_BD);
    await cargado();
    userEvent.click(screen.getByRole('button', { name: 'Borrar mi perfil' }));
    userEvent.click(screen.getByRole('button', { name: 'Sí, borrar mi perfil' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJES.borrarRed);
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('Me gusta programar.');
  });
});

test('cerrar sesión lleva a Entrar', async () => {
  renderConSesion(PERFIL_BD);
  await cargado();
  userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(await screen.findByLabelText('Tu correo')).toBeInTheDocument();
  expect(api.cerrarSesion).toHaveBeenCalledTimes(1);
});

test('la vista previa se actualiza en vivo con la forma de la base de datos', async () => {
  renderConSesion(null);
  await cargado();
  const preview = screen.getByRole('complementary', { name: 'Así te verán los demás' });
  expect(within(preview).getByRole('article', { name: 'Perfil de Ana García' })).toBeInTheDocument();

  userEvent.clear(screen.getByLabelText('Nombre'));
  userEvent.type(screen.getByLabelText('Nombre'), 'Ana G.');
  userEvent.click(screen.getByRole('radio', { name: 'Tecnología' }));
  userEvent.click(screen.getByRole('checkbox', { name: 'Hardware y robótica' }));
  userEvent.type(screen.getByLabelText(/Sobre ti/), 'Backend y datos');
  userEvent.type(screen.getByLabelText(/^LinkedIn/), 'ana-g');

  expect(within(preview).getByText('Ana G.')).toBeInTheDocument();
  expect(within(preview).getByText('Tecnología')).toBeInTheDocument();
  expect(within(preview).getByText('Hardware y robótica')).toBeInTheDocument();
  expect(within(preview).getByText('Backend y datos')).toBeInTheDocument();
  expect(within(preview).getByRole('link')).toHaveAttribute('href', 'https://www.linkedin.com/in/ana-g');
});

describe('barra demo', () => {
  test('solo aparece con ?demo= y enlaza a todas las variantes', async () => {
    irA('/eventos/start-camp/avatar?demo=con-perfil');
    renderConSesion(PERFIL_BD);
    await cargado();
    const barra = screen.getByRole('navigation', { name: 'Modo demo' });
    expect(within(barra).getAllByRole('link')).toHaveLength(api.VARIANTES_DEMO.length);
    expect(within(barra).getByRole('link', { name: 'Con perfil y grupo' })).toHaveAttribute('aria-current', 'page');
  });

  test('sin ?demo= no aparece', async () => {
    renderConSesion(PERFIL_BD);
    await cargado();
    expect(screen.queryByRole('navigation', { name: 'Modo demo' })).not.toBeInTheDocument();
  });
});
