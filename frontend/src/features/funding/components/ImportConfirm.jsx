import Modal from '../../../shared/components/Modal.jsx';
import { importChanges } from '../importing.js';

const plural = (count, word) => `${count} ${word}${count > 1 ? 's' : ''}`;
const names = list => list.length > 4 ? `${list.slice(0, 4).join(', ')} et ${list.length - 4} autres` : list.join(', ');

export default function ImportConfirm({ current, pending, onConfirm, onCancel }) {
  const changes = importChanges(current, pending.funders);
  const lines = [['modifiée', changes.changed], ['nouvelle', changes.added], ['retirée', changes.removed]].filter(([, list]) => list.length);
  return <Modal title="Remplacer les pistes ?" onClose={onCancel}>
    <p>Le fichier « {pending.name} » contient {pending.funders.length} pistes ; le site en a {current.length}.</p>
    {changes.matched ? <ul className="funding-import-changes">
      <li>{plural(changes.unchanged, 'identique')}</li>
      {lines.map(([label, list]) => <li key={label}><b>{plural(list.length, label)}{label === 'retirée' ? ' du site' : ''}</b> : {names(list)}</li>)}
    </ul> : <p className="field-error">Ce fichier n’a pas été enregistré depuis les pistes actuelles du site : c’est le fichier d’origine, ou il date d’avant un autre import. Toutes les pistes du site seront remplacées, avec les tâches cochées et les modifications faites ici.</p>}
    <div className="form-actions"><button className="button button-quiet" onClick={onCancel}>Annuler</button><button className="button button-dark" onClick={onConfirm}>Remplacer les pistes</button></div>
  </Modal>;
}
