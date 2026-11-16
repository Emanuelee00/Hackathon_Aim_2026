import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRentalSpaces } from '../landing/rentalSpaces.js';
import { blankForm, fromForm, move, toForm } from './rentalCards.js';

test('the six cards of the site are there, and go to the form and back unchanged', () => {
  assert.deepEqual(defaultRentalSpaces.map(card => card.id), ['chapelle', 'salon-collectif', 'reunion', 'atelier', 'coworking', 'cantines']);
  for (const card of defaultRentalSpaces) {
    const { card: back } = fromForm(toForm(card), defaultRentalSpaces.filter(other => other.id !== card.id));
    assert.deepEqual(back.details, card.details);
    assert.deepEqual(back.prices, card.prices || []);
    assert.equal(back.link?.url, card.link?.url);
    assert.equal(back.space, card.link ? '' : card.space || '');
  }
});

test('a new card: lines and prices written as text, a free id, clear errors', () => {
  const form = { ...blankForm(), name: 'Le Jardin', details: 'Jusqu’à 150 personnes\n\n Plein air ', prices: '2 heures : 40 €\nJournée : 200 €', button: 'form', space: 'jardin' };
  const { card } = fromForm(form, defaultRentalSpaces);
  assert.equal(card.id, 'le-jardin');
  assert.deepEqual(card.details, ['Jusqu’à 150 personnes', 'Plein air']);
  assert.deepEqual(card.prices, [['2 heures', '40 €'], ['Journée', '200 €']]);
  assert.equal(card.space, 'jardin');
  assert.equal(fromForm(form, [card]).card.id, 'le-jardin-2');
  assert.match(fromForm({ ...form, name: ' ' }, []).error, /nom/);
  assert.match(fromForm({ ...form, prices: 'Journée' }, []).error, /tarif/);
  assert.match(fromForm({ ...form, button: 'link', linkUrl: 'www.site.fr' }, []).error, /https/);
  assert.match(fromForm({ ...form, space: '' }, []).error, /formulaire/);
  assert.equal(fromForm({ ...form, button: 'contact' }, []).card.space, '');
});

test('cards move up and down, and stay in place at the ends', () => {
  const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(move(cards, 1, -1).map(card => card.id), ['b', 'a', 'c']);
  assert.deepEqual(move(cards, 2, 1), cards);
});
