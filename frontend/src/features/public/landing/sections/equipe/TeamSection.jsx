
export default function TeamSection({ team }) {
  return <section id="equipe-lieu" className="landing-team" aria-labelledby="equipe-lieu-titre">
    <p className="kicker">{team.kicker}</p>
    <h2 id="equipe-lieu-titre">{team.title}</h2>
    <p className="lt-intro">{team.intro}</p>
    <ul className="lt-faces">{team.members.map((member, index) => <li key={`${member.name}-${index}`}>
      <span className="lt-photo"><img src={member.photo} alt="" loading="lazy" /></span>
      <strong>{member.name}</strong>
      <small>{member.role}</small>
    </li>)}</ul>
    {team.associations?.length > 0 && <div className="lt-assos"><span>{team.assocLabel}</span>{team.associations.map((assoc, index) => <a key={`${assoc.name}-${index}`} href={assoc.url} target="_blank" rel="noopener noreferrer" title={assoc.name}><img src={assoc.logo} alt={assoc.name} loading="lazy" /></a>)}</div>}
    {team.buttonLabel && <a className="btn btn-primary lt-more" href="/equipe">{team.buttonLabel}</a>}
  </section>;
}
