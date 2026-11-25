import React from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './app/store.jsx';
import App from './app/App.jsx';
import Landing from './features/public/landing/Landing.jsx';
import PublicShell from './app/PublicShell.jsx';
import VolunteerSpace from './features/benevoles/VolunteerSpace.jsx';
import PartnerSpace from './features/partenaires/PartnerSpace.jsx';
import ResidentSpace from './features/residents/ResidentSpace.jsx';
import OrganizerFeedback from './features/public/feedback/OrganizerFeedback.jsx';
import AuthGate from './features/auth/AuthGate.jsx';
import SpaceAssistant from './features/chatbot/SpaceAssistant.jsx';
import Contact from './features/public/site-pages/Contact.jsx';
import LegalNotice from './features/public/site-pages/LegalNotice.jsx';
import PrivacyPolicy from './features/public/site-pages/PrivacyPolicy.jsx';
import SpacesPortal from './features/public/site-pages/SpacesPortal.jsx';
import Team from './features/public/site-pages/Team.jsx';
import Press from './features/public/site-pages/Press.jsx';
import { spaceFromHost } from './shared/lib/spaces.js';
import './styles/index.css';

const pages = {
  equipe: <AuthGate spaceId="equipe"><StoreProvider><App /></StoreProvider><SpaceAssistant spaceId="equipe" /></AuthGate>,
  residents: <AuthGate spaceId="residents"><StoreProvider><PublicShell mainClassName=""><ResidentSpace /></PublicShell></StoreProvider><SpaceAssistant spaceId="residents" /></AuthGate>,
  benevoles: <AuthGate spaceId="benevoles"><StoreProvider><PublicShell><VolunteerSpace /></PublicShell></StoreProvider><SpaceAssistant spaceId="benevoles" /></AuthGate>,
  partenaires: <AuthGate spaceId="partenaires"><StoreProvider><PublicShell><PartnerSpace /></PublicShell></StoreProvider><SpaceAssistant spaceId="partenaires" /></AuthGate>,
};

// Pages of the public site; the server sends index.html for these paths (backend/main.py).
const sitePages = {
  contact: <Contact />,
  'mentions-legales': <LegalNotice />,
  'politique-de-confidentialite': <PrivacyPolicy />,
  connexion: <SpacesPortal />,
  equipe: <Team />,
  'on-parle-de-nous': <Press />,
  // Organisers reach it through the link (or QR) sent after their event; no account needed.
  bilan: <PublicShell><OrganizerFeedback /></PublicShell>,
};
const sitePage = sitePages[window.location.pathname.replace(/^\/|\/$/g, '')];

createRoot(document.getElementById('root')).render(<React.StrictMode>{pages[spaceFromHost(window.location.hostname)] || sitePage || <Landing />}</React.StrictMode>);
