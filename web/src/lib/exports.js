import { spaceById, statuses } from '../data/spaces.js';
import { dateLabel, money } from './format.js';

export function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportEvent(event) {
  const lines = ['MARTHE — FICHE ÉVÉNEMENT', 'Données de démonstration · Document de travail', '', event.title, `Organisateur : ${event.organizer}`, `Contact : ${event.email || 'Non renseigné'}`, `Date : ${dateLabel(event.date)} · ${event.start}–${event.end}`, `Espace : ${spaceById[event.space].name}`, `Statut : ${statuses[event.status]}`, `Personnes prévues : ${event.participants}`, `Recettes prévues : ${money(event.revenue)} · Coûts prévus : ${money(event.costs)}`, '', 'Proposition de participation volontaire', event.opportunity || 'À définir avec l’équipe.'];
  if (event.report) lines.push('', 'BILAN SAISI', `Présences : ${event.report.attendance}, dont résidentes : ${event.report.residents}`, `Recettes : ${money(event.report.revenue)} · Coûts : ${money(event.report.costs)}`, event.report.feedback, event.report.outcomes);
  download(`marthe-${event.id}.txt`, lines.join('\n'));
}

export function exportReports(events) {
  const rows = [['Événement', 'Date', 'Présences', 'Présences résidentes', 'Recettes EUR', 'Coûts EUR', 'Résultats observés']];
  events.filter(event => event.status === 'completed' && event.report).forEach(event => rows.push([event.title, event.date, event.report.attendance, event.report.residents, event.report.revenue, event.report.costs, event.report.outcomes]));
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(';')).join('\r\n');
  download('marthe-bilans-demo.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
}
