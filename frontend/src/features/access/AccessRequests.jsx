import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';

const spaceLabels = { residents: 'Résidente', partenaires: 'Association' };
const formatDate = value => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function AccessRequests({ requests, error, decide }) {
  const reject = request => { if (window.confirm(`Refuser la demande de ${request.name} ? Elle sera supprimée.`)) decide(request.id, false); };
  return <>
    <PageIntro eyebrow="COMPTES" title="Demandes d’accès" description="Les résidentes et les associations déposent une demande depuis leur espace. Vérifiez qui elles sont avant d’ouvrir l’accès : leur compte ne fonctionne qu’une fois validé." />
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="question-list">{requests.map(request => <article key={request.id} className="panel question-card">
      <div className="question-head"><span className="eyebrow">{spaceLabels[request.role]} · {formatDate(request.created_at)}</span></div>
      <p className="question-summary"><strong>{request.name}</strong></p>
      <p className="question-from"><a href={`mailto:${request.email}`}>{request.email}</a></p>
      <div className="form-actions">
        <button className="button button-quiet button-small" onClick={() => reject(request)}>Refuser</button>
        <button className="button button-dark button-small" onClick={() => decide(request.id, true)}><Icon name="check" size={15} />Valider l’accès</button>
      </div>
    </article>)}
      {!requests.length && <EmptyState title="Aucune demande en attente" text="Les nouvelles demandes de résidentes et d’associations apparaîtront ici." />}</div>
  </>;
}
