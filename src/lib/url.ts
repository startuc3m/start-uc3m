// Prefija rutas de assets con la base (en GitHub Pages la web cuelga de /WebStartUC3M).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const asset = (p?: string) => (p && p.startsWith('/') ? base + p : p ?? '');
