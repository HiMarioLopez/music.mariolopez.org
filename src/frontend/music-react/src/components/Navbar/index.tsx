import React from 'react';
import litLogo from '../../assets/lit.svg';
import qwikLogo from '../../assets/qwik.svg';
import reactLogo from '../../assets/react.svg';
import solidLogo from '../../assets/solid.svg';
import svelteLogo from '../../assets/svelte.svg';
import tsLogo from '../../assets/typescript.svg';
import vueLogo from '../../assets/vue.svg';
import './index.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <a href="https://music.mariolopez.org/lit" target="_blank" rel="noopener noreferrer"><img src={litLogo} alt="Lit" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/qwik" target="_blank" rel="noopener noreferrer"><img src={qwikLogo} alt="Qwik" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/react" target="_blank" rel="noopener noreferrer"><img src={reactLogo} alt="React" className="nav-icon react-icon" /></a>
            <a href="https://music.mariolopez.org/solid" target="_blank" rel="noopener noreferrer"><img src={solidLogo} alt="Solid" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/svelte" target="_blank" rel="noopener noreferrer"><img src={svelteLogo} alt="Svelte" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vanilla" target="_blank" rel="noopener noreferrer"><img src={tsLogo} alt="TypeScript" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vue" target="_blank" rel="noopener noreferrer"><img src={vueLogo} alt="Vue" className="nav-icon" /></a>
        </nav>
    );
};

export default Navbar;
