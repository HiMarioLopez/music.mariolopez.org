import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import AppleMusicService from './services/AppleMusicService.ts';
import appConfig from './config/appConfig.ts';

// Initialize Apple Music service on app load
document.addEventListener('musickitloaded', async function () {
  const appleMusicService = AppleMusicService.getInstance();
  await appleMusicService.initializeMusicKit(appConfig.appName, appConfig.appBuild);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
