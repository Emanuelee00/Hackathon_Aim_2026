// « Site » : ce que l'équipe peut changer dans chaque section de la page d'accueil, et comment (le type de chaque champ).
// text : une ligne ; textarea : un paragraphe ; lines : une valeur par ligne ; photo / logo : image du site ou envoyée ;
// url : lien (https://…, /page ou #section) ; bool : case à cocher ; list : éléments à ajouter, ranger ou retirer.

const link = { key: 'url', label: 'Lien (https://…, /page ou #section)', type: 'url' };
const logos = (key, label, itemLabel) => ({ key, label, type: 'list', itemLabel, titleKey: 'name',
  fields: [{ key: 'name', label: 'Nom', type: 'text' }, { key: 'logo', label: 'Logo', type: 'logo' }, link],
  blank: { name: '', logo: '', url: '' } });

export const SITE_SECTIONS = [
  { id: 'hero', label: 'Haut de page', hint: 'La première image de la page, avec le grand titre.', fields: [
    { key: 'photo', label: 'Photo de fond', type: 'photo' },
    { key: 'cities', label: 'Villes qui défilent après « Chez Marthe · » (une par ligne)', type: 'lines' },
    { key: 'title1', label: 'Titre, ligne 1', type: 'text' }, { key: 'mark1', label: 'Titre, ligne 2 (surlignée en rose)', type: 'text' },
    { key: 'title2', label: 'Titre, ligne 3', type: 'text' }, { key: 'mark2', label: 'Titre, ligne 4 (surlignée en rose)', type: 'text' },
    { key: 'subtitle', label: 'Phrase sous le titre', type: 'textarea' },
    { key: 'button1', label: 'Bouton vers « Nous soutenir » (vide : pas de bouton)', type: 'text' },
    { key: 'button2', label: 'Bouton vers « Louer un espace » (vide : pas de bouton)', type: 'text' },
  ] },
  { id: 'place', label: 'Notre lieu', hint: 'La section avec la carte du quartier.', fields: [
    { key: 'eyebrow', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' }, { key: 'text', label: 'Texte', type: 'textarea' },
    { key: 'facts', label: 'Chiffres', type: 'list', itemLabel: 'un chiffre', titleKey: 'value',
      fields: [{ key: 'value', label: 'Chiffre', type: 'text' }, { key: 'label', label: 'Texte à côté', type: 'text' }], blank: { value: '', label: '' } },
    { key: 'pressLabel', label: 'Lien « On parle de nous » (vide : pas de lien)', type: 'text' },
  ] },
  { id: 'team', label: 'L’équipe', hint: 'Les personnes et les associations : elles apparaissent aussi sur la page « Notre équipe ».', fields: [
    { key: 'kicker', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' }, { key: 'intro', label: 'Texte d’introduction', type: 'textarea' },
    { key: 'members', label: 'Les personnes', type: 'list', itemLabel: 'une personne', titleKey: 'name',
      fields: [{ key: 'name', label: 'Prénom', type: 'text' }, { key: 'role', label: 'Rôle', type: 'text' }, { key: 'photo', label: 'Photo', type: 'photo' },
        { key: 'text', label: 'Citation (page « Notre équipe »)', type: 'textarea' }], blank: { name: '', role: '', photo: '', text: '' } },
    { key: 'assocLabel', label: 'Texte avant les logos des associations', type: 'text' },
    { key: 'associations', label: 'Les associations du lieu', type: 'list', itemLabel: 'une association', titleKey: 'name',
      fields: [{ key: 'name', label: 'Nom', type: 'text' }, { key: 'role', label: 'Ce qu’elle fait (page « Notre équipe »)', type: 'text' }, { key: 'logo', label: 'Logo', type: 'logo' }, link],
      blank: { name: '', role: '', logo: '', url: '' } },
    { key: 'buttonLabel', label: 'Bouton vers la page « Notre équipe » (vide : pas de bouton)', type: 'text' },
  ] },
  { id: 'pillars', label: 'Ce que l’on vit', hint: 'La bande violette avec les grandes photos (Se loger, Se reconstruire…).', fields: [
    { key: 'items', label: 'Les cartes', type: 'list', itemLabel: 'une carte', titleKey: 'title',
      fields: [{ key: 'title', label: 'Titre', type: 'text' }, { key: 'photo', label: 'Photo', type: 'photo' }, { key: 'text', label: 'Texte', type: 'textarea' }],
      blank: { title: '', photo: '/foto/facade.webp', text: '' } },
  ] },
  { id: 'events', label: 'Nos évènements', hint: 'Les évènements eux-mêmes viennent du Google Agenda de l’association.', fields: [
    { key: 'title', label: 'Titre', type: 'text' },
  ] },
  { id: 'spaces', label: 'Louer un espace', hint: 'Les cartes des espaces se gèrent juste en dessous.', fields: [
    { key: 'kicker', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' },
    { key: 'showRequest', label: 'Afficher le formulaire de demande sous les cartes', type: 'bool' },
  ] },
  { id: 'partners', label: 'Partenaires', hint: 'Les trois rangées de logos.', fields: [
    { key: 'kicker', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' },
    logos('partners', 'Rangée 1 : nos partenaires', 'un partenaire'),
    { key: 'fundersTitle', label: 'Titre de la rangée 2', type: 'text' }, logos('funders', 'Rangée 2', 'un financeur'),
    { key: 'supportersTitle', label: 'Titre de la rangée 3', type: 'text' }, logos('supporters', 'Rangée 3', 'un soutien'),
  ] },
  { id: 'involve', label: 'Nous soutenir', hint: 'La section « Rejoindre le mouvement » avec ses cartes photo.', fields: [
    { key: 'kicker', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' }, { key: 'text', label: 'Texte', type: 'textarea' },
    { key: 'items', label: 'Les cartes', type: 'list', itemLabel: 'une carte', titleKey: 'title',
      fields: [{ key: 'title', label: 'Titre', type: 'text' }, { key: 'photo', label: 'Photo', type: 'photo' }, { key: 'text', label: 'Texte', type: 'textarea' }, link],
      blank: { title: '', photo: '/foto/facade.webp', text: '', url: '#contact' } },
  ] },
  { id: 'contact', label: 'Contact', hint: 'Le formulaire de contact reste en dessous.', fields: [
    { key: 'kicker', label: 'Petit titre', type: 'text' }, { key: 'title', label: 'Titre', type: 'text' }, { key: 'text', label: 'Texte', type: 'textarea' },
  ] },
];

const LINK = /^(|https?:\/\/\S+|mailto:\S+|#[\w-]+|\/[\w./#-]*)$/;

// Ce qu'il faut corriger avant de publier, ou ''.
export function checkSection(section, values) {
  const walk = (fields, value, where) => {
    for (const field of fields) {
      const current = value[field.key];
      if (field.type === 'url' && !LINK.test(String(current || '').trim())) return `${where}${field.label} : le lien doit commencer par https://, / ou #.`;
      if (field.type === 'list') {
        for (const [index, item] of (current || []).entries()) {
          const problem = walk(field.fields, item, `${field.label}, n° ${index + 1} – `);
          if (problem) return problem;
        }
      }
    }
    return '';
  };
  return walk(section.fields, values, '');
}

// Nettoie avant d'enregistrer : textes sans espaces autour, lignes vides retirées.
export function cleanSection(section, values) {
  const clean = (fields, value) => Object.fromEntries(Object.entries(value).map(([key, current]) => {
    const field = fields.find(item => item.key === key);
    if (!field) return [key, current];
    if (field.type === 'lines') return [key, (current || []).map(line => line.trim()).filter(Boolean)];
    if (field.type === 'list') return [key, (current || []).map(item => clean(field.fields, item))];
    if (typeof current === 'string') return [key, current.trim()];
    return [key, current];
  }));
  return clean(section.fields, values);
}
