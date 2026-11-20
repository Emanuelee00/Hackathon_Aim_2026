import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { syncSources } from '../../shared/data/associations.js';

// Demo sync: the association's weekly slots are added to the team's shared agenda.
export default function SyncPanel({ association, state, conflicts }) {
  const { savePartner, notify } = useStore();
  const [source, setSource] = useState(state.source || syncSources[0]);
  const [syncing, setSyncing] = useState(false);
  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      savePartner({ ...state, synced: true, source, syncedAt: new Date().toISOString() });
      setSyncing(false);
      notify(`${association.slots.length} créneau(x) de ${association.name} ajouté(s) à l’agenda commun.`);
    }, 1200);
  };
  return <div className="panel partner-panel"><h3>Synchroniser votre agenda</h3>
    <p>Outil actuel (à confirmer) : {association.tool}.</p>
    <div className="option-list" role="radiogroup" aria-label="Source de l’agenda">{syncSources.map(item => <label key={item}><input type="radio" name="sync-source" checked={source === item} onChange={() => setSource(item)} />{item}</label>)}</div>
    <button className="button button-dark" disabled={syncing} onClick={sync}>{syncing ? 'Lecture de votre agenda…' : state.synced ? 'Synchroniser à nouveau' : 'Synchroniser'}</button>
    {state.synced && <p role="status"><span className="verdict ok">{association.slots.length} créneau(x) importé(s)</span>{conflicts.length > 0 && <span className="verdict no">{conflicts.length} conflit(s) à arbitrer</span>} Depuis {state.source}, le {new Date(state.syncedAt).toLocaleDateString('fr-FR')}. Vos créneaux apparaissent dans l’agenda commun de l’équipe.</p>}
    <p className="hint">Démonstration : la lecture réelle de Google Agenda ou d’un lien iCal reste à brancher.</p>
  </div>;
}
