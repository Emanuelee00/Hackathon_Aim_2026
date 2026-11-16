import Icon from '../../shared/components/Icon.jsx';
import { monthLabel, monthOf, shiftMonth } from './bilans.js';

export default function MonthPicker({ month, onChange }) {
  const current = monthOf(new Date());
  return <div className="bilan-month" role="group" aria-label="Mois du bilan">
    <button type="button" className="icon-button" aria-label="Mois précédent" onClick={() => onChange(shiftMonth(month, -1))}><Icon name="left" size={16} /></button>
    <strong>{monthLabel(month)}</strong>
    <button type="button" className="icon-button" aria-label="Mois suivant" disabled={month >= current} onClick={() => onChange(shiftMonth(month, 1))}><Icon name="right" size={16} /></button>
  </div>;
}
