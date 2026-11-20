import Icon from '../../../shared/components/Icon.jsx';

export default function SpaceCard({ space, siteName, availability, onBook, onOpen }) {
  const occupied = availability.confirmed.length > 0;
  const schedule = [...availability.confirmed, ...availability.pending].sort((a, b) => a.start.localeCompare(b.start));
  return <article className="space-card panel">
    <div className={`space-visual ${space.color}`}><span className="space-icon"><Icon name={space.icon} size={30} /></span><span className={`availability ${occupied ? 'occupied' : 'free'}`}><i />{occupied ? `${availability.confirmed.length} créneau${availability.confirmed.length > 1 ? 'x' : ''}` : 'Disponible'}</span>{space.area != null && <strong>{space.area}<small>m²</small></strong>}</div>
    <div className="space-body"><div className="space-heading"><div><p className="eyebrow">ESPACE {(siteName ?? 'CHEZ MARTHE').toUpperCase()}</p><h2>{space.name}</h2></div><span>{space.rate != null ? <>{space.rate} €<small>/ heure</small></> : <>Sur devis<small>{space.unit === 'place' ? 'à la place' : 'cas par cas'}</small></>}</span></div><p>{space.description}</p>
      <div className="space-capacity">{space.capacity != null ? <span><Icon name="users" size={16} /><strong>{space.capacity}</strong> personnes</span> : <span><Icon name="help" size={16} />Capacité à préciser</span>}{space.equipment.map(item => <span key={item}><Icon name="check" size={13} />{item}</span>)}</div>
      <div className="space-schedule"><div><strong>Planning du jour</strong>{availability.pending.length > 0 && <small>{availability.pending.length} demande{availability.pending.length > 1 ? 's' : ''} en attente</small>}</div>{schedule.length ? schedule.map(event => <button key={event.id} onClick={() => onOpen(event.id)}><span>{event.start}–{event.end}</span><strong>{event.title}</strong>{event.status === 'pending' && <i>À étudier</i>}</button>) : <p>Aucune réservation confirmée.</p>}</div>
      <button className="button button-dark space-book" onClick={() => onBook(space.id)}>Faire une demande<Icon name="arrow" size={16} /></button>
    </div>
  </article>;
}
