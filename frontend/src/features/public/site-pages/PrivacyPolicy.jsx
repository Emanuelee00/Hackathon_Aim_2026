import SitePage from './SitePage.jsx';
import { association } from './association.js';

// What the platform collects, form by form: keep it in step with the code.
const processing = [
  {
    title: 'Formulaire de contact',
    data: 'nom, e-mail, téléphone (facultatif), sujet et message.',
    purpose: 'vous répondre.',
    basis: 'notre intérêt légitime à répondre aux personnes qui nous écrivent.',
    duration: '3 ans après notre dernier échange.',
  },
  {
    title: 'Demande d’activité ou de location d’espace',
    data: 'nom de l’organisatrice ou de l’organisateur, e-mail, description de l’activité, date, nombre de personnes, besoins techniques et budget.',
    purpose: 'étudier la demande, organiser l’activité et vous recontacter.',
    basis: 'les mesures préalables à un accord que vous nous demandez.',
    duration: '3 ans après l’activité, ou après la demande si elle n’a pas eu lieu.',
  },
  {
    title: 'Bilan d’événement',
    data: 'note, nombre de participants, commentaire sur l’organisation.',
    purpose: 'améliorer l’accueil des activités.',
    basis: 'notre intérêt légitime.',
    duration: 'la même durée que la demande d’activité.',
  },
  {
    title: 'Comptes des espaces (équipe, résidentes, bénévoles, associations)',
    data: 'nom, e-mail, espace, mot de passe (enregistré uniquement sous forme chiffrée, jamais en clair).',
    purpose: 'vous donner accès à votre espace.',
    basis: 'l’utilisation du service que vous demandez.',
    duration: 'tant que le compte est utilisé ; il est supprimé sur simple demande.',
  },
  {
    title: 'Accompagnement des résidentes',
    data: 'objectifs, compétences, langues, disponibilités, activités proposées et suivies, étapes du parcours.',
    purpose: 'proposer des activités et des opportunités adaptées, et suivre le parcours.',
    basis: 'le consentement de la résidente, qu’elle peut retirer à tout moment. Ces informations ne sont visibles que par l’équipe de Chez Marthe.',
    duration: 'la durée de l’accompagnement, puis 1 an au plus.',
  },
  {
    title: 'Partenaires et financeurs',
    data: 'nom, fonction et coordonnées professionnelles des interlocuteurs.',
    purpose: 'suivre nos partenariats et nos demandes de financement.',
    basis: 'notre intérêt légitime.',
    duration: 'la durée de la relation, puis 3 ans.',
  },
];

export default function PrivacyPolicy() {
  return <SitePage eyebrow="INFORMATIONS" title="Politique de confidentialité">
    <section>
      <h2>Qui est responsable de vos données ?</h2>
      <p>{association.name}, association loi 1901, {association.address}. Pour toute question : <a href={`mailto:${association.email}`}>{association.email}</a>.</p>
    </section>
    <section>
      <h2>Quelles données, pourquoi et pour combien de temps ?</h2>
      <p>Nous ne collectons que ce dont nous avons besoin, et seulement quand vous nous le donnez.</p>
      {processing.map(item => <article key={item.title} className="privacy-item">
        <h3>{item.title}</h3>
        <dl>
          <dt>Données</dt><dd>{item.data}</dd>
          <dt>Pour</dt><dd>{item.purpose}</dd>
          <dt>Base légale</dt><dd>{item.basis}</dd>
          <dt>Conservation</dt><dd>{item.duration}</dd>
        </dl>
      </article>)}
      <p>Aucune décision n’est prise de façon automatisée, et vos données ne sont transmises à aucun service d’intelligence artificielle.</p>
    </section>
    <section>
      <h2>Qui peut les voir ?</h2>
      <p>Uniquement les membres de l’équipe de {association.name}, chacun selon son rôle. Notre hébergeur, Google Cloud, conserve les données sur des serveurs situés en France, pour notre compte et sans pouvoir les utiliser. Nous ne vendons ni ne cédons aucune donnée.</p>
    </section>
    <section>
      <h2>Cookies</h2>
      <p>Le site n’utilise ni publicité, ni mesure d’audience, ni cookie de suivi. Un seul cookie est déposé, quand vous vous connectez à un espace : il garde votre session ouverte pendant 30 jours au plus. Il est indispensable au fonctionnement du site et ne demande donc pas de consentement.</p>
      <p>Votre navigateur garde aussi quelques préférences d’affichage sur votre appareil ; elles ne nous sont pas envoyées.</p>
    </section>
    <section>
      <h2>Sécurité</h2>
      <p>Les échanges avec le site sont chiffrés (HTTPS), les mots de passe ne sont jamais enregistrés en clair, et la base de données n’est pas accessible depuis Internet.</p>
    </section>
    <section>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander à consulter, corriger ou supprimer vos données, en limiter l’usage, vous y opposer, les récupérer, ou retirer votre consentement. Écrivez-nous à <a href={`mailto:${association.email}`}>{association.email}</a> : nous répondons dans un délai d’un mois.</p>
      <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">cnil.fr</a>).</p>
    </section>
    <section>
      <h2>Liens vers d’autres sites</h2>
      <p>Les dons et adhésions passent par HelloAsso, et le groupe « Les amies de Chez Marthe » par WhatsApp : ces services appliquent leur propre politique de confidentialité.</p>
    </section>
    <p className="site-page-updated">Dernière mise à jour : 2 novembre 2026.</p>
  </SitePage>;
}
