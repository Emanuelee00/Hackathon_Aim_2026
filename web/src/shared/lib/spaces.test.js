import test from 'node:test';
import assert from 'node:assert/strict';
import { spaceFromHost, spaceUrl } from './spaces.js';

const at = (hostname, port = '') => ({ protocol: 'https:', hostname, port });

test('reads the space from the first subdomain', () => {
  assert.equal(spaceFromHost('equipe.marthe.fr'), 'equipe');
  assert.equal(spaceFromHost('residents.localhost'), 'residents');
  assert.equal(spaceFromHost('marthe.fr'), null);
  assert.equal(spaceFromHost('www.marthe.fr'), null);
});

test('links from the landing page to a space', () => {
  assert.equal(spaceUrl('benevoles', at('marthe.fr')), 'https://benevoles.marthe.fr/');
  assert.equal(spaceUrl('equipe', at('www.marthe.fr')), 'https://equipe.marthe.fr/');
  assert.equal(spaceUrl('equipe', at('localhost', '5173')), 'https://equipe.localhost:5173/');
});

test('links from a space to another space or back to the landing page', () => {
  assert.equal(spaceUrl('residents', at('equipe.marthe.fr')), 'https://residents.marthe.fr/');
  assert.equal(spaceUrl(null, at('partenaires.marthe.fr')), 'https://marthe.fr/');
});

// A bare IP has no subdomains: the link must switch to localhost, otherwise the
// browser cannot resolve <space>.127.0.0.1 and shows a blank page.
test('links from a loopback IP switch to localhost', () => {
  assert.equal(spaceUrl('equipe', at('127.0.0.1', '8000')), 'https://equipe.localhost:8000/');
  assert.equal(spaceUrl(null, at('127.0.0.1', '8000')), 'https://localhost:8000/');
  assert.equal(spaceUrl('residents', at('[::1]', '5173')), 'https://residents.localhost:5173/');
  assert.equal(spaceUrl('equipe', at('marthe.fr')), 'https://equipe.marthe.fr/');
});
