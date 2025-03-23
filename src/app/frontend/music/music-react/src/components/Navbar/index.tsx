import React from 'react';
import angularLogo from '../../assets/angular.svg';
import blazorLogo from '../../assets/blazor.svg';
import litLogo from '../../assets/lit.svg';
import nextLogo from '../../assets/next.svg';
import preactLogo from '../../assets/preact.svg';
import qwikLogo from '../../assets/qwik.svg';
import reactLogo from '../../assets/react.svg';
import solidLogo from '../../assets/solid.svg';
import svelteLogo from '../../assets/svelte.svg';
import tsLogo from '../../assets/typescript.svg';
import vueLogo from '../../assets/vue.svg';
import leptosLogo from '../../assets/leptos.svg';
import randomLogo from '../../assets/random.svg';
import './index.css';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar">
            <a href="https://music.mariolopez.org" target="_self" rel="alternate">
                <img src={randomLogo} alt="Random" title="View a random framework implementation" />
            </a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
                <img src={reactLogo} alt="React" className="focused-icon" />
            </a>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate" className="under-construction" title="The TypeScript version is under construction. Check back soon!">
                <img src={tsLogo} alt="TypeScript" />
            </a>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate" className="under-construction" title="The Lit version is under construction. Check back soon!">
                <img src={litLogo} alt="Lit" />
            </a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate" className="under-construction" title="The Qwik version is under construction. Check back soon!">
                <img src={qwikLogo} alt="Qwik" />
            </a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate" className="under-construction" title="The Solid version is under construction. Check back soon!">
                <img src={solidLogo} alt="Solid" />
            </a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate" className="under-construction" title="The Svelte version is under construction. Check back soon!">
                <img src={svelteLogo} alt="Svelte" />
            </a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate" className="under-construction" title="The Vue version is under construction. Check back soon!">
                <img src={vueLogo} alt="Vue" />
            </a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate" className="under-construction" title="The Preact version is under construction. Check back soon!">
                <img src={preactLogo} alt="Preact" />
            </a>
            <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate" className="under-construction" title="The Angular version is under construction. Check back soon!">
                <img src={angularLogo} alt="Angular" />
            </a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate" className="under-construction" title="The Next.js version is under construction. Check back soon!">
                <img src={nextLogo} alt="Next" />
            </a>
            <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate" className="under-construction" title="The Blazor version is under construction. Check back soon!">
                <img src={blazorLogo} alt="Blazor" />
            </a>
            <a href="https://music.mariolopez.org/leptos" target="_self" rel="alternate" className="under-construction" title="The Leptos version is under construction. Check back soon!">
                <img src={leptosLogo} alt="Leptos" />
            </a>
        </nav>
    );
};

export default Navbar;
