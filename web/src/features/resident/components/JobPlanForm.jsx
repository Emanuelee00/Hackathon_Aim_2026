import { useState } from 'react';
import { EmptyState } from '../../../shared/components/Primitives.jsx';

export default function JobPlanForm() {
  const [cv, setCv] = useState(null);
  const [objective, setObjective] = useState('');
  const ready = cv && objective.trim();

  return <div className="panel job-plan-form">
    <div className="form-grid">
      <label className="field field-full"><span>Le métier ou secteur que vous recherchez</span><input value={objective} onChange={event => setObjective(event.target.value)} placeholder="Ex. commis de cuisine, assistante administrative…" /></label>
      <label className="field field-full"><span>Votre CV (PDF, Word)</span><input type="file" accept=".pdf,.doc,.docx" onChange={event => setCv(event.target.files[0] || null)} /></label>
    </div>
    <button className="button button-dark" disabled={!ready}>Analyser mon CV et proposer un plan</button>
    <p className="ai-caption">Fonctionnalité à venir : l’analyse du CV et la génération du plan seront branchées à l’étape suivante.</p>
    <EmptyState title="Votre plan apparaîtra ici" text="Une fois l’analyse branchée, vous verrez les étapes concrètes vers le métier visé." />
  </div>;
}
