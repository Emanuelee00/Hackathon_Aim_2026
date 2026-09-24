import { useMemo, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { spaces, TODAY } from '../../shared/data/spaces.js';
import { sites } from '../../shared/data/sites.js';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { availabilityFor, bookingsForDate } from './availability.js';
import SpaceCard from './components/SpaceCard.jsx';

export default function Spaces({ onBook, onOpen }) {
  const { events } = useStore();
  const [date, setDate] = useState(TODAY);
  const [siteId, setSiteId] = useState(sites.find(site => site.real)?.id ?? sites[0].id);
  const site = sites.find(candidate => candidate.id === siteId);
  const siteSpaces = useMemo(() => spaces.filter(space => space.site === siteId), [siteId]);
  const siteSpaceIds = useMemo(() => new Set(siteSpaces.map(space => space.id)), [siteSpaces]);
  const daily = useMemo(() => bookingsForDate(events, date).filter(event => siteSpaceIds.has(event.space)), [date, events, siteSpaceIds]);
  const occupied = siteSpaces.filter(space => availabilityFor(space.id, date, events).confirmed.length).length;

  return <>
    <PageIntro eyebrow="LES LIEUX QUI NOUS RASSEMBLENT" title="Nos espaces" description="Trouvez le cadre juste pour chaque rencontre.">
      <div className="space-controls">
        <div className="site-tabs" role="tablist" aria-label="Antenne">{sites.map(candidate => <button key={candidate.id} type="button" className="chip" role="tab" aria-pressed={candidate.id === siteId} onClick={() => setSiteId(candidate.id)}>{candidate.name}</button>)}</div>
        <label className="space-date"><Icon name="calendar" size={16} /><span className="sr-only">Date à consulter</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      </div>
    </PageIntro>
    {site?.capacity != null && <p className="date-chip site-gauge"><Icon name="users" size={14} /> Jauge globale du lieu : {site.capacity} personnes</p>}
    <section className="space-overview" aria-label="Disponibilité des espaces"><div><strong>{siteSpaces.length}</strong><span>espaces à faire vivre</span></div><div><strong>{siteSpaces.length - occupied}</strong><span>disponibles ce jour</span></div><div><strong>{daily.length}</strong><span>réservations et demandes</span></div><div><strong>{siteSpaces.reduce((sum, space) => sum + (space.capacity || 0), 0)}</strong><span>personnes accueillies</span></div></section>
    <div className="spaces-grid">{siteSpaces.map(space => <SpaceCard key={space.id} space={space} siteName={site?.name} availability={availabilityFor(space.id, date, events)} onBook={spaceId => onBook(spaceId, date)} onOpen={onOpen} />)}</div>
  </>;
}
