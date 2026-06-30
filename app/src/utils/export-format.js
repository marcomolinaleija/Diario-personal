import JSZip from 'jszip';
import { formatDateTime, formatWritingRange } from './view-data.js';

export function entriesToMarkdown(entries, title = 'Diario Personal') {
  const lines = [`# ${title}`, ''];
  const isSingleEntryExport = entries.length === 1 && entries[0].title === title;

  entries.forEach((entry) => {
    if (!isSingleEntryExport) {
      lines.push(`## ${entry.title}`);
      lines.push('');
    }

    lines.push(`Fecha: ${formatDateTime(entry.entry_date, entry.entry_time)}`);

    if (entry.tags) {
      lines.push(`Etiquetas: ${entry.tags}`);
    }

    const writingRange = formatWritingRange(entry.writing_started_at, entry.writing_ended_at);
    if (writingRange) {
      lines.push(writingRange);
    }

    lines.push('');
    lines.push(entry.body.trim());
    lines.push('');

    if (!isSingleEntryExport) {
      lines.push('---');
      lines.push('');
    }
  });

  return `${lines.join('\n').trim()}\n`;
}

export function entriesToJson(entries, title = 'Diario Personal') {
  return JSON.stringify({
    title,
    exportedAt: new Date().toISOString(),
    entries: entries.map(toExportEntry)
  }, null, 2);
}

export async function entriesToZip(entries, title = 'Diario Personal') {
  const zip = new JSZip();

  zip.file('README.md', [
    `# ${title}`,
    '',
    `Exportado: ${new Date().toISOString()}`,
    `Entradas: ${entries.length}`,
    '',
    'Estructura:',
    '',
    '- `YYYY/MM/DD/*.md`: entradas individuales en Markdown.',
    '- `diario.md`: todo el contenido en un solo Markdown.',
    '- `diario.json`: respaldo estructurado.',
    ''
  ].join('\n'));

  zip.file('diario.md', entriesToMarkdown(entries, title));
  zip.file('diario.json', entriesToJson(entries, title));

  entries.forEach((entry) => {
    const [year, month, day] = entry.entry_date.split('-');
    const timePrefix = entry.entry_time ? entry.entry_time.replace(':', '') : 'sin-hora';
    const filename = `${timePrefix}-${entry.id}-${safeFilename(entry.title)}.md`;
    const path = `${year}/${month}/${day}/${filename}`;

    zip.file(path, entriesToMarkdown([entry], entry.title));
  });

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });
}

export function zipFilenameForEntry(entry) {
  return `${entry.entry_date}-${safeFilename(entry.title)}.zip`;
}

export function safeFilename(value) {
  return String(value || 'diario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .toLowerCase()
    .slice(0, 120) || 'diario';
}

function toExportEntry(entry) {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    tags: entry.tags,
    entryDate: entry.entry_date,
    entryTime: entry.entry_time,
    writingStartedAt: entry.writing_started_at,
    writingEndedAt: entry.writing_ended_at,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at
  };
}
