import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import ProgressBar from '../../../shared/components/ProgressBar.jsx';
import { dateLabel } from '../../../shared/lib/format.js';
import { currentObjective, requestCvLines } from '../cvLines.js';

function CvLinesAnswer({ answer }) {
  const [copied, setCopied] = useState(-1);
  const copy = async (text, index) => { try { await navigator.clipboard.writeText(text); setCopied(index); } catch { setCopied(-2); } };
  return <div className="cv-ai-answer" role="status">
    <span className={`source-badge ${answer.source}`}>{answer.source === 'ai' ? 'Proposition de l’IA' : 'Suggestion guidée, sans IA'}</span>
    <ul>{answer.lines.map((item, index) => <li key={index}><p>{item.line}</p><button type="button" className="chip" onClick={() => copy(item.line, index)}>{copied === index ? <><Icon name="check" size={15} />Copié</> : 'Copier'}</button></li>)}</ul>
    {copied === -2 && <p className="field-error">Copie impossible ici : sélectionnez le texte à la main.</p>}
    <p className="plan-note"><Icon name="help" size={15} />{answer.advice}</p>
  </div>;
}

function CvLinesHelper({ skills, residentId }) {
  const [objective, setObjective] = useState(() => currentObjective(residentId));
  const [state, setState] = useState({ loading: false, error: '', answer: null });
  async function ask() {
    if (objective.trim().length < 2) { setState({ loading: false, error: 'Écrivez d’abord le métier que vous cherchez.', answer: null }); return; }
    setState({ loading: true, error: '', answer: null });
    try { setState({ loading: false, error: '', answer: await requestCvLines(objective.trim(), skills) }); }
    catch (reason) { setState({ loading: false, error: reason instanceof TypeError ? 'Connexion impossible. Vérifiez Internet puis réessayez.' : reason.message, answer: null }); }
  }
  return <div className="cv-ai">
    <label htmlFor={`cv-ai-${residentId}`}>Pour quel métier ?</label>
    <input id={`cv-ai-${residentId}`} className="plan-input" value={objective} maxLength="160" placeholder="Par exemple : vente" onChange={event => setObjective(event.target.value)} />
    <button type="button" className="button button-dark" disabled={state.loading} onClick={ask}><Icon name="sparkles" size={17} />{state.loading ? 'L’IA écrit…' : 'Demander à l’IA'}</button>
    {state.loading && <div role="status"><p className="plan-note">L’IA rédige vos phrases, quelques secondes.</p><ProgressBar label="Rédaction en cours" /></div>}
    {state.error && <p className="field-error" role="alert"><Icon name="help" size={16} />{state.error}</p>}
    {state.answer && <CvLinesAnswer answer={state.answer} />}
  </div>;
}

export default function CvSkillsPanel({ skills, residentId }) {
  return <section className="panel side-list">
    <h3>À mettre sur mon CV</h3>
    {skills.length > 0 ? <ul>{skills.map(({ skill, event }, index) => <li key={index}><strong>{skill}</strong><small>{event.title} · {dateLabel(event.date)}</small></li>)}</ul> : <p>Vos compétences apparaîtront ici après chaque activité suivie avec l’équipe.</p>}
    <details className="plan-details"><summary>Comment l’écrire sur un CV ?</summary><p>Indiquez la compétence avec le lieu et la date, dans « Expériences » ou « Compétences ». L’IA peut rédiger les phrases pour le métier que vous cherchez.</p>{skills.length > 0 && <CvLinesHelper skills={skills} residentId={residentId} />}</details>
  </section>;
}
