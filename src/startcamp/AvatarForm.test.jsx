import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarForm, { MENSAJE_RED } from './AvatarForm';
import { CONSENTIMIENTO_VERSION } from './opciones';

const PERFIL = {
  estado_grupo: 'abierto',
  rol: 'tecnologia',
  intereses: ['ia', 'salud'],
  linkedin: 'ana-garcia',
  descripcion: 'Me gusta programar.',
  nombre_grupo: 'Los del fondo',
};

function irA(url) {
  window.history.replaceState(null, '', url);
}

function respuesta(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

/** fetch falso del contrato: get/put son { status, body } o una función que devuelve la promesa. */
function mockFetch({
  get = { status: 200, body: { nombre: 'Ana García', perfil: null } },
  put = { status: 200, body: { ok: true } },
} = {}) {
  return vi.fn((url, init = {}) => {
    if (url !== '/api/startcamp/perfil') return Promise.reject(new Error('fetch no mockeado: ' + url));
    const r = (init.method ?? 'GET') === 'PUT' ? put : get;
    return typeof r === 'function' ? r(init) : respuesta(r.status, r.body);
  });
}

function renderForm(opciones) {
  const onEnlaceInvalido = vi.fn();
  global.fetch = mockFetch(opciones);
  render(<AvatarForm onEnlaceInvalido={onEnlaceInvalido} />);
  return { onEnlaceInvalido };
}

const cargado = () => screen.findByLabelText('Nombre');
const llamadasPut = () => global.fetch.mock.calls.filter(([, init]) => init?.method === 'PUT');
const botonGuardar = () => screen.getByRole('button', { name: /Guardar/ });

function rellenarMinimo() {
  userEvent.click(screen.getByRole('radio', { name: /Busco grupo/ }));
  userEvent.click(screen.getByRole('radio', { name: 'Negocio' }));
  userEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }));
}

beforeEach(() => {
  sessionStorage.clear();
  irA('/eventos/start-camp/avatar?t=abc123');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('acceso por enlace', () => {
  test('sin token va a la página de enlace no válido sin llamar al back', async () => {
    irA('/eventos/start-camp/avatar');
    const { onEnlaceInvalido } = renderForm();
    await waitFor(() => expect(onEnlaceInvalido).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('con un token que el back rechaza (401) va a la página de enlace no válido', async () => {
    const { onEnlaceInvalido } = renderForm({ get: { status: 401, body: { error: 'INVALID_TOKEN' } } });
    await waitFor(() => expect(onEnlaceInvalido).toHaveBeenCalled());
    expect(sessionStorage.getItem('startcamp-avatar-token')).toBeNull();
  });

  test('quita el token de la barra de direcciones y lo manda como Bearer', async () => {
    renderForm();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    await cargado();
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/eventos/start-camp/avatar');
    const [, init] = global.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc123');
  });

  test('al recargar sin ?t sigue usando el token de la pestaña', async () => {
    sessionStorage.setItem('startcamp-avatar-token', 'abc123');
    irA('/eventos/start-camp/avatar');
    const { onEnlaceInvalido } = renderForm();
    await cargado();
    expect(onEnlaceInvalido).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123');
  });
});

describe('carga del perfil', () => {
  test('sin perfil: formulario vacío salvo el nombre', async () => {
    renderForm();
    await cargado();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana García');
    screen.getAllByRole('radio').forEach((r) => expect(r).not.toBeChecked());
    expect(screen.getByLabelText(/^LinkedIn/)).toHaveValue('');
    expect(botonGuardar()).toHaveTextContent('Guardar mi avatar');
  });

  test('con perfil: formulario relleno para editar', async () => {
    renderForm({ get: { status: 200, body: { nombre: 'Ana García', perfil: PERFIL } } });
    await cargado();
    expect(screen.getByRole('radio', { name: /Abierto a sumar gente/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tecnología' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'IA' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Salud' })).toBeChecked();
    expect(screen.getByLabelText(/^LinkedIn/)).toHaveValue('ana-garcia');
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('Me gusta programar.');
    expect(screen.getByLabelText(/Nombre del grupo/)).toHaveValue('Los del fondo');
    expect(botonGuardar()).toHaveTextContent('Guardar cambios');
  });

  test('si la carga falla por red, deja reintentar', async () => {
    let intentos = 0;
    renderForm({
      get: () => (++intentos === 1 ? Promise.reject(new TypeError('Failed to fetch')) : respuesta(200, { nombre: 'Ana', perfil: null })),
    });
    userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await cargado();
    expect(intentos).toBe(2);
  });
});

describe('campos', () => {
  test('el nombre del grupo solo aparece si tienes grupo o estás abierto', async () => {
    renderForm();
    await cargado();
    expect(screen.queryByLabelText(/Nombre del grupo/)).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: /Tengo grupo/ }));
    expect(screen.getByLabelText(/Nombre del grupo/)).toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: /Abierto a sumar gente/ }));
    expect(screen.getByLabelText(/Nombre del grupo/)).toBeInTheDocument();
    userEvent.click(screen.getByRole('radio', { name: /Busco grupo/ }));
    expect(screen.queryByLabelText(/Nombre del grupo/)).not.toBeInTheDocument();
  });

  test('como mucho 3 intereses: contador y el resto deshabilitados', async () => {
    renderForm();
    await cargado();
    expect(screen.getByText('0/3')).toBeInTheDocument();
    userEvent.click(screen.getByRole('checkbox', { name: 'IA' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'Salud' }));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Fintech' })).toBeEnabled();
    userEvent.click(screen.getByRole('checkbox', { name: 'Fintech' }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Deporte' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'IA' })).toBeEnabled();
    userEvent.click(screen.getByRole('checkbox', { name: 'IA' }));
    expect(screen.getByRole('checkbox', { name: 'Deporte' })).toBeEnabled();
  });

  test('la descripción tiene contador y tope de 280', async () => {
    renderForm();
    await cargado();
    const desc = screen.getByLabelText(/Sobre ti/);
    expect(desc).toHaveAttribute('maxLength', '280');
    userEvent.type(desc, 'Hola');
    expect(screen.getByText('4/280')).toBeInTheDocument();
  });

  test('el email no se muestra', async () => {
    renderForm({ get: { status: 200, body: { nombre: 'Ana', email: 'ana@uc3m.es', perfil: null } } });
    await cargado();
    expect(screen.queryByText(/ana@uc3m\.es/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});

describe('LinkedIn', () => {
  test('al pegar la URL entera se queda solo el usuario', async () => {
    renderForm();
    await cargado();
    const input = screen.getByLabelText(/^LinkedIn/);
    userEvent.paste(input, 'https://www.linkedin.com/in/ana-garcia/?trk=public_profile');
    expect(input).toHaveValue('ana-garcia');
  });

  test('una URL sin barra final se recorta al salir del campo', async () => {
    renderForm();
    await cargado();
    const input = screen.getByLabelText(/^LinkedIn/);
    userEvent.type(input, 'es.linkedin.com/in/ana-garcia');
    userEvent.tab();
    expect(input).toHaveValue('ana-garcia');
    expect(screen.queryByText('Eso no parece un perfil de LinkedIn')).not.toBeInTheDocument();
  });

  test('un perfil inválido avisa y no deja guardar', async () => {
    renderForm();
    await cargado();
    rellenarMinimo();
    const input = screen.getByLabelText(/^LinkedIn/);
    userEvent.type(input, 'ana garcia');
    userEvent.tab();
    expect(screen.getByText('Eso no parece un perfil de LinkedIn')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');

    userEvent.click(botonGuardar());
    expect(llamadasPut()).toHaveLength(0);
    expect(input).toHaveFocus();
  });
});

describe('guardar', () => {
  test('sin estado, rol ni consentimiento no envía y marca los errores', async () => {
    renderForm();
    await cargado();
    userEvent.click(botonGuardar());
    expect(screen.getByText('Elige cómo vienes al Camp')).toBeInTheDocument();
    expect(screen.getByText('Elige tu rol principal')).toBeInTheDocument();
    expect(screen.getByText('Necesitamos tu permiso para enseñar tu avatar')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Busco grupo/ })).toHaveFocus();
    expect(llamadasPut()).toHaveLength(0);
  });

  test('envía el contrato: Bearer, solo el usuario de LinkedIn y la versión del consentimiento', async () => {
    renderForm();
    await cargado();
    userEvent.click(screen.getByRole('radio', { name: /Tengo grupo/ }));
    userEvent.type(screen.getByLabelText(/Nombre del grupo/), 'Pixel Club');
    userEvent.click(screen.getByRole('radio', { name: 'Diseño' }));
    userEvent.click(screen.getByRole('checkbox', { name: 'Educación' }));
    userEvent.paste(screen.getByLabelText(/^LinkedIn/), 'https://es.linkedin.com/in/ana-garcia/');
    userEvent.type(screen.getByLabelText(/Sobre ti/), 'Diseño producto.');
    userEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }));
    userEvent.click(botonGuardar());

    await screen.findByText(/Guardado/);
    const [[url, init]] = llamadasPut();
    expect(url).toBe('/api/startcamp/perfil');
    expect(init.headers.Authorization).toBe('Bearer abc123');
    expect(JSON.parse(init.body)).toEqual({
      nombre: 'Ana García',
      estado_grupo: 'tengo',
      rol: 'diseno',
      intereses: ['educacion'],
      linkedin: 'ana-garcia',
      descripcion: 'Diseño producto.',
      nombre_grupo: 'Pixel Club',
      consentimiento_version: CONSENTIMIENTO_VERSION,
    });
  });

  test('mientras guarda: "Guardando…", botón deshabilitado y sin doble envío', async () => {
    let terminar;
    renderForm({ put: () => new Promise((r) => (terminar = () => r({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) }))) });
    await cargado();
    rellenarMinimo();
    userEvent.click(botonGuardar());

    const boton = await screen.findByRole('button', { name: 'Guardando…' });
    expect(boton).toBeDisabled();
    userEvent.click(boton);
    expect(llamadasPut()).toHaveLength(1);

    terminar();
    expect(await screen.findByText(/Guardado/)).toBeInTheDocument();
    expect(botonGuardar()).toHaveTextContent('Guardar cambios');
    expect(botonGuardar()).toBeEnabled();
  });

  test.each([
    ['sin red', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['error 500', () => respuesta(500, { error: 'SERVER_ERROR' })],
  ])('%s: avisa y conserva lo escrito', async (_, put) => {
    renderForm({ put });
    await cargado();
    rellenarMinimo();
    userEvent.type(screen.getByLabelText(/Sobre ti/), 'No lo pierdas');
    userEvent.click(botonGuardar());

    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJE_RED);
    expect(screen.getByLabelText(/Sobre ti/)).toHaveValue('No lo pierdas');
    expect(screen.getByRole('radio', { name: 'Negocio' })).toBeChecked();
    expect(screen.queryByText(/Guardado/)).not.toBeInTheDocument();
  });

  test('un INVALID_<CAMPO> del back se marca en ese campo', async () => {
    renderForm({ put: { status: 400, body: { error: 'INVALID_LINKEDIN' } } });
    await cargado();
    rellenarMinimo();
    userEvent.type(screen.getByLabelText(/^LinkedIn/), 'ana-garcia');
    userEvent.click(botonGuardar());
    expect(await screen.findByText('Eso no parece un perfil de LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText(/^LinkedIn/)).toHaveAttribute('aria-invalid', 'true');
  });
});

test('la vista previa se actualiza en vivo', async () => {
  renderForm();
  await cargado();
  const preview = screen.getByRole('complementary', { name: 'Así te verán los demás' });
  expect(within(preview).getByText('Ana García')).toBeInTheDocument();

  userEvent.clear(screen.getByLabelText('Nombre'));
  userEvent.type(screen.getByLabelText('Nombre'), 'Ana G.');
  userEvent.click(screen.getByRole('radio', { name: 'Tecnología' }));
  userEvent.click(screen.getByRole('checkbox', { name: 'IA' }));
  userEvent.type(screen.getByLabelText(/Sobre ti/), 'Backend y datos');
  userEvent.type(screen.getByLabelText(/^LinkedIn/), 'ana-g');

  expect(within(preview).getByText('Ana G.')).toBeInTheDocument();
  expect(within(preview).getByText('Tecnología')).toBeInTheDocument();
  expect(within(preview).getByText('IA')).toBeInTheDocument();
  expect(within(preview).getByText('Backend y datos')).toBeInTheDocument();
  expect(within(preview).getByRole('link')).toHaveAttribute('href', 'https://www.linkedin.com/in/ana-g');
});

describe('mock de demo', () => {
  test('?t=demo funciona sin back: crear y guardar', async () => {
    irA('/eventos/start-camp/avatar?t=demo');
    renderForm();
    expect(await screen.findByLabelText('Nombre', {}, { timeout: 2000 })).toHaveValue('Alex Demo');
    rellenarMinimo();
    userEvent.click(botonGuardar());
    expect(await screen.findByText(/Guardado/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('?t=demo-error simula un fallo de red al guardar', async () => {
    irA('/eventos/start-camp/avatar?t=demo-error');
    renderForm();
    await screen.findByLabelText('Nombre', {}, { timeout: 2000 });
    userEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }));
    userEvent.click(botonGuardar());
    expect(await screen.findByRole('alert', {}, { timeout: 2000 })).toHaveTextContent(MENSAJE_RED);
  });

  test('?t=demo-invalido lleva a enlace no válido', async () => {
    irA('/eventos/start-camp/avatar?t=demo-invalido');
    const { onEnlaceInvalido } = renderForm();
    await waitFor(() => expect(onEnlaceInvalido).toHaveBeenCalled(), { timeout: 2000 });
  });
});
