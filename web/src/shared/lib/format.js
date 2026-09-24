export const money = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
export const dateLabel = (date, options = { day: 'numeric', month: 'long' }) => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', options);
export const shortDate = date => dateLabel(date, { day: 'numeric', month: 'short' });
export const duration = event => (Number(event.end.slice(0, 2)) * 60 + Number(event.end.slice(3)) - Number(event.start.slice(0, 2)) * 60 - Number(event.start.slice(3))) / 60;
export const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('');
