import test from 'node:test';
import assert from 'node:assert/strict';
import { conflicts, validateEvent, validateReport } from './planning.js';

const request = { requestType: 'rental', rentalUse: 'Réunion', equipmentNeeds: 'Aucun', budgetDetails: '50 € convenus', approval: { authority: 'coordinator', reviewer: 'Camille', date: '2026-09-24', note: 'Conditions acceptées' }, id: 'new', title: 'Atelier', organizer: 'Association', referent: 'Camille Martin', referentTeam: 'Équipe accueil', date: '2026-10-01', start: '10:00', end: '12:00', space: 'atelier', participants: 12, revenue: 50, costs: 10 };

test('detects a confirmed booking on the same space and time', () => {
  const existing = { ...request, id: 'existing', status: 'confirmed', start: '11:00', end: '13:00' };
  assert.deepEqual(conflicts(request, [existing]), [existing]);
  assert.match(validateEvent(request, [existing], true), /déjà réservé/);
});

test('allows a pending booking and adjacent time slots', () => {
  const pending = { ...request, id: 'pending', status: 'pending' };
  const adjacent = { ...request, id: 'adjacent', status: 'confirmed', start: '12:00', end: '13:00' };
  assert.equal(validateEvent(request, [pending, adjacent], true), '');
});

test('blocks confirmation above the room capacity', () => {
  assert.match(validateEvent({ ...request, participants: 25 }, [], true), /capacité/);
});

test('validates resident attendance and required feedback', () => {
  const report = { feedbackAuthor: 'Camille', feedbackTeam: 'Accueil', attendance: 5, residents: 6, revenue: 100, costs: 20, feedback: 'Très bien.' };
  assert.match(validateReport(report), /dépasser le total/);
  assert.match(validateReport({ ...report, residents: 2, feedback: '' }), /retour/);
  assert.equal(validateReport({ ...report, residents: 2 }), '');
});


test('requires a responsible person and their team before confirming, including legacy requests', () => {
  for (const fields of [
    { referent: undefined, referentTeam: undefined },
    { referent: '   ' },
    { referentTeam: '   ' },
  ]) {
    const incomplete = { ...request, ...fields };
    assert.equal(validateEvent(incomplete, []), '');
    assert.match(validateEvent(incomplete, [], true), /responsable/);
    assert.match(validateEvent({ ...incomplete, status: 'confirmed' }, []), /responsable/);
  }
  assert.equal(validateEvent(request, [], true), '');
  assert.equal(validateEvent({ ...request, status: 'confirmed' }, []), '');
});


test('keeps incomplete requests as drafts but requires rental answers and a coordinator decision to confirm', () => {
  const draft = { ...request, equipmentNeeds: '', approval: null };
  assert.equal(validateEvent(draft, []), '');
  assert.match(validateEvent(draft, [], true), /questions spécifiques/);
  assert.match(validateEvent({ ...request, approval: null }, [], true), /décision/);
  assert.match(validateEvent({ ...request, requestType: undefined }, []), /type de demande/);
});

test('programming requires committee submission and its recorded decision', () => {
  const program = { ...request, requestType: 'programming', audience: 'Voisines', missionFit: 'Transmission de compétences', supportNeeds: 'Accueil' };
  assert.match(validateEvent(program, [], true), /comité/);
  const approved = { ...program, approval: { ...request.approval, authority: 'committee' } };
  assert.match(validateEvent(approved, [], true), /Présentez/);
  assert.equal(validateEvent({ ...approved, reviewStage: 'committee' }, [], true), '');
  assert.match(validateEvent({ ...approved, reviewStage: 'committee', approval: { ...approved.approval, note: ' ' } }, [], true), /motif/);
});
