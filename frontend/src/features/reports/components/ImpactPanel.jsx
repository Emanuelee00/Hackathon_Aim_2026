import { useStore } from '../../../app/store.jsx';
import { associations } from '../../../shared/data/associations.js';
import { bookableSpaces, TODAY } from '../../../shared/data/spaces.js';
import { monthLabel } from '../../calendar/calendar.js';
import { occupancy, OPEN_HOURS_PER_DAY, organizerSummary, responseDelay } from '../impact.js';

// Figures for funders: how the spaces are used and how fast requests get an answer.
export default function ImpactPanel() {
  const { events, partners } = useStore();
  const month = TODAY.slice(0, 7);
  const synced = associations.filter(association => partners.some(partner => partner.id === association.id && partner.synced));
  const rows = occupancy(bookableSpaces, events, synced, month);
  const delay = responseDelay(events);
  const organizers = organizerSummary(events);
  const completed = events.filter(event => event.status === 'completed' && event.report);
  return <section className="impact-grid">
    <div className="panel impact-panel"><h3>Occupation des espaces · {monthLabel(month)}</h3>
      <div className="bars">{rows.map(row => <div className="bar-row" key={row.space.id}><span>{row.space.name}</span><span className="bar-track"><i style={{ width: `${row.rate}%` }} /></span><span>{row.rate} %</span></div>)}</div>
      <p className="hint">Heures réservées sur {OPEN_HOURS_PER_DAY} h d’ouverture par jour, créneaux des associations synchronisées compris.</p>
    </div>
    <div className="panel impact-panel"><h3>Le suivi des demandes et des bilans</h3>
      <dl className="impact-facts">
        <div><dt>Délai moyen de réponse</dt><dd>{delay == null ? '—' : `${delay} j`}</dd></div>
        <div><dt>Événements avec des résidentes présentes</dt><dd>{completed.filter(event => event.report.residents > 0).length} / {completed.length}</dd></div>
        <div><dt>Satisfaction des organisateurs</dt><dd>{organizers.average} / 5 <small>sur {organizers.count} bilan{organizers.count > 1 ? 's' : ''}</small></dd></div>
        <div><dt>Organisateurs ayant vu des résidentes participer</dt><dd>{organizers.withResidents} / {organizers.count}</dd></div>
      </dl>
    </div>
  </section>;
}
