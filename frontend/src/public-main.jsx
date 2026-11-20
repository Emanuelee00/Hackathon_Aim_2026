import React from 'react';
import { createRoot } from 'react-dom/client';
import Landing from './features/landing/Landing.jsx';
import Contact from './features/site-pages/Contact.jsx';
import LegalNotice from './features/site-pages/LegalNotice.jsx';
import PrivacyPolicy from './features/site-pages/PrivacyPolicy.jsx';
import SpacesPortal from './features/site-pages/SpacesPortal.jsx';
import Team from './features/site-pages/Team.jsx';
import Press from './features/site-pages/Press.jsx';
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
