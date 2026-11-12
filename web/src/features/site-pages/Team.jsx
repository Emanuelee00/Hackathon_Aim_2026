import { useRef, useState } from 'react';
import HomeShell from '../landing/HomeShell.jsx';
import { hostedAssociations, members } from './teamData.js';


const people = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17.5" cy="9.5" r="2.6" /><path d="M17 14.2a5.2 5.2 0 0 1 4.5 5.3" /></svg>;

export default function Team() {
  const grid = useRef(null);
  const [active, setActive] = useState(0);
  // Téléphone : les cartes se font défiler de côté ; les points montrent laquelle est devant.
  const onScroll = () => {
    const el = grid.current;
    const first = el?.children[0];
    if (first) setActive(Math.min(members.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0)))));
  };
  const manifesto = useRef(null);
  const [slide, setSlide] = useState(0);
  // Téléphone : le manifeste est en deux pages à faire défiler.
  const onManifestoScroll = () => {
    const el = manifesto.current;
    if (el) setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.9)) > 0 ? 1 : 0);
  };
  const reduced = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return <HomeShell>
    <main className="team-main">
      <section id="equipe" className="team-v2" aria-labelledby="equipe-titre">
        <div className="team-head">
          <span className="team-icon">{people}</span>
          <p className="eyebrow">NOTRE ÉQUIPE</p>
          <h1 id="equipe-titre">Les visages de Chez Marthe</h1>
        </div>
        <div className="team-grid" ref={grid} onScroll={onScroll}>{members.map(m => <article key={m.name} className="member-card">
          <span className="member-photo" aria-hidden="true">{m.photo ? <img src={m.photo} alt="" loading="lazy" /> : m.name[0]}</span>
          <h2>{m.name}</h2>
          <p className="member-role">{m.role}</p>
          {m.text ? <blockquote>{`«\u00a0${m.text}\u00a0»`}</blockquote> : <p className="member-todo">[Une ou deux phrases de présentation]</p>}
        </article>)}</div>
        <div className="team-dots" aria-hidden="true">{members.map((m, i) => <span key={m.name} className={i === active ? 'on' : ''} />)}</div>
        <button type="button" className="scroll-cue scroll-cue-label" onClick={() => document.getElementById('manifeste')?.scrollIntoView({ behavior: reduced.current ? 'auto' : 'smooth', block: 'start' })}>
          Notre manifeste
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
        </button>
      </section>
      <section id="manifeste" className="manifesto-v2" aria-labelledby="manifeste-titre">
        <h2 id="manifeste-titre">Manifeste</h2>
        <div className="manifesto-body" ref={manifesto} onScroll={onManifestoScroll}>
          <div className="manifesto-part">
          <p className="manifesto-lead">Chez Marthe est un refuge, un lieu ressource et une maison tremplin.</p>
          <p>Un lieu pour passer de la survie à la vie, pour habiter, se réparer, créer, travailler, respirer et rayonner ensemble.</p>
          <p>Ici, des femmes venues de la rue cohabitent avec des femmes du quartier, des artistes, des soignantes, des femmes engagées, des étudiantes.</p>
          <p>Ici, on fait l’expérience du vivre-ensemble, du soin sous toutes ses formes, de la solidarité concrète et joyeuse.</p>
          <p>Ici, nous cultivons la mixité, nous brisons l’entre-soi de la précarité pour tisser un réseau de confiance inédit.</p>
          </div>
          <div className="manifesto-part">
          <p className="manifesto-lead">Chez Marthe, nous croyons que le soin est politique.</p>
          <p>Qu’il s’ancre dans l’écoute, le respect des parcours, la reconnaissance des singularités.</p>
          <p>Qu’il passe par le corps, le psychique, le collectif, l’alimentation, la création, le repos et la sécurité matérielle.</p>
          <p>Nous croyons à la force d’une sororité concrète, à l’intelligence collective, à la capacité des femmes à transformer leurs vulnérabilités en puissances d’agir pour ouvrir le champ des possibles.</p>
          <p>Chez Marthe est un espace vivant d’expérimentation, d’inclusion et de régénération.</p>
          <p className="manifesto-welcome">Bienvenue chez Marthe</p>
          </div>
        </div>
        <div className="team-dots manifesto-dots" aria-hidden="true"><span className={slide === 0 ? 'on' : ''} /><span className={slide === 1 ? 'on' : ''} /></div>
      </section>
      <section id="associations" className="assos-v2" aria-labelledby="assos-titre">
        <p className="kicker">AVEC NOUS, AU QUOTIDIEN</p>
        <h2 id="assos-titre">Les associations du lieu</h2>
        <p className="assos-intro">Chez Marthe vit chaque jour avec les associations qui sont installées dans le lieu.</p>
        <div className="assos-grid">{hostedAssociations.map(assoc => <a key={assoc.name} className="asso-card" href={assoc.url} target="_blank" rel="noopener noreferrer">
          <span className="asso-logo"><img src={assoc.logo} alt="" loading="lazy" /></span>
          <strong>{assoc.name}</strong>
          <small>{assoc.role}</small>
        </a>)}</div>
      </section>
    </main>
  </HomeShell>;
}
