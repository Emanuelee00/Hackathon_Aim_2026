import { useState } from 'react';
import { spaceById } from '../../../shared/data/spaces.js';
import { calculateQuote, prepareQuote, quoteDefaults, quoteMoney } from '../quotes.js';

export default function QuoteForm({ event, onSave }) {
  const [draft, setDraft] = useState(() => quoteDefaults(event));
  const [error, setError] = useState('');
  const perSeat = spaceById[event.space]?.unit === 'place';
  const change = ({ target }) => setDraft(current => ({ ...current, [target.name]: target.value }));
  let preview;
  try { preview = calculateQuote(event, draft); } catch { /* Missing inputs are explained on submission. */ }
  const submit = e => {
    e.preventDefault();
    try {
      const quote = prepareQuote(event, draft);
      onSave({ ...event, quote, revenue: quote.total, quoteHistory: [...(event.quoteHistory || []), ...(event.quote ? [event.quote] : [])] });
      setError('');
    } catch (failure) { setError(failure.message); }
  };
  return <form className="event-form" onSubmit={submit}>
    <p>La durée vient de la demande. Le tarif du catalogue est proposé lorsqu’il existe ; sinon, saisissez le tarif convenu.</p>
    <div className="form-grid">
      <label className="field field-wide"><span>Mode de tarification</span><select name="mode" aria-label="Mode de tarification" value={draft.mode} onChange={change}><option value="hourly">À l’heure</option><option value="fixed">Forfait pour le créneau</option></select></label>
      <label className="field field-wide"><span>{draft.mode === 'fixed' ? 'Forfait pour le créneau (€), par poste si coworking' : perSeat ? 'Tarif par poste et par heure (€)' : 'Tarif horaire de la salle (€)'}</span><input type="number" name="rate" min="0" step="0.01" required value={draft.rate} onChange={change} /></label>
      {perSeat && <label className="field field-wide"><span>Nombre de postes facturés</span><input type="number" name="quantity" min="1" step="1" required value={draft.quantity} onChange={change} /></label>}
      <label className="field field-wide"><span>Prestations supplémentaires</span><input name="extraLabel" value={draft.extraLabel} onChange={change} placeholder="Matériel, ménage, accueil…" /></label>
      <label className="field field-wide"><span>Montant des prestations (€)</span><input type="number" name="extraAmount" min="0" step="0.01" required value={draft.extraAmount} onChange={change} /></label>
      <label className="field field-full"><span>Conditions et contenu du prix</span><textarea name="terms" required value={draft.terms} onChange={change} placeholder="Prestations incluses, conditions de règlement et d’annulation, traitement des taxes à préciser…" /></label>
    </div>
    {preview && <p>{draft.mode === 'fixed' ? 'Forfait' : `${preview.hours} h`} × {preview.quantity} {perSeat ? 'poste(s)' : 'salle'} · Location {quoteMoney.format(preview.base)} · <strong>Total proposé : {quoteMoney.format(preview.total)}</strong></p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-dark">{event.quote ? 'Enregistrer une nouvelle version du devis' : 'Enregistrer le devis'}</button>
    {event.quote && <p>Une nouvelle version remplace l’accord précédent et doit être acceptée à nouveau.</p>}
  </form>;
}
