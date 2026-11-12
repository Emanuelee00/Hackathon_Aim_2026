import { useState } from 'react';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import DocBuilder from './DocBuilder.jsx';
import Editor from './Editor.jsx';
import './quotes.css';

// « Factures et devis » : créer un devis ou une facture (tarifs à cliquer, aperçu en direct), ou écrire librement dans l'éditeur ; téléchargement en Word ou PDF.
const kinds = { devis: 'Devis', facture: 'Facture', editeur: 'Document libre' };

export default function Quotes() {
  const [kind, setKind] = useState('devis');
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FACTURES ET DEVIS" title="Factures et devis" description="Choisissez les tarifs en un clic, vérifiez l’aperçu, puis téléchargez le document en Word ou en PDF." />
    <div className="doc-tabs" role="tablist">{Object.entries(kinds).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={kind === id} className={`doc-tab${kind === id ? ' active' : ''}`} onClick={() => setKind(id)}>{label}</button>)}</div>
    {/* Les deux modèles restent en mémoire quand on change d'onglet. */}
    <div hidden={kind !== 'devis'}><DocBuilder kind="devis" /></div>
    <div hidden={kind !== 'facture'}><DocBuilder kind="facture" /></div>
    {kind === 'editeur' && <Editor />}
  </>;
}
