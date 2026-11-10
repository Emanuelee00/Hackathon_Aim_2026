import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import Editor from './Editor.jsx';
import './quotes.css';

// « Factures et devis »: fill in a quote or an invoice, see the totals, then download it in Word (to adjust) or PDF.
// The files are built by the server (modeles.py) from the association's template; nothing is stored.
const kinds = { devis: 'Créer un devis', facture: 'Créer une facture', editeur: 'Éditeur de document' };
const emptyLine = () => ({ designation: '', quantity: '1', unit_price: '' });
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ number: '', date: today(), name: '', address: '', postal_code: '', city: '', nature: '', lines: [emptyLine()], deposit: '' });
const toNumber = text => Number(String(text).replace(',', '.')) || 0;
const euros = amount => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export default function Quotes() {
  const [kind, setKind] = useState('devis');
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const set = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const setLine = (index, name, value) => setForm(current => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, [name]: value } : line) }));
  const lineTotal = line => Math.round(toNumber(line.quantity) * toNumber(line.unit_price) * 100) / 100;
  const total = form.lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const deposit = kind === 'facture' ? toNumber(form.deposit) : 0;

  const download = async extension => {
    setError('');
    if (!form.number.trim() || !form.name.trim()) return setError(kind === 'devis' ? 'Indiquez le numéro du devis et le nom du client.' : 'Indiquez le numéro de la facture et le nom du client.');
    const lines = form.lines.filter(line => line.designation.trim());
    if (!lines.length) return setError('Ajoutez au moins une prestation avec sa désignation.');
    setBusy(extension);
    try {
      const body = { ...form, lines: lines.map(line => ({ designation: line.designation, quantity: toNumber(line.quantity), unit_price: toNumber(line.unit_price) })), deposit };
      const response = await fetch(`/api/modeles/${kind}.${extension}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
      if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
      if (!response.ok) throw new Error(response.status === 422 ? 'Vérifiez les champs : quantités et prix doivent être des nombres positifs.' : 'Le téléchargement a échoué.');
      const url = URL.createObjectURL(await response.blob());
      const link = Object.assign(document.createElement('a'), { href: url, download: `${kind === 'devis' ? 'Devis' : 'Facture'} ${form.number}.${extension}`.replace('/', '-') });
      link.click();
      URL.revokeObjectURL(url);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy('');
    }
  };

  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · FACTURES ET DEVIS" title="Factures et devis" description="Remplissez un devis ou une facture, ou écrivez librement dans l’éditeur, puis téléchargez le document en Word (pour le modifier encore) ou en PDF." />
    <div className="doc-tabs" role="tablist">{Object.entries(kinds).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={kind === id} className={`doc-tab${kind === id ? ' active' : ''}`} onClick={() => { setKind(id); setError(''); }}>{label}</button>)}</div>
    {kind === 'editeur' ? <Editor /> : <form className="doc-form" onSubmit={event => event.preventDefault()}>
      <div className="doc-grid">
        <label className="field"><span>{kind === 'devis' ? 'Numéro du devis *' : 'Numéro de la facture *'}</span><input value={form.number} onChange={event => set('number', event.target.value)} placeholder="2026-001" /></label>
        <label className="field"><span>Date *</span><input type="date" value={form.date} onChange={event => set('date', event.target.value)} /></label>
        <label className="field doc-wide"><span>Nom du client *</span><input value={form.name} onChange={event => set('name', event.target.value)} placeholder="Association, entreprise ou personne" /></label>
        <label className="field doc-wide"><span>Adresse</span><input value={form.address} onChange={event => set('address', event.target.value)} /></label>
        <label className="field"><span>Code postal</span><input value={form.postal_code} onChange={event => set('postal_code', event.target.value)} /></label>
        <label className="field"><span>Ville</span><input value={form.city} onChange={event => set('city', event.target.value)} /></label>
        <label className="field doc-wide"><span>Nature de la prestation</span><input value={form.nature} onChange={event => set('nature', event.target.value)} placeholder="Location de la Chapelle, atelier…" /></label>
      </div>
      <h3>Prestations</h3>
      <div className="doc-lines">
        <div className="doc-line doc-line-head"><span>Désignation</span><span>Quantité</span><span>Prix unit. HT (€)</span><span>Total</span><span /></div>
        {form.lines.map((line, index) => <div key={index} className="doc-line">
          <input aria-label="Désignation" value={line.designation} onChange={event => setLine(index, 'designation', event.target.value)} placeholder="Désignation" />
          <input aria-label="Quantité" inputMode="decimal" value={line.quantity} onChange={event => setLine(index, 'quantity', event.target.value)} />
          <input aria-label="Prix unitaire HT" inputMode="decimal" value={line.unit_price} onChange={event => setLine(index, 'unit_price', event.target.value)} placeholder="0,00" />
          <strong>{euros(lineTotal(line))}</strong>
          <button type="button" className="button button-quiet button-small" aria-label="Retirer cette ligne" disabled={form.lines.length === 1} onClick={() => setForm(current => ({ ...current, lines: current.lines.filter((_, i) => i !== index) }))}>×</button>
        </div>)}
      </div>
      <button type="button" className="button button-quiet button-small" disabled={form.lines.length >= 30} onClick={() => setForm(current => ({ ...current, lines: [...current.lines, emptyLine()] }))}>+ Ajouter une prestation</button>
      <dl className="doc-totals">
        <div><dt>Total hors taxe</dt><dd>{euros(total)}</dd></div>
        {kind === 'facture' && <>
          <div><dt><label htmlFor="deposit">Acompte versé (€)</label></dt><dd><input id="deposit" inputMode="decimal" value={form.deposit} onChange={event => set('deposit', event.target.value)} placeholder="0,00" /></dd></div>
          <div><dt>Total HT à payer</dt><dd>{euros(total - deposit)}</dd></div>
        </>}
        <div className="doc-final"><dt>Total TTC en euros</dt><dd>{euros(kind === 'facture' ? total - deposit : total)}</dd></div>
      </dl>
      <p className="doc-note">TVA non applicable, article 293 B du CGI. L’IBAN et les conditions de paiement de l’association sont ajoutés automatiquement.</p>
      {error && <p className="doc-error" role="alert">{error}</p>}
      <div className="doc-actions">
        <button type="button" className="button button-dark" disabled={!!busy} onClick={() => download('docx')}><Icon name="file" size={16} />{busy === 'docx' ? 'Préparation…' : 'Télécharger en Word'}</button>
        <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => download('pdf')}><Icon name="file" size={16} />{busy === 'pdf' ? 'Préparation…' : 'Télécharger en PDF'}</button>
        <button type="button" className="button button-quiet" disabled={!!busy} onClick={() => { setForm(blank()); setError(''); }}>Tout effacer</button>
      </div>
    </form>}
  </>;
}
