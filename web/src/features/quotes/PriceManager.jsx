import { useState } from 'react';
import { newSlug } from './priceList.js';

// « Modifier les tarifs » : changer le nom ou le prix d'un tarif, en ajouter, en retirer, ajouter un groupe. Enregistré sur le serveur, pour toute l'équipe.
const toNumber = text => Number(String(text).replace(',', '.'));

export default function PriceManager({ groups, onSave, onReset, onClose }) {
  const [draft, setDraft] = useState(() => groups.map(group => ({ ...group, items: group.items.map(item => ({ ...item, price: String(item.price).replace('.', ',') })) })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (gi, patch) => setDraft(current => current.map((group, i) => i === gi ? { ...group, ...patch } : group));
  const changeItem = (gi, ii, patch) => setDraft(current => current.map((group, i) => i === gi ? { ...group, items: group.items.map((item, j) => j === ii ? { ...item, ...patch } : item) } : group));
  const addItem = gi => setDraft(current => current.map((group, i) => i === gi ? { ...group, items: [...group.items, { id: newSlug('t'), name: '', price: '' }] } : group));
  const removeItem = (gi, ii) => setDraft(current => current.map((group, i) => i === gi ? { ...group, items: group.items.filter((_, j) => j !== ii) } : group));
  const addGroup = () => setDraft(current => [...current, { id: newSlug('g'), name: '', items: [{ id: newSlug('t'), name: '', price: '' }] }]);
  const removeGroup = gi => setDraft(current => current.filter((_, i) => i !== gi));

  const save = async () => {
    setError('');
    const clean = draft.map(group => ({ ...group, name: group.name.trim(), items: group.items.filter(item => item.name.trim()).map(item => ({ ...item, name: item.name.trim(), price: toNumber(item.price) || 0 })) })).filter(group => group.name);
    if (clean.some(group => group.items.some(item => item.price < 0))) return setError('Un prix ne peut pas être négatif.');
    setBusy(true);
    try { await onSave(clean); } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };

  return <div className="price-manager">
    <p className="doc-hint">Changez un nom ou un prix, ajoutez un tarif avec « + » ou retirez-le avec « × ». Ces tarifs sont partagés par toute l’équipe.</p>
    {draft.map((group, gi) => <div key={group.id} className="pm-group">
      <div className="pm-group-head">
        <input aria-label="Nom du groupe" value={group.name} onChange={event => change(gi, { name: event.target.value })} placeholder="Nom du groupe (un espace, « Autres »…)" />
        <button type="button" className="line-remove" onClick={() => removeGroup(gi)} aria-label="Retirer ce groupe">×</button>
      </div>
      {group.items.map((item, ii) => <div key={item.id} className="pm-item">
        <input aria-label="Nom du tarif" value={item.name} onChange={event => changeItem(gi, ii, { name: event.target.value })} placeholder="Nom du tarif (Journée, Ménage…)" />
        <label className="line-price"><input aria-label="Prix" inputMode="decimal" value={item.price} onChange={event => changeItem(gi, ii, { price: event.target.value })} placeholder="0,00" />€</label>
        <button type="button" className="line-remove" onClick={() => removeItem(gi, ii)} aria-label="Retirer ce tarif">×</button>
      </div>)}
      <button type="button" className="button button-quiet button-small" onClick={() => addItem(gi)}>+ Ajouter un tarif</button>
    </div>)}
    <button type="button" className="button button-quiet button-small" onClick={addGroup}>+ Ajouter un groupe</button>
    {error && <p className="doc-error" role="alert">{error}</p>}
    <div className="doc-actions">
      <button type="button" className="button button-dark" disabled={busy} onClick={save}>{busy ? 'Enregistrement…' : 'Enregistrer les tarifs'}</button>
      <button type="button" className="button button-quiet" disabled={busy} onClick={onClose}>Annuler</button>
      <button type="button" className="button button-quiet" disabled={busy} onClick={() => window.confirm('Revenir aux tarifs d’origine ? Vos changements seront perdus.') && onReset()}>Tarifs d’origine</button>
    </div>
  </div>;
}
