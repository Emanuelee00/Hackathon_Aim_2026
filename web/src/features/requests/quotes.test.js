import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote, prepareQuote, quoteDefaults, quoteIsCurrent } from './quotes.js';
import { validateRequest } from './workflow.js';

const event = { requestType: 'rental', title: 'Séminaire', organizer: 'Association', space: 'atelier', date: '2026-11-01', start: '09:00', end: '10:30', participants: 3, rentalUse: 'Réunion', equipmentNeeds: 'Tables', budgetDetails: 'Budget confirmé', approval: { authority: 'coordinator', reviewer: 'Camille', note: 'Accord', date: '2026-09-24' } };
const draft = { rate: 25.55, quantity: 1, extraLabel: 'Accueil', extraAmount: 10.1, terms: 'Prix proposé comprenant accueil et matériel.' };

test('calculates fractional hours and extras in cents, and per-seat quantities', () => {
  assert.equal(calculateQuote(event, draft).total, 48.43);
  assert.equal(calculateQuote(event, { ...draft, mode: 'fixed', rate: 80 }).total, 90.1);
  assert.equal(calculateQuote({ ...event, space: 'coworking' }, { ...draft, rate: 10, quantity: 3 }).total, 55.1);
  assert.throws(() => calculateQuote(event, { ...draft, rate: '' }));
  assert.throws(() => calculateQuote(event, { ...draft, rate: -1 }));
  assert.throws(() => calculateQuote(event, { ...draft, extraLabel: '' }));
  assert.throws(() => calculateQuote({ ...event, space: 'coworking' }, { ...draft, quantity: 1.5 }));
  assert.equal(quoteDefaults({ ...event, space: 'coworking' }).rate, '');
  assert.equal(quoteDefaults(event).rate, 25);
});

test('blocks approval until the current quote is accepted; changed request needs a new quote', () => {
  const quote = prepareQuote(event, draft);
  assert.match(validateRequest({ ...event, quote }, true), /devis/);
  const accepted = { ...event, quote: { ...quote, status: 'accepted', acceptedBy: 'Organisateur' } };
  assert.equal(validateRequest(accepted, true), '');
  assert.equal(quoteIsCurrent({ ...accepted, start: '08:00' }), false);
  assert.match(validateRequest({ ...accepted, equipmentNeeds: 'Sono' }, true), /devis/);
  assert.equal(quoteDefaults({ ...accepted, space: 'coworking' }).rate, '');
  const revised = prepareQuote(accepted, draft);
  assert.equal(revised.version, 2);
  assert.equal(revised.status, 'prepared');
  assert.equal(revised.acceptedBy, '');
});
