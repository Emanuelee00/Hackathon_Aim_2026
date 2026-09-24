import { EmptyState } from '../../../shared/components/Primitives.jsx';
import JobPlanResult from './JobPlanResult.jsx';
import { useJobPlan } from '../jobPlan.js';

export default function JobPlanForm({ resident, skills }) {
  const state = useJobPlan(resident, skills);

  return <form className="panel job-plan-form" onSubmit={state.submit}>
    <div className="form-grid">
      <label className="field field-full"><span>Le métier ou secteur que vous recherchez</span><input required maxLength="160" value={state.objective} onChange={event => state.setObjective(event.target.value)} placeholder="Ex. commis de cuisine, assistante administrative…" /></label>
      <label className="field field-full"><span>Votre CV (PDF ou Word DOCX, 4 Mo maximum)</span><input required type="file" accept=".pdf,.docx" onChange={event => state.setCv(event.target.files[0] || null)} /></label>
    </div>
    <button className="button button-dark" disabled={!state.cv || !state.objective.trim() || state.loading}>{state.loading ? 'Analyse en cours…' : 'Analyser mon CV et proposer un plan'}</button>
    <p className="ai-caption">Votre CV est analysé en mémoire pour créer ce plan. Il n’est pas conservé par Marthe.</p>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.record ? <JobPlanResult plan={state.record.plan} resident={resident} objective={state.record.objective} /> : <EmptyState title="Votre plan apparaîtra ici" text="Ajoutez votre CV et votre objectif pour obtenir des étapes concrètes vers le métier visé." />}
  </form>;
}
