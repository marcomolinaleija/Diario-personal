const DEFAULT_TIME_ZONE = 'America/Monterrey';

export function toLocalInputDateTime(date = new Date(), timeZone = process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? '00' : values.hour;

  return `${values.year}-${values.month}-${values.day}T${hour}:${values.minute}`;
}

export function todayForInput(date = new Date()) {
  return toLocalInputDateTime(date).slice(0, 10);
}

export function timeForInput(date = new Date()) {
  return toLocalInputDateTime(date).slice(11, 16);
}
