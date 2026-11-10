import { useRef } from 'react';
import HomeShell from '../landing/HomeShell.jsx';

// « Notre équipe » (/equipe), reached from the menu. Still to complete: the roles and presentations written « [ … ] », and the missing photos (add `photo`).
const members = [
  { name: 'Véronique', role: 'Fondatrice et Coordinatrice générale', photo: '/foto/equipe/veronique.jpg', text: 'Quand les femmes ont un toit sur la tête et du lien social, elles peuvent faire rayonner leur lumière dans le monde. Le soin est politique !' },
  { name: 'Joria', role: 'Coordination opérationnelle', photo: '/foto/equipe/joria.jpg', text: 'Vivre n’est pas un privilège : c’est un droit, et il commence par un toit, par un lieu où l’on habite, travaille, crée et se soigne ensemble. Chez Marthe, ce droit à une adresse.' },
  { name: 'Flora', role: 'Référente programmation', photo: '/foto/equipe/flora.jpg', text: 'Ici, la fête et la culture ne sont pas réservées à celles qui en ont les clés : elle s’invente, elle se transmet, elle se partage.' },
  { name: 'Sarah', role: 'Animation de la communauté', photo: '/foto/equipe/sarah.jpg', text: 'Créer des rencontres et faire rayonner l’esprit de Chez Marthe, en ligne comme dans la vraie vie : pour que chacune se sente accueillie et que d’autres Chez Marthe voient le jour, de ville en ville.' },
  { name: 'Isadora', role: 'Partenariat stratégique et financier', photo: '/foto/equipe/isadora.jpg', text: 'Chez Marthe, bien plus qu’un toit : un lieu pour reprendre souffle, retrouver sa force et se reconstruire grâce à la sororité. Chaque quartier mérite son Chez Marthe.' },
  { name: 'Barbara', role: 'Pilotage financier', photo: '/foto/equipe/barbara.jpg', text: 'Tout devient possible quand les énergies d’un collectif se mettent au service d’un projet qui fait sens : l’accueil inconditionnel.' },
  { name: 'Caroline', role: 'Recherche de fonds et communication', photo: '/foto/equipe/caroline.jpg', text: 'Rien ne nous arrête quand nous décidons d’avancer unies. Chez Marthe, je suis heureuse de transformer mon énergie en tremplins.' },
];

const people = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17.5" cy="9.5" r="2.6" /><path d="M17 14.2a5.2 5.2 0 0 1 4.5 5.3" /></svg>;

export default function Team() {
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return <HomeShell>
    <main className="team-main">
      <section id="equipe" className="team-v2" aria-labelledby="equipe-titre">
        <div className="team-head">
          <span className="team-icon">{people}</span>
          <p className="eyebrow">NOTRE ÉQUIPE</p>
          <h1 id="equipe-titre">Les visages de Chez Marthe</h1>
        </div>
        <div className="team-grid">{members.map(m => <article key={m.name} className="member-card">
          <span className="member-photo" aria-hidden="true">{m.photo ? <img src={m.photo} alt="" loading="lazy" /> : m.name[0]}</span>
          <h2>{m.name}</h2>
          <p className="member-role">{m.role}</p>
          {m.text ? <blockquote>{`«\u00a0${m.text}\u00a0»`}</blockquote> : <p className="member-todo">[Une ou deux phrases de présentation]</p>}
        </article>)}</div>
        <button type="button" className="scroll-cue scroll-cue-label" onClick={() => document.getElementById('manifeste')?.scrollIntoView({ behavior: reduced.current ? 'auto' : 'smooth', block: 'start' })}>
          Notre manifeste
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
        </button>
      </section>
      <section id="manifeste" className="manifesto-v2" aria-labelledby="manifeste-titre">
        <h2 id="manifeste-titre">Manifeste</h2>
        <div className="manifesto-body">
          <p className="manifesto-lead">Chez Marthe est un refuge, un lieu ressource et une maison tremplin.</p>
          <p>Un lieu pour passer de la survie à la vie, pour habiter, se réparer, créer, travailler, respirer et rayonner ensemble.</p>
          <p>Ici, des femmes venues de la rue cohabitent avec des femmes du quartier, des artistes, des soignantes, des femmes engagées, des étudiantes.</p>
          <p>Ici, on fait l’expérience du vivre-ensemble, du soin sous toutes ses formes, de la solidarité concrète et joyeuse.</p>
          <p>Ici, nous cultivons la mixité, nous brisons l’entre-soi de la précarité pour tisser un réseau de confiance inédit.</p>
          <p className="manifesto-lead">Chez Marthe, nous croyons que le soin est politique.</p>
          <p>Qu’il s’ancre dans l’écoute, le respect des parcours, la reconnaissance des singularités.</p>
          <p>Qu’il passe par le corps, le psychique, le collectif, l’alimentation, la création, le repos et la sécurité matérielle.</p>
          <p>Nous croyons à la force d’une sororité concrète, à l’intelligence collective, à la capacité des femmes à transformer leurs vulnérabilités en puissances d’agir pour ouvrir le champ des possibles.</p>
          <p>Chez Marthe est un espace vivant d’expérimentation, d’inclusion et de régénération.</p>
          <p className="manifesto-welcome">Bienvenue chez Marthe</p>
        </div>
      </section>
    </main>
  </HomeShell>;
}
