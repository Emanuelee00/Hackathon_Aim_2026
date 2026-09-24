import { dateLabel } from '../../../shared/lib/format.js';

export default function ContactsPanel({ contacts }) {
  return <section className="panel side-list">
    <h3>Mes contacts</h3>
    {contacts.length > 0 ? <ul>{contacts.map(({ contact, event }, index) => <li key={index}><strong>{contact}</strong><small>Rencontré lors de « {event.title} » · {dateLabel(event.date)}</small></li>)}</ul> : <p>Les personnes utiles rencontrées pendant vos activités apparaîtront ici.</p>}
  </section>;
}
