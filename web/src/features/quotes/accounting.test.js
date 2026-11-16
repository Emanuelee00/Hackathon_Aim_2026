import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDoc, describe, docTotals, invoiceFromQuote, locked, quoteBlocks, quoteFromEvent, toBody } from './accounting.js';
import { validateRequest } from '../requests/workflow.js';

const event = { id: 'e1', requestType: 'rental', title: 'Séminaire', organizer: 'Association Soleil', email: 'soleil@example.org', space: 'chapelle', date: '2026-12-12', start: '09:00', end: '17:00', rentalUse: 'Réunion', equipmentNeeds: 'Tables', budgetDetails: 'OK', approval: { authority: 'coordinator', reviewer: 'Camille', note: 'Accord', date: '2026-11-16' } };
const lines = [
  { id: 'a', designation: 'La Chapelle — Journée', quantity: '1', unit_price: '350' },
  { id: 'b', designation: 'Sonorisation', quantity: '2', unit_price: '40,50' },
  { id: 'c', designation: '', quantity: '1', unit_price: '' },
];

test('a quote starts from the event: client, what, where and when', () => {
  const doc = quoteFromEvent(event, '2026-007', 'La Chapelle', 'samedi 12 décembre 2026, 09:00–17:00');
  assert.equal(doc.number, '2026-007');
  assert.equal(doc.name, 'Association Soleil');
  assert.equal(doc.nature, 'Séminaire — La Chapelle, samedi 12 décembre 2026, 09:00–17:00');
  assert.deepEqual(doc.lines, []);
  assert.match(checkDoc('devis', doc), /prestation/);
  assert.equal(checkDoc('devis', { ...doc, lines }), '');
});

test('totals in cents, deposit only on invoices, empty lines left out of the file', () => {
  const doc = { ...quoteFromEvent(event, '2026-007'), lines, deposit: '100' };
  assert.deepEqual([docTotals('devis', doc).total, docTotals('devis', doc).due], [431, 431]);
  assert.deepEqual([docTotals('facture', doc).deposit, docTotals('facture', doc).due], [100, 331]);
  const body = toBody('facture', doc);
  assert.equal(body.lines.length, 2);
  assert.deepEqual(body.lines[1], { designation: 'Sonorisation', quantity: 2, unit_price: 40.5 });
  assert.equal(body.deposit, 100);
  assert.equal(toBody('devis', doc).deposit, 0);
});

test('the invoice takes the accepted quote, with its own number and today’s date', () => {
  const quote = { ...quoteFromEvent(event, '2026-007'), date: '2026-10-01', lines };
  const invoice = invoiceFromQuote(quote, '2026-003');
  assert.equal(invoice.number, '2026-003');
  assert.notEqual(invoice.date, '2026-10-01');
  assert.equal(invoice.name, quote.name);
  assert.deepEqual(invoice.lines.map(line => line.designation), quote.lines.map(line => line.designation));
  assert.notEqual(invoice.lines[0].id, quote.lines[0].id);
});

test('what can still be changed, and the request waits for the accepted quote', () => {
  const quote = { doc: { ...quoteFromEvent(event, '2026-007'), lines }, status: 'sent', sentTo: 'soleil@example.org', sentAt: '2026-11-16T10:00:00Z' };
  assert.equal(locked('devis', quote), false);
  assert.match(describe('devis', quote), /Devis n° 2026-007 · 431,00\s€ · envoyé à soleil@example.org le 16\/11\/2026/);
  assert.match(validateRequest({ ...event, accounting: { quote } }, true), /devis/);
  const accepted = { ...quote, status: 'accepted', acceptedBy: 'Awa', acceptedAt: '2026-11-17' };
  assert.equal(locked('devis', accepted), true);
  assert.equal(quoteBlocks({ ...event, accounting: { quote: accepted } }), false);
  assert.equal(validateRequest({ ...event, accounting: { quote: accepted } }, true), '');
  assert.equal(validateRequest(event, true), '');
  assert.equal(locked('facture', { status: 'draft' }), false);
  assert.equal(locked('facture', { status: 'sent' }), true);
  assert.equal(locked('facture', { status: 'issued' }), true);
  assert.equal(describe('facture', undefined), 'Pas encore de facture');
});
