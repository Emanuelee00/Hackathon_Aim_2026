import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import { StoreProvider } from './lib/store.jsx';
import App from './App.jsx';
import './styles.css';
import './layout.css';
import './forms.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><StoreProvider><App /></StoreProvider></React.StrictMode>);
