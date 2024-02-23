// components/Navbar.js

import React from 'react';

import litLogo from '../../assets/lit.svg';
import qwikLogo from '../../assets/qwik.svg';
import reactLogo from '../../assets/react.svg';
import solidLogo from '../../assets/solid.svg';
import svelteLogo from '../../assets/svelte.svg';
import tsLogo from '../../assets/typescript.svg';
import vueLogo from '../../assets/vue.svg';

import './index.css'; // Make sure to create and link this CSS file

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <a href="https://lit.dev" target="_blank" rel="noopener noreferrer"><img src={litLogo} alt="Lit" className="nav-icon" /></a>
            <a href="https://qwik.builder.io" target="_blank" rel="noopener noreferrer"><img src={qwikLogo} alt="Qwik" className="nav-icon" /></a>
            <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer"><img src={reactLogo} alt="React" className="nav-icon react-icon" /></a>
            <a href="https://solidjs.com" target="_blank" rel="noopener noreferrer"><img src={solidLogo} alt="Solid" className="nav-icon" /></a>
            <a href="https://svelte.dev" target="_blank" rel="noopener noreferrer"><img src={svelteLogo} alt="Svelte" className="nav-icon" /></a>
            <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer"><img src={tsLogo} alt="TypeScript" className="nav-icon" /></a>
            <a href="https://vuejs.org" target="_blank" rel="noopener noreferrer"><img src={vueLogo} alt="Vue" className="nav-icon" /></a>
        </nav>
    );
};

export default Navbar;
