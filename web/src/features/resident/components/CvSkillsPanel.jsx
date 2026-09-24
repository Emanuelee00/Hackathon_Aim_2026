import Icon from '../../../shared/components/Icon.jsx';
import { EmptyState } from '../../../shared/components/Primitives.jsx';
import { dateLabel } from '../../../shared/lib/format.js';

export default function CvSkillsPanel({ skills }) {
  return <div className="panel">
    <p className="opportunity-box"><Icon name="sparkles" size={18} /><span>Chaque compétence vient d’une expérience réelle. Sur un CV, mentionnez-la avec le lieu et la date, dans une rubrique « Expériences » ou « Compétences ».</span></p>
    {skills.length > 0 && <ul className="cv-skills-list">{skills.map(({ skill, event }, index) => <li key={index}><strong>{skill}</strong><small>{event.title} · {dateLabel(event.date)}</small></li>)}</ul>}
    {!skills.length && <EmptyState title="Aucune compétence documentée" text="Une fois un parcours suivi par l’équipe, les compétences apparaîtront ici." />}
  </div>;
}
