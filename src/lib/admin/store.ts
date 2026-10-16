// Store del CMS en el navegador: semilla (build) + cambios en localStorage.
// window.cms se expone para que cada pantalla del panel lo use con JS inline.
type Item = { id: string; [k: string]: any };
const KEY = (c: string) => `cms:${c}`;
const seed: Record<string, any> = JSON.parse(document.getElementById('cms-seed')?.textContent || '{}');

function read(c: string): any { try { const v = localStorage.getItem(KEY(c)); return v ? JSON.parse(v) : structuredClone(seed[c]); } catch { return structuredClone(seed[c]); } }
function write(c: string, v: any) { try { localStorage.setItem(KEY(c), JSON.stringify(v)); } catch {} window.dispatchEvent(new CustomEvent('cms:change', { detail: { collection: c } })); }
const uid = () => Math.random().toString(36).slice(2, 9);

export const cms = {
  list: (c: string): Item[] => (read(c) as Item[]) ?? [],
  get: (c: string, id: string): Item | undefined => (read(c) as Item[])?.find((i) => i.id === id),
  save(c: string, item: Item) { const l = cms.list(c); const i = l.findIndex((x) => x.id === item.id); if (i >= 0) l[i] = { ...l[i], ...item }; else l.unshift({ ...item, id: item.id || uid() }); write(c, l); return item; },
  remove(c: string, id: string) { write(c, cms.list(c).filter((x) => x.id !== id)); },
  reorder(c: string, ids: string[]) { const l = cms.list(c); write(c, ids.map((id) => l.find((x) => x.id === id)!).filter(Boolean)); },
  getObject: (c: string): Record<string, any> => read(c) ?? {},
  setObject(c: string, v: Record<string, any>) { write(c, v); },
  reset(c?: string) { if (c) localStorage.removeItem(KEY(c)); else Object.keys(localStorage).filter((k) => k.startsWith('cms:')).forEach((k) => localStorage.removeItem(k)); location.reload(); },
  uid,
  toast(msg: string, kind: 'ok' | 'err' = 'ok') {
    const t = document.createElement('div');
    t.className = `adm-toast ${kind === 'err' ? 'adm-toast-err' : ''}`; t.textContent = msg;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
  },
  // sesión de demo
  isLogged: () => { try { return sessionStorage.getItem('cms:session') === '1'; } catch { return false; } },
  login: () => { try { sessionStorage.setItem('cms:session', '1'); } catch {} },
  logout: () => { try { sessionStorage.removeItem('cms:session'); } catch {} location.href = base() + '/admin'; },
  fmtDate: (s: string) => new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  q: (sel: string) => document.querySelector(sel) as HTMLElement | null,
  esc: (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!),
};
const base = () => (document.documentElement.dataset.base || '');
(window as any).cms = cms;
declare global { interface Window { cms: typeof cms } }
