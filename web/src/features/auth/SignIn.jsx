import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { spaces, spaceUrl } from '../../shared/lib/spaces.js';
import { Brand } from '../landing/Landing.jsx';
import { signIn, signUp } from './api.js';

// Same rule as OPEN_SIGNUP in accounts/models.py: team and association accounts are created by the team.
const openSignUp = ['residents', 'benevoles'];

// Left panel of the page: a photo of the place and a word for each audience.
const welcome = {
  residents: { photo: '/chezmarthe/sororite.webp', title: 'Votre espace, à votre rythme', text: 'Vos propositions d’activités, votre parcours et votre plan emploi, au même endroit.' },
  equipe: { photo: '/chezmarthe/panneaux.webp', title: 'Coordonner la vie du lieu', text: 'Les demandes, le calendrier, les espaces et les bilans de Chez Marthe.' },
  benevoles: { photo: '/chezmarthe/jardin.webp', title: 'Merci pour le coup de main', text: 'Choisissez les missions qui vous plaisent, l’équipe vous confirme la veille.' },
  partenaires: { photo: '/chezmarthe/cantine.webp', title: 'Un seul agenda pour tout le lieu', text: 'Vos créneaux, votre agenda synchronisé et vos réservations d’espaces.' },
};

function Fields({ signingUp, form, change }) {
  return <>
    {signingUp && <label className="field"><span>Prénom</span><input name="name" value={form.name} onChange={change} autoComplete="given-name" required maxLength={120} /></label>}
    <label className="field"><span>Adresse e-mail</span><input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required /></label>
    <label className="field"><span>Mot de passe</span><input name="password" type="password" value={form.password} onChange={change} autoComplete={signingUp ? 'new-password' : 'current-password'} required minLength={8} />{signingUp && <small>8 caractères minimum.</small>}</label>
  </>;
}

export default function SignIn({ spaceId, onSignedIn }) {
  const space = spaces.find(item => item.id === spaceId);
  const intro = welcome[spaceId];
  const [signingUp, setSigningUp] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = ({ target }) => setForm(current => ({ ...current, [target.name]: target.value }));
  const submit = async formEvent => {
    formEvent.preventDefault();
    setBusy(true); setError('');
    try { onSignedIn(await (signingUp ? signUp : signIn)(spaceId, form)); }
    catch (failure) { setError(failure.message); setBusy(false); }
  };
  const switchMode = () => { setSigningUp(!signingUp); setError(''); };

  return <div className="auth-page">
    <aside className="auth-intro" style={{ '--auth-photo': `url(${intro.photo})` }}>
      <Brand />
      <div>
        <p className="cover-kicker"><Icon name={space.icon} size={16} />Espace {space.label}</p>
        <h2>{intro.title}</h2>
        <p>{intro.text}</p>
      </div>
      <a className="auth-back" href={spaceUrl(null)}><Icon name="back" size={15} />Retour à l’accueil</a>
    </aside>
    <main className="auth-main">
      <form className="auth-card" onSubmit={submit}>
        <h1>{signingUp ? 'Créer mon compte' : 'Bon retour parmi nous'}</h1>
        <p className="auth-lead">{signingUp ? 'Quelques secondes suffisent.' : 'Connectez-vous pour retrouver votre espace.'}</p>
        <Fields signingUp={signingUp} form={form} change={change} />
        {error && <p role="alert" className="field-error">{error}</p>}
        <button className="button button-dark button-large" disabled={busy}>{busy ? 'Un instant…' : signingUp ? 'Créer mon compte' : 'Se connecter'}</button>
        {openSignUp.includes(spaceId)
          ? <p className="auth-note">{signingUp ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'} <button type="button" className="text-link" onClick={switchMode}>{signingUp ? 'Se connecter' : 'En créer un'}</button></p>
          : <p className="auth-note">Les comptes de cet espace sont créés par l’équipe de Chez Marthe. Besoin d’un accès ? Écrivez-nous sur <a className="text-link" href="https://www.chezmarthe.org/" target="_blank" rel="noreferrer">chezmarthe.org</a>.</p>}
      </form>
    </main>
  </div>;
}
