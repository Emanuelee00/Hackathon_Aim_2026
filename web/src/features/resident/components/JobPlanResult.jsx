import Icon from '../../../shared/components/Icon.jsx';
import { exportEmploymentPlan } from '../../../shared/lib/exports.js';

function List({ title, items }) {
  return <section><h4>{title}</h4><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>;
}

export default function JobPlanResult({ plan, resident, objective }) {
  return <div className="job-plan-result">
    <header><div><p className="eyebrow">PLAN PERSONNALISÉ</p><h3>{objective}</h3></div><button type="button" className="icon-button" aria-label="Télécharger le plan" onClick={() => exportEmploymentPlan(plan, resident, objective)}><Icon name="download" size={16} /></button></header>
    <p>{plan.summary}</p>
    <div className="job-plan-analysis"><List title="Vos points d’appui" items={plan.strengths} /><List title="Points à renforcer" items={plan.gaps} /></div>
    <List title="À améliorer dans votre CV" items={plan.cv_suggestions} />
    <section><h4>Les prochaines étapes</h4><ol className="job-plan-steps">{plan.steps.map((step, index) => <li key={index}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.action}</p><small>{step.timeframe}</small></div></li>)}</ol></section>
    <p className="plan-source"><Icon name={plan.source === 'ai' ? 'sparkles' : 'help'} size={14} />{plan.source === 'ai' ? 'Proposition générée par l’IA, à valider avec votre accompagnatrice.' : 'Plan guidé de secours, à personnaliser avec votre accompagnatrice.'}</p>
  </div>;
}
