const pad = value => String(value).padStart(2, '0');
const toIso = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function addMonths(month, amount) {
  const [year, index] = month.split('-').map(Number);
  const date = new Date(year, index - 1 + amount, 1, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthLabel(month) {
  const [year, index] = month.split('-').map(Number);
  return new Date(year, index - 1, 1, 12).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function calendarDays(month, today) {
  const [year, index] = month.split('-').map(Number);
  const first = new Date(year, index - 1, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, index - 1, 1 - mondayOffset, 12);
  return Array.from({ length: 42 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const value = toIso(date);
    return { date: value, day: date.getDate(), current: date.getMonth() === index - 1, today: value === today };
  });
}
