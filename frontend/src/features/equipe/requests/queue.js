export const priorities = { high: 'Haute', normal: 'Normale', low: 'Basse' };
export const queueStatuses = ['pending', 'incomplete', 'waitlisted'];

export function queueUpdate(event, status, priority, reason) {
  if (!queueStatuses.includes(status) || !priorities[priority] || !reason.trim()) throw new Error('Choisissez un état, une priorité et expliquez les critères ou informations manquantes.');
  const recordedAt = new Date().toISOString();
  return { ...event, status, priority, queueReason: reason.trim(), reviewStage: null, approval: null,
    waitlistedAt: status === 'waitlisted' ? event.waitlistedAt || recordedAt : null,
    queueHistory: [...(event.queueHistory || []), { status, priority, reason: reason.trim(), recordedAt }] };
}

export function compareRequests(a, b) {
  const order = { high: 0, normal: 1, low: 2 };
  return (order[a.priority || 'normal'] - order[b.priority || 'normal']) || (a.waitlistedAt || '').localeCompare(b.waitlistedAt || '') || a.date.localeCompare(b.date);
}
