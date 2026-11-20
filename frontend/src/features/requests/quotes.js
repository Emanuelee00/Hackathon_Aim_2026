import { spaceById } from '../../shared/data/spaces.js';
import { duration } from '../../shared/lib/format.js';

export const quoteMoney = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function quoteDefaults(event) {
  const quote = quoteIsCurrent(event) ? event.quote : null;
  return { mode: quote?.mode || 'hourly', rate: quote?.rate ?? spaceById[event.space]?.rate ?? '', quantity: spaceById[event.space]?.unit === 'place' ? quote?.quantity ?? event.participants : 1, extraLabel: quote?.extraLabel || '', extraAmount: quote?.extraAmount ?? 0, terms: quote?.terms || '' };
}

export function quoteSnapshot(event) {
  return JSON.stringify([event.requestType, event.title, event.organizer, event.email || '', event.space, event.date, event.start, event.end, event.participants, event.rentalUse || '', event.equipmentNeeds || '', event.budgetDetails || '']);
}

export function calculateQuote(event, draft) {
  const hours = duration(event);
  if (!['hourly', 'fixed'].includes(draft.mode || 'hourly')) throw new Error('Choisissez une tarification horaire ou forfaitaire.');
  const quantity = spaceById[event.space]?.unit === 'place' ? draft.quantity : 1;
  if (draft.rate === '' || !Number.isFinite(Number(draft.rate)) || Number(draft.rate) < 0) throw new Error('Renseignez un tarif horaire positif ou nul.');
  if (!Number.isFinite(hours) || hours <= 0 || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) throw new Error('Vérifiez la durée et le nombre de postes.');
  if (!Number.isFinite(Number(draft.extraAmount)) || Number(draft.extraAmount) < 0 || (Number(draft.extraAmount) > 0 && !draft.extraLabel.trim())) throw new Error('Précisez le libellé et le montant des prestations supplémentaires.');
  const baseCents = Math.round(Number(draft.rate) * 100 * (draft.mode === 'fixed' ? 1 : hours) * Number(quantity));
  const extraCents = Math.round(Number(draft.extraAmount) * 100);
  if (!Number.isSafeInteger(baseCents + extraCents)) throw new Error('Le montant est trop élevé.');
  return { hours, quantity: Number(quantity), base: baseCents / 100, total: (baseCents + extraCents) / 100 };
}

export function quoteIsCurrent(event) {
  return Boolean(event.quote && event.quote.snapshot === quoteSnapshot(event));
}

export function prepareQuote(event, draft) {
  if (event.requestType !== 'rental') throw new Error('Le devis concerne une location d’espace.');
  if (!draft.terms.trim()) throw new Error('Précisez les conditions et ce que le prix comprend.');
  return { ...draft, rate: Number(draft.rate), extraAmount: Number(draft.extraAmount), ...calculateQuote(event, draft), snapshot: quoteSnapshot(event), version: (event.quote?.version || 0) + 1, status: 'prepared', preparedAt: new Date().toISOString(), acceptedBy: '', acceptedAt: '' };
}
