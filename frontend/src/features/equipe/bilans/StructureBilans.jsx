import { useEffect, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { PageIntro } from '../../../shared/components/Primitives.jsx';
import BilanForm from './BilanForm.jsx';
import MonthPicker from './MonthPicker.jsx';
import { commonTotals, entryFor, loadBilans, monthLabel, monthOf, progress } from './bilans.js';
import './bilans.css';

// Espace équipe › « Bilans des structures » : qui a rempli son bilan du mois, les indicateurs communs additionnés,
// le bilan de chaque structure (l'équipe remplit celui de Chez Marthe, ou un autre à la place d'une structure), l'export Excel.
export default function StructureBilans() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => monthOf(new Date()));
  const [open, setOpen] = useState('chez-marthe');
  useEffect(() => { loadBilans().then(setData, problem => setError(problem.message)); }, []);
  if (!data) return <PageIntro eyebrow="MESURER CE QUI COMPTE" title="Bilans des structures" description={error || 'Chargement…'} />;
  const year = month.slice(0, 4);
  const yearMonths = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);
  const monthTotals = commonTotals(data.structures, data.entries, [month]);
  const yearTotals = commonTotals(data.structures, data.entries, yearMonths);
  const filled = data.structures.filter(structure => entryFor(data.entries, structure.id, month)).length;
  const structure = data.structures.find(item => item.id === open);
  const saved = entry => setData(current => ({ ...current, entries: [...current.entries.filter(item => item.structure !== entry.structure || item.month !== entry.month), entry] }));
  return <>
    <PageIntro eyebrow="MESURER CE QUI COMPTE" title="Bilans des structures" description="Chaque mois, chaque structure du lieu remplit un bilan court depuis l’espace associations : des questions communes à toutes, puis les siennes. Rien sur une personne nommée.">
      <div className="funding-actions"><a className="button button-quiet button-small" href={`/api/bilans/excel?annee=${year}`}><Icon name="download" size={15} />Télécharger {year} (Excel)</a></div>
    </PageIntro>
    <div className="bilan-toolbar"><MonthPicker month={month} onChange={setMonth} /><span className="bilan-count">{filled} / {data.structures.length} bilans remplis</span></div>
    <section className="bilan-structures" aria-label="Les structures">{data.structures.map(item => {
      const entry = entryFor(data.entries, item.id, month);
      const { answered, total } = progress(item, entry?.answers);
      return <button key={item.id} type="button" className={`bilan-structure${open === item.id ? ' active' : ''}${entry ? ' is-filled' : ''}`} aria-pressed={open === item.id} onClick={() => setOpen(item.id)}>
        <strong>{item.name}</strong>
        <small>{entry ? `Rempli · ${answered}/${total} réponses` : 'À remplir'}</small>
      </button>;
    })}</section>
    <section className="panel bilan-totals">
      <h3>Indicateurs communs</h3>
      <table>
        <thead><tr><th scope="col">Toutes les structures</th><th scope="col">{monthLabel(month)}</th><th scope="col">Depuis janvier {year}</th></tr></thead>
        <tbody>{monthTotals.map((item, index) => <tr key={item.id}><th scope="row">{item.label}</th><td>{item.value}</td><td>{yearTotals[index].value}</td></tr>)}</tbody>
      </table>
    </section>
    {structure && <section className="panel bilan-panel">
      <h2>{structure.name} · {monthLabel(month)}</h2>
      {structure.id !== 'chez-marthe' && <p className="funding-hint">C’est la structure qui le remplit depuis son espace ; l’équipe peut le compléter à sa place.</p>}
      <BilanForm structure={structure} month={month} entries={data.entries} onSaved={saved} />
    </section>}
  </>;
}
