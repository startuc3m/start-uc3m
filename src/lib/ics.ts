// Desfase (minutos) entre Europe/Madrid y UTC para un instante dado, cubriendo el cambio de horario CET/CEST.
function madridOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as Record<string, string>);
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour === 24 ? 0 : +parts.hour, +parts.minute, +parts.second);
  return (asUTC - instant.getTime()) / 60000;
}

// Convierte fecha + hora local de Madrid (del frontmatter) al instante UTC real, cubriendo el cambio de horario.
export function eventStartDate(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const naiveUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h || 0, m || 0);
  return new Date(naiveUTC - madridOffsetMinutes(new Date(naiveUTC)) * 60000);
}

// Genera un archivo .ics (RFC 5545) para el botón "Añadir al calendario" de la ficha de evento.
export function eventToIcs(event: {
  title: string;
  description: string;
  location: string;
  date: Date;
  time: string;
  durationHours?: number;
}): string {
  const start = eventStartDate(event.date, event.time);
  const end = new Date(start.getTime() + (event.durationHours ?? 3) * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Start UC3M//Eventos//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@startuc3m.org`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(event.description)}`,
    `LOCATION:${esc(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function icsDataHref(ics: string): string {
  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}
