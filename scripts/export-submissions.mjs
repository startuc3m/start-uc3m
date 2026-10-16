// Exporta data/submissions.json a data/submissions.csv (no hay panel /admin todavía, ver docs/decisions.md).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const jsonFile = fileURLToPath(new URL('../data/submissions.json', import.meta.url));
const csvFile = fileURLToPath(new URL('../data/submissions.csv', import.meta.url));

const list = await readFile(jsonFile, 'utf8').then(JSON.parse).catch(() => []);
if (list.length === 0) {
  console.log('No hay envíos en data/submissions.json.');
  process.exit(0);
}

const dataKeys = [...new Set(list.flatMap((s) => Object.keys(s.data ?? {})))];
const columns = ['id', 'form', 'at', ...dataKeys];

const escape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows = list.map((s) => columns.map((c) => escape(c in s ? s[c] : s.data?.[c])).join(','));
const csv = [columns.join(','), ...rows].join('\n') + '\n';

await writeFile(csvFile, csv);
console.log(`Exportados ${list.length} envíos a data/submissions.csv`);
