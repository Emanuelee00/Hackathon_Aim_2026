import { spaceById } from '../../shared/data/spaces.js';

export function validateVisitSlot(slot, slots, now = Date.now()) {
  const start = new Date(`${slot.date}T${slot.start}`).getTime();
  const end = new Date(`${slot.date}T${slot.end}`).getTime();
  if (!slot.guide?.trim() || !slot.site || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < now) return 'Indiquez un référent et un créneau futur dont la fin suit le début.';
  if (slots.some(other => !other.closed && other.id !== slot.id && other.date === slot.date && other.guide.trim().toLowerCase() === slot.guide.trim().toLowerCase() && other.start < slot.end && other.end > slot.start)) return 'Ce référent dispose déjà d’un créneau sur cette plage horaire.';
  return '';
}

export function availableVisitSlots(slots, event, now = Date.now()) {
  return slots.filter(slot => !slot.closed && !slot.booking && slot.site === spaceById[event.space]?.site && new Date(`${slot.date}T${slot.start}`).getTime() >= now && new Date(`${slot.date}T${slot.end}`) <= new Date(`${event.date}T${event.start}`)).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

export function bookVisit(slots, slotId, event, visitor, now = Date.now()) {
  if (!visitor.trim()) throw new Error('Indiquez la personne qui viendra visiter le lieu.');
  if (!availableVisitSlots(slots, event, now).some(slot => slot.id === slotId)) throw new Error('Ce créneau n’est plus disponible ou ne précède pas l’événement.');
  if (slots.some(slot => slot.booking?.eventId === event.id && !slot.outcome)) throw new Error('Annulez la visite déjà réservée avant de choisir un autre créneau.');
  return slots.map(slot => slot.id === slotId ? { ...slot, booking: { eventId: event.id, organizer: event.organizer, visitor: visitor.trim(), reservedAt: new Date(now).toISOString() }, outcome: null } : slot);
}

export function cancelVisit(slots, slotId, reason, now = Date.now()) {
  if (!reason.trim()) throw new Error('Précisez le motif d’annulation.');
  return slots.map(slot => slot.id === slotId && slot.booking && !slot.outcome ? { ...slot, history: [...(slot.history || []), { ...slot.booking, reason: reason.trim(), cancelledAt: new Date(now).toISOString() }], booking: null, outcome: null } : slot);
}

export function recordVisitOutcome(slots, slotId, result, notes, now = Date.now()) {
  const slot = slots.find(item => item.id === slotId);
  if (!slot?.booking || !['suitable', 'changes', 'unsuitable', 'absent'].includes(result) || !notes.trim()) throw new Error('Choisissez un résultat et précisez les suites de la visite.');
  if (new Date(`${slot.date}T${slot.start}`).getTime() > now) throw new Error('La visite n’a pas encore commencé.');
  return slots.map(item => item.id === slotId ? { ...item, outcome: { result, notes: notes.trim(), recordedAt: new Date(now).toISOString(), guide: item.guide } } : item);
}
