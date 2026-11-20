import { useEffect, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import Modal from '../../../shared/components/Modal.jsx';

// The address the follow-up reminders are sent to: shown under the page's buttons, and editable.
export default function ReminderMail({ notify }) {
  const [settings, setSettings] = useState(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let current = true;
    fetch('/api/funders/reminders/settings').then(response => (response.ok ? response.json() : null)).then(data => { if (current && data) setSettings(data); }).catch(() => {});
    return () => { current = false; };
  }, []);
  if (!settings) return null;
  const openDialog = () => { setValue(settings.email); setError(''); setOpen(true); };
  const save = async address => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/funders/reminders/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: address }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError('Cette adresse e-mail n’est pas valide.'); return; }
      setSettings(data);
      setOpen(false);
      notify(`Les rappels seront envoyés à ${data.email}.`);
    } catch { setError('Le serveur est injoignable. Réessayez dans un instant.'); } finally { setBusy(false); }
  };
  return <>
    <button type="button" className="button button-quiet button-small funding-mail-button" onClick={openDialog} title="Adresse qui reçoit les e-mails de rappel">
      <Icon name="mail" size={16} /><span>Rappels envoyés à <b>{settings.email}</b></span><Icon name="edit" size={14} />
    </button>
    {open && <Modal title="Adresse des rappels" subtitle="E-MAILS DE RELANCE" onClose={() => setOpen(false)}>
      <form className="funding-mail-form" onSubmit={event => { event.preventDefault(); save(value.trim()); }}>
        <p>Un an après l’obtention d’un financement (11 mois par défaut), un e-mail de rappel part à cette adresse pour penser à recontacter le financeur.</p>
        <label className="field"><span>Adresse e-mail</span><input type="email" required autoFocus value={value} onChange={event => setValue(event.target.value)} placeholder={settings.default} /></label>
        {error && <p role="alert" className="funding-test-error">{error}</p>}
        <div className="form-actions">
          {settings.email !== settings.default && <button type="button" className="button button-quiet" disabled={busy} onClick={() => save('')}>Revenir à {settings.default}</button>}
          <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Annuler</button>
          <button className="button button-dark" disabled={busy}>{busy ? 'Un instant…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>}
  </>;
}
