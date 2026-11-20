export function reportableEvents(events, today) {
  return events.filter(event => event.status === 'confirmed' && event.date <= today).sort((a, b) => a.date.localeCompare(b.date));
}

export function completedEvents(events) {
  return events.filter(event => event.status === 'completed' && event.report).sort((a, b) => b.date.localeCompare(a.date));
}

export const margin = report => report.revenue - report.costs;
