import test from 'node:test';
import assert from 'node:assert/strict';
import { availableVisitSlots, bookVisit, cancelVisit, recordVisitOutcome, validateVisitSlot } from './visits.js';

const now = new Date('2026-09-24T08:00:00').getTime();
const slot = { id: 'visit', site: 'marseille', date: '2026-09-25', start: '09:00', end: '09:30', guide: 'Camille', booking: null };
const event = { id: 'event', organizer: 'Association', space: 'atelier', date: '2026-09-26', start: '10:00' };

test('validates future slots and prevents overlapping availability for one guide', () => {
  assert.equal(validateVisitSlot(slot, [], now), '');
  assert.notEqual(validateVisitSlot({ ...slot, end: '08:30' }, [], now), '');
  assert.notEqual(validateVisitSlot({ ...slot, date: '2026-09-23' }, [], now), '');
  assert.match(validateVisitSlot({ ...slot, id: 'other', start: '09:15', guide: ' camille ' }, [slot], now), /déjà/);
  assert.equal(validateVisitSlot({ ...slot, id: 'other', start: '09:30', end: '10:00' }, [slot], now), '');
});

test('books only available same-site slots before the event and prevents double booking', () => {
  const slots = [slot, { ...slot, id: 'nice', site: 'nice' }, { ...slot, id: 'late', date: '2026-10-01' }];
  assert.deepEqual(availableVisitSlots(slots, event, now).map(item => item.id), ['visit']);
  const booked = bookVisit(slots, 'visit', event, 'Julie', now);
  assert.throws(() => bookVisit(booked, 'visit', { ...event, id: 'other' }, 'Marie', now));
  assert.throws(() => bookVisit(slots, 'nice', event, 'Julie', now));
  assert.throws(() => bookVisit(slots, 'late', event, 'Julie', now));
  const cancelled = cancelVisit(booked, 'visit', 'Report demandé', now);
  assert.equal(availableVisitSlots(cancelled, event, now).length, 1);
  assert.equal(cancelled[0].history[0].visitor, 'Julie');
  assert.equal(booked[0].booking.visitor, 'Julie');
});

test('records attributed outcomes only once the visit starts', () => {
  const booked = bookVisit([slot], 'visit', event, 'Julie', now);
  assert.throws(() => recordVisitOutcome(booked, 'visit', 'suitable', 'Lieu adapté', now));
  const completed = recordVisitOutcome(booked, 'visit', 'changes', 'Prévoir une rampe', new Date('2026-09-25T10:00:00').getTime());
  assert.equal(completed[0].outcome.guide, 'Camille');
  assert.equal(completed[0].outcome.result, 'changes');
  assert.equal(cancelVisit(completed, 'visit', 'Annulation', now)[0].outcome.result, 'changes');
});
