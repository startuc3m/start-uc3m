export const STARTCAMP_START = Date.parse('2026-11-07T10:00:00+01:00')

export function getStartcampCountdown(now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((STARTCAMP_START - now) / 1000))
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
}
