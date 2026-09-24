import React from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './app/store.jsx';
import App from './app/App.jsx';
import ResidentApp from './app/ResidentApp.jsx';
import Landing from './features/landing/Landing.jsx';
import PublicShell from './app/PublicShell.jsx';
import VolunteerSpace from './features/volunteers/VolunteerSpace.jsx';
import PartnerSpace from './features/partners/PartnerSpace.jsx';
import OrganizerFeedback from './features/feedback/OrganizerFeedback.jsx';
import AuthGate from './features/auth/AuthGate.jsx';
import { spaceFromHost } from './shared/lib/spaces.js';
import './styles/index.css';

const pages = {
  equipe: <AuthGate spaceId="equipe"><StoreProvider><App /></StoreProvider></AuthGate>,
  residents: <AuthGate spaceId="residents"><StoreProvider><ResidentApp /></StoreProvider></AuthGate>,
  benevoles: <AuthGate spaceId="benevoles"><StoreProvider><PublicShell><VolunteerSpace /></PublicShell></StoreProvider></AuthGate>,
  partenaires: <AuthGate spaceId="partenaires"><StoreProvider><PublicShell><PartnerSpace /></PublicShell></StoreProvider></AuthGate>,
  bilan: <StoreProvider><PublicShell><OrganizerFeedback /></PublicShell></StoreProvider>,
};

createRoot(document.getElementById('root')).render(<React.StrictMode>{pages[spaceFromHost(window.location.hostname)] || <Landing />}</React.StrictMode>);
