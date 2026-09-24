import { useStore } from '../../app/store.jsx';
import { money } from '../../shared/lib/format.js';
import { totals } from '../../shared/lib/planning.js';
import { PageIntro, Metric, EmptyState } from '../../shared/components/Primitives.jsx';
import Icon from '../../shared/components/Icon.jsx';
import EventRow from '../../shared/components/EventRow.jsx';
import Hero from './components/Hero.jsx';
import Upcoming from './components/Upcoming.jsx';
import ImpactCard from './components/ImpactCard.jsx';

export default function Dashboard({ onNew, onOpen, navigate }) {
  const { events } = useStore();
  const pending = events.filter(event => event.status === 'pending');
  const impact = totals(events);
  return <>
    <PageIntro eyebrow="JEUDI 24 SEPTEMBRE 2026" title="Bonjour, l’équipe !" description="Une belle journée pour faire vivre Chez Marthe."><span className="date-chip"><Icon name="calendar" size={16} />Septembre 2026</span></PageIntro>
    <Hero onNew={onNew} navigate={navigate} />
    <section className="metrics-grid" aria-label="Les chiffres du lieu"><Metric icon="inbox" label="Demandes à étudier" value={pending.length.toString().padStart(2, '0')} caption="De nouvelles idées à accueillir" tone="peach" /><Metric icon="calendar" label="Événements confirmés" value={events.filter(event => event.status === 'confirmed').length.toString().padStart(2, '0')} caption="Des rencontres à préparer" /><Metric icon="euro" label="Recettes réalisées" value={money(impact.revenue)} caption={`Sur ${impact.count} bilans renseignés`} tone="sand" /><Metric icon="users" label="Participations résidentes" value={impact.residents} caption="Présences cumulées, non uniques" tone="lavender" /></section>
    <div className="dashboard-grid"><div className="dashboard-primary"><section className="panel requests-panel"><div className="panel-heading"><div><h3>Les projets à accueillir <span className="count-label">{pending.length}</span></h3><p>Chaque demande est le début d’une nouvelle rencontre.</p></div><button className="text-link" onClick={() => navigate('requests')}>Tout voir<Icon name="arrow" size={16} /></button></div><div className="request-list">{pending.slice(0, 3).map(event => <EventRow key={event.id} event={event} onOpen={onOpen} />)}{!pending.length && <EmptyState title="Tout est à jour" text="Vous avez pris le temps de regarder chaque projet." />}</div></section>
      <section className="mission-strip"><span className="mission-icon"><Icon name="sparkles" size={25} /></span><div><h3>Et si chaque événement ouvrait une porte ?</h3><p>Le copilote vous aide à imaginer une place pour les résidentes.</p></div><button className="icon-button" aria-label="Découvrir les demandes et leur copilote" onClick={() => navigate('requests')}><Icon name="arrow" /></button></section>
      <Upcoming events={events} onOpen={onOpen} navigate={navigate} /></div><ImpactCard events={events} navigate={navigate} /></div>
    <p className="page-footnote"><span className="live-dot" />Un lieu solidaire, une histoire collective.<span>CHEZ MARTHE · MARSEILLE</span></p>
  </>;
}
