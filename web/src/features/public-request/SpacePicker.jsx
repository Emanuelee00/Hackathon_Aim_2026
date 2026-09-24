import Icon from '../../shared/components/Icon.jsx';
import { bookableSpaces } from '../../shared/data/spaces.js';

const priceLine = space => space.prices ? [space.prices['2h'] && `2 h ${space.prices['2h']} €`, space.prices.half && `½ journée ${space.prices.half} €`, space.prices.day && `journée ${space.prices.day} €`].filter(Boolean).join(', ') : space.rate != null ? `${space.rate} € / heure` : 'Tarif sur devis';

// Choosing a space here fills the form below.
export default function SpacePicker({ value, onPick }) {
  return <div className="space-picker">
    {bookableSpaces.map(space => <button key={space.id} type="button" className="space-pick" aria-pressed={value === space.id} onClick={() => onPick(space.id)}>
      <span className={`event-symbol ${space.color}`}><Icon name={space.icon} size={20} /></span>
      <strong>{space.name}</strong>
      <small>{[space.area && `${space.area} m²`, space.capacity && `${space.capacity} pers.`].filter(Boolean).join(' · ')}</small>
      <span>{space.description}</span>
      <small className="space-pick-price">{priceLine(space)}</small>
    </button>)}
    <div className="space-pick private"><span className="event-symbol"><Icon name="heart" size={20} /></span><strong>Hébergement</strong><span>Espaces privés des résidentes, non accessibles.</span></div>
  </div>;
}
