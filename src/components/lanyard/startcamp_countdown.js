// Horario oficial en Neonpass: 7/11/2026 9:00 – 8/11/2026 20:00.
export const STARTCAMP_START = Date.parse('2026-11-07T09:00:00+01:00')
export const STARTCAMP_END = Date.parse('2026-11-08T20:00:00+01:00')

export function getStartcampCountdown(now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((STARTCAMP_START - now) / 1000))
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
}
