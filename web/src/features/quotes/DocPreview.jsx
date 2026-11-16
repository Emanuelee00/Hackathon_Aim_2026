// L'aperçu du devis ou de la facture, mis en page comme les modèles de l'association (et le PDF) : il se met à jour pendant qu'on écrit.
import { euros, frDate } from './accounting.js';

export default function DocPreview({ kind, doc, total, deposit }) {
  const due = total - deposit;
  const isQuote = kind === 'devis';
  const lines = doc.lines.filter(line => line.designation.trim() || line.lineTotal);
  return <div className={`doc-paper paper-${kind}`} aria-label="Aperçu du document">
    <div className="paper-head">
      <img src="/foto/logo-fond-violet.png" alt="Chez Marthe" />
      <div className="paper-title"><strong>{isQuote ? 'DEVIS' : 'FACTURE'} n° {doc.number || '…'}</strong><span><b>Date :</b> {frDate(doc.date)}</span></div>
    </div>
    <p className="paper-issuer">Association Chez Marthe<br />50, rue Saint Savournin<br />13001 Marseille<br />contact.chezmarthe@gmail.com<br />SIRET : <small>100 396 464 00016</small></p>
    <p className="paper-client">{doc.name || <i>Nom du client</i>}<br />{doc.address}<br />{`${doc.postal_code} ${doc.city}`.trim()}</p>
    <table className="paper-table"><thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unit HT</th><th>Total</th></tr></thead><tbody>
      {doc.nature && <tr><td colSpan="4">{doc.nature}</td></tr>}
      {lines.length ? lines.map(line => <tr key={line.id}><td>{line.designation || '—'}</td><td>{line.quantity}</td><td>{euros(line.price)}</td><td>{euros(line.lineTotal)}</td></tr>) : <tr><td colSpan="4" className="paper-empty">Cliquez sur un tarif pour ajouter une prestation</td></tr>}
    </tbody></table>
    <div className="paper-totals">
      <div><span>Total Hors Taxe</span><b>{euros(total)}</b></div>
      {!isQuote && <><div><span>Acompte versé</span><b>{euros(deposit)}</b></div><div><span>Total HT à payer</span><b>{euros(due)}</b></div></>}
      <div><span>Total TTC en euros</span><b>{euros(isQuote ? total : due)}</b></div>
    </div>
    <p className="paper-vat">Tva non applicable, article 293 B du CGI</p>
    <div className="paper-bottom">
      <p className="paper-pay"><b>{isQuote ? 'Modalité de paiement : par virement bancaire' : 'Paiement par virement'}</b><br />IBAN : FR76 1027 8089 7200 0220 7280 129<br />BIC : CMCIFR2A</p>
      {isQuote && <div className="paper-sign">Acceptation de devis (date et signature)</div>}
    </div>
    {!isQuote && <p className="paper-terms">Conditions de paiement : paiement à réception de facture, à 30 jours. Aucun escompte consenti pour règlement anticipé. Tout incident de paiement est passible d'intérêt de retard. Le montant des pénalités résulte de l'application aux sommes restant dues d'un taux d'intérêt légal en vigueur au moment de l'incident. Indemnité forfaitaire pour frais de recouvrement due au créancier en cas de retard de paiement: 40€</p>}
    <p className="paper-footer">Chez Marthe / Association Loi 1901 enregistrée sous le N° W133041303 à la préfecture des Bouches-du-Rhône- N° Siret 100 396 464 00016<br />Catégorie juridique : 9220 Association déclarée - contact.chezmarthe@gmail.com</p>
  </div>;
}
