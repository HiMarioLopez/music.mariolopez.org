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
            <a href="https://music.mariolopez.org/lit" rel="alternate"><img src={litLogo} alt="Lit" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/qwik" rel="alternate"><img src={qwikLogo} alt="Qwik" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/react" rel="alternate"><img src={reactLogo} alt="React" className="nav-icon react-icon" /></a>
            <a href="https://music.mariolopez.org/solid" rel="alternate"><img src={solidLogo} alt="Solid" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/svelte" rel="alternate"><img src={svelteLogo} alt="Svelte" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vanilla" rel="alternate"><img src={tsLogo} alt="TypeScript" className="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vue" rel="alternate"><img src={vueLogo} alt="Vue" className="nav-icon" /></a>
        </nav>
    );
};

export default Navbar;
