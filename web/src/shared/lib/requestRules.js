import { spaceById } from '../data/spaces.js';
import { duration } from './format.js';

// Simple, readable rules taken from the spaces sheet. They prepare the decision, they never take it.
export const durations = { '2h': ['2 heures', 2], half: ['Une demi-journée', 4], day: ['Une journée', 8], weekly: ['Créneau hebdomadaire d’1 heure', 1] };
export const technicalNeeds = { sound: 'Sonorisation', light: 'Éclairage de la chapelle', video: 'Vidéoprojecteur', breakfast: 'Petit-déjeuner' };
// Hypothesis to be validated with the association: privatising costs 50 % more than renting.
export const PRIVATISATION_RATE = 1.5;

export function durationKeyFor(event) {
  if (durations[event.duration]) return event.duration;
  const hours = duration(event);
  return hours <= 2 ? '2h' : hours <= 4 ? 'half' : 'day';
}

export function estimatePrice(event) {
  const space = spaceById[event.space];
  if (event.requestType === 'programming') return { amount: 0, label: 'Gratuit', note: 'Les activités ouvertes au public sont étudiées par le comité de programmation.' };
  if (!space) return { amount: null, label: '—', note: 'Choisissez un espace pour obtenir une estimation.' };
  if (space.unit === 'place') return { amount: null, label: 'Sur demande', note: 'L’équipe vous recontacte avec les formules disponibles.' };
  const key = durationKeyFor(event);
  const base = space.prices?.[key] ?? (key === '2h' ? space.prices?.half : null) ?? (space.rate != null ? space.rate * durations[key][1] : null);
  if (base == null) return { amount: null, label: 'Sur devis', note: 'Tarif à définir avec l’équipe.' };
  if (event.privatisation) return { amount: Math.round(base * PRIVATISATION_RATE), label: `${Math.round(base * PRIVATISATION_RATE)} €`, note: 'Majoration privatisation, confirmée après étude.' };
  return { amount: base, label: `${base} €`, note: key === 'weekly' ? 'Par séance, pour un créneau régulier.' : 'Tarif indicatif, confirmé après étude.' };
}

// Live warnings shown while a request is being written, and reused by the pre-analysis.
export function requestAlerts(event) {
  const space = spaceById[event.space];
  const needs = event.technical || [];
  const alerts = [];
  if (space?.capacity != null && event.participants > space.capacity) alerts.push({ level: 'no', topic: 'capacity', text: `La jauge indicative de ${space.name.toLowerCase()} est de ${space.capacity} personnes.` });
  if (event.space === 'chapelle' && needs.includes('video')) alerts.push({ level: 'no', topic: 'technical', text: 'L’acoustique de la chapelle ne permet pas les projections. Les Petites Cantines peuvent convenir.' });
  if (event.space === 'salon-collectif' && event.end > '18:00') alerts.push({ level: 'no', topic: 'residents', text: 'Le salon est l’espace de vie des résidentes le soir. Un créneau en journée sera plus simple.' });
  if (event.space === 'jardin') alerts.push({ level: 'warn', topic: 'residents', text: 'Le jardin reste un lieu de passage : il ne peut pas être entièrement fermé au public.' });
  if (event.space === 'jardin' && event.end > '21:00') alerts.push({ level: 'no', topic: 'residents', text: 'Après 21 h, le calme des résidentes est prioritaire au jardin.' });
  if (needs.includes('sound') || needs.includes('light')) alerts.push({ level: 'warn', topic: 'technical', text: 'Une personne formée à la régie devra être présente. L’équipe aide à l’organiser.' });
  return alerts;
}
