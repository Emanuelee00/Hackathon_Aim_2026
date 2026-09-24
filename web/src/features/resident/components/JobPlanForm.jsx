import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import ProgressBar from '../../../shared/components/ProgressBar.jsx';
import JobPlanResult from './JobPlanResult.jsx';
import { useJobPlan } from '../jobPlan.js';

const steps = [['cv', 'Mon CV'], ['objective', 'Mon métier'], ['result', 'Mon plan']];
const suggestions = ['Commis de cuisine', 'Assistante administrative', 'Vente'];

function Stepper({ step }) {
  const current = steps.findIndex(([id]) => id === step);
  return <ol className="plan-stepper">{steps.map(([id, label], index) => <li key={id} className={index < current ? 'done' : ''} aria-current={index === current ? 'step' : undefined}><span>{index < current ? <Icon name="check" size={14} /> : index + 1}</span>{label}</li>)}</ol>;
}

function CvStep({ state, onNext, onExample, missing }) {
  return <div className="plan-step">
    <h4>Ajoutez votre CV</h4>
    <label className={`cv-drop ${state.cv ? 'has-file' : ''}`}>
      <Icon name={state.cv ? 'check' : 'file'} size={26} />
      <span><strong>{state.cv ? state.cv.name : 'Choisir mon CV'}</strong><small>{state.cv ? 'CV prêt · Touchez pour en choisir un autre' : 'PDF ou Word (.docx) · 4 Mo maximum'}</small></span>
      <input type="file" accept=".pdf,.docx" aria-describedby="cv-help" onChange={event => { if (event.target.files[0]) state.chooseCv(event.target.files[0]); event.target.value = ''; }} />
    </label>
    {(state.fileError || missing) && <p className="field-error" role="alert"><Icon name="help" size={16} />{state.fileError || 'Choisissez d’abord un CV ou un exemple ci-dessous.'}</p>}
    <div className="cv-examples"><span>Pas de CV sous la main ? Essayez un exemple fictif :</span>
      {state.isMarie && <button type="button" className="chip" onClick={state.pickMarieExample}>CV de Marie</button>}
      <button type="button" className="chip" onClick={async () => { if (await state.pickTechExample()) onExample(); }}>CV technique → cuisine</button>
    </div>
    <p id="cv-help" className="plan-note">Votre fichier sert seulement à l’analyse : il n’est pas conservé.</p>
    <button type="button" className="button button-dark button-large" onClick={onNext}>Continuer<Icon name="arrow" size={18} /></button>
    <details className="plan-details"><summary>Télécharger les CV d’exemple</summary><a href="/demo/cv-marie-demo.docx" download>CV de Marie (.docx)</a><a href="/demo/cv-tech-demo.docx" download>CV technique (.docx)</a></details>
  </div>;
}

function ObjectiveStep({ state, onBack, missing }) {
  return <div className="plan-step">
    <p className="plan-recap"><Icon name="check" size={16} />CV : <strong>{state.cv?.name}</strong><button type="button" className="text-link" onClick={onBack}>Changer</button></p>
    <h4><label htmlFor="job-objective">Quel métier vous intéresse ?</label></h4>
    <input id="job-objective" className="plan-input" value={state.objective} maxLength="160" autoComplete="off" placeholder="Par exemple : aide à domicile" aria-invalid={missing || undefined} aria-describedby={missing ? 'objective-error' : undefined} onChange={event => state.setObjective(event.target.value)} />
    {missing && <p id="objective-error" className="field-error" role="alert"><Icon name="help" size={16} />Écrivez un métier ou choisissez une idée ci-dessous.</p>}
    <div className="cv-examples"><span>Des idées :</span>{suggestions.map(value => <button type="button" key={value} className="chip" aria-pressed={state.objective === value} onClick={() => state.setObjective(value)}>{value}</button>)}</div>
    <div className="plan-actions"><button type="button" className="button button-quiet" onClick={onBack}><Icon name="back" size={16} />Retour</button><button type="submit" className="button button-dark button-large"><Icon name="sparkles" size={18} />Voir mon plan</button></div>
  </div>;
}

export default function JobPlanForm({ resident, skills }) {
  const state = useJobPlan(resident, skills);
  const [step, setStep] = useState(state.record ? 'result' : 'cv');
  const [missing, setMissing] = useState('');
  const next = () => { setMissing(state.cv ? '' : 'cv'); if (state.cv) setStep('objective'); };
  async function submit(event) {
    event.preventDefault();
    if (!state.cv) { setMissing('cv'); setStep('cv'); return; }
    if (state.objective.trim().length < 2) { setMissing('objective'); return; }
    setMissing('');
    if (await state.analyze()) setStep('result');
  }
  return <form className="panel plan-card" onSubmit={submit} noValidate aria-busy={state.loading}>
    <header className="plan-card-header"><h3>Votre plan vers l’emploi</h3><p>Votre CV et le métier qui vous attire : Marthe vous propose des étapes concrètes.</p></header>
    <Stepper step={state.loading ? 'result' : step} />
    {state.loading && <div className="plan-loading" role="status"><Icon name="sparkles" size={22} /><div><strong>Nous lisons votre CV…</strong><p>Cela prend quelques secondes.</p><ProgressBar label="Analyse du CV en cours" /></div></div>}
    {!state.loading && state.error && step === 'objective' && <div className="plan-error" role="alert"><Icon name="help" size={20} /><div><strong>{state.error}</strong><p>Votre CV et votre métier sont gardés.</p><div className="plan-actions"><button type="submit" className="button button-dark">Réessayer</button><button type="button" className="button button-quiet" onClick={() => setStep('cv')}>Choisir un autre CV</button></div></div></div>}
    {!state.loading && step === 'cv' && <CvStep state={state} onNext={next} onExample={() => { setMissing(''); setStep('objective'); }} missing={missing === 'cv'} />}
    {!state.loading && step === 'objective' && <ObjectiveStep state={state} onBack={() => setStep('cv')} missing={missing === 'objective'} />}
    {!state.loading && step === 'result' && state.record && <JobPlanResult record={state.record} resident={resident} warning={state.error} onEdit={() => setStep(state.cv ? 'objective' : 'cv')} />}
  </form>;
}
