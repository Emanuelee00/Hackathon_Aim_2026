import HomeShell from '../landing/HomeShell.jsx';

// « Notre équipe » (/equipe), reached from the menu. To complete: roles, photos, presentations, values.
const members = [
  { name: 'Véronique', role: 'Présidente' },
  { name: 'Joria', role: '[Rôle]' },
  { name: 'Flora', role: '[Rôle]' },
];

export default function Team() {
  return <HomeShell>
    <main>
      <section id="equipe" className="block team-page" aria-labelledby="equipe-titre">
        <p className="kicker">NOTRE ÉQUIPE</p>
        <h2 id="equipe-titre">Les visages de Chez Marthe</h2>
        <div className="team">{members.map(m => <article key={m.name} className="member">
          <span className="member-avatar" aria-hidden="true">{m.name[0]}</span>
          <div><h3>{m.name}</h3><p className="role">{m.role}</p><p>[Une ou deux phrases de présentation]</p></div>
        </article>)}</div>
        <h3 id="valeurs" className="subtitle">Nos valeurs</h3>
        <div className="values">{[1, 2, 3].map(n => <div key={n} className="value"><strong>[Valeur {n}]</strong><span>[Ce qu’elle veut dire concrètement chez Marthe]</span></div>)}</div>
      </section>
    </main>
  </HomeShell>;
}
