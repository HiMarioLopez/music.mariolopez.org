import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AppleMusicAuthStatus } from './components/AppleMusicLogin';

const App: React.FC = () => {
  return (
    <>
      <div className="app-bg" />
      <div className="app">
        <Navbar />
        <div className="main-content">
          <AppleMusicAuthStatus />
        </div>
        <Footer />
      </div>
    </>
  );
}

export default App;
