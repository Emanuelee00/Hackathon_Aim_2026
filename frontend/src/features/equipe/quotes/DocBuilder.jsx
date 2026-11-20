import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { blankDoc, checkDoc, docTotals, euros, newId, toNumber } from './accounting.js';
import DocPreview from './DocPreview.jsx';
import { downloadDoc, suggestNumber } from './documentsApi.js';
import PriceManager from './PriceManager.jsx';
import { designationOf } from './priceList.js';

// Créer un devis ou une facture : à gauche le client et les prestations (avec les tarifs à cliquer), à droite l'aperçu du document.
// Les fichiers Word et PDF sont fabriqués par le serveur (modeles.py). Seul, dans « Factures et devis », rien n'est enregistré sauf le
// numéro utilisé (partagé par l'équipe). Dans la fenêtre Comptabilité d'un évènement, `initial` est le document gardé dans l'évènement,
// `onChange` reçoit chaque modification et `children` remplace les boutons du bas ; `readOnly` montre seulement l'aperçu.

export default function DocBuilder({ kind, groups, onSavePrices, onResetPrices, initial, onChange, readOnly = false, children }) {
  const [doc, setDoc] = useState(() => initial || blankDoc());
  // Sans document de départ, le numéro proposé est le suivant de l'équipe (tant qu'on ne l'a pas changé à la main).
  const suggested = useRef('');
  const suggest = () => suggestNumber(kind).then(number => {
    setDoc(current => (current.number === suggested.current ? { ...current, number } : current));
    suggested.current = number;
  }).catch(() => {});
  useEffect(() => { if (!initial) suggest(); }, []);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } onChange?.(doc); }, [doc]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const [editing, setEditing] = useState(false);
  const lastLine = useRef(null);
  const set = (name, value) => setDoc(current => ({ ...current, [name]: value }));
  const setLine = (id, name, value) => setDoc(current => ({ ...current, lines: current.lines.map(line => line.id === id ? { ...line, [name]: value } : line) }));

  const { lines: priced, total, deposit, due } = useMemo(() => docTotals(kind, doc), [kind, doc]);

  const addItem = (group, item) => {
    setError('');
    setDoc(current => {
      const existing = current.lines.find(line => line.source === item.id);
      if (existing) return { ...current, lines: current.lines.map(line => line === existing ? { ...line, quantity: String(toNumber(line.quantity) + 1) } : line) };
      return { ...current, lines: [...current.lines, { id: newId(), source: item.id, designation: designationOf(group, item), quantity: '1', unit_price: String(item.price) }] };
    });
    setAdded(item.id);
    setTimeout(() => setAdded(''), 900);
  };
  const addFree = () => {
    setError('');
    setDoc(current => ({ ...current, lines: [...current.lines, { id: newId(), source: '', designation: '', quantity: '1', unit_price: '' }] }));
    setTimeout(() => lastLine.current?.focus(), 50);
  };
  const step = (id, delta) => setDoc(current => ({ ...current, lines: current.lines.map(line => line.id === id ? { ...line, quantity: String(Math.max(1, toNumber(line.quantity) + delta)) } : line) }));
  const remove = id => setDoc(current => ({ ...current, lines: current.lines.filter(line => line.id !== id) }));

  const download = async extension => {
    setError('');
    const problem = checkDoc(kind, doc);
    if (problem) return setError(problem);
    setBusy(extension);
    try { await downloadDoc(kind, doc, extension); } catch (failure) { setError(failure.message); } finally { setBusy(''); }
  };

  const downloads = <>
    <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('docx')}><Icon name="file" size={16} />{busy === 'docx' ? 'Préparation…' : 'Word'}</button>
    <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('pdf')}><Icon name="file" size={16} />{busy === 'pdf' ? 'Préparation…' : 'PDF'}</button>
  </>;
  if (readOnly) return <div className="doc-studio doc-readonly">
    <div className="doc-sticky">
      <DocPreview kind={kind} doc={{ ...doc, lines: priced }} total={total} deposit={deposit} />
      {error && <p className="doc-error" role="alert">{error}</p>}
      <div className="doc-actions">{downloads}{children}</div>
    </div>
  </div>;

  const label = kind === 'devis' ? 'devis' : 'facture';
  return <div className="doc-studio">
    <div className="doc-left">
      <section className="doc-card">
        <h3><span className="step">1</span>Le client</h3>
        <div className="doc-grid">
          <label className="field"><span>{kind === 'devis' ? 'Numéro du devis' : 'Numéro de la facture'} *</span><input value={doc.number} onChange={event => set('number', event.target.value)} /></label>
          <label className="field"><span>Date *</span><input type="date" value={doc.date} onChange={event => set('date', event.target.value)} /></label>
          <label className="field doc-wide"><span>Nom du client *</span><input value={doc.name} onChange={event => set('name', event.target.value)} placeholder="Association, entreprise ou personne" /></label>
          <label className="field doc-wide"><span>Adresse</span><input value={doc.address} onChange={event => set('address', event.target.value)} /></label>
          <label className="field"><span>Code postal</span><input value={doc.postal_code} onChange={event => set('postal_code', event.target.value)} /></label>
          <label className="field"><span>Ville</span><input value={doc.city} onChange={event => set('city', event.target.value)} /></label>
        </div>
      </section>

      <section className="doc-card">
        <h3><span className="step">2</span>Les prestations</h3>
        {editing
          ? <PriceManager groups={groups} onClose={() => setEditing(false)} onSave={async next => { await onSavePrices(next); setEditing(false); }} onReset={async () => { await onResetPrices(); setEditing(false); }} />
          : <>
            <p className="doc-hint">Cliquez sur un tarif pour l’ajouter au {label}. Un second clic ajoute une unité. <button type="button" className="link-button" onClick={() => setEditing(true)}>Modifier les tarifs</button></p>
            <div className="price-groups">{groups.filter(group => group.items.length).map(group => <div key={group.id} className="price-group">
              <b>{group.name}</b>
              <div className="price-chips">{group.items.map(item => <button key={item.id} type="button" className={`price-chip${added === item.id ? ' just-added' : ''}`} onClick={() => addItem(group, item)}>
                <span>{item.name}</span>
                <em>{item.price === 0 ? 'gratuit' : euros(item.price)}</em>
              </button>)}</div>
            </div>)}
            <div className="price-group"><b>Autre prestation</b><div className="price-chips"><button type="button" className="price-chip" onClick={addFree}><span>Ligne libre</span><em>+ ligne</em></button></div></div></div>
          </>}

        <div className="doc-lines2">
          {priced.length === 0 && <p className="doc-empty"><Icon name="file" size={18} />Aucune prestation pour l’instant.</p>}
          {priced.map((line, index) => <div key={line.id} className="line-card">
            <input aria-label="Désignation" className="line-name" value={line.designation} onChange={event => setLine(line.id, 'designation', event.target.value)} placeholder="Désignation" ref={index === priced.length - 1 ? lastLine : null} />
            <div className="line-qty" role="group" aria-label="Quantité">
              <button type="button" onClick={() => step(line.id, -1)} aria-label="Moins">−</button>
              <input aria-label="Quantité" inputMode="decimal" value={line.quantity} onChange={event => setLine(line.id, 'quantity', event.target.value)} />
              <button type="button" onClick={() => step(line.id, 1)} aria-label="Plus">+</button>
            </div>
            <label className="line-price"><input aria-label="Prix unitaire HT" inputMode="decimal" value={line.unit_price} onChange={event => setLine(line.id, 'unit_price', event.target.value)} placeholder="0,00" />€</label>
            <strong className="line-total">{euros(line.lineTotal)}</strong>
            <button type="button" className="line-remove" onClick={() => remove(line.id)} aria-label="Retirer cette ligne">×</button>
          </div>)}
        </div>
        <label className="field"><span>Nature de la prestation (facultatif)</span><input value={doc.nature} onChange={event => set('nature', event.target.value)} placeholder="Location de la Chapelle, atelier…" /></label>
        {kind === 'facture' && <label className="field"><span>Acompte déjà versé (€)</span><input inputMode="decimal" value={doc.deposit} onChange={event => set('deposit', event.target.value)} placeholder="0,00" /></label>}
      </section>
    </div>

    <aside className="doc-right">
      <div className="doc-sticky">
        <div className="doc-total-bar"><span>{kind === 'facture' ? 'À payer' : 'Total'}</span><strong>{euros(kind === 'facture' ? due : total)}</strong></div>
        <DocPreview kind={kind} doc={{ ...doc, lines: priced }} total={total} deposit={deposit} />
        {error && <p className="doc-error" role="alert">{error}</p>}
        <div className="doc-actions">
          {downloads}
          {children ?? <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => { suggested.current = ''; setDoc(blankDoc()); setError(''); suggest(); }}>Nouveau</button>}
        </div>
      </div>
    </aside>
  </div>;
}
