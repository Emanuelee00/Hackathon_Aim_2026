import { useMemo, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { spaces, TODAY } from '../../shared/data/spaces.js';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { availabilityFor, bookingsForDate } from './availability.js';
import SpaceCard from './components/SpaceCard.jsx';

export default function Spaces({ onBook, onOpen }) {
  const { events } = useStore();
  const [date, setDate] = useState(TODAY);
  const daily = useMemo(() => bookingsForDate(events, date), [date, events]);
  const occupied = spaces.filter(space => availabilityFor(space.id, date, events).confirmed.length).length;

  return <>
    <PageIntro eyebrow="LES LIEUX QUI NOUS RASSEMBLENT" title="Nos espaces" description="Trouvez le cadre juste pour chaque rencontre.">
      <label className="space-date"><Icon name="calendar" size={16} /><span className="sr-only">Date à consulter</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
    </PageIntro>
    <section className="space-overview" aria-label="Disponibilité des espaces"><div><strong>{spaces.length}</strong><span>espaces à faire vivre</span></div><div><strong>{spaces.length - occupied}</strong><span>disponibles ce jour</span></div><div><strong>{daily.length}</strong><span>réservations et demandes</span></div><div><strong>{spaces.reduce((sum, space) => sum + space.capacity, 0)}</strong><span>personnes accueillies</span></div></section>
    <div className="spaces-grid">{spaces.map(space => <SpaceCard key={space.id} space={space} availability={availabilityFor(space.id, date, events)} onBook={spaceId => onBook(spaceId, date)} onOpen={onOpen} />)}</div>
  </>;
}
