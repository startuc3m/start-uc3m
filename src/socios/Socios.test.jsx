import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Socios from './Socios';

function availabilityPayload({ occupied = 0, premiumOpen = true } = {}) {
  const state = (tier) => {
    if (tier === 1) return occupied < 10 ? 'available' : 'sold_out';
    if (tier === 2) {
      if (occupied < 10) return 'coming_soon';
      return occupied < 30 ? 'available' : 'sold_out';
    }
    return occupied < 30 ? 'coming_soon' : 'available';
  };

  return {
    options: [
      { plan: 'standard', tier: 1, priceCents: 799, state: state(1), remaining: Math.max(10 - occupied, 0) },
      { plan: 'standard', tier: 2, priceCents: 899, state: state(2), remaining: Math.max(30 - occupied, 0) },
      { plan: 'standard', tier: 3, priceCents: 999, state: state(3), remaining: null },
      { plan: 'premium', tier: null, priceCents: 2500, state: premiumOpen ? 'invite_only' : 'closed', remaining: null },
    ],
  };
}

function mockFetch({ availability, eligible = false, checkout } = {}) {
  return jest.fn((url, init) => {
    if (String(url).includes('/api/membership/availability')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(availability) });
    }
    if (String(url).includes('/api/membership/premium-eligibility')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ eligible }) });
    }
    if (String(url).includes('/api/membership/checkout')) {
      const body = checkout || { ok: true, payload: { url: 'https://stripe.test/s/1', priceCents: 799 } };
      return Promise.resolve({ ok: body.ok, json: () => Promise.resolve(body.payload) });
    }
    return Promise.reject(new Error('fetch no mockeado: ' + url));
  });
}

function renderSocios() {
  return render(
    <MemoryRouter>
      <Socios />
    </MemoryRouter>
  );
}

/** Devuelve la fila (label) de una modalidad a partir de su precio. */
function optionRow(priceText) {
  return screen.getByText(priceText).closest('label');
}

beforeEach(() => {
  jest.useRealTimers();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('criterio 10 - estados de las modalidades', () => {
  test('sin socios: tramo 1 seleccionable, 2 y 3 proximamente, premium bloqueado', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload({ occupied: 0 }) });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());

    const tramo1 = optionRow('7,99 €');
    expect(within(tramo1).getByRole('radio')).toBeEnabled();
    expect(within(tramo1).getByText('Quedan 10 plazas a este precio')).toBeInTheDocument();

    const tramo2 = optionRow('8,99 €');
    expect(within(tramo2).getByRole('radio')).toBeDisabled();
    expect(within(tramo2).getByText('Cuando se agote el tramo anterior')).toBeInTheDocument();

    const tramo3 = optionRow('9,99 €');
    expect(within(tramo3).getByRole('radio')).toBeDisabled();

    const premium = optionRow('25,00 €');
    expect(within(premium).getByRole('radio')).toBeDisabled();
    expect(within(premium).getByText('Solo por invitación de Start')).toBeInTheDocument();
  });

  test('con 10 socios: tramo 1 agotado con precio tachado, tramo 2 disponible', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload({ occupied: 10 }) });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());

    const tramo1 = optionRow('7,99 €');
    expect(within(tramo1).getByRole('radio')).toBeDisabled();
    expect(within(tramo1).getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByText('7,99 €')).toHaveClass('socios__opcion-precio--tachado');

    const tramo2 = optionRow('8,99 €');
    expect(within(tramo2).getByRole('radio')).toBeEnabled();
    expect(within(tramo2).getByText('Quedan 20 plazas a este precio')).toBeInTheDocument();
  });

  test('el tramo vigente queda preseleccionado', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload({ occupied: 15 }) });
    renderSocios();

    await waitFor(() => expect(screen.getByText('8,99 €')).toBeInTheDocument());
    expect(within(optionRow('8,99 €')).getByRole('radio')).toBeChecked();
  });

  test('con premium cerrado la opcion no es seleccionable', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload({ premiumOpen: false }) });
    renderSocios();

    await waitFor(() => expect(screen.getByText('25,00 €')).toBeInTheDocument());
    const premium = optionRow('25,00 €');
    expect(within(premium).getByRole('radio')).toBeDisabled();
    expect(within(premium).getByText('No disponible ahora mismo')).toBeInTheDocument();
  });
});

describe('elegibilidad premium', () => {
  test('un email invitado desbloquea la opcion premium', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload(), eligible: true });
    renderSocios();

    await waitFor(() => expect(screen.getByText('25,00 €')).toBeInTheDocument());
    expect(within(optionRow('25,00 €')).getByRole('radio')).toBeDisabled();

    userEvent.type(screen.getByLabelText('Email'), 'vip@uc3m.es');

    await waitFor(
      () => expect(within(optionRow('25,00 €')).getByRole('radio')).toBeEnabled(),
      { timeout: 3000 }
    );
    expect(screen.getByText('Tienes invitación para la modalidad premium.')).toBeInTheDocument();
  });

  test('un email no invitado deja el premium bloqueado', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload(), eligible: false });
    renderSocios();

    await waitFor(() => expect(screen.getByText('25,00 €')).toBeInTheDocument());
    userEvent.type(screen.getByLabelText('Email'), 'cualquiera@gmail.com');

    await waitFor(() => expect(screen.getByText('Te enviaremos aquí tu número de socio.')).toBeInTheDocument());
    expect(within(optionRow('25,00 €')).getByRole('radio')).toBeDisabled();
  });

  test('no se consulta la elegibilidad con un email incompleto', async () => {
    const fetchMock = mockFetch({ availability: availabilityPayload() });
    global.fetch = fetchMock;
    renderSocios();

    await waitFor(() => expect(screen.getByText('25,00 €')).toBeInTheDocument());
    userEvent.type(screen.getByLabelText('Email'), 'aun-no');

    const llamadas = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes('premium-eligibility')
    );
    expect(llamadas).toHaveLength(0);
  });
});

describe('envio del formulario', () => {
  function rellenar() {
    userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana García');
    userEvent.type(screen.getByLabelText('Email'), 'ana@uc3m.es');
    userEvent.type(screen.getByLabelText('Teléfono'), '666123456');
    userEvent.click(screen.getByRole('checkbox'));
  }

  test('el boton exige nombre, email, telefono y privacidad', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload() });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());
    const boton = screen.getByRole('button', { name: 'Pagar y hacerme socio' });
    expect(boton).toBeDisabled();

    userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana García');
    userEvent.type(screen.getByLabelText('Email'), 'ana@uc3m.es');
    expect(boton).toBeDisabled();

    userEvent.click(screen.getByRole('checkbox'));
    expect(boton).toBeDisabled();

    userEvent.type(screen.getByLabelText('Teléfono'), '666123456');
    expect(boton).toBeEnabled();
  });

  test('un telefono demasiado corto no deja pagar', async () => {
    global.fetch = mockFetch({ availability: availabilityPayload() });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());
    userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana García');
    userEvent.type(screen.getByLabelText('Email'), 'ana@uc3m.es');
    userEvent.click(screen.getByRole('checkbox'));
    userEvent.type(screen.getByLabelText('Teléfono'), '66612');

    expect(screen.getByRole('button', { name: 'Pagar y hacerme socio' })).toBeDisabled();
  });

  test('un email que ya es socio muestra el error en castellano', async () => {
    global.fetch = mockFetch({
      availability: availabilityPayload(),
      checkout: { ok: false, payload: { error: 'ALREADY_MEMBER' } },
    });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());
    rellenar();
    userEvent.click(screen.getByRole('button', { name: 'Pagar y hacerme socio' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este email ya está dado de alta como socio de Start.'
      )
    );
  });

  test('si el tramo cambio, avisa antes de redirigir en vez de cobrar de mas en silencio', async () => {
    global.fetch = mockFetch({
      availability: availabilityPayload(),
      // El servidor devuelve 8,99 aunque el formulario mostraba 7,99.
      checkout: { ok: true, payload: { url: 'https://stripe.test/s/2', priceCents: 899 } },
    });
    renderSocios();

    await waitFor(() => expect(screen.getByText('7,99 €')).toBeInTheDocument());
    rellenar();
    userEvent.click(screen.getByRole('button', { name: 'Pagar y hacerme socio' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/se agotó el tramo que habías visto/)
    );
    expect(screen.getByRole('alert')).toHaveTextContent('8,99 €');
    expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeInTheDocument();
  });
});
