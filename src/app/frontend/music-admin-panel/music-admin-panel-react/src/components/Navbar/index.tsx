import React from 'react';
import reactLogo from '../../assets/react.svg';
import './index.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <a href="https://music.mariolopez.org/react/admin-panel" target="_self" rel="alternate">
                <img src={reactLogo} alt="React" className="focused-icon" />
            </a>
        </nav>
    );
};

export default Navbar;
