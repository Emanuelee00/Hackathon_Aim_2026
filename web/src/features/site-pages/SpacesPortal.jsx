import { spaceUrl } from '../../shared/lib/spaces.js';
import HomeShell from '../landing/HomeShell.jsx';

// « Nos espaces » (/connexion): one card per space, each opening its sign-in / sign-up on its subdomain.
const portals = [
  { id: 'residents', title: 'Résidentes', text: 'Vos propositions d’activités, votre parcours et votre plan emploi.', signup: 'Pas encore de compte ? Faites une demande : l’équipe la valide.', action: 'Demander un accès' },
  { id: 'benevoles', title: 'Bénévoles', text: 'Donner un coup de main aux événements du lieu.', signup: 'Pas encore de compte ? Créez-le en une minute.', action: 'Créer un compte' },
  { id: 'partenaires', title: 'Associations', text: 'Associations hébergées : vos créneaux, votre agenda et vos réservations.', signup: 'Pas encore de compte ? Faites une demande : l’équipe la valide.', action: 'Demander un accès' },
  { id: 'equipe', title: 'Équipe', text: 'Coordonner les demandes, le calendrier, les espaces et les bilans.', signup: 'Les comptes de l’équipe sont créés par Chez Marthe.' },
];

export default function SpacesPortal() {
  return <HomeShell>
    <main className="portal">
      <p className="kicker">NOS ESPACES</p>
      <h1>Un espace pour chacune et chacun</h1>
      <p>Choisissez votre espace pour vous connecter ou créer votre compte.</p>
      <div className="portal-grid">{portals.map(p => <section key={p.id} className="portal-card" aria-labelledby={`${p.id}-titre`}>
        <h2 id={`${p.id}-titre`}>{p.title}</h2>
        <p>{p.text}</p>
        <p className="signup">{p.signup}</p>
        <div className="portal-actions">
          <a className="btn btn-primary" href={spaceUrl(p.id)}>Se connecter</a>
          {p.action && <a className="btn btn-outline" href={spaceUrl(p.id)}>{p.action}</a>}
        </div>
      </section>)}</div>
    </main>
  </HomeShell>;
}
