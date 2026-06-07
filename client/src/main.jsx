import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a2e1a',
          color: '#f5f0e8',
          border: '1px solid rgba(201,168,76,0.3)',
          fontFamily: 'Raleway, sans-serif',
        },
        success: {
          iconTheme: { primary: '#c9a84c', secondary: '#1a2e1a' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#1a2e1a' },
        },
      }}
    />
  </React.StrictMode>
);
