import { useEffect, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { dateLabel } from '../../../shared/lib/format.js';

// The copies the server keeps in its database: one per day, the last state of that day.
export default function ServerCopies({ funders }) {
  const [days, setDays] = useState([]);
  useEffect(() => {
    fetch('/api/funders/backups').then(response => response.ok ? response.json() : { days: [] }).then(data => setDays(data.days)).catch(() => setDays([]));
  }, [funders]);
  if (!days.length) return null;
  return <section className="panel funding-copies">
    <h3>Copies Excel sur le serveur</h3>
    <p>Le serveur garde une copie par jour pendant 30 jours, avec l’état de la fin de la journée. Pour revenir en arrière, téléchargez-la puis importez-la.</p>
    <ul>{days.map(day => <li key={day}><a href={`/api/funders/backups/${day}`} download><Icon name="download" size={15} />{dateLabel(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</a></li>)}</ul>
  </section>;
}
