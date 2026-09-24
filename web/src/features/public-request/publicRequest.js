import { durations, estimatePrice, technicalNeeds } from '../../shared/lib/requestRules.js';

export const requestKinds = {
  programming: ['Proposer une activité', 'Ouverte au public, gratuite ou à prix libre'],
  rental: ['Louer un espace', 'Cours, atelier, réunion'],
  privatisation: ['Privatiser', 'Événement privé'],
  coworking: ['Coworker', 'Réserver une place'],
};
export const emptyForm = { kind: 'programming', title: '', space: '', date: '', duration: '2h', start: '18:00', participants: 15, description: '', technical: [], openToResidents: true, organizer: '', email: '' };

function endTime(start, hours) {
  const [h, m] = start.split(':').map(Number);
  const minutes = Math.min(h * 60 + m + hours * 60, 23 * 60 + 59);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// The single desk: every public request becomes a pending request in the team's queue.
export function buildRequest(form, now = new Date()) {
  const rental = form.kind !== 'programming';
  const needs = form.technical.map(need => technicalNeeds[need]).join(', ') || 'Aucun';
  const draft = { requestType: rental ? 'rental' : 'programming', privatisation: form.kind === 'privatisation', space: form.kind === 'coworking' ? 'coworking' : form.space, duration: form.duration, start: form.start, end: endTime(form.start, durations[form.duration][1]), participants: Number(form.participants) || 0, technical: form.technical, openToResidents: form.openToResidents };
  return {
    ...draft, id: `request-${now.getTime()}`, title: form.title.trim(), category: requestKinds[form.kind][0], organizer: form.organizer.trim(), email: form.email.trim(), referent: '', referentTeam: '', date: form.date,
    description: form.description.trim(), opportunity: form.openToResidents ? 'Activité ouverte gratuitement aux femmes hébergées.' : '',
    audience: '', missionFit: '', supportNeeds: '', rentalUse: rental ? form.description.trim() : '', equipmentNeeds: needs, budgetDetails: rental ? `Estimation en ligne : ${estimatePrice(draft).label}` : '',
    revenue: estimatePrice(draft).amount || 0, costs: 0, tasks: [], report: null, status: 'pending', source: 'Formulaire en ligne', submittedAt: now.toISOString(),
  };
}

export function formErrors(form, today) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Donnez un nom à votre activité.';
  if (form.kind !== 'coworking' && !form.space) errors.space = 'Choisissez un espace.';
  if (!form.date) errors.date = 'Indiquez une date.';
  else if (form.date < today) errors.date = 'Choisissez une date à venir.';
  if (!(Number(form.participants) >= 1)) errors.participants = 'Indiquez un nombre de personnes.';
  if (!form.description.trim()) errors.description = 'Décrivez votre projet en quelques lignes.';
  if (!form.organizer.trim()) errors.organizer = 'Indiquez votre nom ou votre structure.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = 'Indiquez une adresse e-mail valide.';
  return errors;
}
