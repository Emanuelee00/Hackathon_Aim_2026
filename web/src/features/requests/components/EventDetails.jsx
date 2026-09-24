import AssociationsPanel from './AssociationsPanel.jsx';
import QueuePanel from './QueuePanel.jsx';
import SatisfactionPanel from '../../reports/components/SatisfactionPanel.jsx';
import { queueStatuses } from '../queue.js';
import { Badge } from '../../../shared/components/Primitives.jsx';
import Icon from '../../../shared/components/Icon.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel, money } from '../../../shared/lib/format.js';
import { requestTypes, requestQuestions } from '../workflow.js';
import RequestReview from './RequestReview.jsx';
import { exportEvent } from '../../../shared/lib/exports.js';

export default function EventDetails({ event, events, onSave, onEdit, onClose, notify }) {
  return <div className="event-detail">
    <div className="detail-summary"><Badge status={event.status} /><span>{requestTypes[event.requestType] || 'Type à préciser'} · {event.category || 'Sans catégorie'}</span></div>
    <div className="detail-grid"><div><small>Date et horaire</small><strong>{dateLabel(event.date)} · {event.start}–{event.end}</strong></div><div><small>Espace</small><strong>{spaceById[event.space].name}</strong></div><div><small>Organisateur</small><strong>{event.organizer}</strong></div><div><small>Participants</small><strong>{event.participants} personnes</strong></div><div><small>Recettes prévues</small><strong>{money(event.revenue)}</strong></div><div><small>Coûts prévus</small><strong>{money(event.costs)}</strong></div></div>
    <div className="detail-grid"><div><small>Responsable de l’événement</small><strong>{event.referent?.trim() || 'À renseigner'}</strong></div><div><small>Équipe / association du responsable</small><strong>{event.referentTeam?.trim() || 'À renseigner'}</strong></div></div>
    <section className="detail-copy"><h3>La demande</h3><p>{event.description || 'Aucune description renseignée.'}</p></section>
    {(requestQuestions[event.requestType] || []).map(([key, label]) => <section className="detail-copy" key={key}><h3>{label}</h3><p>{event[key] || 'À renseigner'}</p></section>)}
    {event.approval && <section className="detail-copy"><h3>Décision enregistrée · {event.approval.authority === 'committee' ? 'Comité de coordination' : 'Coordinatrice'}</h3><p>{event.approval.reviewer} · {event.approval.date}</p><p>{event.approval.note}</p></section>}
    {event.status === 'pending' && <RequestReview event={event} events={events} onSave={onSave} onClose={onClose} notify={notify} />}
    {queueStatuses.includes(event.status) && <QueuePanel event={event} onSave={onSave} />}
    <AssociationsPanel event={event} onSave={onSave} />
    {['confirmed', 'completed'].includes(event.status) && <SatisfactionPanel event={event} onSave={onSave} />}
    {event.report && <section className="detail-copy"><h3>Retour de la responsable</h3><p>{event.report.feedbackAuthor || 'Responsable à préciser'} · {event.report.feedbackTeam || 'Équipe à préciser'}</p><p>{event.report.feedback}</p></section>}
    <section className="opportunity-box"><Icon name="sparkles" size={20} /><div><small>OPPORTUNITÉ POUR LES RÉSIDENTES</small><p>{event.opportunity || 'À définir avec l’équipe et les résidentes concernées.'}</p></div></section>
    <div className="detail-actions"><button className="button button-quiet" onClick={() => exportEvent(event)}><Icon name="download" size={16} />Exporter</button><button className="button button-quiet" onClick={onEdit}>Modifier</button></div>
  </div>;
}
