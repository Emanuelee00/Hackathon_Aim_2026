import { useState } from 'react';
import { validateReport } from '../../../shared/lib/planning.js';

export default function ReportForm({ event, linkedParticipations = 0, onSave, onCancel }) {
  const [report, setReport] = useState(event.report || { attendance: event.participants, residents: linkedParticipations, revenue: event.revenue, costs: event.costs, feedback: '', outcomes: '' });
  const [error, setError] = useState('');
  const change = ({ target }) => setReport(current => ({ ...current, [target.name]: target.type === 'number' ? Number(target.value) : target.value }));
  const submit = formEvent => {
    formEvent.preventDefault();
    const message = validateReport(report);
    if (message) return setError(message);
    onSave(report);
  };

  return <form className="report-form" onSubmit={submit}>
    <p className="report-intro">Renseignez ce qui s’est réellement passé. {linkedParticipations > 0 && <strong>{linkedParticipations} participation{linkedParticipations > 1 ? 's' : ''} issue{linkedParticipations > 1 ? 's' : ''} des parcours est préremplie.</strong>}</p>{error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-grid"><label className="field"><span>Présences totales *</span><input type="number" min="0" name="attendance" value={report.attendance} onChange={change} required /></label><label className="field"><span>Présences de résidentes *</span><input type="number" min="0" name="residents" value={report.residents} onChange={change} required /></label><label className="field"><span>Recettes réelles (€)</span><input type="number" min="0" name="revenue" value={report.revenue} onChange={change} /></label><label className="field"><span>Coûts réels (€)</span><input type="number" min="0" name="costs" value={report.costs} onChange={change} /></label><label className="field field-full"><span>Retour sur le déroulement *</span><textarea name="feedback" rows="4" value={report.feedback} onChange={change} placeholder="Ambiance, participation, points d’attention…" required /></label><label className="field field-full"><span>Résultats humains observés</span><textarea name="outcomes" rows="3" value={report.outcomes} onChange={change} placeholder="Liens créés, suites proposées, nouvelles opportunités…" /></label></div>
    <div className="form-actions"><button type="button" className="button button-quiet" onClick={onCancel}>Annuler</button><button className="button button-dark">Enregistrer le bilan</button></div>
  </form>;
}
