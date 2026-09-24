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
import './styles/index.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><StoreProvider><App /></StoreProvider></React.StrictMode>);
