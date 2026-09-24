import { satisfactionSummary } from './satisfaction.js';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, Metric, PageIntro } from '../../shared/components/Primitives.jsx';
import { TODAY, spaceById } from '../../shared/data/spaces.js';
import { exportReports } from '../../shared/lib/exports.js';
import { dateLabel, money } from '../../shared/lib/format.js';
import { totals } from '../../shared/lib/planning.js';
import { useStore } from '../../app/store.jsx';
import { completedEvents, margin, reportableEvents } from './reporting.js';

export default function Reports({ onOpen, onReport }) {
  const { events } = useStore();
  const impact = totals(events);
  const satisfaction = satisfactionSummary(events.flatMap(event => event.satisfactionResponses || []));
  const pending = reportableEvents(events, TODAY);
  const completed = completedEvents(events);
  const participation = impact.attendance ? Math.round(impact.residents / impact.attendance * 100) : 0;

  return <>
    <PageIntro eyebrow="MESURER CE QUI COMPTE" title="Bilans & impact" description="Des chiffres utiles, enrichis par les histoires derrière chaque rencontre."><button className="button button-quiet" onClick={() => exportReports(events)} disabled={!completed.length}><Icon name="download" size={16} />Exporter les bilans</button></PageIntro>
    <section className="metrics-grid report-metrics"><Metric icon="checks" label="Bilans renseignés" value={String(impact.count).padStart(2, '0')} caption={`${pending.length} bilan${pending.length > 1 ? 's' : ''} à compléter`} tone="sage" /><Metric icon="users" label="Participations totales" value={impact.attendance} caption={`${participation} % de participations résidentes`} tone="peach" /><Metric icon="heart" label="Participations résidentes" value={impact.residents} caption="Présences cumulées et consenties" tone="lavender" /><Metric icon="euro" label="Solde réalisé" value={money(impact.revenue - impact.costs)} caption={`${money(impact.revenue)} de recettes`} tone="sand" /></section>
    <p>Questionnaires : {satisfaction.count} réponse(s) · Satisfaction {satisfaction.satisfaction}/5 · Accueil {satisfaction.welcome}/5 · Utilité {satisfaction.usefulness}/5</p>
    <section className="impact-story"><div><span className="impact-story-icon"><Icon name="sparkles" size={24} /></span><p className="eyebrow">L’IMPACT AU-DELÀ DES CHIFFRES</p><h2>Chaque événement peut ouvrir<br /><em>une nouvelle possibilité.</em></h2></div><p>Les bilans rendent visibles les participations volontaires, les liens créés et les prochaines étapes. L’équipe garde la décision; les données servent le parcours des résidentes.</p></section>
    <section className="panel reports-pending"><div className="panel-heading"><div><h3>Bilans à compléter <span className="count-label">{pending.length}</span></h3><p>Événements confirmés dont la date est arrivée.</p></div></div>{pending.length ? <div className="report-todo-list">{pending.map(event => <div key={event.id}><span className={`event-symbol ${spaceById[event.space].color}`}><Icon name={spaceById[event.space].icon} size={20} /></span><span><strong>{event.title}</strong><small>{dateLabel(event.date)} · {spaceById[event.space].name}</small></span><button className="button button-dark button-small" onClick={() => onReport(event.id)}>Saisir le bilan</button></div>)}</div> : <EmptyState title="Tous les bilans sont à jour" text="Les prochains événements apparaîtront ici une fois leur date arrivée." />}</section>
    <section className="reports-section"><div className="section-heading"><div><span className="eyebrow">HISTOIRES ET RÉSULTATS</span><h2>Les derniers bilans</h2><p>Ce que les rencontres ont réellement produit.</p></div></div><div className="report-cards">{completed.map(event => <article className="report-card panel" key={event.id}><header><div><small>{dateLabel(event.date)} · {spaceById[event.space].name}</small><h3>{event.title}</h3></div><button className="icon-button" aria-label={`Ouvrir ${event.title}`} onClick={() => onOpen(event.id)}><Icon name="diagonal" size={16} /></button></header><p>{event.report.feedback}</p><small>Retour de {event.report.feedbackAuthor || 'responsable à préciser'} · {event.report.feedbackTeam || 'équipe à préciser'}</small><p>Questionnaires : {satisfactionSummary(event.satisfactionResponses).count} · Satisfaction {satisfactionSummary(event.satisfactionResponses).satisfaction}/5</p><div className="report-outcome"><Icon name="heart" size={17} /><span>{event.report.outcomes || 'Aucun résultat complémentaire renseigné.'}</span></div><footer><span><strong>{event.report.attendance}</strong> présences</span><span><strong>{event.report.residents}</strong> résidentes</span><span><strong>{money(margin(event.report))}</strong> solde</span></footer></article>)}</div></section>
  </>;
}
