import { spaceById } from '../../shared/data/spaces.js';
import { estimatePrice, requestAlerts, technicalNeeds } from '../../shared/lib/requestRules.js';

export const verdicts = { ok: 'Aligné avec la charte', warn: 'À discuter', no: 'Hors charte' };

function overlapping(event, events) {
  return events.filter(other => other.id !== event.id && ['pending', 'confirmed'].includes(other.status) && other.space === event.space && other.date === event.date && other.start < event.end && other.end > event.start);
}

function fitCriterion(event) {
  if (event.requestType === 'programming') return { level: 'ok', label: 'Cohérence avec le projet du lieu', detail: 'Activité ouverte au public, étudiée par le comité.' };
  if (event.privatisation) return { level: 'warn', label: 'Cohérence avec le projet du lieu', detail: 'Événement privé : vérifier son lien avec le projet du lieu.' };
  if (event.openToResidents) return { level: 'ok', label: 'Cohérence avec le projet du lieu', detail: 'Location avec des places offertes aux résidentes.' };
  return { level: 'warn', label: 'Cohérence avec le projet du lieu', detail: 'Location commerciale, utile au modèle économique.' };
}

function slotCriterion(event, events) {
  const others = overlapping(event, events);
  if (!others.length) return { level: 'ok', label: 'Créneau', detail: 'Aucune autre réservation sur ce créneau.' };
  const confirmed = others.some(other => other.status === 'confirmed');
  return { level: confirmed ? 'no' : 'warn', label: 'Créneau', detail: `${confirmed ? 'Déjà réservé' : 'Aussi demandé'} : ${others.map(other => other.title).join(', ')}.` };
}

// Scripted pre-analysis: the committee and the charter stay sovereign.
export function preAnalysis(event, events) {
  const space = spaceById[event.space];
  const alerts = requestAlerts(event);
  const worst = topic => alerts.find(alert => alert.topic === topic && alert.level === 'no') || alerts.find(alert => alert.topic === topic);
  const residents = worst('residents');
  const capacity = worst('capacity');
  const technical = worst('technical');
  const needs = (event.technical || []).map(need => technicalNeeds[need]);
  const criteria = [
    fitCriterion(event),
    { label: 'Vie des résidentes', ...(residents ? { level: residents.level, detail: residents.text } : { level: 'ok', detail: 'Compatible avec le calme et l’intimité du lieu.' }) },
    { label: 'Jauge', ...(capacity ? { level: 'no', detail: capacity.text } : space?.capacity == null ? { level: 'warn', detail: 'Jauge de l’espace à préciser.' } : { level: 'ok', detail: `${event.participants} personnes pour ${space.capacity} possibles.` }) },
    { label: 'Technique', ...(technical ? { level: technical.level, detail: technical.text } : { level: 'ok', detail: needs.length ? `${needs.join(', ')} demandé(s).` : 'Aucun besoin particulier.' }) },
    slotCriterion(event, events),
  ];
  const blocking = criteria.slice(0, 2).some(criterion => criterion.level === 'no');
  const verdict = blocking ? 'no' : criteria.some(criterion => criterion.level !== 'ok') ? 'warn' : 'ok';
  return { verdict, criteria, price: estimatePrice(event) };
}
