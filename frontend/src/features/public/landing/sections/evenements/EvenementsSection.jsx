import WeekProgramme from './WeekProgramme.jsx';

export default function EvenementsSection({ title }) {
  return <section id="evenements" className="block block-wall prog" aria-labelledby="evenements-titre">
    <WeekProgramme title={title} />
  </section>;
}
