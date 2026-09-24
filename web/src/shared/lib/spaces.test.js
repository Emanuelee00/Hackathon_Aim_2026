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
