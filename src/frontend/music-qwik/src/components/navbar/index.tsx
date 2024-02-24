import { component$ } from '@builder.io/qwik';
import litLogo from '../../assets/lit.svg';
import qwikLogo from '../../assets/qwik.svg';
import reactLogo from '../../assets/react.svg';
import solidLogo from '../../assets/solid.svg';
import svelteLogo from '../../assets/svelte.svg';
import tsLogo from '../../assets/typescript.svg';
import vueLogo from '../../assets/vue.svg';
import './index.css';

export default component$(() => {
    return (
        <nav class="navbar">
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate"><img src={litLogo} alt="Lit" class="nav-icon" /></a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate"><img src={qwikLogo} alt="Qwik" class="nav-icon qwik-icon" /></a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate"><img src={reactLogo} alt="React" class="nav-icon" /></a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate"><img src={solidLogo} alt="Solid" class="nav-icon" /></a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate"><img src={svelteLogo} alt="Svelte" class="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate"><img src={tsLogo} alt="TypeScript" class="nav-icon" /></a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate"><img src={vueLogo} alt="Vue" class="nav-icon" /></a>
        </nav>
    );
});
