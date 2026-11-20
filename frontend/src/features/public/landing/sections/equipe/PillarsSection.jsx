import { apiUrl } from '../../../../../shared/lib/apiUrl.js';

// Violet wave closing the band above and below (same as the platform's public site).
function Wave({ className }) {
  return <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48 C 240 8 480 8 720 40 S 1200 80 1440 30 V80 H0 Z" /></svg>;
}

export default function PillarsSection({ pillars }) {
  return <section className="landing-band" aria-labelledby="pillars-title">
    <div className="landing-wrap">
      <h2 id="pillars-title" className="sr-only">Ce que l’on vit Chez Marthe</h2>
      <div className="pillars">{pillars.items.map((pillar, index) => <article key={`${pillar.title}-${index}`} className="pillar">
        <img src={apiUrl(pillar.photo)} alt="" loading="lazy" />
        <h3>{pillar.title}</h3>
        <p>{pillar.text}</p>
      </article>)}</div>
    </div>
    <Wave className="wave wave-bottom" />
  </section>;
}
