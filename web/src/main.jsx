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
import SpaceAssistant from './features/chatbot/SpaceAssistant.jsx';
import { spaceFromHost } from './shared/lib/spaces.js';
import './styles/index.css';

const pages = {
  equipe: <AuthGate spaceId="equipe"><StoreProvider><App /></StoreProvider><SpaceAssistant spaceId="equipe" /></AuthGate>,
  residents: <AuthGate spaceId="residents"><StoreProvider><ResidentApp /></StoreProvider><SpaceAssistant spaceId="residents" /></AuthGate>,
  benevoles: <AuthGate spaceId="benevoles"><StoreProvider><PublicShell><VolunteerSpace /></PublicShell></StoreProvider><SpaceAssistant spaceId="benevoles" /></AuthGate>,
  partenaires: <AuthGate spaceId="partenaires"><StoreProvider><PublicShell><PartnerSpace /></PublicShell></StoreProvider><SpaceAssistant spaceId="partenaires" /></AuthGate>,
  bilan: <PublicShell><OrganizerFeedback /></PublicShell>,
};

createRoot(document.getElementById('root')).render(<React.StrictMode>{pages[spaceFromHost(window.location.hostname)] || <Landing />}</React.StrictMode>);
