import { env } from '../config/env.js';

export function baseViewData(reply, data = {}) {
  return {
    appName: env.appName,
    currentPath: reply.request.url,
    csrfToken: reply.ensureCsrfToken(),
    ...data
  };
}

export function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date, time) {
  const formattedDate = formatDate(date);
  if (!time) return formattedDate;
  return `${formattedDate} ${time}`;
}

export function formatWritingRange(start, end) {
  if (!start || !end) return '';
  return `Escrito de ${formatInputDateTime(start)} a ${formatInputDateTime(end)}`;
}

export function excerpt(value, maxLength = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function formatInputDateTime(value) {
  const [date, time] = String(value || '').split('T');
  if (!date || !time) return value;
  return `${formatDate(date)} ${time.slice(0, 5)}`;
}
