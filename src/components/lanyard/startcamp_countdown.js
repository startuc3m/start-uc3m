// Horario de Notion: viernes 6/11 a las 18:00 – domingo 8/11 a las 20:00 (viernes confirmado por Álvaro).
export const STARTCAMP_START = Date.parse('2026-11-06T18:00:00+01:00')
export const STARTCAMP_END = Date.parse('2026-11-08T20:00:00+01:00')

// [días, horas, minutos, segundos] hasta `target` (ms); todo a 0 cuando ya ha llegado.
export function countdownTo(target, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((target - now) / 1000))
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
}

export const getStartcampCountdown = (now = Date.now()) => countdownTo(STARTCAMP_START, now)

// "3d 04h 12m" y " 09s" por separado: en móvil los segundos no caben.
export const pad = (n) => String(n).padStart(2, '0')
export const formatClock = ([d, h, m]) => `${d}d ${pad(h)}h ${pad(m)}m`

// Avisos del Camp que se cierran durante la sesión. En modo privado sessionStorage falla y vuelven al recargar.
export function isDismissed(key) {
  try { return sessionStorage.getItem(key) === '1' } catch { return false }
}

export function dismiss(key) {
  try { sessionStorage.setItem(key, '1') } catch {}
}
