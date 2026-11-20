import { useEffect, useRef, useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { TODAY } from '../../shared/data/spaces.js';
import { submitRequest } from '../../shared/lib/publicForms.js';
import { estimatePrice, requestAlerts } from '../../shared/lib/requestRules.js';
import { buildRequest, emptyForm, formErrors } from './publicRequest.js';
import RequestFields from './RequestFields.jsx';
import SpacePicker from './SpacePicker.jsx';

function Estimate({ request }) {
  const price = estimatePrice(request);
  // Louer un espace et Privatiser : l'estimation est gratuite (le tarif est confirmé par l'équipe après étude).
  const free = request.requestType === 'rental';
  return <aside className="panel request-estimate" aria-live="polite"><small className="eyebrow">ESTIMATION</small><strong>{free ? 'Gratuite' : price.label}</strong><p>{free ? 'L’estimation est gratuite et sans engagement : l’équipe étudie votre demande et vous confirme le tarif.' : price.note}</p>
    {requestAlerts(request).map(alert => <p key={alert.text} className={`request-alert ${alert.level}`}><Icon name={alert.level === 'no' ? 'close' : 'help'} size={15} />{alert.text}</p>)}</aside>;
}

function Done({ request, onAgain }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.scrollIntoView({ behavior: 'smooth' }); }, []);
  return <div className="panel request-done" tabIndex={-1} ref={ref}>
    <span className="verdict ok">Demande reçue</span><h2>Merci, {request.organizer}</h2>
    <p>Votre demande « {request.title} » est enregistrée sous la référence CM-{request.id.slice(-6)}. Vous recevrez une réponse après le comité de vendredi.</p>
    <ol className="request-steps"><li className="done">Demande reçue et enregistrée</li><li className="done">Pré-analyse par l’équipe</li><li>Passage au comité de coordination, vendredi</li><li>Réponse par e-mail et proposition de visite</li></ol>
    <button className="button button-quiet" onClick={onAgain}>Faire une autre demande</button>
  </div>;
}

// Single desk for every request: programming, rental, privatisation or coworking.
// `spaces` limits and renames the spaces offered; `hidePicker` hides the built-in cards when the page shows its
// own; `picked` ({ space, at }) selects a space from outside, e.g. a card of the home page.
export default function PublicRequest({ spaces, hidePicker = false, picked }) {
  const [form, setForm] = useState(emptyForm);
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null);
  const formRef = useRef(null);
  const set = (name, value) => { setForm(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: '' })); };
  const pick = space => {
    // « Coworker » et « Proposer une activité » passent par un formulaire Google : ici, on reste sur la location d'un espace.
    set('space', space === 'coworking' ? '' : space);
    if (form.kind === 'coworking' || form.kind === 'programming') set('kind', 'rental');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { if (picked?.space) pick(picked.space); }, [picked?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async e => {
    e.preventDefault();
    const found = formErrors(form, TODAY);
    if (Object.keys(found).length) { setErrors(found); return formRef.current?.querySelector(`#pr-${Object.keys(found)[0]}`)?.focus(); }
    const request = buildRequest(form);
    setSending(true); setSendError('');
    try {
      const { id } = await submitRequest(request);
      setSent({ ...request, id });
    } catch (failure) {
      setSendError(failure.message);
    } finally {
      setSending(false);
    }
  };
  return <section className="public-request" aria-labelledby="public-request-title">
    <div className="landing-hero"><p className="eyebrow">UN LIEU À PARTAGER</p><h2 id="public-request-title">Louer un espace ou proposer une activité</h2><p>L’équipe étudie chaque demande en comité, chaque vendredi.</p></div>
    {!hidePicker && <SpacePicker value={form.space} onPick={pick} />}
    {sendError && <p className="form-error" role="alert">{sendError}</p>}
    {sent ? <Done request={sent} onAgain={() => { setForm(emptyForm); setSent(null); }} /> : <div className="request-layout">
      <form className="panel event-form" ref={formRef} onSubmit={submit} noValidate><RequestFields form={form} errors={errors} set={set} spaces={spaces} /><div className="form-actions"><button className="button button-dark" disabled={sending}>{sending ? 'Envoi…' : 'Envoyer ma demande'}</button></div></form>
      <Estimate request={buildRequest(form)} />
    </div>}
  </section>;
}
