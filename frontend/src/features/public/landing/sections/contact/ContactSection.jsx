import { ContactForm } from '../../../site-pages/Contact.jsx';

export default function ContactSection({ contact }) {
  return <section id="contact" className="block" aria-labelledby="contact-titre">
    <p className="kicker">{contact.kicker}</p>
    <h2 id="contact-titre">{contact.title}</h2>
    {contact.text && <p>{contact.text}</p>}
    <ContactForm />
  </section>;
}
