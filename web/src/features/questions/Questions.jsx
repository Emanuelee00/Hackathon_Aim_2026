import { useState } from 'react';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';

const filters = [['new', 'À traiter'], ['done', 'Traitées'], ['all', 'Toutes']];
const formatDate = value => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

function QuestionCard({ question, setStatus }) {
  const subject = encodeURIComponent(`Chez Marthe · votre question Q-${question.id}`);
  return <article className={`panel question-card ${question.status}`}>
    <div className="question-head"><span className="eyebrow">Q-{question.id} · {formatDate(question.created_at)}</span>{question.status === 'done' && <span className="verdict ok">Traitée</span>}</div>
    <p className="question-summary">{question.summary}</p>
    <p className="question-from"><strong>{question.name}</strong> · <a href={`mailto:${question.email}?subject=${subject}`}>{question.email}</a></p>
    <details><summary>Voir la conversation avec l’assistant</summary>
      <ol className="question-transcript">{question.transcript.map((turn, index) => <li key={index} className={turn.role}><small>{turn.role === 'user' ? question.name : 'Assistant'}</small>{turn.content}</li>)}</ol>
    </details>
    <div className="form-actions">
      <a className="button button-quiet button-small" href={`mailto:${question.email}?subject=${subject}`}><Icon name="send" size={15} />Répondre par e-mail</a>
      {question.status === 'new'
        ? <button className="button button-dark button-small" onClick={() => setStatus(question.id, 'done')}><Icon name="check" size={15} />Marquer comme traitée</button>
        : <button className="button button-quiet button-small" onClick={() => setStatus(question.id, 'new')}>Rouvrir</button>}
    </div>
  </article>;
}

export default function Questions({ questions, error, setStatus }) {
  const [filter, setFilter] = useState('new');
  const shown = questions.filter(question => filter === 'all' || question.status === filter);
  return <>
    <PageIntro eyebrow="ASSISTANT DE RENSEIGNEMENTS" title="Les questions reçues" description="Ce que l’assistant du site n’a pas pu trancher seul. Répondez par e-mail, puis marquez la question comme traitée." />
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="filter-tabs question-filters" aria-label="Filtrer les questions">{filters.map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}<span>{value === 'all' ? questions.length : questions.filter(question => question.status === value).length}</span></button>)}</div>
    <div className="question-list">{shown.map(question => <QuestionCard key={question.id} question={question} setStatus={setStatus} />)}
      {!shown.length && <EmptyState title="Aucune question ici" text="Les questions transmises par l’assistant du site apparaîtront dans cette liste." />}</div>
  </>;
}
