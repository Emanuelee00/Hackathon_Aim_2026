import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { preAnalysis, verdicts } from '../preAnalysis.js';
import { draftReply, mailtoLink } from '../replies.js';

const marks = { ok: 'check', warn: 'help', no: 'close' };

export function Verdict({ verdict }) {
  return <span className={`verdict ${verdict}`}>{verdicts[verdict]}</span>;
}

function ReplyDraft({ event, analysis, onSave, notify }) {
  const [text, setText] = useState(() => draftReply(event, analysis));
  const copy = () => navigator.clipboard?.writeText(text).then(() => notify('La réponse est copiée.'), () => notify('Copie impossible : sélectionnez le texte.'));
  const markSent = () => { onSave({ ...event, replySentAt: new Date().toISOString() }); notify('La réponse est notée comme envoyée.'); };
  return <div className="reply-draft">
    <label className="field"><span>Réponse proposée, à relire avant envoi</span><textarea rows="10" value={text} onChange={e => setText(e.target.value)} /></label>
    <div className="detail-actions"><button className="button button-quiet" onClick={copy}>Copier</button><a className="button button-quiet" href={mailtoLink(event, text)}>Ouvrir dans la messagerie</a><button className="button button-dark" onClick={markSent}>Marquer comme envoyée</button></div>
  </div>;
}

// Automatic pre-analysis: a decision aid, never a decision.
export default function PreAnalysisPanel({ event, events, onSave, notify }) {
  const [drafting, setDrafting] = useState(false);
  const analysis = preAnalysis(event, events);
  return <section className="detail-copy pre-analysis">
    <h3>Pré-analyse selon les règles du lieu</h3>
    <p><Verdict verdict={analysis.verdict} /> Tarif indicatif : <strong>{analysis.price.label}</strong> · {analysis.price.note}</p>
    <ul className="criteria">{analysis.criteria.map(criterion => <li key={criterion.label} className={criterion.level}><Icon name={marks[criterion.level]} size={15} /><span><strong>{criterion.label}</strong><small>{criterion.detail}</small></span></li>)}</ul>
    {event.replySentAt && <p>Réponse envoyée le {new Date(event.replySentAt).toLocaleDateString('fr-FR')}.</p>}
    {drafting ? <ReplyDraft event={event} analysis={analysis} onSave={onSave} notify={notify} /> : <button className="button button-quiet" onClick={() => setDrafting(true)}><Icon name="file" size={16} />Préparer une réponse</button>}
    <p className="hint">Aide à la décision calculée à partir de règles simples. La décision revient à l’équipe et au comité.</p>
  </section>;
}
