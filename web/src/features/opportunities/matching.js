export const eligibleResidents = residents => residents.filter(resident => resident.consent);

export const eligibleEvents = events => events.filter(event => ['pending', 'confirmed'].includes(event.status) && event.opportunity?.trim()).sort((a, b) => a.date.localeCompare(b.date));

export function workflowCounts(matches) {
  return matches.reduce((counts, match) => ({ ...counts, [match.status]: (counts[match.status] || 0) + 1 }), { suggested: 0, proposed: 0, accepted: 0, declined: 0, dismissed: 0 });
}
