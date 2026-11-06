import { useEffect, useState } from 'react';
import { spaceById } from '../../shared/data/spaces.js';
import { spaceUrl } from '../../shared/lib/spaces.js';
import PublicRequest from '../public-request/PublicRequest.jsx';
import { ContactForm } from '../site-pages/Contact.jsx';
import HomeShell, { LINKS } from './HomeShell.jsx';

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
  { title: 'Se loger', photo: '/foto/facade.webp', text: 'Un toit sûr pour se poser et retrouver de la stabilité.' },
  { title: 'Se reconstruire', photo: '/foto/sororite.webp', text: 'Un lieu d’écoute, sans jugement, à son rythme.' },
  { title: 'Se nourrir', photo: '/foto/cantine.webp', text: 'Des repas partagés à prix libre avec la cantine.' },
  { title: 'Rayonner', photo: '/foto/jardin.webp', text: 'Des rencontres et des projets avec tout le quartier.' },
];

// The spaces offered to the public, with the names, surfaces and prices of the « Espaces Chez Marthe » sheet.
// « reunion » is the Bureau; the Atelier is lent in exchange for free workshops.
const publicSpaces = [
  { id: 'chapelle', name: 'La Chapelle', photo: '/foto/chapelle.jpg', info: '80 à 150 personnes · 114 m² · concerts, spectacles, danse, yoga', price: '2 h 40 € · ½ journée 150 € · journée 300 €', note: 'Sonorisation (micro + enceinte) : 50 €' },
  { id: 'salon-collectif', name: 'Salon collectif / Séminaire', photo: '/foto/salon.jpg', info: 'Max. 20 personnes · 28 m² · séminaires et réunions', price: '2 h 40 € · ½ journée 100 € · journée 200 €' },
  { id: 'reunion', name: 'Le Bureau', photo: '/foto/bureau.jpg', info: 'Max. 6 personnes · 16 m² · réunions en petit comité', price: '2 h 40 € · ½ journée 100 € · journée 200 €' },
  { id: 'atelier', name: 'L’Atelier', photo: '/foto/bienvenue.jpg', exchange: 'Échange de services : vous créez ici, vous animez un atelier pour nous' },
];
const requestSpaces = publicSpaces.map(space => ({ ...spaceById[space.id], name: space.id === 'atelier' ? 'L’Atelier (échange de services)' : space.name }));

const partners = [
  { name: 'Habitat Alternatif Social', logo: 'has.webp', url: 'https://www.has.asso.fr/' },
  { name: 'JUST', logo: 'just.webp', url: 'https://just.earth/' },
  { name: 'Les Petites Cantines Marseille', logo: 'petites-cantines.webp', url: 'https://marseille.lespetitescantines.org/' },
  { name: 'Sister4Good', logo: 'sista4good.webp', url: 'https://www.sista4good.com/' },
  { name: 'Benenova Marseille', logo: 'benenova.webp', url: 'https://www.benenova.fr/' },
];

const involvement = [
  { title: 'Faire un don', text: 'Aménager les espaces et faire durer le lieu.', url: LINKS.donate },
  { title: 'Adhérer', text: 'Rejoindre l’association et porter le projet avec nous.', url: LINKS.join },
  { title: 'Les amies de Chez Marthe', text: 'La communauté qui suit la vie du lieu au quotidien.', url: LINKS.friends },
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
          <p>Soutenez un lieu tremplin pour les femmes, <span className="keep">au cœur de{' '}
            {/* Every city is laid out invisibly in the same cell: the widest one sets the width, so « au cœur de » never moves. */}
            <span className="city" aria-hidden="true">
              <span className="city-sizer">{cities.map(c => <span key={c}>{c}|.</span>)}</span>
              <span className="city-now">{city}<span className="city-cursor">|</span>.</span>
            </span></span>
            <span className="sr-only">{cities.join(', ')}.</span>
          </p>
        </div>
        <div className="actions"><a className="btn btn-primary" href="#s-impliquer">Nous soutenir</a></div>
        <a className="btn btn-rent" href="#espaces">Louer un espace <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>;
}

export default function Landing() {
  const [picked, setPicked] = useState(null);
  return <HomeShell home>
    <main>
      <Hero />

      <section id="le-lieu" className="block" aria-labelledby="lieu-titre">
        <p className="kicker">NOTRE PREMIER LIEU</p>
        <h2 id="lieu-titre">Chez Marthe, Saint-Savournin</h2>
        <img className="wide" src="/foto/panneaux.webp" alt="Panneaux peints indiquant la chapelle, le jardin, les espaces personnels et les associations du lieu" />
        <p>Un ancien couvent de 1 500 m² dans le quartier des Réformés : trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.</p>
        <ul className="facts">
          <li><strong>30</strong><span>femmes hébergées, avec ou sans enfants</span></li>
          <li><strong>~20</strong><span>étudiantes en situation de précarité</span></li>
          <li><strong>6</strong><span>espaces partagés avec le quartier</span></li>
        </ul>
        <div className="home-pillars">{pillars.map(p => <figure key={p.title}><img src={p.photo} alt="" loading="lazy" /><figcaption><strong>{p.title}</strong>{p.text}</figcaption></figure>)}</div>
      </section>

      <section id="evenements" className="block block-wall" aria-labelledby="evenements-titre">
        <p className="kicker">NOS ÉVÈNEMENTS</p>
        <h2 id="evenements-titre">La programmation</h2>
        {/* To fill with the real programme. */}
        <ol className="events">{[1, 2, 3].map(n => <li key={n} className="event"><span className="event-date"><strong>jj</strong>mois</span><span className="event-body"><strong>[Titre de l’évènement]</strong><small>[heure] · [espace] · [gratuit / prix]</small></span></li>)}</ol>
        <p className="small">Toute la programmation et les inscriptions sur notre Instagram.</p>
      </section>

      <section id="espaces" className="block" aria-labelledby="espaces-titre">
        <p className="kicker">LOUER UN ESPACE</p>
        <h2 id="espaces-titre">Un lieu pour votre activité</h2>
        <div className="home-spaces">{publicSpaces.map(space => <a key={space.id} className="space" href="#demande" onClick={() => setPicked({ space: space.id, at: Date.now() })}>
          <img src={space.photo} alt="" loading="lazy" />
          <span><strong>{space.name}</strong>{space.info && <small>{space.info}</small>}{space.price && <small className="price">{space.price}</small>}{space.note && <small>{space.note}</small>}{space.exchange && <small className="exchange">{space.exchange}</small>}</span>
        </a>)}</div>
      </section>

      <div id="demande" className="block request-block"><PublicRequest spaces={requestSpaces} hidePicker picked={picked} /></div>

      <section id="partenaires" className="block" aria-labelledby="partenaires-titre">
        <p className="kicker">ILS FONT VIVRE LE LIEU</p>
        <h2 id="partenaires-titre">Nos partenaires</h2>
        <ul className="home-partners">{partners.map(p => <li key={p.name}><a href={p.url} target="_blank" rel="noreferrer"><img src={`/foto/partenaires/${p.logo}`} alt={p.name} loading="lazy" /></a></li>)}</ul>
      </section>

      <section id="s-impliquer" className="block" aria-labelledby="impliquer-titre">
        <p className="kicker">REJOINDRE LE MOUVEMENT</p>
        <h2 id="impliquer-titre">Nous soutenir</h2>
        <p>Faites un don, adhérez à l’association ou rejoignez la communauté : chaque soutien fait vivre Chez Marthe.</p>
        <div className="involve-grid">{involvement.map(item => <a key={item.title} className="home-involve" href={item.url} target="_blank" rel="noreferrer"><strong>{item.title}</strong><span>{item.text}</span></a>)}</div>
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
