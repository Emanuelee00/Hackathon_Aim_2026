import { useEffect, useState } from 'react';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import DocBuilder from './DocBuilder.jsx';
import Editor from './Editor.jsx';
import { defaultGroups } from './priceList.js';
import './quotes.css';

// « Factures et devis » : créer un devis ou une facture (tarifs à cliquer, aperçu en direct), ou écrire librement dans l'éditeur ; téléchargement en Word ou PDF.
const kinds = { devis: 'Devis', facture: 'Facture', editeur: 'Document libre' };

async function ask(method, body) {
  const response = await fetch('/api/modeles/tarifs', { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify({ groups: body }) : undefined }).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  if (!response.ok) throw new Error(response.status === 422 ? 'Vérifiez les tarifs : chaque nom est obligatoire et chaque prix doit être un nombre positif.' : 'L’enregistrement a échoué.');
  return response.json();
}

export default function Quotes() {
  const [kind, setKind] = useState('devis');
  const [groups, setGroups] = useState(defaultGroups); // les tarifs de l'équipe s'ils ont été changés, sinon ceux d'origine
  useEffect(() => { ask('GET').then(data => { if (data.groups) setGroups(data.groups); }).catch(() => {}); }, []);
  const savePrices = async next => { const data = await ask('PUT', next); setGroups(data.groups); };
  const resetPrices = async () => { await ask('DELETE'); setGroups(defaultGroups); };
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FACTURES ET DEVIS" title="Factures et devis" description="Choisissez les tarifs en un clic, vérifiez l’aperçu, puis téléchargez le document en Word ou en PDF." />
    <div className="doc-tabs" role="tablist">{Object.entries(kinds).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={kind === id} className={`doc-tab${kind === id ? ' active' : ''}`} onClick={() => setKind(id)}>{label}</button>)}</div>
    {/* Les deux modèles restent en mémoire quand on change d'onglet. */}
    <div hidden={kind !== 'devis'}><DocBuilder kind="devis" groups={groups} onSavePrices={savePrices} onResetPrices={resetPrices} /></div>
    <div hidden={kind !== 'facture'}><DocBuilder kind="facture" groups={groups} onSavePrices={savePrices} onResetPrices={resetPrices} /></div>
    {kind === 'editeur' && <Editor />}
  </>;
}
