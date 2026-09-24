import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { Metric, PageIntro } from '../../shared/components/Primitives.jsx';
import { associations } from '../../shared/data/associations.js';
import { bookableSpaces, spaceById, TODAY } from '../../shared/data/spaces.js';
import { money } from '../../shared/lib/format.js';
import { addMonths, monthLabel } from '../calendar/calendar.js';
import { occupancy, OPEN_HOURS_PER_DAY, responseDelay } from '../reports/impact.js';
import { reportableEvents } from '../reports/reporting.js';
import { requestTypes } from '../requests/workflow.js';
import { followUpAdvice, spaceAdvice } from './advice.js';
import { breakdown, communityStats, eventStats, requestStats, satisfactionStats } from './stats.js';

const show = (value, unit = '') => value == null ? '—' : `${value}${unit}`;
const score = value => value === '—' ? value : `${value} / 5`;
const requestKind = event => event.privatisation ? 'Privatisation' : requestTypes[event.requestType] || 'Non précisé';

function BarList({ rows, value = row => `${row.count}` }) {
  return <div className="bars">{rows.map(row => <div className="bar-row" key={row.label} title={`${row.label} : ${value(row)}`}><span>{row.label}</span><span className="bar-track"><i style={{ width: `${row.share || 0}%` }} /></span><span>{value(row)}</span></div>)}</div>;
}

function Facts({ items }) {
  return <dl className="impact-facts">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function AdvicePanel({ advice }) {
  return <section className="panel stats-advice"><div className="panel-heading"><div><h3>Nos conseils <span className="count-label">{advice.length}</span></h3><p>Des pistes tirées des chiffres ci-dessous. L’équipe reste seule juge.</p></div></div>
    {advice.length ? <ul>{advice.map(item => <li key={item.title} className={item.tone}><span className="stats-advice-icon"><Icon name={item.tone === 'warn' ? 'clock' : 'sparkles'} size={17} /></span><div><strong>{item.title}</strong><p>{item.text}</p></div></li>)}</ul> : <p className="stats-advice-empty">Rien à signaler : les indicateurs sont au vert.</p>}
  </section>;
}

function OccupancyPanel({ rows, month, setMonth }) {
  return <section className="panel impact-panel stats-occupancy">
    <div className="stats-occupancy-head"><h3>Taux d’occupation par espace</h3><div className="stats-month"><button className="icon-button" aria-label="Mois précédent" onClick={() => setMonth(addMonths(month, -1))}><Icon name="left" size={16} /></button><strong>{monthLabel(month)}</strong><button className="icon-button" aria-label="Mois suivant" onClick={() => setMonth(addMonths(month, 1))}><Icon name="right" size={16} /></button></div></div>
    <BarList rows={rows.map(row => ({ label: row.space.name, share: row.rate, rate: row.rate }))} value={row => `${row.rate} %`} />
    <p className="hint">Heures réservées sur {OPEN_HOURS_PER_DAY} h d’ouverture par jour (événements confirmés et créneaux des associations synchronisées) : {rows.reduce((sum, row) => sum + row.hours, 0)} h réservées au total ce mois-ci.</p>
  </section>;
}

export default function Stats() {
  const { events, matches, partners } = useStore();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const synced = associations.filter(association => partners.some(partner => partner.id === association.id && partner.synced));
  const rows = occupancy(bookableSpaces, events, synced, month);
  const requests = requestStats(events), held = eventStats(events, TODAY), satisfaction = satisfactionStats(events), community = communityStats(events, matches);
  const delay = responseDelay(events), toReport = reportableEvents(events, TODAY).length;
  const advice = [...followUpAdvice({ requests, events: held, satisfaction, community, delay, toReport }), ...spaceAdvice(rows)];
  return <>
    <PageIntro eyebrow="PILOTER LE LIEU" title="Statistiques & conseils" description="Les chiffres clés du lieu, et ce qu’ils suggèrent de faire." />
    <section className="metrics-grid" aria-label="Chiffres clés"><Metric icon="inbox" label="Demandes reçues" value={requests.received} caption={`${requests.waiting} en attente · ${show(requests.acceptance, ' %')} acceptées`} tone="peach" /><Metric icon="calendar" label="Événements" value={held.total} caption={`${held.upcoming} à venir · ${held.past} passés`} /><Metric icon="heart" label="Taux de satisfaction" value={show(satisfaction.satisfiedRate, ' %')} caption={`Notes de 4 ou 5 sur ${satisfaction.ratings} avis`} tone="lavender" /><Metric icon="users" label="Participations résidentes" value={community.residents} caption={`${show(community.residentShare, ' %')} des présences`} tone="sand" /></section>
    <AdvicePanel advice={advice} />
    <OccupancyPanel rows={rows} month={month} setMonth={setMonth} />
    <section className="impact-grid">
      <div className="panel impact-panel"><h3>Les demandes</h3><Facts items={[['Acceptées', requests.accepted], ['Refusées ou annulées', requests.refused], ['Taux d’acceptation', show(requests.acceptance, ' %')], ['Délai moyen de réponse', show(delay, ' j')]]} /><h4>Par canal</h4><BarList rows={breakdown(requests.requests, event => event.source || 'Non précisé')} /><h4>Par type</h4><BarList rows={breakdown(requests.requests, requestKind)} /></div>
      <div className="panel impact-panel"><h3>Les événements</h3><Facts items={[['Présences enregistrées', held.attendance], ['Présences moyennes', show(held.averageAttendance)], ['Taux de remplissage', show(held.fillRate, ' %')], ['Bilans saisis', `${held.reported} · ${toReport} à saisir`], ['Recettes réalisées', money(held.revenue)], ['Solde réalisé', money(held.revenue - held.costs)], ['Recettes prévues', money(held.expectedRevenue)]]} /><h4>Par espace</h4><BarList rows={breakdown(held.held, event => spaceById[event.space].name)} /><h4>Par thème</h4><BarList rows={breakdown(held.held, event => event.category || 'Non précisé')} /></div>
      <div className="panel impact-panel"><h3>La satisfaction</h3><Facts items={[['Satisfaction du public', score(satisfaction.survey.satisfaction)], ['Qualité de l’accueil', score(satisfaction.survey.welcome)], ['Utilité de l’activité', score(satisfaction.survey.usefulness)], ['Organisateurs : tout était prêt', show(satisfaction.logisticsReady, ' %')]]} /><h4>Répartition des notes ({satisfaction.ratings} avis)</h4><BarList rows={satisfaction.distribution} /></div>
      <div className="panel impact-panel"><h3>Résidentes & bénévoles</h3><Facts items={[['Événements avec des résidentes', `${community.withResidents} / ${community.reports}`], ['Opportunités proposées', community.proposals], ['Opportunités acceptées', community.accepted], ['Participations réalisées', community.participated], ['Prochaines étapes engagées', community.nextSteps], ['Postes bénévoles pourvus', `${community.filled} / ${community.places}`], ['Couverture bénévole', show(community.coverage, ' %')]]} /></div>
    </section>
  </>;
}
