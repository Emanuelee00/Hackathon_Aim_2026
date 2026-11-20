import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import Modal from '../../shared/components/Modal.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import './messages.css';

// {name} → its example, as the e-mail would read; a name that is not known is left as written.
const preview = (text, variables) => text.replace(/\{(\w+)\}/g, (all, name) => variables.find(variable => variable.name === name)?.example ?? all);

async function call(path, options) {
  const response = await fetch(`/api/messages${path}`, options).catch(() => null);
  if (!response) throw new Error('Le serveur est injoignable. Réessayez dans un instant.');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'L’enregistrement a échoué.');
  return data;
}

// One automatic e-mail: its subject and message can be edited, and saving asks to confirm so nothing changes by accident.
function MessageCard({ template, onChanged }) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [showPreview, setShowPreview] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'save' | 'reset'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const area = useRef(null);
  const changed = subject !== template.subject || body !== template.body;
  const original = subject === template.defaultSubject && body === template.defaultBody;
  const insert = name => {
    const field = area.current;
    const start = field?.selectionStart ?? body.length;
    const end = field?.selectionEnd ?? body.length;
    setBody(`${body.slice(0, start)}{${name}}${body.slice(end)}`);
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(start + name.length + 2, start + name.length + 2); });
  };
  const run = async () => {
    setBusy(true); setError('');
    try {
      const next = confirm === 'save'
        ? await call(`/${template.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, body }) })
        : await call(`/${template.id}`, { method: 'DELETE' });
      setSubject(next.subject); setBody(next.body);
      setConfirm(null);
      onChanged(next, confirm === 'save' ? 'Le message est enregistré : les prochains e-mails partiront avec ce texte.' : 'Le texte d’origine est rétabli.');
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  return <article className="panel message-card">
    <header>
      <h3>{template.title}</h3>
      {template.custom ? <span className="message-badge custom">Texte modifié</span> : <span className="message-badge">Texte d’origine</span>}
    </header>
    <dl className="message-meta">
      <div><dt>Service</dt><dd>{template.service}</dd></div>
      <div><dt>Quand</dt><dd>{template.trigger}</dd></div>
      <div><dt>Envoyé à</dt><dd>{template.recipient}</dd></div>
      <div><dt>E-mail utilisé</dt><dd>{template.from}</dd></div>
    </dl>
    <label className="field"><span>Objet</span><input value={subject} maxLength={150} onChange={event => setSubject(event.target.value)} /></label>
    <label className="field"><span>Message</span><textarea ref={area} rows={template.body.split('\n').length + 2} value={body} onChange={event => setBody(event.target.value)} /></label>
    <div className="message-variables" aria-label="Variables à insérer">
      <span>Cliquez pour insérer dans le message :</span>
      {template.variables.map(variable => <button type="button" key={variable.name} className="chip" title={`${variable.label} · exemple : ${variable.example.split('\n')[0]}`} onClick={() => insert(variable.name)}>{`{${variable.name}}`}</button>)}
    </div>
    {showPreview && <div className="message-preview" role="region" aria-label="Aperçu">
      <p className="message-preview-head"><b>Objet :</b> {preview(subject, template.variables)}</p>
      <pre>{preview(body, template.variables)}</pre>
    </div>}
    <div className="message-actions">
      <button type="button" className="button button-quiet button-small" onClick={() => setShowPreview(!showPreview)}><Icon name="mail" size={16} />{showPreview ? 'Masquer l’aperçu' : 'Voir un aperçu'}</button>
      {!original && <button type="button" className="button button-quiet button-small" onClick={() => { setError(''); setConfirm('reset'); }}>Rétablir le texte d’origine</button>}
      <span className="message-state" role="status">{changed ? 'Modifications non enregistrées' : ''}</span>
      <button type="button" className="button button-dark" disabled={!changed} onClick={() => { setError(''); setConfirm('save'); }}>Enregistrer</button>
    </div>
    {confirm && <Modal title={confirm === 'save' ? 'Enregistrer ce message ?' : 'Rétablir le texte d’origine ?'} subtitle="CONFIRMATION" onClose={() => setConfirm(null)}>
      <div className="message-confirm">
        <p>{confirm === 'save' ? <>Les prochains e-mails « <b>{template.title}</b> » partiront avec ce nouveau texte.</> : <>Votre texte sera remplacé par le texte d’origine pour « <b>{template.title}</b> ».</>}</p>
        {error && <p role="alert" className="message-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button button-quiet" onClick={() => setConfirm(null)}>Annuler</button>
          <button type="button" className="button button-dark" disabled={busy} onClick={run}>{busy ? 'Un instant…' : confirm === 'save' ? 'Oui, enregistrer' : 'Oui, rétablir'}</button>
        </div>
      </div>
    </Modal>}
  </article>;
}

// The address « Bonjour Chez Marthe » answers the forms from, shown above its messages and editable (saving asks to confirm).
function FormsSender({ forms, onChanged }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async address => {
    setBusy(true); setError('');
    try {
      const next = await call('/sender/forms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: address }) });
      onChanged(next);
      setConfirming(false); setOpen(false);
    } catch (failure) { setError(failure.message.includes('valide') || failure.message.includes('échoué') ? 'Cette adresse e-mail n’est pas valide.' : failure.message); setConfirming(false); } finally { setBusy(false); }
  };
  return <div className="message-identity">
    <span className="metric-icon sage"><Icon name="mail" size={20} /></span>
    <div><b>E-mail utilisé pour répondre aux formulaires : {forms.from}</b><p>Quand quelqu’un remplit un formulaire, la confirmation part de cette adresse, et sa réponse arrive dans cette boîte.</p></div>
    <button type="button" className="button button-quiet button-small" onClick={() => { setValue(forms.address); setError(''); setConfirming(false); setOpen(true); }}><Icon name="edit" size={15} />Changer l’adresse</button>
    {open && <Modal title="Adresse « Bonjour Chez Marthe »" subtitle="E-MAIL D’ENVOI" onClose={() => setOpen(false)}>
      <form className="message-confirm" onSubmit={event => { event.preventDefault(); setConfirming(true); }}>
        <label className="field"><span>Adresse e-mail</span><input type="email" required autoFocus value={value} onChange={event => { setValue(event.target.value); setConfirming(false); }} placeholder={forms.default} /></label>
        <p className="message-hint">Cette adresse doit être celle du compte relié au service d’envoi (par exemple le Gmail dont vous avez créé la « mot de passe d’application »), sinon le service la remplace.</p>
        {error && <p role="alert" className="message-error">{error}</p>}
        {confirming
          ? <div className="message-sure" role="alert"><p>Les prochaines réponses aux formulaires partiront de <b>{value.trim().toLowerCase()}</b>. Confirmer ?</p>
            <div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>Non</button><button type="button" className="button button-dark" disabled={busy} onClick={() => save(value.trim())}>{busy ? 'Un instant…' : 'Oui, enregistrer'}</button></div></div>
          : <div className="form-actions">
            {forms.address !== forms.default && <button type="button" className="button button-quiet" disabled={busy} onClick={() => save('')}>Revenir à {forms.default}</button>}
            <button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Annuler</button>
            <button className="button button-dark" disabled={!value.trim() || value.trim().toLowerCase() === forms.address}>Enregistrer</button></div>}
      </form>
    </Modal>}
  </div>;
}

export default function Messages() {
  const { notify } = useStore();
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState('');
  useEffect(() => { call('').then(setData).catch(error => setFailure(error.message)); }, []);
  const changed = (next, text) => { setData(current => ({ ...current, templates: current.templates.map(item => (item.id === next.id ? next : item)) })); notify(text); };
  const groups = data ? [...new Set(data.templates.map(template => template.group))] : [];
  return <>
    <PageIntro eyebrow="ESPACE ÉQUIPE · MESSAGES" title="Messages automatiques" description="Les e-mails que le site envoie tout seul. Modifiez le texte, enregistrez : les prochains e-mails partiront avec votre message." />
    {failure && <p className="form-error" role="alert">{failure}</p>}
    {!data && !failure && <p className="funding-muted">Chargement…</p>}
    {data && <>
      <section className="panel message-sender" aria-label="Service d’envoi">
        <span className="metric-icon sage"><Icon name="send" size={20} /></span>
        <div><b>Service d’envoi des e-mails</b><p>Branché une seule fois sur le serveur (Gmail avec mot de passe d’application, ou Resend) : ensuite tout part automatiquement.</p></div>
        <span className={`message-badge ${data.senders.configured ? 'on' : 'off'}`}>{data.senders.configured ? 'Envoi actif' : 'À brancher : rien n’est envoyé pour l’instant'}</span>
      </section>
      {groups.map(group => <section key={group} className="message-group" aria-label={group}>
        <h2>{group}</h2>
        {group === 'Bonjour Chez Marthe' && <FormsSender forms={data.senders.forms} onChanged={next => setData(current => ({ ...current, senders: next, templates: current.templates.map(item => (item.group === 'Bonjour Chez Marthe' ? { ...item, from: next.forms.from } : item)) }))} />}
        {data.templates.filter(template => template.group === group).map(template => <MessageCard key={template.id} template={template} onChanged={changed} />)}
      </section>)}
    </>}
  </>;
}
