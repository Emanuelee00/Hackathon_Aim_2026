import PartnerRow from './PartnerRow.jsx';

export default function PartenairesSection({ partners }) {
  return <section id="partenaires" className="block" aria-labelledby="partenaires-titre">
    <p className="kicker">{partners.kicker}</p>
    <h2 id="partenaires-titre">{partners.title}</h2>
    {partners.partners?.length > 0 && <PartnerRow items={partners.partners} />}
    {partners.funders?.length > 0 && <><h3 className="partners-subtitle">{partners.fundersTitle}</h3><PartnerRow items={partners.funders} /></>}
    {partners.supporters?.length > 0 && <><h3 className="partners-subtitle">{partners.supportersTitle}</h3><PartnerRow items={partners.supporters} /></>}
  </section>;
}
