import { useRef, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import { SITE_PHOTOS } from '../site/rentalCards.js';
import { Avatar } from './ProfilePicker.jsx';
import { useProfile } from './ProfileProvider.jsx';
import { MENU_COLORS, PAGE_COLORS, uploadPhoto } from './profiles.js';

// Un fond : aucun, une couleur (proposée ou au choix), une photo du site ou une image de l'ordinateur.
function BackgroundPicker({ title, value, colors, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async event => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { onChange({ kind: 'image', value: await uploadPhoto(file) }); } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };
  const is = (kind, choice) => value.kind === kind && value.value === choice;
  return <fieldset className="profile-bg">
    <legend>{title}</legend>
    <div className="profile-swatches" role="group" aria-label={`${title} : couleur`}>
      <button type="button" className={`profile-swatch is-none${value.kind === 'none' ? ' active' : ''}`} aria-pressed={value.kind === 'none'} onClick={() => onChange({ kind: 'none', value: '' })}>Par défaut</button>
      {colors.map(color => <button key={color} type="button" className={`profile-swatch${is('color', color) ? ' active' : ''}`} aria-pressed={is('color', color)} aria-label={`Couleur ${color}`} style={{ background: color }} onClick={() => onChange({ kind: 'color', value: color })} />)}
      <label className="profile-swatch is-custom" title="Une autre couleur"><input type="color" value={value.kind === 'color' ? value.value : colors[0]} onChange={event => onChange({ kind: 'color', value: event.target.value })} aria-label={`${title} : autre couleur`} /><Icon name="palette" size={16} /></label>
    </div>
    <div className="rental-gallery profile-gallery" role="group" aria-label={`${title} : image`}>
      {value.kind === 'image' && !SITE_PHOTOS.includes(value.value) && <button type="button" aria-pressed="true" aria-label="Votre image"><img src={value.value} alt="" /></button>}
      {SITE_PHOTOS.map(photo => <button key={photo} type="button" aria-pressed={is('image', photo)} aria-label={`Photo ${photo.slice(6)}`} onClick={() => onChange({ kind: 'image', value: photo })}><img src={photo} alt="" loading="lazy" /></button>)}
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    <button type="button" className="button button-quiet button-small" disabled={busy} onClick={() => input.current.click()}><Icon name="download" size={15} />{busy ? 'Envoi…' : 'Une image de mon ordinateur'}</button>
    {error && <p className="doc-error" role="alert">{error}</p>}
  </fieldset>;
}

// « Mon espace » : ses fonds (page et menu), son prénom et son rôle. Chaque choix est enregistré tout de suite.
export default function ProfileSettings({ onClose }) {
  const { profile, update, remove } = useProfile();
  const [confirm, setConfirm] = useState(false);
  const set = changes => update({ ...profile, ...changes });
  return <Modal title={`L’espace de ${profile.name}`} subtitle="PERSONNALISER" onClose={onClose} wide>
    <div className="profile-settings">
      <section className="profile-me"><Avatar profile={profile} size="large" />
        <label className="field"><span>Prénom</span><input defaultValue={profile.name} maxLength={60} onBlur={event => { const name = event.target.value.trim(); if (name && name !== profile.name) set({ name }); }} /></label>
        <label className="field"><span>Rôle</span><input defaultValue={profile.role} maxLength={100} onBlur={event => { if (event.target.value.trim() !== profile.role) set({ role: event.target.value.trim() }); }} /></label>
      </section>
      <BackgroundPicker title="Fond de la page" value={profile.pageBackground} colors={PAGE_COLORS} onChange={pageBackground => set({ pageBackground })} />
      <BackgroundPicker title="Fond du menu" value={profile.menuBackground} colors={MENU_COLORS} onChange={menuBackground => set({ menuBackground })} />
      <p className="funding-hint"><Icon name="grip" size={14} /> Pour ranger votre menu et mettre en avant vos rubriques : « Ranger mon menu », en haut du menu à gauche.</p>
      <div className="profile-danger">{confirm
        ? <><span>Supprimer l’espace de {profile.name} ? Son menu et ses fonds seront effacés.</span><button type="button" className="button button-small funding-remove-yes" onClick={() => { remove(profile.id); onClose(); }}>Oui, supprimer</button><button type="button" className="button button-quiet button-small" onClick={() => setConfirm(false)}>Annuler</button></>
        : <button type="button" className="text-link" onClick={() => setConfirm(true)}>Supprimer cet espace</button>}</div>
      <div className="advice-actions"><button type="button" className="button button-dark" onClick={onClose}>Terminé</button></div>
    </div>
  </Modal>;
}
