import { useEffect, useRef } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { exportEmploymentPlan } from '../../../shared/lib/exports.js';

function List({ title, items }) {
  return <section><h4>{title}</h4><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>;
}

export default function JobPlanResult({ plan, resident, objective }) {
  const result = useRef(null);
  useEffect(() => { result.current?.focus(); }, [plan]);
  return <div className="job-plan-result" ref={result} tabIndex={-1} aria-label="Votre plan vers l’emploi">
    <header className="job-result-hero"><Icon name={plan.source === 'ai' ? 'sparkles' : 'leaf'} size={28} /><div><p className="eyebrow">{plan.source === 'ai' ? 'VOTRE PLAN EST PRÊT' : 'VOTRE POINT DE DÉPART'}</p><h3>Cap sur : {objective}</h3></div></header>
    <p className="plan-source"><Icon name={plan.source === 'ai' ? 'sparkles' : 'help'} size={16} />{plan.source === 'ai' ? 'Analyse IA à discuter avec votre accompagnatrice.' : 'Plan guidé, sans génération IA : des repères à vérifier et à personnaliser avec votre accompagnatrice.'}</p>
    <p>{plan.summary}</p>
    <div className="job-plan-analysis"><List title="Vos points d’appui" items={plan.strengths} /><List title="Points à renforcer" items={plan.gaps} /></div>
    <List title="À améliorer dans votre CV" items={plan.cv_suggestions} />
    <section><h4>Les prochaines étapes</h4><ol className="job-plan-steps">{plan.steps.map((step, index) => <li key={index}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.action}</p><small>{step.timeframe}</small></div></li>)}</ol></section>
    <button type="button" className="button button-dark" onClick={() => exportEmploymentPlan(plan, resident, objective)}><Icon name="download" size={18} />Télécharger mon plan</button>
  </div>;
}
