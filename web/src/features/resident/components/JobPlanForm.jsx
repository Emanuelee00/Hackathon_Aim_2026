import Icon from '../../../shared/components/Icon.jsx';
import ProgressBar from '../../../shared/components/ProgressBar.jsx';
import JobPlanResult from './JobPlanResult.jsx';
import { useJobPlan } from '../jobPlan.js';

function CvUpload({ state }) {
  return <label className={`cv-upload ${state.cv ? 'has-file' : ''}`}>
    <Icon name={state.cv ? 'check' : 'file'} size={30} />
    <strong>{state.cv ? state.cv.name : 'Choisir mon CV'}</strong>
    <span>{state.cv ? 'CV sélectionné · Cliquez pour le remplacer' : 'Cliquez ici pour sélectionner un fichier'}</span>
    <small>PDF ou Word DOCX · 4 Mo maximum</small>
    <input aria-label="Choisir mon CV" required={!state.cv} disabled={state.loading} type="file" accept=".pdf,.docx" onChange={event => { if (event.target.files[0]) state.setCv(event.target.files[0]); }} />
  </label>;
}

function ObjectiveField({ state }) {
  return <div className="job-objective">
    <label className="field"><span>Quel métier aimeriez-vous exercer ?</span><input required disabled={state.loading} minLength="2" maxLength="160" pattern=".*\S.*\S.*" value={state.objective} onChange={event => state.setObjective(event.target.value)} placeholder="Écrivez un métier ou un secteur…" /></label>
    <span className="job-example-label">Besoin d’une idée ? Choisissez un exemple :</span>
    <div className="job-examples">{['Commis de cuisine', 'Assistante administrative', 'Vente'].map(value => <button type="button" key={value} disabled={state.loading} aria-pressed={state.objective === value} onClick={() => state.setObjective(value)}>{value}<Icon name="plus" size={13} /></button>)}</div>
  </div>;
}

export default function JobPlanForm({ resident, skills }) {
  const state = useJobPlan(resident, skills);
  return <form className="panel job-plan-form" onSubmit={state.submit} aria-busy={state.loading}>
    <header className="job-plan-intro"><span className="job-plan-symbol"><Icon name="sparkles" size={25} /></span><p className="eyebrow">UN PREMIER PAS VERS VOTRE PROCHAIN MÉTIER</p><h3>Votre expérience a de la valeur.<br />Découvrez la suite.</h3><p>Votre CV + votre envie : retrouvez vos atouts, des conseils et un plan pour avancer.</p></header>
    <section className="job-input-step"><h4><span>{state.cv ? <Icon name="check" size={16} /> : '1'}</span>Ajoutez votre CV</h4><CvUpload state={state} /></section>
    <aside className="cv-demo-tools"><strong>Essayez avec des CV fictifs</strong><p>{resident.id === 'marie' ? 'Le CV de Marie est prêt. Vous pouvez lancer le plan ou le remplacer par votre CV.' : 'Un CV technique est disponible pour tester une reconversion vers la cuisine.'}</p><a href="/demo/cv-marie-demo.docx" download>Télécharger le CV de Marie</a><a href="/demo/cv-tech-demo.docx" download>Télécharger le CV technique</a><button type="button" className="text-link" disabled={state.loading} onClick={state.useTechExample}>Tester un CV tech → cuisine <Icon name="arrow" size={16} /></button><small>Pour votre propre CV ou le test tech, les compétences fictives de Marie ne sont pas ajoutées à l’analyse.</small></aside>
    <section className="job-input-step"><h4><span>{state.objective.trim().length >= 2 ? <Icon name="check" size={16} /> : '2'}</span>Choisissez votre direction</h4><ObjectiveField state={state} /></section>
    <button type="submit" className="button button-dark job-plan-submit" disabled={state.loading}><Icon name="sparkles" size={19} />{state.loading ? 'Préparation de votre plan…' : 'Découvrir mon plan'}{!state.loading && <Icon name="arrow" size={18} />}</button>
    <p className="ai-caption">Votre fichier CV n’est pas conservé. Vous restez libre de choisir les prochaines étapes.</p>
    {state.loading && <div className="job-plan-loading" role="status"><Icon name="sparkles" size={24} /><div><strong>Votre prochaine étape se prépare</strong><p>Nous analysons votre CV et votre objectif, quelques secondes suffisent.</p><ProgressBar label="Analyse du CV en cours" /></div></div>}
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.record?.demo && <p className="ai-caption">Exemple prérempli fictif : lancez « Découvrir mon plan » pour analyser le fichier sélectionné.</p>}
    {!state.loading && (state.record ? <JobPlanResult plan={state.record.plan} resident={resident} objective={state.record.objective} /> : <div className="job-plan-preview"><span><Icon name="check" size={17} />Vos atouts</span><span><Icon name="file" size={17} />Un CV plus clair</span><span><Icon name="arrow" size={17} />Des étapes concrètes</span></div>)}
  </form>;
}
