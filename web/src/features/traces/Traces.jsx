import Icon from '../../shared/components/Icon.jsx';

export default function Traces({ traces }) {
  return <section className="panel traces">
    <h3><Icon name="leaf" size={18} />Mes traces ici</h3>
    <p>Ce que vous avez semé chez Marthe. Rien à gagner, tout à garder.</p>
    {traces.length ? <ul>{traces.map(item => <li key={item.id}>
      <strong>{item.count}</strong>
      <span>{item.label}<small>{item.stage}{item.next && ` · prochaine floraison à ${item.next}`}</small></span>
    </li>)}</ul> : <p className="traces-empty">Vos premières traces apparaîtront après un moment partagé ici.</p>}
  </section>;
}
