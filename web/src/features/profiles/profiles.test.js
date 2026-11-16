import test from 'node:test';
import assert from 'node:assert/strict';
import { initials, isLight, nextTheme, orderedNavigation, pageStyle, profileId, seedProfiles, toggleStar } from './profiles.js';

const navigation = [{ id: 'dashboard' }, { id: 'requests' }, { id: 'funding' }, { id: 'site' }];

test('each person of the site team gets her own space, with a readable id', () => {
  const list = seedProfiles([{ name: 'Véronique', role: 'Coordinatrice', photo: '/foto/equipe/veronique.jpg' }, { name: 'Léa' }, { name: 'Léa' }]);
  assert.deepEqual(list.map(profile => profile.id), ['veronique', 'lea', 'lea-2']);
  assert.equal(list[0].role, 'Coordinatrice');
  assert.deepEqual(list[1].starred, []);
  assert.equal(profileId('  '), 'personne');
  assert.equal(initials('Marie-Claire'), 'MC');
});

test('her menu follows her order; new sections come after, in the usual order', () => {
  const profile = { menuOrder: ['funding', 'gone', 'dashboard'], starred: [] };
  assert.deepEqual(orderedNavigation(navigation, profile).map(item => item.id), ['funding', 'dashboard', 'requests', 'site']);
  assert.deepEqual(orderedNavigation(navigation, null).map(item => item.id), ['dashboard', 'requests', 'funding', 'site']);
  const starred = toggleStar(profile, 'site');
  assert.deepEqual(starred.starred, ['site']);
  assert.deepEqual(toggleStar(starred, 'site').starred, []);
});

test('a light menu colour switches the menu text to dark', () => {
  assert.equal(isLight('#f3e9f7'), true);
  assert.equal(isLight('#662b80'), false);
});

test('the sun and the M switch the theme on, a second click switches it off; a light page colour waits in the dark', () => {
  assert.equal(nextTheme('light', 'dark'), 'dark');
  assert.equal(nextTheme('dark', 'dark'), 'light');
  assert.equal(nextTheme('dark', 'violet'), 'violet');
  assert.equal(pageStyle({ kind: 'color', value: '#fbeff3' }, 'dark'), undefined);
  assert.equal(pageStyle({ kind: 'color', value: '#fbeff3' }).background, '#fbeff3');
  assert.match(pageStyle({ kind: 'image', value: '/foto/jardin.webp' }, 'violet').background, /36,14,48/);
});
