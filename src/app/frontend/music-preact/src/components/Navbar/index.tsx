import litLogo from '../../assets/lit.svg';
import qwikLogo from '../../assets/qwik.svg';
import reactLogo from '../../assets/react.svg';
import solidLogo from '../../assets/solid.svg';
import svelteLogo from '../../assets/svelte.svg';
import tsLogo from '../../assets/typescript.svg';
import vueLogo from '../../assets/vue.svg';
import preactLogo from '../../assets/preact.svg';
import angularLogo from '../../assets/angular.svg';
import nextLogo from '../../assets/next.svg';
import blazorLogo from '../../assets/blazor.svg';
import leptosLogo from '../../assets/leptos.svg';
import './index.css';

const Navbar = () => {
    return (
        <nav>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate"><img src={tsLogo} alt="TypeScript" /></a>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate"><img src={litLogo} alt="Lit" /></a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate"><img src={qwikLogo} alt="Qwik" /></a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate"><img src={reactLogo} alt="React" /></a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate"><img src={solidLogo} alt="Solid" /></a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate"><img src={svelteLogo} alt="Svelte" /></a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate"><img src={vueLogo} alt="Vue" /></a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate"><img src={preactLogo} alt="Preact" className="focused-icon" /></a>
            <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate"><img src={angularLogo} alt="Angular" /></a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate"><img src={nextLogo} alt="Next" /></a>
            <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate"><img src={blazorLogo} alt="Blazor" /></a>
            <a href="https://music.mariolopez.org/leptos" target="_self" rel="alternate"><img src={leptosLogo} alt="Leptos" /></a>
        </nav>
    );
};

export default Navbar;
