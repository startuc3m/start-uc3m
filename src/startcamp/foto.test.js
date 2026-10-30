import { vi } from 'vitest';
import { ErrorFoto, MENSAJES_FOTO, procesarFoto, recorteCentrado, validarArchivoFoto } from './foto';

const MB = 1024 * 1024;
const archivo = (type, size = 1000, name = 'foto') => ({ type, size, name });

/**
 * Canvas falso (jsdom no tiene canvas). Apunta lo que se dibuja y "codifica"
 * solo a partir de lo dibujado, como uno de verdad: el Blob de salida no ve
 * nunca los bytes del archivo original. `tamanos[tipo]` da el peso por calidad;
 * `sinWebp` imita a un navegador que no sabe hacer WebP (devuelve PNG).
 */
function lienzoFalso({ tamanos = {}, sinWebp = false } = {}) {
  const dibujos = [];
  const codificados = [];
  const ctx = {
    fillRect: vi.fn(),
    drawImage: vi.fn((...args) => dibujos.push(args.slice(1))),
  };
  const lienzo = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob(ok, tipo, calidad) {
      codificados.push([tipo, calidad]);
      const real = sinWebp && tipo === 'image/webp' ? 'image/png' : tipo;
      const peso = tamanos[real]?.[calidad] ?? 40 * 1024;
      const cabecera = real === 'image/jpeg' ? 'JFIF' : 'RIFFWEBP';
      ok(new Blob([cabecera, new Uint8Array(peso - cabecera.length)], { type: real }));
    },
  };
  const crearLienzo = vi.fn((lado) => Object.assign(lienzo, { width: lado, height: lado }));
  return { lienzo, ctx, dibujos, codificados, crearLienzo };
}

const imagen = (width, height) => ({ width, height, close: vi.fn() });

async function bytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

function contiene(datos, texto) {
  const aguja = new TextEncoder().encode(texto);
  for (let i = 0; i <= datos.length - aguja.length; i++) {
    if (aguja.every((b, j) => datos[i + j] === b)) return true;
  }
  return false;
}

/** JPEG mínimo con un bloque EXIF (APP1) que lleva coordenadas GPS. */
function jpegConGps() {
  const exif = new TextEncoder().encode('Exif\0\0MM\0*GPSLatitude 40.3326 N GPSLongitude 3.7652 W Pixel 8');
  const app1 = [0xff, 0xe1, (exif.length + 2) >> 8, (exif.length + 2) & 0xff, ...exif];
  return new File([new Uint8Array([0xff, 0xd8, ...app1, 0xff, 0xd9])], 'IMG_2026.jpg', { type: 'image/jpeg' });
}

describe('validarArchivoFoto', () => {
  test.each(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])('acepta %s', (tipo) => {
    expect(validarArchivoFoto(archivo(tipo))).toBeNull();
  });

  test('HEIC sin tipo (algunos navegadores) se reconoce por la extensión', () => {
    expect(validarArchivoFoto(archivo('', 1000, 'IMG_0001.HEIC'))).toBeNull();
  });

  test.each(['image/gif', 'image/svg+xml', 'application/pdf', 'video/mp4', ''])('rechaza el tipo «%s»', (tipo) => {
    expect(validarArchivoFoto(archivo(tipo, 1000, 'cosa'))).toBe('tipo');
  });

  test('máximo 5 MB de entrada', () => {
    expect(validarArchivoFoto(archivo('image/jpeg', 5 * MB))).toBeNull();
    expect(validarArchivoFoto(archivo('image/jpeg', 5 * MB + 1))).toBe('tamano');
  });

  test('los mensajes son claros', () => {
    expect(MENSAJES_FOTO.tipo).toBe('Elige una imagen JPG, PNG, WebP o HEIC.');
    expect(MENSAJES_FOTO.tamano).toMatch(/5 MB/);
  });
});

describe('recorteCentrado', () => {
  test('apaisada, vertical y cuadrada', () => {
    expect(recorteCentrado(1200, 800)).toEqual({ sx: 200, sy: 0, lado: 800 });
    expect(recorteCentrado(600, 900)).toEqual({ sx: 0, sy: 150, lado: 600 });
    expect(recorteCentrado(500, 500)).toEqual({ sx: 0, sy: 0, lado: 500 });
  });
});

describe('procesarFoto', () => {
  const foto = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

  test('recorte cuadrado centrado a 400x400 y WebP', async () => {
    const c = lienzoFalso();
    const img = imagen(1200, 800);
    const blob = await procesarFoto(foto, { decodificar: async () => img, crearLienzo: c.crearLienzo });
    expect(c.crearLienzo).toHaveBeenCalledWith(400);
    expect(c.dibujos).toEqual([[200, 0, 800, 800, 0, 0, 400, 400]]);
    expect(c.ctx.drawImage.mock.calls[0][0]).toBe(img);
    expect(blob.type).toBe('image/webp');
    expect(blob.size).toBeLessThan(150 * 1024);
    expect(img.close).toHaveBeenCalled();
  });

  test('baja la calidad hasta quedar por debajo de 150 KB', async () => {
    const c = lienzoFalso({ tamanos: { 'image/webp': { 0.85: 300 * 1024, 0.75: 180 * 1024, 0.65: 120 * 1024 } } });
    const blob = await procesarFoto(foto, { decodificar: async () => imagen(400, 400), crearLienzo: c.crearLienzo });
    expect(c.codificados).toEqual([
      ['image/webp', 0.85],
      ['image/webp', 0.75],
      ['image/webp', 0.65],
    ]);
    expect(blob.size).toBe(120 * 1024);
  });

  test('si nunca baja del objetivo, se queda con la más ligera', async () => {
    const pesos = { 0.85: 400 * 1024, 0.75: 300 * 1024, 0.65: 250 * 1024, 0.5: 200 * 1024 };
    const c = lienzoFalso({ tamanos: { 'image/webp': pesos } });
    const blob = await procesarFoto(foto, { decodificar: async () => imagen(400, 400), crearLienzo: c.crearLienzo });
    expect(blob.size).toBe(200 * 1024);
  });

  test('sin WebP en el navegador, JPEG', async () => {
    const c = lienzoFalso({ sinWebp: true });
    const blob = await procesarFoto(foto, { decodificar: async () => imagen(800, 600), crearLienzo: c.crearLienzo });
    expect(blob.type).toBe('image/jpeg');
    expect(c.codificados.map(([t]) => t)).toEqual(['image/webp', 'image/jpeg']);
  });

  test('tipo o tamaño que no valen: error claro sin abrir la imagen', async () => {
    const decodificar = vi.fn();
    await expect(procesarFoto(new File(['x'], 'a.gif', { type: 'image/gif' }), { decodificar })).rejects.toMatchObject({
      motivo: 'tipo',
      message: MENSAJES_FOTO.tipo,
    });
    const grande = new File([new Uint8Array(5 * MB + 1)], 'grande.jpg', { type: 'image/jpeg' });
    await expect(procesarFoto(grande, { decodificar })).rejects.toBeInstanceOf(ErrorFoto);
    await expect(procesarFoto(grande, { decodificar })).rejects.toMatchObject({ motivo: 'tamano' });
    expect(decodificar).not.toHaveBeenCalled();
  });

  test('si el navegador no sabe abrirla (p. ej. HEIC fuera de Safari): ErrorFoto lectura', async () => {
    const heic = new File(['x'], 'IMG.heic', { type: 'image/heic' });
    const decodificar = async () => {
      throw new DOMException('The source image cannot be decoded', 'EncodingError');
    };
    await expect(procesarFoto(heic, { decodificar, crearLienzo: lienzoFalso().crearLienzo })).rejects.toMatchObject({
      motivo: 'lectura',
    });
  });

  describe('privacidad: no se sube nada del archivo original', () => {
    test('los metadatos EXIF con la ubicación GPS no llegan al archivo nuevo', async () => {
      const original = jpegConGps();
      expect(contiene(await bytes(original), 'GPSLatitude')).toBe(true);

      const c = lienzoFalso();
      const blob = await procesarFoto(original, { decodificar: async () => imagen(3000, 4000), crearLienzo: c.crearLienzo });
      const salida = await bytes(blob);
      expect(contiene(salida, 'Exif')).toBe(false);
      expect(contiene(salida, 'GPS')).toBe(false);
      expect(contiene(salida, 'Pixel 8')).toBe(false);
    });

    test('aunque ya sea un WebP 400x400 ligero, se vuelve a codificar (nunca se sube el original)', async () => {
      const original = new File(['RIFFWEBP', 'EXIF', 'GPSLatitude'], 'ya-lista.webp', { type: 'image/webp' });
      const c = lienzoFalso();
      const blob = await procesarFoto(original, { decodificar: async () => imagen(400, 400), crearLienzo: c.crearLienzo });
      expect(blob).not.toBe(original);
      expect(c.codificados.length).toBeGreaterThan(0);
      expect(contiene(await bytes(blob), 'GPS')).toBe(false);
    });
  });
});
