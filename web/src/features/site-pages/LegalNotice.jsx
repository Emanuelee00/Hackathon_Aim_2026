import SitePage from './SitePage.jsx';
import { association } from './association.js';

export default function LegalNotice() {
  return <SitePage eyebrow="INFORMATIONS" title="Mentions légales">
    <section>
      <h2>Éditeur du site</h2>
      <p>
        <strong>{association.name}</strong>, association loi 1901<br />
        Siège social : {association.address}<br />
        N° SIRET : {association.siret}<br />
        E-mail : <a href={`mailto:${association.email}`}>{association.email}</a>
      </p>
      <p>Directrice de la publication : {association.publisher}</p>
    </section>
    <section>
      <h2>Hébergement</h2>
      <p>Google Cloud EMEA Limited, Velasco, Clanwilliam Place, Dublin 2, Irlande. Les serveurs et les données sont situés en France (région de Paris).</p>
      <p>Nom de domaine et messagerie : IONOS SARL, 7 place de la Gare, BP 70109, 57200 Sarreguemines Cedex, France.</p>
    </section>
    <section>
      <h2>Crédits</h2>
      <p>Photographies : Céline Ravier.</p>
      <p>Conception et réalisation de la plateforme : l’équipe bénévole du hackathon AIM 2026, pour {association.name}.</p>
    </section>
    <section>
      <h2>Propriété intellectuelle</h2>
      <p>Les textes, photographies, logos et éléments graphiques de ce site appartiennent à {association.name} ou à leurs auteurs. Toute reproduction sans autorisation préalable est interdite.</p>
    </section>
    <section>
      <h2>Données personnelles</h2>
      <p>La manière dont nous utilisons et protégeons vos données est décrite dans notre <a href="/politique-de-confidentialite">politique de confidentialité</a>.</p>
    </section>
  </SitePage>;
}
