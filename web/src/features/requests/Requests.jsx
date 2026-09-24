import { useMemo, useState } from 'react';
import EventRow from '../../shared/components/EventRow.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';
import { useStore } from '../../app/store.jsx';

const filters = [
  ['all', 'Toutes'], ['pending', 'À étudier'], ['confirmed', 'Confirmées'],
  ['completed', 'Terminées'], ['cancelled', 'Refusées'],
];

export default function Requests({ onNew, onOpen }) {
  const { events } = useStore();
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => events.filter(event => {
    const matchesStatus = status === 'all' || event.status === status;
    const text = `${event.title} ${event.organizer} ${event.category}`.toLowerCase();
    return matchesStatus && text.includes(query.trim().toLowerCase());
  }), [events, query, status]);

  return <>
    <PageIntro eyebrow="DEMANDE D’OCCUPATION" title="Les projets à accueillir" description="Étudiez chaque proposition avec attention, puis décidez ensemble.">
      <button className="button button-dark" onClick={onNew}><Icon name="plus" size={17} />Nouvelle demande</button>
    </PageIntro>
    <section className="panel requests-page">
      <div className="request-tools">
        <label className="search-field"><Icon name="search" size={17} /><span className="sr-only">Rechercher</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un projet…" /></label>
        <div className="filter-tabs" aria-label="Filtrer les demandes">{filters.map(([value, label]) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{label}<span>{value === 'all' ? events.length : events.filter(event => event.status === value).length}</span></button>)}</div>
      </div>
      <div className="request-list">{shown.map(event => <EventRow key={event.id} event={event} onOpen={onOpen} />)}{!shown.length && <EmptyState title="Aucun projet trouvé" text="Modifiez votre recherche ou ajoutez une nouvelle demande." />}</div>
    </section>
  </>;
}
