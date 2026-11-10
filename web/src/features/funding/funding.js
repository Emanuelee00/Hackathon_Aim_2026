// Funding tracker: the funders imported from the team's Excel file, then edited here.
export const fundingStatuses = {
  qualify: { label: 'À qualifier', mark: '?' },
  check: { label: 'À vérifier', mark: '?' },
  todo: { label: 'À traiter', mark: '●' },
  priority: { label: 'Prioritaire', mark: '★' },
  submitted: { label: 'Déposé', mark: '✉' },
  validated: { label: 'Presque validé', mark: '✓' },
  closed: { label: 'Clôturé', mark: '—' },
  ineligible: { label: 'Pas éligible', mark: '—' },
};
export const closedStatuses = ['closed', 'ineligible'];
// Soft fills for a row or a column; the same keys and colours as funding/cells.py.
export const rowColors = {
  rose: { label: 'Rose', value: '#fde2e7' }, lilas: { label: 'Lilas', value: '#ece3f5' }, sable: { label: 'Sable', value: '#fbf3c9' },
  menthe: { label: 'Menthe', value: '#dcf2e6' }, ciel: { label: 'Ciel', value: '#dbeaf7' }, gris: { label: 'Gris', value: '#ececec' },
};
// The columns of the Excel "Retroplanning" sheet, with their original headings,
// in the card's order: who the funder is and how to reach them come first.
export const funderFields = [
  ['name', 'Nom de la structure'], ['type', 'Type'], ['contact', 'Nom, prénom du contact'], ['email', 'Mail'], ['phone', 'Téléphone'], ['notes', 'Informations'],
  ['amount', 'Nature de l’aide / montant'], ['deadlineNote', 'Échéances'], ['purpose', 'Objet, pertinence pour Chez Marthe'],
  ['documents', 'Documents à envoyer'], ['links', 'Liens utiles'], ['history', 'Historique d’accès à l’info'],
  ['firstContact', 'Premier contact effectué'], ['potential', 'Potentialité (texte d’origine)'], ['progress', 'État d’avancement de la candidature'],
];

// Once a funding is obtained, a reminder is sent to the team to ask the funder again: a year later, a month early (11 months, editable).
export const DEFAULT_FOLLOWUP_MONTHS = 11;
export const followupMonths = funder => (Number.isInteger(funder.followupMonths) && funder.followupMonths > 0 ? funder.followupMonths : DEFAULT_FOLLOWUP_MONTHS);

// The same day `months` later, or the last day of a shorter month (31 January + 1 month = 28 February).
export function addMonths(day, months) {
  const [year, month, date] = day.split('-').map(Number);
  const index = month - 1 + months;
  const target = [year + Math.floor(index / 12), index % 12];
  const last = new Date(Date.UTC(target[0], target[1] + 1, 0)).getUTCDate();
  return `${target[0]}-${String(target[1] + 1).padStart(2, '0')}-${String(Math.min(date, last)).padStart(2, '0')}`;
}

export const followupDate = funder => (funder.obtainedOn ? addMonths(funder.obtainedOn, followupMonths(funder)) : '');

export const emptyFunder = () => ({ ...Object.fromEntries(funderFields.map(([key]) => [key, ''])), id: crypto.randomUUID(), status: 'qualify', deadline: '', owner: '', color: '', obtainedOn: '', followupMonths: DEFAULT_FOLLOWUP_MONTHS, tasks: [] });

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000);

export function nextTask(funder) {
  return funder.tasks.filter(task => !task.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0];
}

export function overdueTasks(funders, today) {
  return funders.flatMap(funder => funder.tasks.filter(task => !task.done && task.due && task.due < today).map(task => ({ funder, task }))).sort((a, b) => a.task.due.localeCompare(b.task.due));
}

// The closest deadline in the next two weeks of a funder whose file is not sent yet.
export function urgentDeadline(funders, today, days = 14) {
  return funders.filter(funder => ['qualify', 'check', 'todo', 'priority'].includes(funder.status) && funder.deadline >= today && daysBetween(today, funder.deadline) <= days)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
}
