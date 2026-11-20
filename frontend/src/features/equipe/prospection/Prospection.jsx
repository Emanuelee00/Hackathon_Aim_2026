import { useState } from 'react';
import { useStore } from '../../../app/store.jsx';
import Icon from '../../../shared/components/Icon.jsx';
import { Metric, PageIntro } from '../../../shared/components/Primitives.jsx';
import { download } from '../../../shared/lib/exports.js';
import { dateLabel } from '../../../shared/lib/format.js';
import { localToday } from '../funding/funding.js';
import { addedFunders, calls, euCalls, frCalls, guide, lastFunders, moreFunders, patrons, repertoire, strategy as seedStrategy, withEmails } from './prospectionData.js';
import SheetTable from './SheetTable.jsx';
import { fundingMatcher, fundingStatus } from './fundingMatches.js';
import { SHEETS, counts, toFunder, toSheet } from './sheets.js';
import useSharedList from './useSharedList.js';
import './prospection.css';

// « Financeurs potentiels » : où chercher de l'argent. Les quatre onglets du fichier de prospection de l'équipe
// (répertoire des financeurs, appels et échéances, stratégie, mode d'emploi), modifiables ici par toute l'équipe.
// Quand on décide de demander un financement, la ligne passe dans le tableau de bord « Financements » (suivi des dossiers).

const tabs = [['repertoire', 'Répertoire des financeurs'], ['calls', 'Appels et échéances'], ['strategy', 'Stratégie'], ['guide', 'Mode d’emploi'], ['europe', 'Appels européens'], ['france', 'Appels français'], ['patrons', 'Mécènes et investisseurs']];
// Le fichier de l'équipe, plus les pistes trouvées sur internet le 16 novembre 2026 (lignes en bleu), avec les e-mails trouvés.
const seedProspects = withEmails([...repertoire, ...addedFunders, ...moreFunders, ...lastFunders]);
const seedCalls = withEmails(calls);
const seedEurope = withEmails(euCalls);
const seedFrance = withEmails(frCalls);

async function saveExcel(sheets) {
  const response = await fetch('/api/prospection/excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheets }) }).catch(() => null);
  if (!response?.ok) throw new Error('L’enregistrement du fichier Excel a échoué.');
  download(`Financeurs potentiels - Chez Marthe ${localToday()}.xlsx`, await response.blob(), response.headers.get('Content-Type'));
}

export default function Prospection({ navigate }) {
  const { funders, saveFunder, notify } = useStore();
  // Les lignes déjà suivies dans « Financements » sont en rouge et ne peuvent pas y être envoyées une deuxième fois.
  const fundingAuto = fundingMatcher(funders);
  const fundingOf = row => fundingStatus(row, fundingAuto);
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('marthe-prospection-tab') || 'repertoire'; } catch { return 'repertoire'; } });
  const lists = {
    repertoire: useSharedList(SHEETS.repertoire.storeKey, seedProspects),
    calls: useSharedList(SHEETS.calls.storeKey, seedCalls),
    strategy: useSharedList(SHEETS.strategy.storeKey, seedStrategy),
    europe: useSharedList(SHEETS.europe.storeKey, seedEurope),
    france: useSharedList(SHEETS.france.storeKey, seedFrance),
    patrons: useSharedList(SHEETS.patrons.storeKey, patrons),
  };
  const today = localToday();
  const numbers = counts(lists.repertoire.items, lists.calls.items, today, lists.europe.items, lists.france.items);
  const choose = id => { setTab(id); try { sessionStorage.setItem('marthe-prospection-tab', id); } catch { /* l'onglet vaut pour cette visite */ } };
  const track = prospect => {
    if (fundingOf(prospect)) return notify(`« ${prospect.name} » est déjà dans les financements (« ${fundingOf(prospect)} »).`);
    saveFunder(toFunder(prospect));
    lists.repertoire.setItems(rows => rows.map(row => (row.id === prospect.id ? { ...row, trackedOn: today, status: row.status === 'Obtenu' ? row.status : 'Dossier en préparation' } : row)));
    notify(`« ${prospect.name} » est ajouté au suivi des financements (statut « À traiter »).`);
  };
  const exportAll = () => saveExcel(['repertoire', 'calls', 'strategy', 'europe', 'france', 'patrons'].map(id => toSheet(SHEETS[id], lists[id].items, [...SHEETS[id].columns.map(([key]) => key)]))
    .concat({ title: 'Mode d’emploi', columns: ['Objet', 'Texte'], rows: guide }))
    .then(() => notify('Fichier Excel enregistré dans vos téléchargements.'), error => notify(error.message));
  const error = Object.values(lists).map(list => list.error).find(Boolean);
  const ready = Object.values(lists).every(list => list.ready);

  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FINANCEURS POTENTIELS" title="Financeurs potentiels" description="Où chercher des financements : les pistes à contacter, les appels à surveiller et la stratégie. Quand vous décidez de demander, envoyez la piste dans le suivi des financements.">
      <div className="funding-actions">
        <button type="button" className="button button-quiet button-small" disabled={!ready} onClick={exportAll}><Icon name="download" size={16} />Enregistrer dans Excel</button>
        <button type="button" className="button button-quiet button-small" onClick={() => navigate('funding')}><Icon name="euro" size={16} />Suivi des financements</button>
      </div>
    </PageIntro>
    {error && <p role="alert" className="notice">{error}</p>}
    <section className="metrics-grid" aria-label="La prospection en chiffres">
      <Metric icon="sparkles" label="Adéquation très élevée" value={numbers.hot} caption="Pistes à privilégier" tone="peach" />
      <Metric icon="mail" label="À contacter" value={numbers.toContact} caption="Premier contact à prendre" tone="lavender" />
      <Metric icon="send" label="Demandes en cours" value={numbers.inProgress} caption="Contact pris ou dossier" />
      <Metric icon="clock" label="Échéances proches" value={numbers.soon.length} caption="Appels (France et Europe) dans les 45 jours" tone="sand" />
    </section>
    {numbers.soon.length > 0 && <section className="funding-alert prospection-soon" role="status">
      <strong>{numbers.soon.length}<small>{numbers.soon.length > 1 ? 'APPELS' : 'APPEL'}</small></strong>
      <p><b>Bientôt :</b> {numbers.soon.map(call => `${call.name} (${dateLabel(call.deadline)})`).join(' · ')}</p>
    </section>}
    <div className="doc-tabs prospection-tabs" role="tablist">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`doc-tab${tab === id ? ' active' : ''}`} onClick={() => choose(id)}>
      {label}{lists[id] ? <small> {lists[id].items.length}</small> : null}
    </button>)}</div>
    {tab === 'guide'
      ? <section className="panel prospection-guide"><dl>{guide.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
        <p className="funding-hint">Le bouton <Icon name="send" size={14} /> d’une ligne du répertoire ajoute la piste au tableau de bord « Financements » (statut « À traiter », avec ses informations), pour suivre la demande : échéance, tâches, relances.</p></section>
      : lists[tab].ready && <SheetTable key={tab} sheet={SHEETS[tab]} rows={lists[tab].items} onChange={lists[tab].setItems} onTrack={tab === 'repertoire' ? track : undefined} fundingAuto={fundingAuto} />}
  </>;
}
