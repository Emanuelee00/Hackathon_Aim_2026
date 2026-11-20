import test from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl } from './apiUrl.js';

test('only API paths use the configured API origin', () => {
  assert.equal(apiUrl('/api/site'), '/api/site');
  assert.equal(apiUrl('/foto/logo.webp'), '/foto/logo.webp');
  assert.equal(apiUrl('https://example.com/image.webp'), 'https://example.com/image.webp');
});
