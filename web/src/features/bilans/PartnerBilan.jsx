import { useEffect, useState } from 'react';
import BilanForm from './BilanForm.jsx';
import MonthPicker from './MonthPicker.jsx';
import { loadBilans, monthOf } from './bilans.js';
import './bilans.css';

// Espace associations › « Notre bilan du mois » : la structure du compte connecté, et elle seule.
export default function PartnerBilan() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => monthOf(new Date()));
  useEffect(() => { loadBilans().then(setData, problem => setError(problem.message)); }, []);
  if (error) return <div className="panel partner-panel"><p className="doc-error">{error}</p></div>;
  if (!data) return <div className="panel partner-panel"><p>Chargement…</p></div>;
  const structure = data.structures.find(item => item.id === data.mine);
  if (!structure) return <div className="panel partner-panel"><h3>Bilan du mois</h3><p>Ce compte n’est relié à aucune structure du lieu. Écrivez à l’équipe de Chez Marthe pour qu’elle le relie à la vôtre.</p></div>;
  const saved = entry => setData(current => ({ ...current, entries: [...current.entries.filter(item => item.month !== entry.month), entry] }));
  return <section className="panel partner-panel bilan-panel">
    <div className="bilan-toolbar"><div><h2>Notre bilan du mois</h2><p>{structure.name} · une dizaine de minutes, une fois par mois. Les cases peuvent rester vides ; rien sur une personne nommée.</p></div><MonthPicker month={month} onChange={setMonth} /></div>
    <BilanForm structure={structure} month={month} entries={data.entries} onSaved={saved} />
  </section>;
}
