import { Badge } from '../../../shared/components/Primitives.jsx';
import Icon from '../../../shared/components/Icon.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel, money } from '../../../shared/lib/format.js';
import { validateEvent } from '../../../shared/lib/planning.js';
import { exportEvent } from '../../../shared/lib/exports.js';

export default function EventDetails({ event, events, onSave, onEdit, onClose, notify }) {
  const decide = status => {
    if (status === 'confirmed') {
      const error = validateEvent(event, events, true);
      if (error) return notify(error);
    }
    onSave({ ...event, status });
    notify(status === 'confirmed' ? 'La demande est confirmée.' : 'La demande est refusée.');
    onClose();
  };

  return <div className="event-detail">
    <div className="detail-summary"><Badge status={event.status} /><span>{event.category || 'Sans catégorie'}</span></div>
    <div className="detail-grid"><div><small>Date et horaire</small><strong>{dateLabel(event.date)} · {event.start}–{event.end}</strong></div><div><small>Espace</small><strong>{spaceById[event.space].name}</strong></div><div><small>Organisateur</small><strong>{event.organizer}</strong></div><div><small>Participants</small><strong>{event.participants} personnes</strong></div><div><small>Recettes prévues</small><strong>{money(event.revenue)}</strong></div><div><small>Coûts prévus</small><strong>{money(event.costs)}</strong></div></div>
    <section className="detail-copy"><h3>La demande</h3><p>{event.description || 'Aucune description renseignée.'}</p></section>
    <section className="opportunity-box"><Icon name="sparkles" size={20} /><div><small>OPPORTUNITÉ POUR LES RÉSIDENTES</small><p>{event.opportunity || 'À définir avec l’équipe et les résidentes concernées.'}</p></div></section>
    <div className="detail-actions"><button className="button button-quiet" onClick={() => exportEvent(event)}><Icon name="download" size={16} />Exporter</button><button className="button button-quiet" onClick={onEdit}>Modifier</button>{event.status === 'pending' && <><button className="button button-danger" onClick={() => decide('cancelled')}>Refuser</button><button className="button button-dark" onClick={() => decide('confirmed')}><Icon name="check" size={16} />Confirmer</button></>}</div>
  </div>;
}
