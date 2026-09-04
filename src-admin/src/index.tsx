// Dev-only entry point. Not part of the production build.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<App />);
}
