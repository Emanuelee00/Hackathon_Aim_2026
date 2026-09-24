import { bookableSpaces } from '../../shared/data/spaces.js';
import { durations, technicalNeeds } from '../../shared/lib/requestRules.js';
import { requestKinds } from './publicRequest.js';

function Field({ id, label, error, wide, children }) {
  return <label className={`field ${wide ? 'field-full' : 'field-wide'}`} htmlFor={id}><span>{label}</span>{children}{error && <p className="form-error" id={`${id}-error`}>{error}</p>}</label>;
}

export default function RequestFields({ form, errors, set }) {
  const input = (name, props = {}) => <input id={`pr-${name}`} value={form[name]} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `pr-${name}-error` : undefined} onChange={e => set(name, e.target.value)} {...props} />;
  const toggleNeed = need => set('technical', form.technical.includes(need) ? form.technical.filter(item => item !== need) : [...form.technical, need]);
  return <>
    <div className="kind-picker" role="radiogroup" aria-label="Vous souhaitez">{Object.entries(requestKinds).map(([kind, [label, hint]]) => <label key={kind} className={form.kind === kind ? 'active' : ''}><input type="radio" name="kind" checked={form.kind === kind} onChange={() => set('kind', kind)} /><strong>{label}</strong><small>{hint}</small></label>)}</div>
    <div className="form-grid">
      <Field id="pr-title" label="Nom de l’activité *" error={errors.title}>{input('title', { placeholder: 'Ex. Cours de yoga doux' })}</Field>
      <Field id="pr-space" label="Espace *" error={errors.space}><select id="pr-space" value={form.kind === 'coworking' ? 'coworking' : form.space} disabled={form.kind === 'coworking'} onChange={e => set('space', e.target.value)}><option value="">Choisir un espace</option>{bookableSpaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}</select></Field>
      <Field id="pr-date" label="Date souhaitée *" error={errors.date}>{input('date', { type: 'date' })}</Field>
      <Field id="pr-duration" label="Durée"><select id="pr-duration" value={form.duration} onChange={e => set('duration', e.target.value)}>{Object.entries(durations).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <Field id="pr-start" label="Heure de début">{input('start', { type: 'time' })}</Field>
      <Field id="pr-participants" label="Personnes attendues *" error={errors.participants}>{input('participants', { type: 'number', min: 1 })}</Field>
      <Field id="pr-description" label="Décrivez votre projet *" error={errors.description} wide><textarea id="pr-description" rows="4" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ce que vous proposez, pour qui, et pourquoi Chez Marthe" /></Field>
    </div>
    <fieldset className="request-options"><legend>Besoins techniques</legend><div className="option-list">{Object.entries(technicalNeeds).map(([need, label]) => <label key={need}><input type="checkbox" checked={form.technical.includes(need)} onChange={() => toggleNeed(need)} />{label}</label>)}</div>
      <div className="option-list"><label><input type="checkbox" checked={form.openToResidents} onChange={() => set('openToResidents', !form.openToResidents)} />J’accepte d’ouvrir l’activité gratuitement aux femmes hébergées</label></div></fieldset>
    <div className="form-grid">
      <Field id="pr-organizer" label="Votre nom ou structure *" error={errors.organizer}>{input('organizer')}</Field>
      <Field id="pr-email" label="E-mail *" error={errors.email}>{input('email', { type: 'email' })}</Field>
    </div>
  </>;
}
