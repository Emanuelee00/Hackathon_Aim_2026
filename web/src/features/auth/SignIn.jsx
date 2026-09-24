import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { spaces, spaceUrl } from '../../shared/lib/spaces.js';
import { Brand } from '../landing/Landing.jsx';
import { signIn, signUp } from './api.js';

// Same rule as OPEN_SIGNUP in accounts/models.py: team accounts are created by the team.
const openSignUp = ['residents'];

function Fields({ signingUp, form, change }) {
  return <>
    {signingUp && <label className="field"><span>Prénom</span><input name="name" value={form.name} onChange={change} autoComplete="given-name" required maxLength={120} /></label>}
    <label className="field"><span>Adresse e-mail</span><input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required /></label>
    <label className="field"><span>Mot de passe</span><input name="password" type="password" value={form.password} onChange={change} autoComplete={signingUp ? 'new-password' : 'current-password'} required minLength={8} /></label>
  </>;
}

export default function SignIn({ spaceId, onSignedIn }) {
  const space = spaces.find(item => item.id === spaceId);
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

  return <div className="landing auth-page">
    <Brand />
    <form className="auth-card" onSubmit={submit}>
      <p className="eyebrow">ESPACE {space.label.toUpperCase()}</p>
      <h1>{signingUp ? 'Créer mon compte' : 'Se connecter'}</h1>
      <Fields signingUp={signingUp} form={form} change={change} />
      {error && <p role="alert" className="field-error">{error}</p>}
      <button className="button button-dark button-large" disabled={busy}>{signingUp ? 'Créer mon compte' : 'Se connecter'}</button>
      {openSignUp.includes(spaceId)
        ? <button type="button" className="text-link" onClick={switchMode}>{signingUp ? 'J’ai déjà un compte' : 'Pas encore de compte ? En créer un'}</button>
        : <p className="auth-note">Les comptes de cet espace sont créés par l’équipe de Chez Marthe.</p>}
    </form>
    <a className="text-link" href={spaceUrl(null)}><Icon name="back" size={15} />Retour à l’accueil</a>
  </div>;
}
