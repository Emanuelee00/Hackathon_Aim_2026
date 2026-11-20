import { useStore } from '../../app/store.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { spaceById, TODAY } from '../../shared/data/spaces.js';
import { dateLabel, shortDate } from '../../shared/lib/format.js';
import { preAnalysis } from '../requests/preAnalysis.js';
import { requestTypes } from '../requests/workflow.js';
import { Verdict } from '../requests/components/PreAnalysisPanel.jsx';
import { committeeColumns, nextFriday } from './board.js';

function Card({ event, verdict, onOpen }) {
  return <button className="committee-card" onClick={() => onOpen(event.id)}>
    <strong>{event.title}</strong>
    <small>{spaceById[event.space].name} · {shortDate(event.date)} · {event.start}</small>
    <small>{event.organizer} · {requestTypes[event.requestType] || 'Type à préciser'}{event.reviewStage === 'committee' ? ' · Inscrite au comité' : ''}</small>
    {verdict ? <Verdict verdict={verdict} /> : <span className={`verdict ${event.status === 'confirmed' ? 'ok' : 'no'}`}>{event.status === 'confirmed' ? 'Validée' : 'Refusée'} le {shortDate(event.approval.date)}</span>}
  </button>;
}

export default function Committee({ onOpen }) {
  const { events } = useStore();
  const columns = committeeColumns(events, event => preAnalysis(event, events).verdict);
  return <>
    <PageIntro eyebrow={`COMITÉ DE COORDINATION · ${dateLabel(nextFriday(TODAY), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}, 10 H`} title="Le comité du vendredi" description="Les demandes sont triées par la pré-analyse. La décision revient au comité : ouvrez une carte pour la consigner." />
    <section className="committee-board">{columns.map(column => <div className="committee-column panel" key={column.id}>
      <h3>{column.label}<span className="count-label">{column.items.length}</span></h3>
      {column.items.map(({ event, verdict }) => <Card key={event.id} event={event} verdict={verdict} onOpen={onOpen} />)}
      {!column.items.length && <p className="committee-empty">Aucune demande.</p>}
    </div>)}</section>
  </>;
}
