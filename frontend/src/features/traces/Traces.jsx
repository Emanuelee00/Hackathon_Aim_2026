import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { TODAY } from '../../shared/data/spaces.js';
import { laughTrace } from './traces.js';

function Trace({ item }) {
  return <li><strong>{item.count}</strong><span>{item.label}<small>{item.stage}{item.next && ` · prochaine floraison à ${item.next}`}</small></span></li>;
}

export default function Traces({ traces }) {
  const { laughs, addLaugh, removeLastLaugh, notify } = useStore();
  const all = laughs.length ? [...traces, laughTrace(laughs)] : traces;
  const laugh = () => { addLaugh(TODAY); notify('Ce rire est gardé, rien que pour vous.'); };
  return <section className="panel traces">
    <h3><Icon name="leaf" size={18} />Mes traces ici</h3>
    <p>Ce que vous avez semé chez Marthe. Rien à gagner, tout à garder.</p>
    {all.length ? <ul>{all.map(item => <Trace key={item.id} item={item} />)}</ul> : <p className="traces-empty">Vos premières traces apparaîtront après un moment partagé ici.</p>}
    <div className="traces-laugh">
      <button className="button button-quiet button-small" onClick={laugh}><Icon name="heart" size={16} />J’ai ri aujourd’hui</button>
      {laughs.length > 0 && <button className="text-link" onClick={removeLastLaugh}>Retirer le dernier</button>}
    </div>
  </section>;
}
