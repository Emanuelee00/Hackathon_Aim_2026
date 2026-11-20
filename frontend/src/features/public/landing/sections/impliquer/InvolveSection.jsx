import { apiUrl } from '../../../../../shared/lib/apiUrl.js';

export default function InvolveSection({ involve }) {
  return <section id="s-impliquer" className="block" aria-labelledby="impliquer-titre">
    <p className="kicker">{involve.kicker}</p>
    <h2 id="impliquer-titre">{involve.title}</h2>
    {involve.text && <p>{involve.text}</p>}
    <div className="involve-grid">{involve.items.map((item, index) => <a key={`${item.title}-${index}`} className="home-involve" href={item.url || '#contact'} target={item.url?.startsWith('http') ? '_blank' : undefined} rel={item.url?.startsWith('http') ? 'noreferrer' : undefined} style={{ '--photo': `url("${apiUrl(item.photo)}")` }}><strong>{item.title}</strong><span>{item.text}</span></a>)}</div>
  </section>;
}
