// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildProperties, createNotionMember, createNotionMentoria } from './notion.mjs';

const pago = {
  full_name: 'Ana García',
  email: 'ana@uc3m.es',
  phone: '+34666123456',
  price_cents: 1500,
  paid_at: '2026-11-20T10:00:00Z',
  stripe_payment_intent: 'pi_123',
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NOTION_API_KEY;
  delete process.env.NOTION_SOCIOS_DATABASE_ID;
  delete process.env.NOTION_MENTORIAS_DATABASE_ID;
});

describe('Notion de mentorías', () => {
  it('rellena las columnas por tipo y palabra clave, como socios', async () => {
    const { mentoriaFieldSpecs } = await import('./notion.mjs');
    const schema = { Nombre: 'title', Correo: 'email', Teléfono: 'phone_number', 'Importe (€)': 'number', 'Fecha de pago': 'date', 'Stripe payment intent': 'rich_text' };
    const { properties, omitidas } = buildProperties(pago, schema, mentoriaFieldSpecs(pago));
    expect(properties.Nombre.title[0].text.content).toBe('Ana García');
    expect(properties.Correo.email).toBe('ana@uc3m.es');
    expect(properties['Teléfono'].phone_number).toBe('+34666123456');
    expect(properties['Importe (€)'].number).toBe(15);
    expect(properties['Stripe payment intent'].rich_text[0].text.content).toBe('pi_123');
    expect(omitidas).toEqual([]);
  });

  it('sin NOTION_MENTORIAS_DATABASE_ID no hace nada (y no llama a Notion)', async () => {
    process.env.NOTION_API_KEY = 'secret_x';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const r = await createNotionMentoria(pago);
    expect(r).toMatchObject({ ok: false, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('escribe en la base de mentorías, no en la de socios', async () => {
    process.env.NOTION_API_KEY = 'secret_x';
    process.env.NOTION_SOCIOS_DATABASE_ID = 'db_socios';
    process.env.NOTION_MENTORIAS_DATABASE_ID = 'db_mentorias';
    const fetchMock = vi.fn(async (url, opts) => {
      if (opts.method === 'GET') {
        return { ok: true, json: async () => ({ properties: { Nombre: { type: 'title' }, Email: { type: 'email' } } }) };
      }
      return { ok: true, json: async () => ({ id: 'page_1' }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const r = await createNotionMentoria(pago);
    expect(r.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain('/databases/db_mentorias');
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.parent.database_id).toBe('db_mentorias');
  });

  it('socios sigue rellenando sus columnas igual que antes', () => {
    const socio = { ...pago, member_number: 7, plan: 'standard', tier: 2, price_cents: 1200 };
    const schema = { Socio: 'title', 'Nº socio': 'number', Importe: 'number', Email: 'email', Modalidad: 'select', Tramo: 'select', 'Fecha de pago': 'date', 'Stripe payment intent': 'rich_text', 'ID socio': 'rich_text' };
    const { properties, omitidas } = buildProperties(socio, schema);
    expect(properties['Nº socio'].number).toBe(7);
    expect(properties.Importe.number).toBe(12);
    expect(properties.Modalidad.select.name).toBe('Estándar');
    expect(properties.Tramo.select.name).toBe('Tramo 2');
    expect(properties['ID socio'].rich_text[0].text.content).toBe('0007');
    expect(omitidas).toEqual(['telefono (ninguna columna phone_number encaja)']);
  });

  it('createNotionMember sigue sin hacer nada si falta su configuración', async () => {
    const r = await createNotionMember(pago);
    expect(r).toMatchObject({ ok: false, skipped: true });
  });
});
