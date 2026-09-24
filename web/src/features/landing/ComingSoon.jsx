import Icon from '../../shared/components/Icon.jsx';
import { spaces, spaceUrl } from '../../shared/lib/spaces.js';
import { Brand } from './Landing.jsx';

export default function ComingSoon({ spaceId }) {
  const space = spaces.find(item => item.id === spaceId);
  return <div className="landing">
    <Brand />
    <header className="landing-hero">
      <p className="eyebrow">ESPACE {space.label.toUpperCase()}</p>
      <h1>Bientôt ici</h1>
      <p>{space.text} Cet espace est en cours de préparation.</p>
      <a className="text-link" href={spaceUrl(null)}><Icon name="back" size={15} />Retour à l’accueil</a>
    </header>
  </div>;
}
