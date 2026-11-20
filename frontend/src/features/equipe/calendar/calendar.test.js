import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, calendarDays } from './calendar.js';

test('builds a six-week Monday-first calendar grid', () => {
  const days = calendarDays('2026-09', '2026-09-24');
  assert.equal(days.length, 42);
  assert.equal(days[0].date, '2026-08-31');
  assert.equal(days.at(-1).date, '2026-10-11');
  assert.equal(days.find(day => day.today)?.date, '2026-09-24');
});

test('moves between months across year boundaries', () => {
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
});
