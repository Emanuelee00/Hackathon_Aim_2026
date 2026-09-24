import Icon from '../../shared/components/Icon.jsx';
import { spaces, spaceUrl } from '../../shared/lib/spaces.js';
import { StoreProvider } from '../../app/store.jsx';
import PublicRequest from '../public-request/PublicRequest.jsx';

// Pages, photos and partners mirror the association's site (chezmarthe.org) so the demo feels like its next version.
const pillars = [
  { title: 'Se loger', photo: '/chezmarthe/facade.webp', text: 'Un toit sûr pour se poser et retrouver de la stabilité avant la prochaine étape.' },
  { title: 'Se reconstruire', photo: '/chezmarthe/sororite.webp', text: 'Un lieu d’écoute, sans jugement, pour prendre soin de soi à son rythme.' },
  { title: 'Se nourrir', photo: '/chezmarthe/cantine.webp', text: 'Des repas partagés à prix libre avec la cantine et le jardin.' },
  { title: 'Rayonner', photo: '/chezmarthe/jardin.webp', text: 'Des rencontres, des projets et des coups de main avec tout le quartier.' },
];

const partners = [
  { name: 'Habitat Alternatif Social', logo: 'has.webp', url: 'https://www.has.asso.fr/' },
  { name: 'JUST', logo: 'just.webp', url: 'https://just.earth/' },
  { name: 'Les Petites Cantines Marseille', logo: 'petites-cantines.webp', url: 'https://marseille.lespetitescantines.org/' },
  { name: 'Sister4Good', logo: 'sista4good.webp', url: 'https://www.sista4good.com/' },
  { name: 'Benenova Marseille', logo: 'benenova.webp', url: 'https://www.benenova.fr/' },
];

const involvement = [
  { title: 'Faire un don', icon: 'heart', text: 'Aménager les espaces et faire durer le lieu.', url: 'https://www.helloasso.com/associations/chez-marthe/formulaires/3', cta: 'Je donne' },
  { title: 'Adhérer', icon: 'users', text: 'Rejoindre l’association et porter le projet avec nous.', url: 'https://www.helloasso.com/associations/chez-marthe/adhesions/adhesion-chez-marthe', cta: 'J’adhère' },
  { title: 'Les amies de Chez Marthe', icon: 'sparkles', text: 'La communauté qui suit la vie du lieu au quotidien.', url: 'https://chat.whatsapp.com/GCTH2IPPnraADelLbGxVzX?mode=gi_t', cta: 'Je rejoins' },
];

export function Brand() {
  return <a href={spaceUrl(null)} className="landing-brand"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>;
}

function Wave({ className }) {
  return <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C 240 8 480 8 720 40 S 1200 80 1440 30 V80 H0 Z" /></svg>;
}

export default function Landing() {
  return <div className="landing">
    <header className="site-header">
      <Brand />
      <nav aria-label="Sur cette page"><a href="#espaces">Espaces</a><a href="#le-lieu">Le lieu</a><a href="#demande">Demande</a><a href="#partenaires">Partenaires</a><a href="#s-impliquer">S’impliquer</a></nav>
      <a className="button button-pink button-small" href="#demande">Faire une demande</a>
    </header>

    <section className="landing-cover">
      <div className="landing-cover-inner">
        <p className="cover-kicker">Chez Marthe · Marseille</p>
        <h1>Des lieux tremplins pour les femmes</h1>
        <p>Habiter, travailler, vivre ensemble, créer du lien et rayonner.</p>
        <div className="cover-actions"><a className="button button-dark button-large" href="#espaces">Choisir mon espace</a><a className="button button-light button-large" href="#demande">Proposer une activité</a></div>
      </div>
    </section>

    <section id="espaces" className="landing-section landing-wrap">
      <div className="section-title"><p className="eyebrow">LA PLATEFORME</p><h2>Un espace pour chacune et chacun</h2></div>
      <nav className="landing-spaces" aria-label="Espaces">
        {spaces.filter(space => !space.hidden).map(space => <a key={space.id} href={spaceUrl(space.id)} className="landing-card">
          <span className="landing-icon"><Icon name={space.icon} size={22} /></span>
          <strong>{space.label}{space.soon && <small>Bientôt</small>}</strong>
          <p>{space.text}</p>
          <Icon name="arrow" size={18} className="landing-arrow" />
        </a>)}
      </nav>
    </section>

    <section className="landing-band" aria-labelledby="pillars-title">
      <Wave className="wave wave-top" />
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

    <section id="le-lieu" className="landing-section landing-wrap place">
      <img src="/chezmarthe/panneaux.webp" alt="Panneaux peints indiquant la chapelle, le jardin, les espaces personnels et les associations du lieu" loading="lazy" />
      <div>
        <p className="eyebrow">NOTRE PREMIER LIEU</p>
        <h2>Chez Marthe, Saint-Savournin</h2>
        <p>Un ancien couvent de 1 500 m² dans le quartier des Réformés : trois bâtiments, une chapelle néogothique et un jardin, réveillés pour devenir la première Maison Tremplin.</p>
        <ul className="place-facts">
          <li><strong>30</strong><span>femmes hébergées, avec ou sans enfants</span></li>
          <li><strong>~20</strong><span>étudiantes en situation de précarité</span></li>
          <li><strong>6</strong><span>espaces partagés avec le quartier</span></li>
        </ul>
      </div>
    </section>

    <div id="demande" className="landing-section landing-wrap"><StoreProvider><PublicRequest /></StoreProvider></div>

    <section id="partenaires" className="landing-section landing-wrap">
      <div className="section-title"><p className="eyebrow">ILS FONT VIVRE LE LIEU</p><h2>Nos partenaires</h2></div>
      <ul className="partners">{partners.map(partner => <li key={partner.name}><a href={partner.url} target="_blank" rel="noreferrer"><img src={`/chezmarthe/partenaires/${partner.logo}`} alt={partner.name} loading="lazy" /></a></li>)}</ul>
    </section>

    <section id="s-impliquer" className="landing-section landing-wrap">
      <div className="section-title"><p className="eyebrow">REJOINDRE LE MOUVEMENT</p><h2>Comment s’impliquer ?</h2></div>
      <div className="involve">{involvement.map(item => <a key={item.title} className="involve-card" href={item.url} target="_blank" rel="noreferrer">
        <span className="landing-icon"><Icon name={item.icon} size={22} /></span>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        <span className="button button-dark button-small">{item.cta}</span>
      </a>)}</div>
    </section>

    <footer className="site-footer">
      <div className="landing-wrap">
        <img src="/logo-chez-marthe.png" alt="Chez Marthe" />
        <p>Habiter &amp; rayonner. Démonstration hackathon : les données de la plateforme sont fictives.</p>
        <a href="https://www.chezmarthe.org/" target="_blank" rel="noreferrer">chezmarthe.org</a>
      </div>
    </footer>
  </div>;
}
