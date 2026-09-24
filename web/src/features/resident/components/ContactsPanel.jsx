import { EmptyState } from '../../../shared/components/Primitives.jsx';
import { dateLabel } from '../../../shared/lib/format.js';

export default function ContactsPanel({ contacts }) {
  return <div className="panel">
    {contacts.length > 0 && <ul className="cv-skills-list">{contacts.map(({ contact, event }, index) => <li key={index}><strong>{contact}</strong><small>Rencontré·e lors de « {event.title} » · {dateLabel(event.date)}</small></li>)}</ul>}
    {!contacts.length && <EmptyState title="Aucun contact enregistré" text="Un contact utile pour votre recherche apparaîtra ici dès qu’il sera documenté avec l’équipe." />}
  </div>;
}
