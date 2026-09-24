import Icon from './Icon.jsx';
import { totals } from '../lib/planning.js';

export default function ImpactCard({ events, navigate }) {
  const impact = totals(events);
  return <section className="impact-card"><div className="impact-top"><span className="eyebrow">LES PETITES VICTOIRES</span><Icon name="heart" size={20} /></div><h3>Au-delà des murs,<br /><em>ce qui nous relie.</em></h3><div className="impact-number">{impact.residents}<span>participations de résidentes<br />dans les bilans saisis</span></div><div className="impact-bottom"><span className="avatar-stack"><i>A</i><i>M</i><i>S</i><i>+</i></span><span>Des moments partagés,<br />des liens qui se créent.</span></div><button className="text-link" onClick={() => navigate('reports')}>Explorer les bilans<Icon name="arrow" size={16} /></button></section>;
}
