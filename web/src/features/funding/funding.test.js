import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, defaultFollowupDate, emptyFunder, followupDate, followupMonths, localToday, nextTask, overdueTasks, urgentDeadline } from './funding.js';
import { calendarEvents, calendarMonths } from './calendar.js';
import { importChanges } from './importing.js';
import { moveColumn, resizeWithNeighbour, scaleWidths, totalWidth } from './tableMath.js';
import { amountValue, sortFunders } from './sorting.js';

const task = (id, due, done = false) => ({ id, text: id, owner: 'Véro', due, done });
const funder = (id, status, deadline = '', tasks = []) => ({ id, name: id, status, deadline, tasks });

test('uses the local date, not the UTC one', () => {
  assert.equal(localToday(new Date(2026, 9, 30, 23, 30)), '2026-10-30');
});

test('the next task is the first open one by due date, undated last', () => {
  assert.equal(nextTask(funder('a', 'todo', '', [task('sans date', ''), task('fait', '2026-01-01', true), task('nov', '2026-11-02')])).id, 'nov');
  assert.equal(nextTask(funder('a', 'todo')), undefined);
});

test('lists open tasks past their date, oldest first', () => {
  const funders = [funder('a', 'todo', '', [task('sept', '2026-09-01'), task('fait', '2026-08-01', true)]), funder('b', 'todo', '', [task('aout', '2026-08-15'), task('demain', '2026-10-31')])];
  assert.deepEqual(overdueTasks(funders, '2026-10-30').map(item => item.task.id), ['aout', 'sept']);
});

test('warns about a close deadline only while the file is not sent', () => {
  const funders = [funder('envoyé', 'submitted', '2026-11-01'), funder('loin', 'todo', '2027-02-01'), funder('fse', 'todo', '2026-11-01'), funder('passé', 'priority', '2026-09-07')];
  assert.equal(urgentDeadline(funders, '2026-10-30').id, 'fse');
  assert.equal(urgentDeadline([funder('loin', 'todo', '2027-02-01')], '2026-10-30'), undefined);
});

test('shows the current month up to the same month next year', () => {
  const months = calendarMonths('2026-10-30').map(month => month.start);
  assert.equal(months.length, 13);
  assert.deepEqual([months[0], months[3], months[12]], ['2026-10-01', '2027-01-01', '2027-10-01']);
});

test('places deadlines and tasks of the window on rows that do not overlap', () => {
  const funders = [funder('fse', 'todo', '2026-11-01'), funder('fdva', 'todo', '2027-02-01', [task('veille', '2027-02-01')]), funder('vieux', 'closed', '2026-11-02'), funder('raja', 'submitted', '', [task('retard', '2026-10-01')])];
  const events = calendarEvents(funders, '2026-10-30', 6, 0.2);
  assert.deepEqual(events.map(event => [event.id, event.kind, event.lane]), [['task-retard', 'late', 0], ['deadline-fse', 'deadline', 1], ['deadline-fdva', 'deadline', 0], ['task-veille', 'task', 1]]);
  const later = [funder('septembre', 'todo', '2027-09-15'), funder('trop loin', 'todo', '2027-11-02')];
  assert.deepEqual(calendarEvents(later, '2026-10-30').map(event => event.id), ['deadline-septembre']);
});

test('an import from a file saved by the site lists what it changes', () => {
  const site = [funder('a', 'todo', '', [task('t', '')]), funder('b', 'todo'), funder('c', 'todo')];
  const file = [{ ...site[0], tasks: [{ ...site[0].tasks[0], id: 'nouvel id' }] }, { ...site[1], status: 'priority' }, funder('d', 'todo')];
  assert.deepEqual(importChanges(site, file), { matched: true, unchanged: 1, changed: ['b'], added: ['d'], removed: ['c'] });
  assert.equal(importChanges(site, [funder('x', 'todo')]).matched, false);
});

test('a wider or narrower table scales the text columns, not the date, state and card', () => {
  const widths = { name: 200, type: 100, deadline: 140, status: 160, card: 50 };
  assert.deepEqual(scaleWidths(widths, 950), { name: 400, type: 200, deadline: 140, status: 160, card: 50 });
  assert.equal(totalWidth(scaleWidths(widths, 950)), 950);
  assert.equal(totalWidth(scaleWidths(widths, 951)), 951);
  assert.deepEqual(scaleWidths(widths, 300), { name: 50, type: 50, deadline: 140, status: 160, card: 50 });
});

test('a column dropped on another takes its place, from either side', () => {
  assert.deepEqual(moveColumn(['a', 'b', 'c'], 'a', 'b'), ['b', 'a', 'c']);
  assert.deepEqual(moveColumn(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
});

test('reads the first amount of a free-text cell', () => {
  const amounts = ['Montant total de l’appel : 250 000 € ', '3 000–15 000 €', '• 15 000€ / an', 'Valorisation et 30K de soutien', '35000.0', 'Financier mais il faut 2 ans d’existence', 'Variable', ''];
  assert.deepEqual(amounts.map(amountValue), [250000, 3000, 15000, 30000, 35000, null, null, null]);
});

test('sorts by amount, deadline or state, empty values last either way', () => {
  const funders = [{ id: 'a', amount: 'Variable', deadline: '', status: 'closed' }, { id: 'b', amount: '15 000 €', deadline: '2026-11-01', status: 'priority' }, { id: 'c', amount: '3 000 €', deadline: '2027-02-01', status: 'qualify' }];
  const ids = sort => sortFunders(funders, sort).map(funder => funder.id);
  assert.deepEqual(ids({ key: 'amount', direction: 'asc' }), ['c', 'b', 'a']);
  assert.deepEqual(ids({ key: 'amount', direction: 'desc' }), ['b', 'c', 'a']);
  assert.deepEqual(ids({ key: 'deadline', direction: 'desc' }), ['c', 'b', 'a']);
  assert.deepEqual(ids({ key: 'status', direction: 'asc' }), ['c', 'b', 'a']);
  assert.deepEqual(ids(null), ['a', 'b', 'c']);
});

test('resizing a column changes its neighbour, never the table; the last one covers the row actions', () => {
  const widths = { name: 200, type: 100, amount: 150, card: 100 };
  const order = ['name', 'type', 'amount', 'card'];
  assert.deepEqual(resizeWithNeighbour(widths, order, 'name', 240), { name: 240, type: 60, amount: 150, card: 100 });
  assert.deepEqual(resizeWithNeighbour(widths, order, 'name', 400), { name: 250, type: 50, amount: 150, card: 100 });
  assert.deepEqual(resizeWithNeighbour(widths, order, 'amount', 190), { name: 200, type: 100, amount: 190, card: 60 });
  assert.deepEqual(resizeWithNeighbour(widths, order, 'amount', 400), { name: 200, type: 100, amount: 200, card: 50 });
  assert.equal(totalWidth(resizeWithNeighbour(widths, order, 'type', 10)), totalWidth(widths));
});

test('the reminder falls 11 months after the funding is obtained, unless the delay is changed', () => {
  assert.equal(emptyFunder().followupMonths, 11);
  assert.equal(followupDate({ obtainedOn: '2026-01-10' }), '2026-12-10');
  assert.equal(followupDate({ obtainedOn: '2026-01-10', followupMonths: 6 }), '2026-07-10');
  assert.equal(followupMonths({ followupMonths: 0 }), 11);
  assert.equal(followupDate({ followupMonths: 11 }), '');
});

test('months are added to the last day of a shorter month', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-03-15', 11), '2027-02-15');
  assert.equal(addMonths('2026-12-01', 1), '2027-01-01');
});

test('the reminder day can be chosen by hand, and goes back to 11 months after the obtention', () => {
  const funder = { obtainedOn: '2026-01-10', followupMonths: 11, followupOn: '' };
  assert.equal(followupDate(funder), '2026-12-10');
  assert.equal(followupDate({ ...funder, followupOn: '2026-10-05' }), '2026-10-05');
  assert.equal(defaultFollowupDate({ ...funder, followupOn: '2026-10-05' }), '2026-12-10');
  assert.equal(emptyFunder().followupOn, '');
});
