import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCv } from './cvFile.js';

test('accepts PDF and DOCX files up to 4 MB', () => {
  assert.equal(validateCv({ name: 'cv.PDF', size: 1000 }), '');
  assert.equal(validateCv({ name: 'mon cv.docx', size: 4 * 1024 * 1024 }), '');
});

test('explains why a file is refused', () => {
  assert.match(validateCv({ name: 'photo.jpg', size: 1000 }), /PDF ou un document Word/);
  assert.match(validateCv({ name: 'cv.pdf', size: 5 * 1024 * 1024 }), /4 Mo/);
});
