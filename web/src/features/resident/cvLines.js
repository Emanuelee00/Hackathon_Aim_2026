import demoPlan from './demoPlan.json';
import { loadJobPlan } from './jobPlan.js';
import { dateLabel } from '../../shared/lib/format.js';

export function currentObjective(residentId) {
  return loadJobPlan(residentId)?.objective || (residentId === 'marie' ? demoPlan.objective : '');
}

export async function requestCvLines(objective, skills) {
  const body = { objective, skills: skills.map(({ skill, event }) => ({ skill, event: event.title, date: dateLabel(event.date, { day: 'numeric', month: 'long', year: 'numeric' }) })) };
  const response = await fetch('/api/cv-lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Le service n’a pas répondu. Réessayez dans un instant.');
  return data;
}
