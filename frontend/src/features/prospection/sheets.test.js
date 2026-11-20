import test from 'node:test';
import assert from 'node:assert/strict';
import { addedFunders, calls, contactEmails, patrons, euCalls, frCalls, guide, lastFunders, moreFunders, repertoire, strategy, withEmails } from './prospectionData.js';
import { SHEETS, counts, filterOptions, filterRows, sortRows, toFunder, toSheet, tone } from './sheets.js';

test('the team’s file is all there: 57 funders, 10 calls, 4 parts, the guide', () => {
  assert.deepEqual([repertoire.length, calls.length, strategy.length, guide.length], [57, 10, 4, 8]);
  assert.equal(repertoire[0].name, 'Fondation de Marseille');
  assert.equal(new Set(repertoire.map(row => row.id)).size, 57);
  for (const [id, rows] of [['repertoire', withEmails([...repertoire, ...addedFunders, ...moreFunders, ...lastFunders])], ['calls', withEmails(calls)], ['strategy', strategy], ['europe', withEmails(euCalls)], ['france', withEmails(frCalls)]]) {
    const keys = SHEETS[id].columns.map(([key]) => key).filter(key => key !== 'card' && key !== 'advice');
    for (const row of rows) assert.deepEqual(keys.filter(key => !(key in row)), [], `${id}: ${row.id}`);
  }
});

test('search, filters, and sorting by fit with empty cells last', () => {
  const sheet = SHEETS.repertoire;
  assert.equal(filterRows(repertoire, sheet, 'habitat', {}).length > 5, true);
  const toContact = filterRows(repertoire, sheet, '', { status: 'À contacter' });
  assert.equal(toContact.length, 14);
  assert.deepEqual(filterOptions(repertoire, 'fit').slice(0, 2), ['Très élevée', 'Élevée']);
  const rows = [{ id: 1, fit: 'Moyenne' }, { id: 2, fit: '' }, { id: 3, fit: 'Très élevée' }, { id: 4, fit: 'Exclue' }];
  assert.deepEqual(sortRows(rows, { key: 'fit', direction: 'asc' }).map(row => row.id), [3, 1, 4, 2]);
  assert.deepEqual(sortRows(rows, { key: 'fit', direction: 'desc' }).map(row => row.id), [4, 1, 3, 2]);
  const amounts = [{ id: 1, requested: '15 000 €' }, { id: 2, requested: '3K' }, { id: 3, requested: '' }];
  assert.deepEqual(sortRows(amounts, { key: 'requested', direction: 'asc' }).map(row => row.id), [2, 1, 3]);
});

test('colours of statuses and fits', () => {
  assert.equal(tone('À contacter'), 'hot');
  assert.equal(tone('Très élevée'), 'hot');
  assert.equal(tone('Élevée'), 'warm');
  assert.equal(tone('Veille 2027'), 'watch');
  assert.equal(tone('Dossier déposé'), 'active');
  assert.equal(tone('Obtenu'), 'won');
  assert.equal(tone('Déjà sollicitée'), 'closed');
  assert.equal(tone('À qualifier'), 'explore');
  assert.equal(tone(''), 'none');
});

test('a prospect becomes a funding to follow, with what the team knows', () => {
  const funder = toFunder({ ...repertoire[0], contact: 'Alexis', requested: '20 000 €' });
  assert.equal(funder.name, 'Fondation de Marseille');
  assert.equal(funder.status, 'todo');
  assert.equal(funder.amount, '20 000 €');
  assert.equal(funder.contact, 'Alexis');
  assert.equal(funder.links, 'https://fondation-marseille.org/');
  assert.match(funder.notes, /Points de vigilance : Coordonnées/);
  assert.match(funder.purpose, /Action recommandée : Prise de contact/);
  assert.deepEqual(funder.tasks, []);
});

test('counts, close deadlines and the Excel sheet', () => {
  const soonCalls = [{ name: 'A', deadline: '2026-12-01' }, { name: 'B', deadline: '2027-06-01' }, { name: 'C', deadline: '2026-11-01' }];
  const numbers = counts(repertoire, soonCalls, '2026-11-16');
  assert.equal(numbers.toContact, 14);
  assert.equal(numbers.hot, 9);
  assert.deepEqual(numbers.soon.map(call => call.name), ['A']);
  const sheet = toSheet(SHEETS.strategy, strategy, ['part', 'scope', 'card']);
  assert.deepEqual(sheet.columns, ['Volet', 'Périmètre']);
  assert.equal(sheet.rows[0][0], 'A. Association Chez Marthe');
});

test('what the web search added: new funders and calls in blue, European calls with clear states', () => {
  const ids = [...repertoire, ...addedFunders].map(row => row.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(addedFunders.length >= 15 && addedFunders.every(row => row.color === 'ciel' && row.link.startsWith('https://')));
  const names = new Set(repertoire.map(row => row.name));
  assert.deepEqual(addedFunders.filter(row => names.has(row.name)), []);
  assert.ok(euCalls.some(row => row.name.startsWith('DAPHNE')));
  for (const row of [...euCalls, ...frCalls]) {
    assert.ok(['Ouvert', 'À venir', 'Permanent', 'À vérifier', 'Clos – prochaine édition à surveiller', 'Fonds gérés en France'].includes(row.state), row.id);
    assert.ok(!row.deadline || /^\d{4}-\d{2}-\d{2}$/.test(row.deadline), row.id);
    assert.ok(row.state !== 'Ouvert' || row.deadline, `${row.id} : un appel ouvert a une date limite`);
  }
  assert.equal(tone('Ouvert'), 'hot');
  assert.equal(tone('Clos – prochaine édition à surveiller'), 'watch');
  assert.equal(tone('À venir'), 'warm');
  const numbers = counts([], [], '2026-11-16', euCalls, frCalls);
  assert.deepEqual(numbers.soon.map(row => row.deadline), ['2026-11-30', '2026-12-01', '2026-12-01', '2026-12-11', '2026-12-30']);
});

test('at least 200 funders, links and vigilance in sight, a direct contact on every row', () => {
  const all = withEmails([...repertoire, ...addedFunders, ...moreFunders, ...lastFunders]);
  assert.ok(all.length >= 200, String(all.length));
  assert.equal(new Set(all.map(row => row.name.toLowerCase())).size, all.length);
  for (const id of ['repertoire', 'calls', 'europe', 'france']) {
    const keys = SHEETS[id].columns.map(([key]) => key);
    assert.ok(keys.indexOf('link') <= 4 && keys.indexOf('email') === keys.indexOf('link') + 1 && keys.indexOf('linkedin') === keys.indexOf('email') + 1 && keys.indexOf(id === 'calls' ? 'conditions' : 'vigilance') <= 7, id);
  }
  assert.ok(all.every(row => row.email && row.linkedin));
  assert.match(all.find(row => row.id === 'r02').linkedin, /linkedin.com\/in\/bouchra-rguibi/);
  assert.match(all.find(row => row.id === 'r02').contact, /Bouchra Rguibi/);
  assert.match(all.find(row => row.id === 'x001').linkedin, /Marina Iliaev/);
  assert.equal(all.find(row => row.id === 'x001').email, 'droitsdesfemmes@marseille.fr');
  assert.equal(all.find(row => row.id === 'r02').email, 'Non trouvé');
  assert.equal(all.find(row => row.id === 'x050').email, 'À chercher');
  assert.ok(Object.values(contactEmails).every(value => value === 'Non trouvé' || /@/.test(value)));
  assert.ok(frCalls.length >= 25 && frCalls.find(row => row.id === 'f01').deadline === '2027-01-13');
});

test('patrons and investors: all columns filled, angels kept for part B only', () => {
  const keys = SHEETS.patrons.columns.map(([key]) => key).filter(key => key !== 'card' && key !== 'advice');
  for (const row of patrons) assert.deepEqual(keys.filter(key => !(key in row)), [], row.id);
  assert.equal(new Set(patrons.map(row => row.id)).size, patrons.length);
  assert.ok(patrons.filter(row => /angels/i.test(row.type)).every(row => /volet B/.test(row.type)));
  assert.ok(patrons.every(row => row.link.startsWith('https://')));
});

test('a piece of advice for every row of every table, written by hand for the main ones', async () => {
  const { adviceFor, customAdvice } = await import('./advice.js');
  const tables = { repertoire: withEmails([...repertoire, ...addedFunders, ...moreFunders, ...lastFunders]), calls, europe: euCalls, france: frCalls, patrons };
  const all = Object.values(tables).flat().map(row => row.id);
  assert.deepEqual(Object.keys(customAdvice).filter(id => !all.includes(id)), []);
  for (const [id, rows] of Object.entries(tables)) {
    assert.ok(SHEETS[id].columns.some(([key]) => key === 'advice'), id);
    for (const row of rows) {
      const text = adviceFor(id, row);
      assert.match(text, /Ce que vous mettez en avant|Mettez en avant/, `${id} ${row.id}`);
      assert.ok(text.length > 120, `${id} ${row.id}`);
    }
  }
  assert.match(adviceFor('patrons', patrons.find(row => row.id === 'm13')), /volet B/);
  assert.equal(adviceFor('repertoire', { id: 'zz', advice: 'Mon conseil' }), 'Mon conseil');
  assert.match(toSheet(SHEETS.patrons, patrons, ['name', 'advice']).rows[0][1], /DAPAT/);
});

test('« Contacté » is offered right after « À contacter » and shows in green', async () => {
  const { STATUSES, tone } = await import('./sheets.js');
  assert.equal(STATUSES[1], 'Contacté');
  assert.equal(tone('Contacté'), 'contacted');
  assert.equal(tone('À contacter'), 'hot');
  assert.equal(tone('Contact pris'), 'active');
});

test('a potential funder already followed in « Financements » is recognised, by its row or by its exact name', async () => {
  const { fundingMatcher } = await import('./fundingMatches.js');
  const match = fundingMatcher([{ name: 'Fondation MACIF' }, { name: 'Ville de Marseille / Métropole Aix-Marseille-Provence' }, { name: 'Fondation  Kering ' }]);
  assert.equal(match({ id: 'r02', name: 'Fondation Macif' }), 'Fondation MACIF');
  assert.equal(match({ id: 'x001', name: 'Ville de Marseille – service Droits des femmes' }), 'Ville de Marseille / Métropole Aix-Marseille-Provence');
  assert.equal(match({ id: 'new', name: 'Fondation Kering' }), 'Fondation  Kering ');
  assert.equal(match({ id: 'r14', name: 'Fondation des Femmes' }), '');
  assert.equal(fundingMatcher([])({ id: 'r02', name: 'Fondation Macif' }), '');
});

test('the team can mark a row « already in Financements » by hand, or take the red away', async () => {
  const { MARKED_BY_HAND, fundingStatus, toggleFunding } = await import('./fundingMatches.js');
  const auto = row => (row.id === 'r02' ? 'Fondation MACIF' : '');
  const macif = { id: 'r02', name: 'Fondation Macif' };
  const other = { id: 'zz', name: 'Fondation X' };
  const notMacif = toggleFunding(macif, auto);
  assert.equal(notMacif.inFunding, 'no');
  assert.equal(fundingStatus(notMacif, auto), '');
  assert.deepEqual(toggleFunding(notMacif, auto), macif);
  const marked = toggleFunding(other, auto);
  assert.equal(fundingStatus(marked, auto), MARKED_BY_HAND);
  assert.deepEqual(toggleFunding(marked, auto), other);
});
