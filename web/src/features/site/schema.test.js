import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSite, mergeSite, sectionAnchors } from '../landing/siteContent.js';
import { SITE_SECTIONS, checkSection, cleanSection } from './schema.js';

test('every section of the home page can be edited, and every field has its original value', () => {
  assert.deepEqual(SITE_SECTIONS.map(section => section.id), Object.keys(defaultSite));
  for (const section of SITE_SECTIONS) {
    assert.equal(defaultSite[section.id].visible, true, section.id);
    for (const field of section.fields) assert.ok(field.key in defaultSite[section.id], `${section.id}.${field.key}`);
    assert.equal(checkSection(section, defaultSite[section.id]), '', section.id);
  }
  for (const anchor of Object.keys(sectionAnchors)) assert.ok(anchor in defaultSite);
});

test('what the team saved replaces the original, section by section', () => {
  const merged = mergeSite({ involve: { visible: false, title: 'Agir avec nous' } });
  assert.equal(merged.involve.title, 'Agir avec nous');
  assert.equal(merged.involve.visible, false);
  assert.equal(merged.involve.items.length, 4);
  assert.equal(merged.hero.title1, 'Des lieux');
  assert.equal(mergeSite(null).team.members.length, defaultSite.team.members.length);
});

test('links are checked and texts cleaned before publishing', () => {
  const involve = SITE_SECTIONS.find(section => section.id === 'involve');
  const bad = { ...defaultSite.involve, items: [{ title: 'Don', photo: '/foto/jardin.webp', text: '', url: 'www.don.fr' }] };
  assert.match(checkSection(involve, bad), /Les cartes, n° 1.*https/);
  const hero = SITE_SECTIONS.find(section => section.id === 'hero');
  const cleaned = cleanSection(hero, { ...defaultSite.hero, cities: [' Marseille ', '', 'Nice'], title1: '  Des lieux  ' });
  assert.deepEqual(cleaned.cities, ['Marseille', 'Nice']);
  assert.equal(cleaned.title1, 'Des lieux');
});
