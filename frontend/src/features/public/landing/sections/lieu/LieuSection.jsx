import PlaceMap from './PlaceMap.jsx';

export default function LieuSection({ place }) {
  return <section id="le-lieu" className="landing-section landing-wrap place place-bg">
    <PlaceMap />
    <div>
      <p className="eyebrow">{place.eyebrow}</p>
      <h2>{place.title}</h2>
      <p>{place.text}</p>
      {place.facts?.length > 0 && <ul className="place-facts">{place.facts.map(fact => <li key={`${fact.value}-${fact.label}`}><strong>{fact.value}</strong><span>{fact.label}</span></li>)}</ul>}
      {place.pressLabel && <a className="place-press place-press-text" href="/on-parle-de-nous">{place.pressLabel}</a>}
    </div>
  </section>;
}
