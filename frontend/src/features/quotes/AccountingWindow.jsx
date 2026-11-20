import { useEffect, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { spaceById } from '../../shared/data/spaces.js';
import { dateLabel } from '../../shared/lib/format.js';
import { checkDoc, describe, invoiceFromQuote, locked, quoteFromEvent, today } from './accounting.js';
import DocBuilder from './DocBuilder.jsx';
import { sendDoc, takeNumber, usePriceList } from './documentsApi.js';
import './quotes.css';

// La fenêtre « Comptabilité » d'un évènement : 1. le devis (modifiable, envoyé, accepté), 2. la facture, faite à partir du devis accepté.
// Tout est enregistré dans l'évènement (event.accounting) au fil de la saisie. L'envoi par e-mail part du serveur, avec le PDF.

// Est-ce que l'envoi des e-mails est branché ? (la page Messages le sait ; sans réponse on laisse essayer).
function useMailReady() {
  const [ready, setReady] = useState(null);
  useEffect(() => {
    fetch('/api/messages').then(response => (response.ok ? response.json() : null)).then(data => setReady(data ? data.senders.configured : null)).catch(() => {});
  }, []);
  return ready;
}

function DocumentStep({ kind, entry, event, prices, onUpdate, notify, mailReady, canReopen, children }) {
  const [doc, setDoc] = useState(entry.doc);
  const [panel, setPanel] = useState('');
  const [to, setTo] = useState(entry.sentTo || event.email || '');
  const [who, setWho] = useState(entry.acceptedBy || event.organizer || '');
  const [when, setWhen] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isQuote = kind === 'devis';
  const word = isQuote ? 'Le devis' : 'La facture';

  // Enregistre dans l'évènement ; un devis envoyé puis modifié redevient un brouillon (à renvoyer).
  const latest = useRef({ doc, entry, onUpdate });
  latest.current = { doc, entry, onUpdate };
  const persist = (patch = {}) => {
    const { doc: current, entry: saved, onUpdate: update } = latest.current;
    const changed = JSON.stringify(current) !== JSON.stringify(saved.doc);
    update({ ...saved, doc: current, updatedAt: new Date().toISOString(), ...(changed && saved.status === 'sent' ? { status: 'draft' } : {}), ...patch });
  };
  // Enregistrement automatique pendant la saisie, et en fermant la fenêtre.
  useEffect(() => {
    if (JSON.stringify(doc) === JSON.stringify(entry.doc)) return undefined;
    const timer = setTimeout(() => persist(), 700);
    return () => clearTimeout(timer);
  }, [doc]);
  useEffect(() => () => { if (JSON.stringify(latest.current.doc) !== JSON.stringify(latest.current.entry.doc)) persist(); }, []);

  const open = name => { setError(''); setPanel(current => (current === name ? '' : name)); };
  const send = async submit => {
    submit.preventDefault();
    const problem = checkDoc(kind, doc);
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    try {
      const answer = await sendDoc(kind, doc, to.trim(), event);
      persist({ status: 'sent', sentTo: answer.to, sentAt: answer.at });
      setPanel('');
      notify(`${word} n° ${doc.number} est parti${isQuote ? '' : 'e'} à ${answer.to}.`);
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const accept = submit => {
    submit.preventDefault();
    persist({ status: 'accepted', acceptedBy: who.trim(), acceptedAt: when });
    setPanel('');
    notify('Devis accepté : vous pouvez maintenant émettre la facture.');
  };
  const issue = () => {
    const problem = checkDoc(kind, doc);
    if (problem) return setError(problem);
    persist({ status: 'issued', issuedAt: today() });
    notify('La facture est émise : elle ne se modifie plus.');
  };

  const readOnly = locked(kind, entry);
  const actions = <>
    {!readOnly && <button type="button" className="button button-dark" onClick={() => open('send')}><Icon name="mail" size={16} />Envoyer par e-mail</button>}
    {!readOnly && isQuote && <button type="button" className="button button-quiet" onClick={() => open('accept')}><Icon name="check" size={16} />Devis accepté</button>}
    {!readOnly && !isQuote && <button type="button" className="button button-quiet" onClick={issue}><Icon name="check" size={16} />Émise sans e-mail</button>}
    {readOnly && isQuote && canReopen && <button type="button" className="button button-quiet" onClick={() => onUpdate({ ...entry, status: 'draft', acceptedBy: '', acceptedAt: '' })}><Icon name="edit" size={16} />Rouvrir le devis</button>}
  </>;

  return <div className="account-step">
    <p className={`account-status status-${entry.status}`}>{describe(kind, entry)}{!readOnly && <small> · enregistré automatiquement</small>}</p>
    {panel === 'send' && <form className="account-form" onSubmit={send}>
      <label className="field"><span>Adresse e-mail du client *</span><input type="email" required value={to} onChange={change => setTo(change.target.value)} placeholder="client@exemple.org" /></label>
      <button className="button button-dark" disabled={busy}>{busy ? 'Envoi…' : `Envoyer ${isQuote ? 'le devis' : 'la facture'} en PDF`}</button>
      <p className="doc-note">{mailReady === false ? 'L’envoi des e-mails n’est pas encore branché sur le serveur : ce bouton fonctionnera dès qu’il le sera. En attendant, téléchargez le PDF.' : 'Le texte de l’e-mail se modifie dans la page Messages (« Factures et devis »).'}</p>
      {error && <p className="doc-error" role="alert">{error}</p>}
    </form>}
    {panel === 'accept' && <form className="account-form" onSubmit={accept}>
      <label className="field"><span>Accepté par *</span><input required value={who} onChange={change => setWho(change.target.value)} placeholder="Nom de la personne qui a accepté" /></label>
      <label className="field"><span>Le</span><input type="date" required value={when} onChange={change => setWhen(change.target.value)} /></label>
      <button className="button button-dark">Consigner l’acceptation</button>
      <p className="doc-note">Le devis accepté ne se modifie plus ; la facture se prépare à partir de lui.</p>
    </form>}
    {!panel && error && <p className="doc-error" role="alert">{error}</p>}
    {children}
    <DocBuilder key={`${entry.doc.number}-${readOnly}`} kind={kind} groups={prices.groups} onSavePrices={prices.save} onResetPrices={prices.reset} initial={doc} onChange={setDoc} readOnly={readOnly}>{actions}</DocBuilder>
  </div>;
}

export default function AccountingWindow({ event, onSave, notify, onBack }) {
  const prices = usePriceList();
  const mailReady = useMailReady();
  const accounting = event.accounting || {};
  const { quote, invoice } = accounting;
  const [tab, setTab] = useState(quote?.status === 'accepted' || invoice ? 'facture' : 'devis');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const space = spaceById[event.space]?.name || '';
  // Chaque mise à jour repart de l'évènement le plus récent, pour ne pas écraser l'autre document.
  const current = useRef(event);
  current.current = event;
  const update = (key, entry) => onSave({ ...current.current, accounting: { ...(current.current.accounting || {}), [key]: entry } });

  const create = async (kind, makeDoc) => {
    setBusy(true);
    setError('');
    try {
      const number = await takeNumber(kind);
      update(kind === 'devis' ? 'quote' : 'invoice', { doc: makeDoc(number), status: 'draft', createdAt: new Date().toISOString() });
      setTab(kind);
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const when = `${dateLabel(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${event.start}–${event.end}`;
  const newQuote = () => create('devis', number => quoteFromEvent(event, number, space, when));
  const newInvoice = fromQuote => create('facture', number => (fromQuote ? invoiceFromQuote(quote.doc, number) : quoteFromEvent(event, number, space, when)));

  return <div className="accounting">
    <div className="account-head">
      <div><small>Évènement</small><strong>{event.title}</strong></div>
      <div><small>Date</small><strong>{when}</strong></div>
      <div><small>Espace</small><strong>{space}</strong></div>
      <div><small>Client</small><strong>{event.organizer}{event.email ? ` · ${event.email}` : ''}</strong></div>
      {onBack && <button type="button" className="button button-quiet" onClick={onBack}><Icon name="left" size={16} />Retour à l’évènement</button>}
    </div>
    <div className="doc-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'devis'} className={`doc-tab${tab === 'devis' ? ' active' : ''}`} onClick={() => setTab('devis')}>1. Devis{quote ? ` · ${quote.status === 'accepted' ? 'accepté' : quote.status === 'sent' ? 'envoyé' : 'brouillon'}` : ''}</button>
      <button type="button" role="tab" aria-selected={tab === 'facture'} className={`doc-tab${tab === 'facture' ? ' active' : ''}`} onClick={() => setTab('facture')}>2. Facture{invoice ? ` · ${invoice.status === 'draft' ? 'brouillon' : invoice.status === 'sent' ? 'envoyée' : 'émise'}` : ''}</button>
    </div>
    {error && <p className="doc-error" role="alert">{error}</p>}

    {tab === 'devis' && (quote
      ? <DocumentStep key={`devis-${quote.doc.number}`} kind="devis" entry={quote} event={event} prices={prices} onUpdate={entry => update('quote', entry)} notify={notify} mailReady={mailReady} canReopen={!invoice} />
      : <div className="account-empty"><p>Pas encore de devis pour cet évènement. Il sera prérempli avec l’organisateur et l’évènement ; vous ajoutez les prestations en cliquant sur les tarifs.</p><button type="button" className="button button-dark" disabled={busy} onClick={newQuote}>{busy ? 'Préparation…' : 'Préparer le devis'}</button></div>)}

    {tab === 'facture' && (invoice
      ? <DocumentStep key={`facture-${invoice.doc.number}`} kind="facture" entry={invoice} event={event} prices={prices} onUpdate={entry => update('invoice', entry)} notify={notify} mailReady={mailReady} />
      : quote?.status === 'accepted'
        ? <div className="account-empty"><p>Le devis n° {quote.doc.number} est accepté. La facture reprend ses prestations ; vous pourrez encore la modifier (acompte, ligne en plus) avant de l’envoyer.</p><button type="button" className="button button-dark" disabled={busy} onClick={() => newInvoice(true)}>{busy ? 'Préparation…' : 'Émettre la facture'}</button></div>
        : <div className="account-empty"><p>La facture se prépare à partir du devis, une fois qu’il est accepté (bouton « Devis accepté » dans l’onglet Devis).</p><button type="button" className="link-button" disabled={busy} onClick={() => newInvoice(false)}>Faire une facture sans devis</button></div>)}
  </div>;
}
