import { Brand, SiteFooter } from '../landing/Landing.jsx';

// Pages of the public site outside the landing: legal notice, privacy, contact.
export default function SitePage({ eyebrow, title, children }) {
  return <div className="landing site-page-shell">
    <header className="site-header">
      <Brand />
      <nav aria-label="Site"><a href="/">Accueil</a><a href="/#demande">Faire une demande</a><a href="/contact">Contact</a></nav>
    </header>
    <main className="landing-section landing-wrap site-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </main>
    <SiteFooter />
  </div>;
}
