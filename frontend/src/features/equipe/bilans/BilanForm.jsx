import { useEffect, useState } from 'react';
import { checkAnswers, entryFor, monthLabel, progress, saveBilan, toAnswers } from './bilans.js';

// Le bilan d'une structure pour un mois : ses questions, puis les questions communes. Les cases vides restent permises.
export default function BilanForm({ structure, month, entries, onSaved }) {
  const entry = entryFor(entries, structure.id, month);
  const initial = () => Object.fromEntries(Object.entries(entry?.answers || {}).map(([key, value]) => [key, String(value)]));
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  useEffect(() => { setError(''); setDone(''); }, [structure.id, month]);
  useEffect(() => { setForm(initial()); }, [structure.id, month, entry?.updatedAt]);
  const changed = JSON.stringify(toAnswers(structure, form)) !== JSON.stringify(toAnswers(structure, initial()));
  const set = (id, value) => { setForm(current => ({ ...current, [id]: value })); setDone(''); };
  const submit = async event => {
    event.preventDefault();
    const problem = checkAnswers(structure, form);
    if (problem) return setError(problem);
    setBusy(true); setError('');
    try {
      const saved = await saveBilan(structure.id, month, toAnswers(structure, form));
      onSaved(saved);
      setDone('Bilan enregistré. Vous pouvez le compléter plus tard.');
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };
  const { answered, total } = progress(structure, toAnswers(structure, form));
  return <form className="bilan-form" onSubmit={submit}>
    <p className="bilan-state">{entry ? `Enregistré le ${new Date(entry.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${entry.by ? ` par ${entry.by}` : ''}` : `Pas encore rempli pour ${monthLabel(month)}`} · {answered} / {total} réponses</p>
    {structure.sections.map(section => <fieldset key={section.title} className="bilan-section">
      <legend>{section.title}</legend>
      <div className="bilan-grid">{section.questions.map(question => <label key={question.id} className={`field${question.type === 'text' ? ' bilan-wide' : ''}`}>
        <span>{question.label}</span>
        {question.type === 'number'
          ? <input inputMode="decimal" value={form[question.id] || ''} onChange={event => set(question.id, event.target.value)} />
          : <textarea rows={3} value={form[question.id] || ''} onChange={event => set(question.id, event.target.value)} />}
        {question.help && <small>{question.help}</small>}
      </label>)}</div>
    </fieldset>)}
    {error && <p className="doc-error" role="alert">{error}</p>}
    {done && <p className="bilan-done" role="status">{done}</p>}
    <div className="bilan-actions"><button type="submit" className="button button-dark" disabled={busy || !changed}>{busy ? 'Enregistrement…' : 'Enregistrer le bilan'}</button></div>
  </form>;
}
