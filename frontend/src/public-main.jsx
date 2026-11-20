import React from 'react';
import { createRoot } from 'react-dom/client';
import Landing from './features/public/landing/Landing.jsx';
import Contact from './features/public/site-pages/Contact.jsx';
import LegalNotice from './features/public/site-pages/LegalNotice.jsx';
import PrivacyPolicy from './features/public/site-pages/PrivacyPolicy.jsx';
import SpacesPortal from './features/public/site-pages/SpacesPortal.jsx';
import Team from './features/public/site-pages/Team.jsx';
import Press from './features/public/site-pages/Press.jsx';
import './styles/index.css';

const pages = {
  contact: <Contact />,
  'mentions-legales': <LegalNotice />,
  'politique-de-confidentialite': <PrivacyPolicy />,
  connexion: <SpacesPortal />,
  equipe: <Team />,
  'on-parle-de-nous': <Press />,
};

const path = window.location.pathname.replace(/^\/|\/$/g, '');
createRoot(document.getElementById('root')).render(
  <React.StrictMode>{pages[path] || <Landing />}</React.StrictMode>,
);
