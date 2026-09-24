import Icon from '../../../shared/components/Icon.jsx';

export default function Hero({ onNew, navigate }) {
  return <section className="hero">
    <div className="hero-copy"><span className="hero-kicker"><span className="live-dot" /> UN LIEU, MILLE POSSIBLES</span><h2>Faire vivre les espaces.<br /><em>Faire grandir les liens.</em></h2><p>Des premières idées aux rencontres qui comptent,<br className="desktop-break" /> donnons une place à chaque projet.</p><button className="button button-dark" onClick={onNew}>Accueillir un projet<Icon name="arrow" size={17} /></button></div>
    <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-sun" /><div className="art-arch arch-one" /><div className="art-arch arch-two" /><div className="art-arch arch-three" /><div className="art-stem" /><span className="art-leaf leaf-one" /><span className="art-leaf leaf-two" /><span className="art-flower">✳</span><div className="art-caption">les belles choses<br /><em>commencent ensemble.</em></div></div>
    <button className="hero-sticker" onClick={() => navigate('spaces')}><Icon name="space" size={17} /><span>3 espaces à faire vivre</span><Icon name="diagonal" size={15} /></button>
  </section>;
}
