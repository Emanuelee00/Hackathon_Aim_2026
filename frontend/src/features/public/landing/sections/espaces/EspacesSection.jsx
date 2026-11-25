import { useRef, useState } from 'react';

import { spaceById } from '../../../../../shared/data/spaces.js';
import PublicRequest from '../../../public-request/PublicRequest.jsx';

// The cards of « Louer un espace » : the team edits them in « Site », see rentalSpaces.js and siteContent.js.
const requestSpacesOf = cards => cards.filter(card => !card.link && spaceById[card.space]).map(card => ({ ...spaceById[card.space], name: card.space === 'atelier' ? 'L’Atelier (échange de services)' : card.name }));

export default function EspacesSection({ spaces, publicSpaces }) {
  const [picked, setPicked] = useState(null);
  const spacesRef = useRef(null);
  const [spaceActive, setSpaceActive] = useState(0);
  // Téléphone : les espaces se font défiler de côté, un à la fois ; les points montrent lequel est devant.
  const onSpacesScroll = () => {
    const el = spacesRef.current;
    const first = el?.children[0];
    if (first) setSpaceActive(Math.min(publicSpaces.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || 0)))));
  };
  const requestSpaces = requestSpacesOf(publicSpaces);
  return <>
    <section id="espaces" className="block" aria-labelledby="espaces-titre">
      <p className="kicker">{spaces.kicker}</p>
      <h2 id="espaces-titre">{spaces.title}</h2>
      <div className="home-spaces" ref={spacesRef} onScroll={onSpacesScroll}>{publicSpaces.map(space => <a key={space.id} className="space" href={space.link ? space.link.url : spaceById[space.space] ? '#demande' : '#contact'} {...(space.link ? { target: '_blank', rel: 'noopener noreferrer' } : spaceById[space.space] ? { onClick: () => setPicked({ space: space.space, at: Date.now() }) } : {})}>
        <img src={space.photo} alt="" loading="lazy" style={{ objectPosition: space.focus }} />
        <h3 className="space-title">{space.name}</h3>
        <div className="space-body">
          <ul className="space-details">{(space.details || []).map(detail => <li key={detail}>{detail}</li>)}</ul>
          {space.prices?.length > 0 && <dl className="space-prices">{space.prices.map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>)}</dl>}
          {space.note && <p>{space.note}</p>}
          {space.exchange && <p className="space-exchange">{space.exchange}</p>}
          <span className="space-cta">{space.link ? `${space.link.label} ↗` : spaceById[space.space] ? 'Faire une demande →' : 'Nous contacter →'}</span>
        </div>
      </a>)}</div>
      <div className="team-dots" aria-hidden="true">{publicSpaces.map((space, i) => <span key={space.id} className={i === spaceActive ? 'on' : ''} />)}</div>
    </section>
    {spaces.showRequest !== false && <div id="demande" className="block request-block"><PublicRequest spaces={requestSpaces} hidePicker picked={picked} /></div>}
  </>;
}
