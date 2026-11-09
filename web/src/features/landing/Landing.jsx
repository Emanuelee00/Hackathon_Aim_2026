import { useEffect, useState } from 'react';
import { spaceById } from '../../shared/data/spaces.js';
import { spaceUrl } from '../../shared/lib/spaces.js';
import PublicRequest from '../public-request/PublicRequest.jsx';
import { ContactForm } from '../site-pages/Contact.jsx';
import HomeShell, { LINKS, socials } from './HomeShell.jsx';

const cities = ['Marseille', 'Nice', 'Avignon', 'Paris', 'Angers', 'La Ciotat'];

// Types out each city, pauses, erases it, then moves to the next — skipped for reduced motion.
function useTypewriter(words, { typingMs = 90, deletingMs = 45, pauseMs = 1500 } = {}) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let index = 0;
    let current = words[0];
    let deleting = true;
    let timerId;
    function step() {
      const word = words[index];
      current = deleting ? current.slice(0, -1) : word.slice(0, current.length + 1);
      setText(current);
      let delay = deleting ? deletingMs : typingMs;
      if (!deleting && current === word) { delay = pauseMs; deleting = true; }
      else if (deleting && current === '') { deleting = false; index = (index + 1) % words.length; }
      timerId = setTimeout(step, delay);
    }
    timerId = setTimeout(step, pauseMs);
    return () => clearTimeout(timerId);
  }, []);
  return text;
}

const pillars = [
  { title: 'Se loger', photo: '/foto/facade.webp', text: 'Un toit sûr pour se poser et retrouver de la stabilité avant la prochaine étape.' },
  { title: 'Se reconstruire', photo: '/foto/sororite.webp', text: 'Un lieu d’écoute, sans jugement, pour prendre soin de soi à son rythme.' },
  { title: 'Se nourrir', photo: '/foto/cantine.webp', text: 'Des repas partagés à prix libre avec la cantine et le jardin.' },
  { title: 'Rayonner', photo: '/foto/jardin.webp', text: 'Des rencontres, des projets et des coups de main avec tout le quartier.' },
];

// Violet wave closing the band above and below (same as the platform's public site).
function Wave({ className }) {
  return <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C 240 8 480 8 720 40 S 1200 80 1440 30 V80 H0 Z" /></svg>;
}

// The spaces offered to the public, with the names, surfaces and prices of the « Espaces Chez Marthe » sheet.
// « reunion » is the Bureau; the Atelier is lent in exchange for free workshops.
const publicSpaces = [
  { id: 'chapelle', name: 'La Chapelle', photo: '/foto/chapelle.jpg', focus: 'center 14%', details: ['80 à 150 personnes', '114 m²', 'Concerts, spectacles, danse, yoga'], prices: [['2 heures', '40 €'], ['Demi-journée', '150 €'], ['Journée', '300 €']], note: 'Sonorisation (micro + enceinte) : 50 € en plus.' },
  { id: 'salon-collectif', name: 'Salon collectif / Séminaire', photo: '/foto/salon.jpg', focus: 'center 45%', details: ['Maximum 20 personnes', '28 m²', 'Séminaires et réunions'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'reunion', name: 'Le Bureau', photo: '/foto/bureau.jpg', focus: 'center 40%', details: ['Maximum 6 personnes', '16 m²', 'Réunions en petit comité'], prices: [['2 heures', '40 €'], ['Demi-journée', '100 €'], ['Journée', '200 €']] },
  { id: 'atelier', name: 'L’Atelier', photo: '/foto/atelier.jpg', focus: 'center 55%', details: ['Échange de services'], exchange: 'Vous utilisez l’Atelier et, en échange, vous animez un atelier gratuit pour Chez Marthe.' },
];
const requestSpaces = publicSpaces.map(space => ({ ...spaceById[space.id], name: space.id === 'atelier' ? 'L’Atelier (échange de services)' : space.name }));

const partners = [
  { name: 'Habitat Alternatif Social', logo: 'has.webp', url: 'https://www.has.asso.fr/' },
  { name: 'JUST', logo: 'just.webp', url: 'https://just.earth/' },
  { name: 'Les Petites Cantines Marseille', logo: 'petites-cantines.webp', url: 'https://marseille.lespetitescantines.org/' },
  { name: 'Sister4Good', logo: 'sista4good.webp', url: 'https://www.sista4good.com/' },
  { name: 'Benenova Marseille', logo: 'benenova.webp', url: 'https://www.benenova.fr/' },
];

// Financeurs publics : le logo vient de la page Wikipédia de la Métropole.
const funders = [
  { name: 'Métropole Aix-Marseille-Provence', logo: 'metropole-aix-marseille-provence.svg', url: 'https://www.ampmetropole.fr/' },
];

const involvement = [
  { title: 'Proposer un lieu d’accueil', photo: '/foto/facade.webp', text: 'Vous connaissez un lieu qui pourrait accueillir le projet ? Parlons-en.', url: '#contact' },
  { title: 'Faire un don', photo: '/foto/jardin.webp', text: 'Aménager les espaces et faire durer le lieu.', url: LINKS.donate },
  { title: 'Adhérer', photo: '/foto/sororite.webp', text: 'Rejoindre l’association et porter le projet avec nous.', url: LINKS.join },
  { title: 'Les amies de Chez Marthe', photo: '/foto/cantine.webp', text: 'La communauté qui suit la vie du lieu au quotidien.', url: LINKS.friends },
];

export function Brand() {
  return <a href={spaceUrl(null)} className="landing-brand"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>;
}

// Still used by the legal and contact pages (SitePage).
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="landing-wrap">
      <img src="/logo-chez-marthe.png" alt="Chez Marthe" />
      <p>Habiter &amp; rayonner.</p>
      <nav aria-label="Informations"><a href="/contact">Contact</a><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a></nav>
    </div>
  </footer>;
}

function Hero() {
  const city = useTypewriter(cities);
  return <section className="home-hero">
    <div className="hero-inner">
      <div className="hero-media" aria-hidden="true"><img className="clip is-on" src="/foto/haut-de-page.jpg" alt="" /></div>
      <div className="hero-text">
        <div className="hero-headline">
          <h1>Rejoignez l’aventure</h1>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#s-impliquer">Nous soutenir</a>
            <a className="btn btn-rent" href="#espaces">Louer un espace</a>
          </div>
          <p>Soutenez un lieu tremplin pour les femmes,<br /><span className="keep">au cœur de{' '}
            {/* Every city is laid out invisibly in the same cell: the widest one sets the width, so « au cœur de » never moves. */}
            <span className="city" aria-hidden="true">
              <span className="city-sizer">{cities.map(c => <span key={c}>{c}|.</span>)}</span>
              <span className="city-now">{city}<span className="city-cursor">|</span>.</span>
            </span></span>
            <span className="sr-only">{cities.join(', ')}.</span>
          </p>
        </div>
      </div>
    </div>
  </section>;
}

const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

// Programmation : une semaine du Google Agenda de l'association (via /api/programmation), avec une flèche pour la semaine suivante.
function WeekProgramme() {
  const [monday, setMonday] = useState(() => mondayOf(new Date()));
  const [events, setEvents] = useState(null);
  const start = isoDate(monday);
  useEffect(() => {
    let current = true;
    setEvents(null);
    fetch(`/api/programmation?semaine=${start}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('indisponible'))))
      .then(data => current && setEvents(data.events))
      .catch(() => current && setEvents(false));
    return () => { current = false; };
  }, [start]);
  const days = Array.from({ length: 7 }, (_, n) => { const day = new Date(monday); day.setDate(monday.getDate() + n); return day; });
  const shift = weeks => { const next = new Date(monday); next.setDate(monday.getDate() + weeks * 7); setMonday(next); };
  const thisWeek = start === isoDate(mondayOf(new Date()));
  const last = days[6];
  const label = `${monday.getDate()}${monday.getMonth() === last.getMonth() ? '' : ` ${monthNames[monday.getMonth()]}`} – ${last.getDate()} ${monthNames[last.getMonth()]}`;
  return <div className="week">
    <div className="week-head">
      <button type="button" className="week-arrow" onClick={() => shift(-1)} disabled={thisWeek} aria-label="Semaine précédente">‹</button>
      <p className="week-label" aria-live="polite">Semaine du {label}</p>
      <button type="button" className="week-arrow" onClick={() => shift(1)} aria-label="Semaine suivante">›</button>
    </div>
    {events === false && <p className="week-note">La programmation n’est pas disponible pour le moment. Retrouvez-la sur notre Instagram.</p>}
    <ol className="week-days">{days.map((day, n) => {
      const dayEvents = (events || []).filter(event => event.date === isoDate(day));
      return <li key={isoDate(day)} className={`week-day${dayEvents.length ? ' has-events' : ''}`}>
        <span className="event-date"><strong>{day.getDate()}</strong>{dayNames[n].slice(0, 3)}</span>
        <div className="week-events">
          {dayEvents.length
            ? dayEvents.map((event, index) => <p key={event.title + event.start} className={`week-event shade-${Math.min(index, 3)}`}><strong>{event.title}</strong><small>{[event.start && `${event.start}${event.end ? `–${event.end}` : ''}`, event.place].filter(Boolean).join(' · ') || 'Toute la journée'}</small></p>)
            : <p className="week-empty">{events === null ? '…' : 'Rien de prévu'}</p>}
        </div>
      </li>;
    })}</ol>
  </div>;
}

export default function Landing() {
  const [picked, setPicked] = useState(null);
  return <HomeShell home>
    <main>
      <Hero />

      <section className="landing-band" aria-labelledby="pillars-title">
        <div className="landing-wrap">
          <h2 id="pillars-title" className="sr-only">Ce que l’on vit Chez Marthe</h2>
          <div className="pillars">{pillars.map(pillar => <article key={pillar.title} className="pillar">
            <img src={pillar.photo} alt="" loading="lazy" />
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>)}</div>
        </div>
        <Wave className="wave wave-bottom" />
      </section>

      {/* La photo des panneaux peints (chapelle, jardin, espaces personnels, associations) est le fond de la section : voir home.css. */}
      <section id="le-lieu" className="landing-section landing-wrap place place-bg">
        <div>
          <p className="eyebrow">NOTRE PREMIER LIEU</p>
          <h2>Chez Marthe, Saint-Savournin</h2>
          <p>Un ancien couvent de 1 500 m² dans le quartier des Réformés : trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.</p>
          <ul className="place-facts">
            <li><strong>30</strong><span>femmes hébergées, avec ou sans enfants</span></li>
            <li><strong>6</strong><span>espaces partagés avec le quartier</span></li>
          </ul>
        </div>
      </section>

      <section id="evenements" className="block block-wall" aria-labelledby="evenements-titre">
        <p className="kicker">NOS ÉVÈNEMENTS</p>
        <h2 id="evenements-titre">La programmation</h2>
        <WeekProgramme />
        <p className="small">Toute la programmation et les inscriptions sur notre <a className="insta-link" href={socials[0].url} target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
      </section>

      <section id="espaces" className="block" aria-labelledby="espaces-titre">
        <p className="kicker">LOUER UN ESPACE</p>
        <h2 id="espaces-titre">Un lieu pour votre activité</h2>
        <div className="home-spaces">{publicSpaces.map(space => <a key={space.id} className="space" href="#demande" onClick={() => setPicked({ space: space.id, at: Date.now() })}>
          <img src={space.photo} alt="" loading="lazy" style={{ objectPosition: space.focus }} />
          <h3 className="space-title">{space.name}</h3>
          <div className="space-body">
            <ul className="space-details">{space.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
            {space.prices && <dl className="space-prices">{space.prices.map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{amount}</dd></div>)}</dl>}
            {space.note && <p>{space.note}</p>}
            {space.exchange && <p className="space-exchange">{space.exchange}</p>}
            <span className="space-cta">Faire une demande →</span>
          </div>
        </a>)}</div>
      </section>

      <div id="demande" className="block request-block"><PublicRequest spaces={requestSpaces} hidePicker picked={picked} /></div>

      <section id="partenaires" className="block" aria-labelledby="partenaires-titre">
        <p className="kicker">ILS FONT VIVRE LE LIEU</p>
        <h2 id="partenaires-titre">Nos partenaires</h2>
        <ul className="home-partners">{partners.map(p => <li key={p.name}><a href={p.url} target="_blank" rel="noreferrer"><img src={`/foto/partenaires/${p.logo}`} alt={p.name} loading="lazy" /></a></li>)}</ul>
        <h3 className="partners-subtitle">Nos partenaires financiers</h3>
        <ul className="home-partners funders">{funders.map(p => <li key={p.name}><a href={p.url} target="_blank" rel="noreferrer"><img src={`/foto/partenaires/${p.logo}`} alt={p.name} loading="lazy" /></a></li>)}</ul>
      </section>

      <section id="s-impliquer" className="block" aria-labelledby="impliquer-titre">
        <p className="kicker">REJOINDRE LE MOUVEMENT</p>
        <h2 id="impliquer-titre">Nous soutenir</h2>
        <p>Faites un don, adhérez à l’association ou rejoignez la communauté : chaque soutien fait vivre Chez Marthe.</p>
        <div className="involve-grid">{involvement.map(item => <a key={item.title} className="home-involve" href={item.url} target={item.url.startsWith('http') ? '_blank' : undefined} rel={item.url.startsWith('http') ? 'noreferrer' : undefined} style={{ '--photo': `url(${item.photo})` }}><strong>{item.title}</strong><span>{item.text}</span></a>)}</div>
      </section>

      <section id="contact" className="block" aria-labelledby="contact-titre">
        <p className="kicker">CONTACT</p>
        <h2 id="contact-titre">Contactez-nous</h2>
        <p>Une question, une idée, l’envie de vous impliquer ? Écrivez-nous : nous répondons généralement sous 1 à 2 jours ouvrables.</p>
        <ContactForm />
      </section>
    </main>
  </HomeShell>;
}
