import HomeShell from '../landing/HomeShell.jsx';

// « On parle de nous » (/on-parle-de-nous): the press articles that mention Chez Marthe. To add one, add a line here.
const articles = [
  { source: 'Écho Sud', title: 'Quand l’art contemporain a invité à s’approprier le lieu d’accueil Chez Marthe, le temps d’une exposition : « L’étreinte des lieux »', url: 'https://echosud.fr/marseille-quand-lart-contemporain-a-invite-a-sapproprier-le-lieu-daccueil-chez-marthe-le-temps-dune-exposition-letreinte-des-lieux/' },
  { source: 'Marcelle', title: 'Il reste encore demain', url: 'https://www.marcelle.media/il-reste-encore-demain/' },
  { source: 'Love Spots Marseille', title: 'Chez Marthe, tiers-lieu à Marseille', url: 'https://marseille.love-spots.com/adresses/tiers-lieux/266220-chez-marthe.html' },
  { source: 'La Provence', title: '« C’est un lieu de vie, pas de survie » : Chez Marthe, un refuge à Marseille pour les femmes qui ont connu la rue', url: 'https://www.laprovence.com/article/societe/6453234820738714/c-est-un-lieu-de-vie-pas-de-survie-chez-marthe-un-refuge-a-marseille-pour-les-femmes-qui-ont-connu-la-rue' },
  { source: 'La Provence', title: 'Chez Marthe, la rue va montrer sur scène son « incroyable talent » aux Marseillais', url: 'https://www.laprovence.com/article/societe/5814185871652114/chez-marthe-la-rue-va-montrer-sur-scene-son-incroyable-talent-aux-marseillais' },
  { source: 'La Provence', title: 'Mouvement World with Women : pourquoi les femmes sont invitées « à ne rien faire » ce mardi 13 octobre', url: 'https://www.laprovence.com/article/societe/16313140338124/mouvement-world-with-women-pourquoi-les-femmes-sont-invitees-a-ne-rien-faire-ce-mardi-13-octobre' },
  { source: 'Marsactu', title: '[Marseille fait genre] Véronique Eyraud, un toit pour toutes', url: 'https://marsactu.fr/chroniques/marseille-fait-genre-veronique-eyraud-un-toit-pour-toutes/' },
  { source: 'Presse Agence', title: 'Véronique Eyraud : « Chez Marthe est un espace de dignité et de projection vers l’avenir »', url: 'https://presseagence.fr/marseille-veronique-eyraud-chez-marthe-est-un-espace-de-dignite-et-de-projection-vers-lavenir/' },
  { source: 'Instagram', title: 'La Provence sur Instagram', url: 'https://www.instagram.com/p/DZfsIsAkW-8/' },
];

const paper = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H17a1 1 0 0 1 1 1v14.5" /><path d="M18 8h1.5A1.5 1.5 0 0 1 21 9.5v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5" /><path d="M8 8.5h6M8 12h6M8 15.5h3" /></svg>;

export default function Press() {
  return <HomeShell>
    <main className="press-v2">
      <div className="press-head">
        <span className="press-icon">{paper}</span>
        <p className="eyebrow">ON PARLE DE NOUS</p>
        <h1>Chez Marthe dans la presse</h1>
        <p>Les articles et reportages qui racontent le lieu. Retrouvez aussi nos stories à la une sur Instagram.</p>
      </div>
      <div className="press-wall">{articles.map((a, index) => <a key={a.url} className={`press-clip${a.source === 'Instagram' ? ' is-insta' : ''}`} href={a.url} target="_blank" rel="noopener noreferrer">
        <span className="clip-masthead"><b>{a.source}</b><i>N° {String(index + 1).padStart(2, '0')}</i></span>
        <strong>{a.title}</strong>
        <span className="clip-read">{a.source === 'Instagram' ? 'Voir le post' : 'Lire l’article'} <span aria-hidden="true">↗</span></span>
      </a>)}</div>
    </main>
  </HomeShell>;
}
