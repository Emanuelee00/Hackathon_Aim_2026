import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import Modal from '../../shared/components/Modal.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { bookableSpaces } from '../../shared/data/spaces.js';
import { spaceUrl } from '../../shared/lib/spaces.js';
import { defaultRentalSpaces } from '../landing/rentalSpaces.js';
import { FOCUS, SITE_PHOTOS, blankForm, fromForm, move, shrinkPhoto, toForm } from './rentalCards.js';
import './rentals.css';

// « Louer un espace (site) » : les cartes de la page d'accueil, que l'équipe ajoute, modifie, range ou supprime.
// Chaque enregistrement est visible tout de suite sur le site (espaces.py).

async function call(method, body) {
  const response = await fetch('/api/espaces-a-louer', body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { method }).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Vérifiez les champs de la carte.');
  return data;
}

async function uploadPhoto(file) {
  const data = await shrinkPhoto(file);
  const response = await fetch('/api/espaces-a-louer/photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) }).catch(() => null);
  const answer = await response?.json().catch(() => ({}));
  if (!response?.ok) throw new Error(typeof answer?.detail === 'string' ? answer.detail : 'La photo n’a pas pu être envoyée.');
  return answer.url;
}

function CardForm({ initial, others, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);
  const set = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const field = name => ({ value: form[name], onChange: event => set(name, event.target.value) });
  const pickFile = async event => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { set('photo', await uploadPhoto(file)); } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };
  const submit = async event => {
    event.preventDefault();
    const { card, error: problem } = fromForm(form, others);
    if (problem) return setError(problem);
    setBusy(true); setError('');
    try { await onSave(card); } catch (failure) { setError(failure.message); setBusy(false); }
  };
  return <form className="rental-form" onSubmit={submit}>
    <label className="field"><span>Nom de l’espace *</span><input {...field('name')} required placeholder="Le Jardin" /></label>
    <div className="rental-photo">
      <img src={form.photo} alt="" style={{ objectPosition: form.focus }} />
      <div>
        <span className="rental-label">Photo</span>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickFile} />
        <button type="button" className="button button-quiet button-small" disabled={busy} onClick={() => fileInput.current.click()}><Icon name="download" size={15} />{busy ? 'Envoi…' : 'Choisir une photo sur l’ordinateur'}</button>
        <div className="rental-gallery" role="group" aria-label="Photos du site">{SITE_PHOTOS.map(photo => <button key={photo} type="button" aria-pressed={form.photo === photo} aria-label={`Photo ${photo.slice(6)}`} onClick={() => set('photo', photo)}><img src={photo} alt="" loading="lazy" /></button>)}</div>
        <label className="field"><span>Partie de la photo à montrer</span><select {...field('focus')}>{FOCUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
    </div>
    <label className="field"><span>Informations (une par ligne)</span><textarea rows={4} {...field('details')} placeholder={'Maximum 20 personnes\n28 m²\nSéminaires et réunions'} /></label>
    <label className="field"><span>Tarifs (une ligne par tarif : « libellé : prix »)</span><textarea rows={3} {...field('prices')} placeholder={'2 heures : 40 €\nJournée : 200 €'} /></label>
    <label className="field"><span>Note sous les tarifs</span><input {...field('note')} placeholder="Sonorisation : 50 € en plus." /></label>
    <label className="field"><span>Texte mis en avant (facultatif)</span><input {...field('exchange')} placeholder="Vous animez un atelier gratuit en échange." /></label>
    <fieldset className="rental-button"><legend>Quand on clique sur la carte</legend>
      <label><input type="radio" name="button" checked={form.button === 'form'} onChange={() => set('button', 'form')} /> Formulaire de demande pour l’espace
        <select {...field('space')} disabled={form.button !== 'form'} aria-label="Espace du formulaire"><option value="">Choisir…</option>{bookableSpaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
      <label><input type="radio" name="button" checked={form.button === 'link'} onChange={() => set('button', 'link')} /> Lien vers un autre site</label>
      {form.button === 'link' && <div className="rental-link"><input aria-label="Adresse du lien" {...field('linkUrl')} placeholder="https://…" /><input aria-label="Texte du bouton" {...field('linkLabel')} placeholder="Découvrir" /></div>}
      <label><input type="radio" name="button" checked={form.button === 'contact'} onChange={() => set('button', 'contact')} /> « Nous contacter » (formulaire de contact)</label>
    </fieldset>
    {error && <p className="doc-error" role="alert">{error}</p>}
    <div className="rental-actions"><button className="button button-dark" disabled={busy}>Enregistrer et publier</button><button type="button" className="button button-quiet" onClick={onCancel}>Annuler</button></div>
  </form>;
}

export default function RentalCards() {
  const { notify } = useStore();
  const [cards, setCards] = useState(null);
  const [custom, setCustom] = useState(false);
  const [editing, setEditing] = useState(null); // { index, form } ; index -1 : nouvelle carte
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    call('GET').then(data => { setCards(data.cards || defaultRentalSpaces); setCustom(Boolean(data.cards)); }, problem => { setCards(defaultRentalSpaces); setError(problem.message); });
  }, []);
  const publish = async (next, message) => {
    const data = await call('PUT', { cards: next });
    setCards(data.cards); setCustom(true); setError('');
    notify(message);
  };
  const saveCard = async card => {
    const next = editing.index < 0 ? [...cards, card] : cards.map((item, index) => (index === editing.index ? card : item));
    await publish(next, `« ${card.name} » est publiée sur la page d’accueil.`);
    setEditing(null);
  };
  const run = promise => promise.catch(problem => setError(problem.message));
  const reset = () => run(call('DELETE').then(() => { setCards(defaultRentalSpaces); setCustom(false); setRemoving(null); notify('Les six cartes d’origine sont de retour sur le site.'); }));
  const home = `${spaceUrl(null)}#espaces`;
  if (!cards) return <PageIntro eyebrow="ESPACE ÉQUIPE · SITE PUBLIC" title="Louer un espace" description="Chargement…" />;
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · SITE PUBLIC" title="Louer un espace" description="Les cartes de la partie « Louer un espace » de la page d’accueil. Chaque modification est publiée tout de suite sur le site.">
      <div className="funding-actions">
        <a className="button button-quiet button-small" href={home} target="_blank" rel="noreferrer"><Icon name="diagonal" size={15} />Voir sur le site</a>
        <button type="button" className="button button-dark button-small" onClick={() => setEditing({ index: -1, form: blankForm() })}><Icon name="plus" size={16} />Ajouter une carte</button>
      </div>
    </PageIntro>
    {error && <p className="doc-error" role="alert">{error}</p>}
    <div className="rental-grid">{cards.map((card, index) => <article key={card.id} className="rental-card">
      <img src={card.photo} alt="" loading="lazy" style={{ objectPosition: card.focus }} />
      <div className="rental-body">
        <h3>{card.name}</h3>
        <ul>{(card.details || []).map(detail => <li key={detail}>{detail}</li>)}</ul>
        {card.prices?.length > 0 && <dl>{card.prices.map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>)}</dl>}
        {card.note && <p>{card.note}</p>}
        {card.exchange && <p className="rental-exchange">{card.exchange}</p>}
        <p className="rental-target">{card.link ? `Lien : ${card.link.label} ↗` : card.space ? 'Bouton : Faire une demande' : 'Bouton : Nous contacter'}</p>
      </div>
      <div className="rental-tools">
        <button type="button" className="icon-button" aria-label={`Placer ${card.name} avant`} disabled={index === 0} onClick={() => run(publish(move(cards, index, -1), 'Ordre des cartes enregistré.'))}><Icon name="left" size={16} /></button>
        <button type="button" className="icon-button" aria-label={`Placer ${card.name} après`} disabled={index === cards.length - 1} onClick={() => run(publish(move(cards, index, 1), 'Ordre des cartes enregistré.'))}><Icon name="right" size={16} /></button>
        <button type="button" className="button button-quiet button-small" onClick={() => setEditing({ index, form: toForm(card) })}><Icon name="edit" size={15} />Modifier</button>
        {removing === card.id
          ? <span className="rental-confirm">Supprimer du site ?<button type="button" className="button button-small funding-remove-yes" onClick={() => run(publish(cards.filter(item => item.id !== card.id), `« ${card.name} » n’est plus sur le site.`).then(() => setRemoving(null)))}>Oui</button><button type="button" className="button button-quiet button-small" onClick={() => setRemoving(null)}>Non</button></span>
          : <button type="button" className="icon-button rental-delete" aria-label={`Supprimer ${card.name}`} onClick={() => setRemoving(card.id)}><Icon name="trash" size={16} /></button>}
      </div>
    </article>)}</div>
    {!cards.length && <p className="funding-muted">Aucune carte : la partie « Louer un espace » est vide sur le site.</p>}
    {custom && <p className="funding-hint">Les cartes ont été modifiées par l’équipe. {removing === 'reset'
      ? <>Revenir aux six cartes d’origine (les photos ajoutées seront effacées) ? <button type="button" className="text-link" onClick={reset}>Oui, revenir</button> · <button type="button" className="text-link" onClick={() => setRemoving(null)}>Non</button></>
      : <button type="button" className="text-link" onClick={() => setRemoving('reset')}>Revenir aux cartes d’origine</button>}</p>}
    {editing && <Modal title={editing.index < 0 ? 'Nouvelle carte' : `Modifier « ${cards[editing.index].name} »`} subtitle="LOUER UN ESPACE" onClose={() => setEditing(null)} wide>
      <CardForm initial={editing.form} others={editing.index < 0 ? cards : cards.filter((_, index) => index !== editing.index)} onSave={saveCard} onCancel={() => setEditing(null)} />
    </Modal>}
  </>;
}
