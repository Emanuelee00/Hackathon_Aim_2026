import { useState } from 'react';
import { useStore } from '../../../app/store.jsx';
import { PageIntro } from '../../../shared/components/Primitives.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel } from '../../../shared/lib/format.js';
import { describe } from './accounting/accounting.js';
import DocBuilder from './invoicing/DocBuilder.jsx';
import { usePriceList } from './invoicing/documentsApi.js';
import Editor from './editor/Editor.jsx';
import './quotes.css';

// « Factures et devis » : le suivi des devis et factures des évènements, créer un devis ou une facture à part (tarifs à cliquer,
// aperçu en direct), ou écrire librement dans l'éditeur ; téléchargement en Word ou PDF.
const kinds = { suivi: 'Suivi des évènements', devis: 'Devis', facture: 'Facture', editeur: 'Document libre' };

function Follow({ onOpen }) {
  const { events } = useStore();
  const withAccounts = events.filter(event => event.accounting?.quote || event.accounting?.invoice).sort((a, b) => b.date.localeCompare(a.date));
  if (!withAccounts.length) return <p className="doc-hint">Aucun devis pour l’instant. Ouvrez un évènement (Demandes ou Calendrier) puis « Comptabilité » pour préparer son devis ; il apparaîtra ici.</p>;
  return <ul className="account-list">{withAccounts.map(event => <li key={event.id}>
    <button type="button" onClick={() => onOpen(event.id)}>
      <strong>{event.title}</strong>
      <span>{event.organizer} · {dateLabel(event.date)} · {spaceById[event.space]?.name}</span>
      <span>{describe('devis', event.accounting.quote)}</span>
      <span>{describe('facture', event.accounting.invoice)}</span>
    </button>
  </li>)}</ul>;
}

export default function Quotes({ onAccounting }) {
  const [kind, setKind] = useState('suivi');
  const prices = usePriceList();
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FACTURES ET DEVIS" title="Factures et devis" description="Le devis et la facture de chaque évènement se préparent dans sa fenêtre Comptabilité. Ici : leur suivi, et des documents à part." />
    <div className="doc-tabs" role="tablist">{Object.entries(kinds).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={kind === id} className={`doc-tab${kind === id ? ' active' : ''}`} onClick={() => setKind(id)}>{label}</button>)}</div>
    {kind === 'suivi' && <Follow onOpen={onAccounting} />}
    {/* Les deux modèles restent en mémoire quand on change d'onglet. */}
    <div hidden={kind !== 'devis'}><DocBuilder kind="devis" groups={prices.groups} onSavePrices={prices.save} onResetPrices={prices.reset} /></div>
    <div hidden={kind !== 'facture'}><DocBuilder kind="facture" groups={prices.groups} onSavePrices={prices.save} onResetPrices={prices.reset} /></div>
    {kind === 'editeur' && <Editor />}
  </>;
}
