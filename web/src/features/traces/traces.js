import { duration } from '../../shared/lib/format.js';
import { commitments } from '../volunteers/volunteering.js';

// No points, no ranking: each trace grows like a plant, from what really happened here.
const STAGES = [[1, 'Une graine semée'], [3, 'Ça pousse'], [5, 'En bourgeon'], [10, 'En fleur'], [25, 'Un arbre, déjà']];

export function stageOf(count) {
  const reached = STAGES.filter(([step]) => count >= step);
  const next = STAGES.find(([step]) => count < step);
  return { stage: reached.at(-1)?.[1] || '', next: next?.[0] || null };
}

const trace = (id, count, one, many) => ({ id, count, label: count > 1 ? many : one, ...stageOf(count) });

export function volunteerTraces(events, name, today) {
  const lived = [...new Set(commitments(events, name).filter(({ event }) => event.date < today && ['confirmed', 'completed'].includes(event.status)).map(({ event }) => event))];
  return [
    trace('moments', lived.length, 'coup de main donné', 'coups de main donnés'),
    trace('hours', Math.round(lived.reduce((sum, event) => sum + duration(event), 0)), 'heure offerte', 'heures offertes'),
    trace('faces', lived.reduce((sum, event) => sum + (event.participants || 0), 0), 'visage croisé', 'visages croisés'),
    trace('places', new Set(lived.map(event => event.space)).size, 'recoin du lieu habité', 'recoins du lieu habités'),
  ].filter(item => item.count > 0);
}

export function residentTraces(matches, eventById, residentId) {
  const lived = matches.filter(match => match.resident_id === residentId && match.status === 'accepted' && match.journey?.participation === 'participated' && eventById[match.eventId]);
  const count = field => lived.filter(match => match.journey[field]?.trim()).length;
  return [
    trace('moments', lived.length, 'moment vécu ensemble', 'moments vécus ensemble'),
    trace('contacts', count('contact'), 'rencontre qui compte', 'rencontres qui comptent'),
    trace('skills', count('skills'), 'savoir-faire révélé', 'savoir-faire révélés'),
    trace('steps', lived.filter(match => match.journey.nextStep && match.journey.nextStep !== 'none').length, 'pas en avant', 'pas en avant'),
    trace('faces', lived.reduce((sum, match) => sum + (eventById[match.eventId].participants || 0), 0), 'visage croisé', 'visages croisés'),
  ].filter(item => item.count > 0);
}

export const laughTrace = laughs => trace('laughs', laughs.length, 'rire partagé', 'rires partagés');
