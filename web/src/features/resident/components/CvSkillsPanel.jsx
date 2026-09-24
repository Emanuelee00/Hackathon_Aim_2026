import { dateLabel } from '../../../shared/lib/format.js';

export default function CvSkillsPanel({ skills }) {
  return <section className="panel side-list">
    <h3>À mettre sur mon CV</h3>
    {skills.length > 0 ? <ul>{skills.map(({ skill, event }, index) => <li key={index}><strong>{skill}</strong><small>{event.title} · {dateLabel(event.date)}</small></li>)}</ul> : <p>Vos compétences apparaîtront ici après chaque activité suivie avec l’équipe.</p>}
    <details className="plan-details"><summary>Comment l’écrire sur un CV ?</summary><p>Indiquez la compétence avec le lieu et la date, dans « Expériences » ou « Compétences ».</p></details>
  </section>;
}
