import Icon from '../../shared/components/Icon.jsx';
import { spaces, spaceUrl } from '../../shared/lib/spaces.js';

export function Brand() {
  return <a href={spaceUrl(null)} className="landing-brand"><img src="/logo-chez-marthe.png" alt="Chez Marthe" /></a>;
}

export default function Landing() {
  return <div className="landing">
    <Brand />
    <header className="landing-hero">
      <p className="eyebrow">CHEZ MARTHE · MARSEILLE</p>
      <h1>Le compagnon des lieux vivants</h1>
      <p>Chaque rencontre ouvre des possibles. Choisissez votre espace pour commencer.</p>
    </header>
    <nav className="landing-spaces" aria-label="Espaces">
      {spaces.map(space => <a key={space.id} href={spaceUrl(space.id)} className="landing-card">
        <span className="landing-icon"><Icon name={space.icon} size={22} /></span>
        <strong>{space.label}{space.soon && <small>Bientôt</small>}</strong>
        <p>{space.text}</p>
        <Icon name="arrow" size={18} className="landing-arrow" />
      </a>)}
    </nav>
  </div>;
}
