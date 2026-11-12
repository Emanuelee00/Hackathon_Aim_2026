import { useMemo, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import DocPreview from './DocPreview.jsx';
import { priceGroups } from './priceList.js';

// Créer un devis ou une facture : à gauche le client et les prestations (avec les tarifs à cliquer), à droite l'aperçu du document.
// Les fichiers Word et PDF sont fabriqués par le serveur (modeles.py) ; rien n'est enregistré, sauf le dernier numéro utilisé (dans ce navigateur).
const today = () => new Date().toISOString().slice(0, 10);
const toNumber = text => Number(String(text).replace(',', '.')) || 0;
const euros = amount => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
let counter = 0;
const newId = () => `l${Date.now()}-${counter++}`;

const counterKey = (kind, year) => `marthe-numero-${kind}-${year}`;
function nextNumber(kind) {
  const year = new Date().getFullYear();
  let last = 0;
  try { last = Number(localStorage.getItem(counterKey(kind, year))) || 0; } catch { /* navigateur sans stockage */ }
  return `${year}-${String(last + 1).padStart(3, '0')}`;
}
function rememberNumber(kind, number) {
  const match = /^(\d{4})-(\d+)$/.exec(number.trim());
  if (!match) return;
  try { localStorage.setItem(counterKey(kind, match[1]), String(Number(match[2]))); } catch { /* idem */ }
}
const blank = kind => ({ number: nextNumber(kind), date: today(), name: '', address: '', postal_code: '', city: '', nature: '', lines: [], deposit: '' });

export default function DocBuilder({ kind }) {
  const [doc, setDoc] = useState(() => blank(kind));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const lastLine = useRef(null);
  const set = (name, value) => setDoc(current => ({ ...current, [name]: value }));
  const setLine = (id, name, value) => setDoc(current => ({ ...current, lines: current.lines.map(line => line.id === id ? { ...line, [name]: value } : line) }));

  const priced = useMemo(() => doc.lines.map(line => {
    const quantity = toNumber(line.quantity);
    const price = toNumber(line.unit_price);
    return { ...line, quantity: line.quantity, price, lineTotal: Math.round(quantity * price * 100) / 100 };
  }), [doc.lines]);
  const total = priced.reduce((sum, line) => sum + line.lineTotal, 0);
  const deposit = kind === 'facture' ? toNumber(doc.deposit) : 0;

  const addItem = item => {
    setError('');
    setDoc(current => {
      const existing = item.id !== 'libre' && current.lines.find(line => line.source === item.id);
      if (existing) return { ...current, lines: current.lines.map(line => line === existing ? { ...line, quantity: String(toNumber(line.quantity) + 1) } : line) };
      return { ...current, lines: [...current.lines, { id: newId(), source: item.id, designation: item.label, quantity: '1', unit_price: item.price === null ? '' : String(item.price) }] };
    });
    setAdded(item.id);
    setTimeout(() => setAdded(''), 900);
    if (item.id === 'libre') setTimeout(() => lastLine.current?.focus(), 50);
  };
  const step = (id, delta) => setDoc(current => ({ ...current, lines: current.lines.map(line => line.id === id ? { ...line, quantity: String(Math.max(1, toNumber(line.quantity) + delta)) } : line) }));
  const remove = id => setDoc(current => ({ ...current, lines: current.lines.filter(line => line.id !== id) }));

  const download = async extension => {
    setError('');
    if (!doc.number.trim() || !doc.name.trim()) return setError(`Indiquez le numéro ${kind === 'devis' ? 'du devis' : 'de la facture'} et le nom du client.`);
    const lines = priced.filter(line => line.designation.trim());
    if (!lines.length) return setError('Ajoutez au moins une prestation : cliquez sur un tarif à gauche.');
    setBusy(extension);
    try {
      const body = { ...doc, deposit, lines: lines.map(line => ({ designation: line.designation, quantity: toNumber(line.quantity), unit_price: line.price })) };
      const response = await fetch(`/api/modeles/${kind}.${extension}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
      if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
      if (!response.ok) throw new Error(response.status === 422 ? 'Vérifiez les champs : quantités et prix doivent être des nombres positifs.' : 'Le téléchargement a échoué.');
      const url = URL.createObjectURL(await response.blob());
      Object.assign(document.createElement('a'), { href: url, download: `${kind === 'devis' ? 'Devis' : 'Facture'} ${doc.number}.${extension}`.replace('/', '-') }).click();
      URL.revokeObjectURL(url);
      rememberNumber(kind, doc.number);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy('');
    }
  };

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
        <p className="doc-hint">Cliquez sur un tarif pour l’ajouter au {label}. Un second clic ajoute une unité.</p>
        <div className="price-groups">{priceGroups.map(group => <div key={group.id} className="price-group">
          <b>{group.name}</b>
          <div className="price-chips">{group.items.map(item => <button key={item.id} type="button" className={`price-chip${added === item.id ? ' just-added' : ''}`} onClick={() => addItem(item)}>
            <span>{item.short}</span>
            <em>{item.price === null ? '+ ligne' : item.price === 0 ? 'gratuit' : euros(item.price)}</em>
          </button>)}</div>
        </div>)}</div>

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
        <div className="doc-total-bar"><span>{kind === 'facture' ? 'À payer' : 'Total'}</span><strong>{euros(kind === 'facture' ? total - deposit : total)}</strong></div>
        <DocPreview kind={kind} doc={{ ...doc, lines: priced }} total={total} deposit={deposit} />
        {error && <p className="doc-error" role="alert">{error}</p>}
        <div className="doc-actions">
          <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('docx')}><Icon name="file" size={16} />{busy === 'docx' ? 'Préparation…' : 'Word'}</button>
          <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('pdf')}><Icon name="file" size={16} />{busy === 'pdf' ? 'Préparation…' : 'PDF'}</button>
          <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => { setDoc(blank(kind)); setError(''); }}>Nouveau</button>
        </div>
      </div>
    </aside>
  </div>;
}
