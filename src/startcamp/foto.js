// Foto del perfil: comprobar el archivo y prepararlo en el navegador antes de
// subirlo (solo se usa con fotosActivas(), ver api.js).
//
// procesarFoto recorta un cuadrado centrado, lo reduce a 400x400 y lo vuelve a
// codificar como WebP (o JPEG si el navegador no sabe hacer WebP), bajando la
// calidad hasta quedar por debajo de ~150 KB.
//
// Privacidad: la imagen se dibuja en un canvas y se codifica otra vez desde
// los píxeles. El archivo nuevo no lleva nada del original: ni metadatos EXIF,
// ni la ubicación GPS, ni el modelo del móvil. Por eso nunca se sube el
// archivo original, aunque ya sea pequeño y cuadrado (lo comprueba un test).

import { LADO_FOTO, MAX_FOTO_BYTES, OBJETIVO_FOTO_BYTES, TIPOS_FOTO } from './opciones.js';

export const MENSAJES_FOTO = {
  tipo: 'Elige una imagen JPG, PNG, WebP o HEIC.',
  tamano: 'La imagen pesa más de 5 MB. Elige una más ligera.',
  lectura: 'No hemos podido abrir esta imagen. Prueba con una JPG o PNG.',
};

/** Error al preparar la foto. `motivo` es una clave de MENSAJES_FOTO. */
export class ErrorFoto extends Error {
  constructor(motivo) {
    super(MENSAJES_FOTO[motivo]);
    this.motivo = motivo;
  }
}

// Algunos navegadores no dan tipo a las HEIC del iPhone: se mira la extensión.
const EXTENSION_HEIC = /\.(heic|heif)$/i;

// Calidades que se prueban, de mejor a peor, hasta bajar del objetivo.
const CALIDADES = [0.85, 0.75, 0.65, 0.5];

/** Motivo por el que no vale el archivo ('tipo' | 'tamano'), o null si vale. */
export function validarArchivoFoto(archivo) {
  if (!archivo) return 'tipo';
  const tipo = String(archivo.type ?? '').toLowerCase();
  const esImagen = TIPOS_FOTO.includes(tipo) || (!tipo && EXTENSION_HEIC.test(archivo.name ?? ''));
  if (!esImagen) return 'tipo';
  if (archivo.size > MAX_FOTO_BYTES) return 'tamano';
  return null;
}

/** Cuadrado más grande centrado en una imagen de ancho x alto. */
export function recorteCentrado(ancho, alto) {
  const lado = Math.min(ancho, alto);
  return { sx: Math.round((ancho - lado) / 2), sy: Math.round((alto - lado) / 2), lado };
}

/**
 * Abre la imagen. createImageBitmap respeta la orientación EXIF (la foto sale
 * derecha); si no existe o no puede, se prueba con <img>. HEIC solo se abre
 * en los navegadores que lo leen (Safari); en el resto, ErrorFoto('lectura').
 */
async function decodificarImagen(archivo) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    } catch {
      // Sigue con <img>.
    }
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function lienzoNuevo(lado) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lado;
  lienzo.height = lado;
  return lienzo;
}

const codificar = (lienzo, tipo, calidad) => new Promise((ok) => lienzo.toBlob(ok, tipo, calidad));

/**
 * Archivo elegido → Blob listo para subir (cuadrado, `lado` x `lado`, WebP o
 * JPEG, sin metadatos). Lanza ErrorFoto si no vale o no se puede abrir.
 * `decodificar` y `crearLienzo` se pueden cambiar en los tests (jsdom no
 * tiene canvas).
 */
export async function procesarFoto(
  archivo,
  { lado = LADO_FOTO, objetivo = OBJETIVO_FOTO_BYTES, decodificar = decodificarImagen, crearLienzo = lienzoNuevo } = {}
) {
  const motivo = validarArchivoFoto(archivo);
  if (motivo) throw new ErrorFoto(motivo);

  let imagen;
  try {
    imagen = await decodificar(archivo);
  } catch {
    throw new ErrorFoto('lectura');
  }
  const ancho = imagen?.naturalWidth || imagen?.width;
  const alto = imagen?.naturalHeight || imagen?.height;
  if (!ancho || !alto) throw new ErrorFoto('lectura');

  const lienzo = crearLienzo(lado);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new ErrorFoto('lectura');
  const { sx, sy, lado: recorte } = recorteCentrado(ancho, alto);
  ctx.imageSmoothingQuality = 'high';
  // Fondo blanco: un PNG con transparencia no sale negro al pasar a JPEG.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, lado, lado);
  // Solo se copian píxeles: aquí se quedan fuera EXIF y GPS.
  ctx.drawImage(imagen, sx, sy, recorte, recorte, 0, 0, lado, lado);
  imagen.close?.();

  for (const tipo of ['image/webp', 'image/jpeg']) {
    let menor = null;
    for (const calidad of CALIDADES) {
      const blob = await codificar(lienzo, tipo, calidad);
      // Si el navegador no sabe hacer este tipo, devuelve PNG: se prueba el siguiente.
      if (!blob || blob.type !== tipo) break;
      if (blob.size <= objetivo) return blob;
      if (!menor || blob.size < menor.size) menor = blob;
    }
    if (menor) return menor;
  }
  throw new ErrorFoto('lectura');
}
