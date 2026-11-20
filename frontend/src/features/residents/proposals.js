const OPEN_VIGILANCE = 'Places limitées : l’équipe vous confirmera votre inscription.';

// Upcoming events open to everyone stay visible until the resident decides.
export function openActivities(available, mine, residentId) {
  const pending = mine.filter(match => match.status === 'proposed' && match.source === 'open');
  // Suggestions the team has not sent yet are internal: they never block an application.
  const visible = mine.filter(match => !['suggested', 'dismissed'].includes(match.status));
  const untouched = available.filter(event => !visible.some(match => match.eventId === event.id));
  return [...pending, ...untouched.map(event => ({ id: `${event.id}-${residentId}`, eventId: event.id, source: 'open', isNew: true, rationale: event.description, benefit: event.opportunity, vigilance: OPEN_VIGILANCE }))];
}

export function groupProposals(mine, available, residentId) {
  const proposed = mine.filter(match => match.status === 'proposed');
  const applications = mine.filter(match => ['applied', 'not_selected'].includes(match.status));
  return { fromTeam: proposed.filter(match => !['cv', 'open'].includes(match.source)), fromCv: proposed.filter(match => match.source === 'cv'), open: openActivities(available, mine, residentId), applications };
}

export const cvMatches = items => items.map(item => ({ eventId: item.event_id, source: 'cv', status: 'proposed', reasons: (item.reasons || []).map(text => ({ kind: 'cv', text })), rationale: item.rationale, benefit: item.benefit, vigilance: item.vigilance }));
