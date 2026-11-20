// Volunteer roles live on each event: volunteerNeeds [{ id, role, needed }] and volunteers [{ id, needId, name }].
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function missions(events, today) {
  return events.filter(event => ['pending', 'confirmed'].includes(event.status) && event.date >= today && event.volunteerNeeds?.length).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

export const signedUp = (event, needId) => (event.volunteers || []).filter(volunteer => volunteer.needId === needId);

export function toggleSignup(event, needId, name) {
  const volunteers = event.volunteers || [];
  const mine = volunteers.find(volunteer => volunteer.needId === needId && same(volunteer.name, name));
  if (mine) return { ...event, volunteers: volunteers.filter(volunteer => volunteer !== mine) };
  const need = event.volunteerNeeds.find(item => item.id === needId);
  if (signedUp(event, needId).length >= need.needed) throw new Error('Ce rôle est déjà complet.');
  return { ...event, volunteers: [...volunteers, { id: crypto.randomUUID(), needId, name: name.trim() }] };
}

export function commitments(events, name) {
  if (!name.trim()) return [];
  return events.flatMap(event => (event.volunteers || []).filter(volunteer => same(volunteer.name, name)).map(volunteer => ({ event, need: event.volunteerNeeds.find(need => need.id === volunteer.needId) }))).filter(item => item.need);
}
