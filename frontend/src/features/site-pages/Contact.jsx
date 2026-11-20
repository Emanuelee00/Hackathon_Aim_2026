import { useState } from 'react';
import { sendContact } from '../../shared/lib/publicForms.js';
import SitePage from './SitePage.jsx';
import { association } from './association.js';

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '', website: '' };
const required = { name: 'Indiquez votre nom.', email: 'Indiquez votre e-mail.', subject: 'Indiquez le sujet.', message: 'Écrivez votre message.' };

function Field({ id, label, error, full, children }) {
  return <label className={`field ${full ? 'field-full' : 'field-wide'}`} htmlFor={`contact-${id}`}><span>{label}</span>{children}{error && <p className="form-error" id={`contact-${id}-error`}>{error}</p>}</label>;
}

// The form and the association's details, also shown on the home page.
export function ContactForm() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);
  const props = name => ({
    id: `contact-${name}`,
    value: form[name],
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
    onChange: e => { setForm({ ...form, [name]: e.target.value }); setErrors({ ...errors, [name]: '' }); },
  });
  const submit = async e => {
    e.preventDefault();
    const found = Object.fromEntries(Object.entries(required).filter(([name]) => !form[name].trim()));
    if (Object.keys(found).length) { setErrors(found); return document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus(); }
    setSending(true); setSendError('');
    try {
      await sendContact(form);
      setSent(true);
    } catch (failure) {
      setSendError(failure.message);
    } finally {
      setSending(false);
    }
  };

  return <div className="contact-layout">
      {sent
        ? <div className="panel request-done" role="status"><span className="verdict ok">Message envoyé</span><h2>Merci, {form.name}</h2><p>Nous vous répondrons à {form.email}.</p><button className="button button-quiet" onClick={() => { setForm(emptyForm); setSent(false); }}>Écrire un autre message</button></div>
        : <form className="panel event-form" onSubmit={submit} noValidate>
          {sendError && <p className="form-error" role="alert">{sendError}</p>}
          <div className="form-grid">
            <Field id="name" label="Nom *" error={errors.name}><input {...props('name')} autoComplete="name" /></Field>
            <Field id="email" label="E-mail *" error={errors.email}><input {...props('email')} type="email" autoComplete="email" /></Field>
            <Field id="phone" label="Téléphone"><input {...props('phone')} type="tel" autoComplete="tel" /></Field>
            <Field id="subject" label="Sujet *" error={errors.subject}><input {...props('subject')} /></Field>
            <Field id="message" label="Message *" error={errors.message} full><textarea {...props('message')} rows={7} /></Field>
            {/* Hidden from people: only spam robots fill it in. */}
            <input className="contact-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>
          <p className="contact-privacy">Vos informations servent uniquement à vous répondre. Voir notre <a href="/politique-de-confidentialite">politique de confidentialité</a>.</p>
          <div className="form-actions"><button className="button button-dark" disabled={sending}>{sending ? 'Envoi…' : 'Envoyer le message'}</button></div>
        </form>}
      <aside className="panel contact-details">
        <h2>{association.name}</h2>
        <p><a href={`mailto:${association.email}`}>{association.email}</a></p>
        <p>Siège social :<br />{association.address}</p>
      </aside>
  </div>;
}

export default function Contact() {
  return <SitePage eyebrow="CONTACT" title="Contactez-nous">
    <p>Une question, une idée, l’envie de vous impliquer ? Écrivez-nous : nous répondons généralement sous 1 à 2 jours ouvrables.</p>
    <ContactForm />
  </SitePage>;
}
