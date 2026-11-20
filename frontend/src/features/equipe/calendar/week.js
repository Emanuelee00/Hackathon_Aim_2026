// Week view by space: events plus the recurring slots of synced associations, with overlaps flagged.
const addDays = (day, amount) => {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toLocaleDateString('en-CA');
};
const isoWeekday = day => new Date(`${day}T12:00:00`).getDay() || 7;

export const mondayOf = day => addDays(day, 1 - isoWeekday(day));
export const shiftWeek = (monday, amount) => addDays(monday, amount * 7);
export const weekDays = monday => Array.from({ length: 7 }, (_, index) => addDays(monday, index));

export function slotsOn(associations, day) {
  return associations.flatMap(association => association.slots.filter(slot => slot.weekdays.includes(isoWeekday(day))).map(slot => ({ id: `${slot.id}-${day}`, slotId: slot.id, title: slot.title, start: slot.start, end: slot.end, space: slot.space, date: day, kind: 'asso' })));
}

export function entriesFor(space, day, events, slots) {
  const booked = events.filter(event => event.space === space && event.date === day && ['pending', 'confirmed', 'completed'].includes(event.status)).map(event => ({ ...event, kind: event.status === 'pending' ? 'pending' : event.requestType || 'confirmed' }));
  const all = [...booked, ...slots.filter(slot => slot.space === space && slot.date === day)].sort((a, b) => a.start.localeCompare(b.start));
  return all.map(entry => ({ ...entry, conflict: all.some(other => other !== entry && other.start < entry.end && other.end > entry.start) }));
}

// A slot that overlaps an event on the same weekday, in the weeks to come.
export function slotConflicts(association, events, from, weeks = 4) {
  const days = Array.from({ length: weeks * 7 }, (_, index) => addDays(from, index));
  return days.flatMap(day => slotsOn([association], day).flatMap(slot => events.filter(event => ['pending', 'confirmed'].includes(event.status) && event.space === slot.space && event.date === day && event.start < slot.end && event.end > slot.start).map(event => ({ slot, event }))));
}
