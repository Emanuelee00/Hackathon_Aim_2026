import { spaceById } from '../data/spaces.js';
import { duration } from './format.js';

export function conflicts(event, events) {
  return events.filter(other => other.id !== event.id && other.status === 'confirmed' && other.space === event.space && other.date === event.date && other.start < event.end && other.end > event.start);
}

export function validateEvent(event, events, confirming = false) {
  if (!event.title.trim() || !event.organizer.trim()) return 'Ajoutez un titre et un organisateur.';
  if (!event.date || !event.start || !event.end || duration(event) <= 0) return 'La fin doit être après le début, le même jour.';
  if (!spaceById[event.space]) return 'Choisissez un espace.';
  if (!Number.isInteger(event.participants) || event.participants < 1) return 'Indiquez un nombre de personnes valide.';
  if (![event.revenue, event.costs].every(value => Number.isFinite(value) && value >= 0)) return 'Les montants doivent être positifs ou nuls.';
  if (confirming && event.participants > spaceById[event.space].capacity) return 'La capacité de cet espace est dépassée. Modifiez la demande.';
  if (confirming && conflicts(event, events).length) return 'Cet espace est déjà réservé sur ce créneau. Modifiez la demande.';
  return '';
}

export function totals(events) {
  const reports = events.filter(event => event.status === 'completed' && event.report).map(event => event.report);
  return reports.reduce((sum, report) => ({ attendance: sum.attendance + report.attendance, residents: sum.residents + report.residents, revenue: sum.revenue + report.revenue, costs: sum.costs + report.costs, count: sum.count + 1 }), { attendance: 0, residents: 0, revenue: 0, costs: 0, count: 0 });
}

export function validateReport(report) {
  if (![report.attendance, report.residents].every(value => Number.isInteger(value) && value >= 0)) return 'Les présences doivent être des nombres entiers positifs ou nuls.';
  if (report.residents > report.attendance) return 'Les présences de résidentes ne peuvent pas dépasser le total.';
  if (![report.revenue, report.costs].every(value => Number.isFinite(value) && value >= 0)) return 'Vérifiez les recettes et les dépenses.';
  if (!report.feedback.trim()) return 'Ajoutez un retour sur le déroulement de l’événement.';
  return '';
}
