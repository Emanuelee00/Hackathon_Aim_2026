import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { useProfile } from './ProfileProvider.jsx';
import { initials } from './profiles.js';
import './profiles.css';

export function Avatar({ profile, size = 'medium', photo = true }) {
  return <span className={`profile-avatar is-${size}`} aria-hidden="true">{photo && profile.photo ? <img src={profile.photo} alt="" /> : initials(profile.name)}</span>;
}

// « Qui êtes-vous ? » : juste après la connexion à l'espace équipe. On peut aussi ajouter une personne (seulement ici, connecté).
export default function ProfilePicker() {
  const { profiles, ready, error, choose, add } = useProfile();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const submit = async event => {
    event.preventDefault();
    const form = event.currentTarget.elements;
    const name = form.name.value.trim();
    if (!name) return setProblem('Indiquez un prénom.');
    setBusy(true); setProblem('');
    try { const profile = await add(name, form.role.value); choose(profile.id); } catch (failure) { setProblem(failure.message); setBusy(false); }
  };
  return <main className="profile-picker">
    <img className="profile-picker-logo" src="/logo-chez-marthe.png" alt="Chez Marthe" />
    <h1>Qui êtes-vous ?</h1>
    <p>Choisissez votre prénom pour retrouver votre espace : votre menu, vos rubriques préférées, vos couleurs.</p>
    {error && <p className="doc-error" role="alert">{error}</p>}
    {!ready && !error && <p>Chargement…</p>}
    <ul className="profile-grid">
      {profiles.map(profile => <li key={profile.id}><button type="button" className="profile-card" onClick={() => choose(profile.id)}>
        <Avatar profile={profile} size="large" photo={false} /><strong>{profile.name}</strong>{profile.role && <small>{profile.role}</small>}
      </button></li>)}
      {ready && <li>{adding
        ? <form className="profile-card profile-add-form" onSubmit={submit}>
          <label className="field"><span>Prénom</span><input name="name" autoFocus maxLength={60} /></label>
          <label className="field"><span>Rôle (facultatif)</span><input name="role" maxLength={100} /></label>
          {problem && <p className="doc-error" role="alert">{problem}</p>}
          <div className="profile-add-actions"><button className="button button-dark button-small" disabled={busy}>{busy ? 'Ajout…' : 'Ajouter'}</button><button type="button" className="button button-quiet button-small" onClick={() => setAdding(false)}>Annuler</button></div>
        </form>
        : <button type="button" className="profile-card profile-add" onClick={() => setAdding(true)}><span className="profile-avatar is-large"><Icon name="plus" size={30} /></span><strong>Ajouter une personne</strong><small>Nouvelle arrivée dans l’équipe</small></button>}</li>}
    </ul>
  </main>;
}
