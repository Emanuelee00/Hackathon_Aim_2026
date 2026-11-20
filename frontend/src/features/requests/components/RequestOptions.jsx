import { technicalNeeds } from '../../../shared/lib/requestRules.js';

// Technical needs and conditions used by the price estimate and the pre-analysis.
export default function RequestOptions({ draft, setDraft }) {
  const toggleNeed = need => setDraft(current => ({ ...current, technical: current.technical?.includes(need) ? current.technical.filter(item => item !== need) : [...(current.technical || []), need] }));
  const toggle = name => setDraft(current => ({ ...current, [name]: !current[name] }));
  return <fieldset className="request-options">
    <legend>Besoins techniques et conditions</legend>
    <div className="option-list">{Object.entries(technicalNeeds).map(([need, label]) => <label key={need}><input type="checkbox" checked={draft.technical?.includes(need) || false} onChange={() => toggleNeed(need)} />{label}</label>)}</div>
    <div className="option-list">
      {draft.requestType === 'rental' && <label><input type="checkbox" checked={Boolean(draft.privatisation)} onChange={() => toggle('privatisation')} />Privatisation (événement privé)</label>}
      <label><input type="checkbox" checked={Boolean(draft.openToResidents)} onChange={() => toggle('openToResidents')} />Activité ouverte gratuitement aux femmes hébergées</label>
    </div>
  </fieldset>;
}
