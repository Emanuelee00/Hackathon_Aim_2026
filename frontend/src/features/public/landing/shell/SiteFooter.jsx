// Still used by the legal and contact pages (SitePage).
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="landing-wrap">
      <img src="/logo-chez-marthe.png" alt="Chez Marthe" />
      <p>Habiter &amp; rayonner.</p>
      <nav aria-label="Informations"><a href="/contact">Contact</a><a href="/mentions-legales">Mentions légales</a><a href="/politique-de-confidentialite">Confidentialité</a></nav>
    </div>
  </footer>;
}
