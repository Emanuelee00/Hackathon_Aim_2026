import { useEffect, useRef, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { exportEmploymentPlan } from '../../../shared/lib/exports.js';

const sources = {
  demo: { label: 'Exemple prérempli', text: 'Exemple fictif. Touchez « Modifier » puis « Voir mon plan » pour analyser un CV.' },
  ai: { label: 'Proposition de l’IA', text: 'Générée par l’IA à partir de votre CV : relisez-la avec votre accompagnatrice.' },
  guided: { label: 'Plan guidé, sans IA', text: 'Des repères prudents, à personnaliser avec votre accompagnatrice.' },
};

function Block({ icon, title, items }) {
  return <section className="plan-block"><h5><Icon name={icon} size={18} />{title}</h5><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>;
}

export default function JobPlanResult({ record, resident, warning, onEdit, onShowProposals }) {
  const { plan, objective } = record;
  const source = sources[record.demo ? 'demo' : plan.source] || sources.guided;
  const [first, ...later] = plan.steps;
  const [downloaded, setDownloaded] = useState(false);
  const result = useRef(null);
  useEffect(() => { result.current?.focus(); setDownloaded(false); }, [plan]);
  return <div className="plan-result" ref={result} tabIndex={-1} aria-label="Votre plan vers l’emploi">
    <header className="plan-hero"><span className={`source-badge ${record.demo ? 'demo' : plan.source}`}>{source.label}</span><h4>Cap sur : {objective}</h4><p>{plan.summary}</p></header>
    <p className="plan-note"><Icon name="help" size={15} />{source.text}</p>
    {warning && <p className="field-error" role="status">{warning}</p>}
    <section className="plan-now"><p className="eyebrow">À FAIRE MAINTENANT · {first.timeframe}</p><h5>{first.title}</h5><p>{first.action}</p></section>
    <div className="plan-columns"><Block icon="check" title="Ce que vous avez déjà" items={plan.strengths} /><Block icon="sparkles" title="Ce que vous allez apprendre" items={plan.gaps} /></div>
    {later.length > 0 && <section className="plan-block"><h5><Icon name="calendar" size={18} />Ensuite</h5><ol className="plan-later">{later.map((step, index) => <li key={index}><strong>{step.title}</strong><span>{step.action}</span><small>{step.timeframe}</small></li>)}</ol></section>}
    <Block icon="file" title="Conseils pour votre CV" items={plan.cv_suggestions} />
    {plan.proposals?.length > 0 && <div className="plan-cv-proposals"><Icon name="sparkles" size={20} /><p><strong>{plan.proposals.length} activité{plan.proposals.length > 1 ? 's' : ''} liée{plan.proposals.length > 1 ? 's' : ''} à votre CV</strong>Retrouvez-les dans vos propositions, marquées « Grâce à votre CV ».</p><button type="button" className="button button-dark" onClick={onShowProposals}>Voir les propositions</button></div>}
    <div className="plan-actions"><button type="button" className="button button-dark button-large" onClick={() => { exportEmploymentPlan(plan, resident, objective); setDownloaded(true); }}><Icon name="download" size={18} />Télécharger mon plan</button><button type="button" className="button button-quiet" onClick={onEdit}>Modifier mon CV ou mon métier</button></div>
    {downloaded && <p className="confirm" role="status"><Icon name="check" size={16} />Plan téléchargé : retrouvez-le dans vos téléchargements.</p>}
  </div>;
}
