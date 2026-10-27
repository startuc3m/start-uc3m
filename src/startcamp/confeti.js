// Confeti al crear el perfil del Start Camp. Para quitarlo, borrar este
// archivo y su llamada en AvatarForm.jsx.
//
// canvas-confetti se carga solo al lanzarlo, para no pesar en la carga de la
// página. Si no carga o falla, no pasa nada: el guardado ya ha terminado.

// Brand kit (src/styles/global.css): cobalt, lavender, cyan, accent, lime.
export const COLORES_CONFETI = ['#333399', '#b6b8e7', '#8ee1e6', '#f5e443', '#d6ff4f'];

// Por debajo del mensaje de «Guardado» (z-40 en AvatarForm.jsx) y de la
// cabecera (z-50), por encima del resto de la página.
export const Z_CONFETI = 30;

const BASE = {
  colors: COLORES_CONFETI,
  particleCount: 70,
  spread: 50,
  startVelocity: 60,
  gravity: 1.2,
  ticks: 110, // unos 1,8 s a 60 fps
  zIndex: Z_CONFETI,
  disableForReducedMotion: true,
};

function prefiereMenosMovimiento() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/** Una ráfaga corta desde las dos esquinas de abajo. Nunca lanza errores. */
export async function lanzarConfeti() {
  // Con movimiento reducido ni se descarga la librería.
  if (prefiereMenosMovimiento()) return;
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({ ...BASE, angle: 60, origin: { x: 0, y: 1 } });
    confetti({ ...BASE, angle: 120, origin: { x: 1, y: 1 } });
  } catch {
    // Sin confeti, sin más.
  }
}
