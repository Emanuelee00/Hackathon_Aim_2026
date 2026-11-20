import { useState } from 'react';
import { satisfactionSummary, validateResponse } from '../satisfaction.js';

const questions = [['satisfaction', 'Satisfaction globale'], ['welcome', 'Qualité de l’accueil'], ['usefulness', 'Utilité de l’activité']];
const empty = { satisfaction: '', welcome: '', usefulness: '', comment: '' };

export default function SatisfactionPanel({ event, onSave }) {
  const [draft, setDraft] = useState(empty);
  const [message, setMessage] = useState('');
  const responses = event.satisfactionResponses || [];
  const summary = satisfactionSummary(responses);
  const submit = e => {
    e.preventDefault();
    const error = validateResponse(draft);
    if (error) return setMessage(error);
    onSave({ ...event, satisfactionResponses: [...responses, { ...draft, id: crypto.randomUUID(), recordedAt: new Date().toISOString() }] });
    setDraft(empty);
    setMessage('Merci, votre réponse a été enregistrée.');
  };
  return <section className="detail-copy"><h3>Questionnaire de satisfaction</h3>
    <p>Participation facultative, sans nom demandé. Une réponse par participant, à remplir ici ou à saisir avec l’équipe. Les réponses restent dans ce navigateur.</p>
    <p><strong>{summary.count} réponse(s)</strong> · Satisfaction : {summary.satisfaction}/5 · Accueil : {summary.welcome}/5 · Utilité : {summary.usefulness}/5</p>
    <form onSubmit={submit}><div className="form-grid">{questions.map(([key, label]) => <label className="field" key={key}><span>{label}</span><select aria-label={label} required value={draft[key]} onChange={e => setDraft({ ...draft, [key]: Number(e.target.value) })}><option value="">Choisir une note</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} / 5{value === 1 ? ' — Pas du tout' : value === 5 ? ' — Tout à fait' : ''}</option>)}</select></label>)}
      <label className="field field-full"><span>Commentaire facultatif</span><textarea value={draft.comment} maxLength={1000} onChange={e => setDraft({ ...draft, comment: e.target.value })} placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…" /></label></div>
      <button className="button button-dark">Enregistrer la réponse</button>{message && <p role="status">{message}</p>}
    </form>
    <details><summary>Consulter les réponses ({responses.length})</summary>{responses.map((response, index) => <p key={response.id}>Réponse {index + 1} · {response.satisfaction}/5 · Accueil {response.welcome}/5 · Utilité {response.usefulness}/5{response.comment && ` — ${response.comment}`}</p>)}</details>
  </section>;
}
