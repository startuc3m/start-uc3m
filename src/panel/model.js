export const PERSONALITY_GROUPS = [
  { name: 'Analistas', codes: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { name: 'Diplomáticos', codes: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { name: 'Centinelas', codes: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { name: 'Exploradores', codes: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];
export const PERSONALITIES = PERSONALITY_GROUPS.flatMap(g => g.codes);
export const TEST_URL = 'https://www.16personalities.com/es/test-de-personalidad';
export const normalizeEmail = value => String(value ?? '').trim().toLowerCase();
export const validEmail = value => value.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value);
export const canManage = member => member?.active === true && (member.position === 'junta' || member.manage_users === true);
export const canPublish = member => member?.active === true && ['junta', 'responsable'].includes(member.position);

/** No side effects. Ambiguous lines stay visible for correction, never silently discarded. */
export function parseInvitations(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 20480) throw new Error('La lista supera 20 KB. Divídela en varios lotes.');
  const rows = [];
  const seen = new Set();
  function add(raw, name = '', candidate = raw) {
    const email = normalizeEmail(candidate);
    const error = !validEmail(email) ? 'Correo inválido o línea ambigua' : seen.has(email) ? 'Duplicado en la lista' : name.length > 120 ? 'Nombre demasiado largo' : '';
    if (!error) seen.add(email);
    rows.push({ raw, name: name.trim(), email, error });
  }
  for (const line of text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
    const angle = line.match(/^([^<>]*)<([^<>]+)>$/);
    if (angle) { add(line, angle[1].trim(), angle[2]); continue; }
    const parts = line.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.slice(0, -1).every(s => !s.includes('@')) && validEmail(normalizeEmail(parts.at(-1)))) {
      add(line, parts.slice(0, -1).join(', ').replace(/^"|"$/g, ''), parts.at(-1));
    } else if (parts.every(s => validEmail(normalizeEmail(s)))) {
      parts.forEach(s => add(s));
    } else add(line);
  }
  if (rows.length > 100) throw new Error('Máximo 100 personas por lote.');
  return rows;
}

function bounded(value, max, label, required = false) {
  if (typeof value !== 'string') throw new Error(`${label}: valor inválido.`);
  const result = value.trim();
  if (result.length > max || (required && !result)) throw new Error(`${label}: revisa este campo.`);
  return result;
}
export function validateProfile(input) {
  const name = bounded(input.name, 120, 'Nombre', true);
  const career = bounded(input.career, 160, 'Carrera', true);
  const course = bounded(input.course, 50, 'Curso', true);
  const linkedin = bounded(input.linkedin ?? '', 300, 'LinkedIn');
  if (linkedin) {
    let url; try { url = new URL(linkedin); } catch { throw new Error('LinkedIn: URL inválida.'); }
    if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname) || url.username || url.password) throw new Error('Usa una URL https de LinkedIn.');
  }
  const personality = input.personality || null;
  if (personality && !PERSONALITIES.includes(personality)) throw new Error('Selecciona una de las 16 etiquetas.');
  return { name, career, course, linkedin, personality };
}
export function validateClassification(input, departments = []) {
  const kind = input.kind;
  const position = input.position ?? 'miembro';
  const department = bounded(input.department ?? '', 80, 'Departamento') || null;
  if (!['socio', 'starter'].includes(kind) || !['miembro', 'responsable', 'junta'].includes(position)) throw new Error('Tipo o cargo inválido.');
  if (kind === 'socio' && (department || position !== 'miembro' || input.manage_users)) throw new Error('Los permisos de equipo requieren tipo Starter.');
  if (kind === 'starter' && !departments.some(d => d.id === department)) throw new Error('Selecciona un departamento válido.');
  if (input.manage_users && department !== 'IT' && position !== 'junta') throw new Error('La gestión de usuarios corresponde a Junta o IT autorizado.');
  return { kind, department, position, manage_users: input.manage_users === true };
}
