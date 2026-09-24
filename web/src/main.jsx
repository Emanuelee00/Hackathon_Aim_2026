import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import { StoreProvider } from './app/store.jsx';
import App from './app/App.jsx';
import ResidentApp from './app/ResidentApp.jsx';
import Landing from './features/landing/Landing.jsx';
import ComingSoon from './features/landing/ComingSoon.jsx';
import AuthGate from './features/auth/AuthGate.jsx';
import { spaceFromHost } from './shared/lib/spaces.js';
import './styles/index.css';

const pages = {
  equipe: <AuthGate spaceId="equipe"><StoreProvider><App /></StoreProvider></AuthGate>,
  residents: <AuthGate spaceId="residents"><StoreProvider><ResidentApp /></StoreProvider></AuthGate>,
  benevoles: <ComingSoon spaceId="benevoles" />,
  partenaires: <ComingSoon spaceId="partenaires" />,
};

createRoot(document.getElementById('root')).render(<React.StrictMode>{pages[spaceFromHost(window.location.hostname)] || <Landing />}</React.StrictMode>);
