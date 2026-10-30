import { useRef, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, Metric, PageIntro } from '../../shared/components/Primitives.jsx';
import { download } from '../../shared/lib/exports.js';
import { dateLabel } from '../../shared/lib/format.js';
import { daysBetween, emptyFunder, localToday, overdueTasks, urgentDeadline } from './funding.js';
import FundingCalendar from './components/FundingCalendar.jsx';
import FundingPanels from './components/FundingPanels.jsx';
import FundersTable from './components/FundersTable.jsx';
import FunderSheet from './components/FunderSheet.jsx';
import ImportConfirm from './components/ImportConfirm.jsx';
import ServerCopies from './components/ServerCopies.jsx';

async function readTracker(file) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/funders/import', { method: 'POST', body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'L’import a échoué.');
  return data.funders;
}

// The funders as the page shows them, in the format the import reads back.
async function saveTracker(funders) {
  const response = await fetch('/api/funders/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(funders) });
  if (!response.ok) throw new Error('L’enregistrement du fichier Excel a échoué.');
  download(`AAP retroplanning - Chez Marthe ${localToday()}.xlsx`, await response.blob(), response.headers.get('Content-Type'));
}

function UrgentBanner({ funder, today, onOpen }) {
  const days = daysBetween(today, funder.deadline);
  return <section className="funding-alert" role="status"><strong>{days}<small>{days > 1 ? 'JOURS' : 'JOUR'}</small></strong>
    <p><b>{funder.name} : clôture le {dateLabel(funder.deadline, { day: 'numeric', month: 'long', year: 'numeric' })}</b>{funder.amount && <span>{funder.amount.split('\n')[0]}</span>}</p>
    <button className="button button-dark button-small" onClick={() => onOpen(funder.id)}>Ouvrir la fiche</button>
  </section>;
}

export default function Funding() {
  const { funders, saveFunder, removeFunder, replaceFunders, notify } = useStore();
  const [openId, setOpenId] = useState(null);
  // The last task ticked in « Tâches en retard », the only one that can be put back.
  const [lastDone, setLastDone] = useState(null);
  // An import waiting for the team to confirm it replaces the current funders.
  const [pendingImport, setPendingImport] = useState(null);
  const fileInput = useRef(null);
  const today = localToday();
  const urgent = urgentDeadline(funders, today);
  const overdue = overdueTasks(funders, today);
  const opened = funders.find(funder => funder.id === openId);
  const count = status => funders.filter(funder => funder.status === status).length;
  const importFile = async event => {
    const [file] = event.target.files;
    event.target.value = '';
    try {
      const imported = { funders: await readTracker(file), name: file.name };
      if (funders.length) setPendingImport(imported);
      else applyImport(imported);
    } catch (error) { notify(error.message); }
  };
  const applyImport = imported => {
    replaceFunders(imported.funders);
    setPendingImport(null);
    notify(`${imported.funders.length} pistes importées depuis ${imported.name}.`);
  };
  const addFunder = () => { const funder = emptyFunder(); saveFunder(funder); setOpenId(funder.id); };
  const markDone = (funder, task) => {
    saveFunder({ ...funder, tasks: funder.tasks.map(item => item.id === task.id ? { ...item, done: true } : item) });
    setLastDone({ funderId: funder.id, taskId: task.id, text: task.text, name: funder.name });
    notify('Tâche marquée comme faite.');
  };
  const undoDone = () => {
    const funder = funders.find(item => item.id === lastDone.funderId);
    if (funder) saveFunder({ ...funder, tasks: funder.tasks.map(item => item.id === lastDone.taskId ? { ...item, done: false } : item) });
    setLastDone(null);
    notify('La tâche est de nouveau à faire.');
  };
  const importButton = <button className="button button-quiet button-small" onClick={() => fileInput.current.click()}><Icon name="file" size={16} />Importer depuis Excel</button>;
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FINANCEMENTS" title="Tableau de bord des financements" description={`${funders.length} pistes suivies · chaque modification est enregistrée automatiquement`}>
      <div className="funding-actions"><input ref={fileInput} type="file" accept=".xlsx" hidden onChange={importFile} />{importButton}
        <button className="button button-quiet button-small" disabled={!funders.length} onClick={() => saveTracker(funders).then(() => notify('Fichier Excel enregistré dans vos téléchargements.'), error => notify(error.message))}><Icon name="download" size={16} />Enregistrer dans Excel</button>
        <button className="button button-dark button-small" onClick={addFunder}><Icon name="plus" size={16} />Nouvelle piste</button></div>
    </PageIntro>
    {!funders.length ? <EmptyState title="Aucune piste pour l’instant" text="Importez votre fichier de suivi (onglet « Retroplanning » et « feuille de route ») ou ajoutez une première piste." action={importButton} /> : <>
      {urgent && <UrgentBanner funder={urgent} today={today} onOpen={setOpenId} />}
      <section className="metrics-grid" aria-label="Les financements en chiffres"><Metric icon="sparkles" label="Pistes prioritaires" value={count('priority')} caption="À traiter en premier" tone="peach" /><Metric icon="send" label="Dossiers déposés" value={count('submitted')} caption="En attente de réponse" tone="lavender" /><Metric icon="check" label="Presque validés" value={count('validated')} caption="Financements en bonne voie" /><Metric icon="clock" label="Tâches en retard" value={overdue.length} caption="Date dépassée, non cochées" tone="sand" /></section>
      <FundingCalendar funders={funders} today={today} onOpen={setOpenId} />
      <FundingPanels funders={funders} overdue={overdue} lastDone={lastDone} onOpen={setOpenId} onDone={markDone} onUndo={undoDone} />
      <FundersTable funders={funders} today={today} onSave={saveFunder} onOpen={setOpenId} onAdd={addFunder} />
      <ServerCopies funders={funders} />
    </>}
    {pendingImport && <ImportConfirm current={funders} pending={pendingImport} onConfirm={() => applyImport(pendingImport)} onCancel={() => setPendingImport(null)} />}
    {opened && <FunderSheet key={opened.id} funder={opened} onSave={saveFunder} onRemove={removeFunder} onClose={() => setOpenId(null)} />}
  </>;
}
