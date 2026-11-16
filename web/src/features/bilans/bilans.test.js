import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswers, commonTotals, monthLabel, progress, shiftMonth, toAnswers } from './bilans.js';

const common = [
  { title: 'Hébergement', questions: [{ id: 'hebergees', label: 'Dames hébergées', type: 'number' }] },
  { title: 'Indicateurs communs', questions: [{ id: 'dames', label: 'Dames', type: 'number' }, { id: 'dames_observations', label: 'Retours', type: 'text' }] },
  { title: 'Liens entre les structures du lieu', questions: [{ id: 'orientees_vers', label: 'Orientées', type: 'number' }] },
];
const has = { id: 'has', name: 'HAS', sections: common };

test('months go back and forth across the year', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(monthLabel('2026-11'), 'novembre 2026');
});

test('the form keeps numbers as numbers and drops empty boxes', () => {
  assert.deepEqual(toAnswers(has, { hebergees: '28', dames: '2,5', dames_observations: '  ', orientees_vers: '' }), { hebergees: 28, dames: 2.5 });
  assert.match(checkAnswers(has, { dames: '-1' }), /Dames/);
  assert.match(checkAnswers(has, { dames: 'trois' }), /nombre positif/);
  assert.equal(checkAnswers(has, { dames: '3', dames_observations: 'Bien' }), '');
  assert.deepEqual(progress(has, { dames: 3 }), { answered: 1, total: 4 });
});

test('common indicators add up every structure over the months asked', () => {
  const entries = [
    { structure: 'has', month: '2026-10', answers: { dames: 2, orientees_vers: 1 } },
    { structure: 'benenova', month: '2026-11', answers: { dames: 3 } },
    { structure: 'has', month: '2025-11', answers: { dames: 50 } },
  ];
  const totals = commonTotals([has], entries, ['2026-10', '2026-11']);
  assert.deepEqual(totals.map(item => [item.id, item.value]), [['dames', 5], ['orientees_vers', 1]]);
});
