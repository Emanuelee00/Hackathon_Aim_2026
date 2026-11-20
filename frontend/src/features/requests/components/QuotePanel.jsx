import { useState } from 'react';
import { download } from '../../../shared/lib/exports.js';
import { spaceById } from '../../../shared/data/spaces.js';
import { quoteIsCurrent, quoteMoney } from '../quotes.js';
import QuoteForm from './QuoteForm.jsx';

export default function QuotePanel({ event, onSave }) {
  const [acceptedBy, setAcceptedBy] = useState('');
  const [editing, setEditing] = useState(false);
  const quote = event.quote;
  const current = quoteIsCurrent(event);
  const editable = ['pending', 'incomplete', 'waitlisted'].includes(event.status);
  const accept = e => {
    e.preventDefault();
    if (!current || !acceptedBy.trim()) return;
    onSave({ ...event, quote: { ...quote, status: 'accepted', acceptedBy: acceptedBy.trim(), acceptedAt: new Date().toISOString() } });
  };
  const exportQuote = () => download(`marthe-devis-${event.id}-v${quote.version}.txt`, ['MARTHE — PROPOSITION DE LOCATION', 'Document de travail · Démonstration', event.title, `Organisateur : ${event.organizer}`, `Espace : ${spaceById[event.space].name}`, `${event.date} · ${event.start}–${event.end}`, `Version ${quote.version} · ${quote.status === 'accepted' ? 'Accord consigné' : 'À accepter'}`, `${quote.mode === 'fixed' ? 'Forfait' : `${quote.hours} h`} × ${quote.quantity} unité(s) × ${quoteMoney.format(quote.rate)}`, `Location : ${quoteMoney.format(quote.base)}`, `${quote.extraLabel || 'Prestations'} : ${quoteMoney.format(quote.extraAmount)}`, `Total proposé : ${quoteMoney.format(quote.total)}`, quote.terms, quote.acceptedBy ? `Accord de ${quote.acceptedBy} consigné le ${quote.acceptedAt}` : 'Accord à recueillir'].join('\n'));
  return <section className="detail-copy request-module"><h3>Devis de location</h3>
    {quote && <><p><strong>Version {quote.version} · {quoteMoney.format(quote.total)}</strong> · {quote.status === 'accepted' ? `Accord de ${quote.acceptedBy} consigné` : 'À accepter'}</p><p>{quote.mode === 'fixed' ? 'Forfait' : `${quote.hours} h`} × {quote.quantity} unité(s) × {quoteMoney.format(quote.rate)} + {quoteMoney.format(quote.extraAmount)} de prestations</p><p>{quote.terms}</p>
      {!current && <p role="alert" className="form-error">La demande a changé : préparez une nouvelle version du devis.</p>}
      <button className="button button-quiet" disabled={!current} onClick={exportQuote}>Télécharger le devis</button>
      {editable && current && quote.status !== 'accepted' && !editing && <form className="event-form" onSubmit={accept}><label className="field"><span>Accord donné par l’organisateur</span><input required value={acceptedBy} onChange={e => setAcceptedBy(e.target.value)} placeholder="Nom de la personne ayant accepté" /></label><button className="button button-dark">Consigner l’acceptation du devis</button><p>L’équipe enregistre l’accord reçu. Aucun envoi automatique ni signature en ligne.</p></form>}
    </>}
    {editable && quote && !editing && current && <button className="button button-quiet" onClick={() => setEditing(true)}>Réviser le devis</button>}
    {editable && (!quote || editing || !current) && <QuoteForm key={`${event.space}-${quote?.version || 0}`} event={event} onSave={next => { onSave(next); setEditing(false); }} />}
    {!editable && !quote && <p>Aucun devis enregistré.</p>}
    {event.quoteHistory?.length > 0 && <details><summary>Versions précédentes</summary>{event.quoteHistory.map(item => <p key={item.version}>Version {item.version} · {quoteMoney.format(item.total)} · {item.acceptedBy ? `Accord de ${item.acceptedBy}` : 'Sans accord enregistré'}</p>)}</details>}
  </section>;
}
