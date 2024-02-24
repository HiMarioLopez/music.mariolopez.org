import { LitElement, html, css } from 'lit';
import litLogo from '../assets/lit.svg';
import qwikLogo from '../assets/qwik.svg';
import reactLogo from '../assets/react.svg';
import solidLogo from '../assets/solid.svg';
import svelteLogo from '../assets/svelte.svg';
import tsLogo from '../assets/typescript.svg';
import vueLogo from '../assets/vue.svg';

export class Navbar extends LitElement {
    static styles = css`
    .navbar {
        display: flex;
        justify-content: center;
        padding: 10px 0;
        background: rgba(35, 35, 35, 0.9);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 40px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .nav-icon {
        width: 40px;
        height: 40px;
        margin: 0 10px;
    }

    .lit-icon {
        opacity: 1;
    }

    .nav-icon:not(.lit-icon) {
        opacity: 0.25;
    }

    .nav-icon:hover {
        filter: drop-shadow(0 0 0.5em rgba(255, 255, 255, 0.3));
        transition: filter 0.3s ease, opacity 0.3s ease;
        opacity: 1;
    }

    @media (max-width: 680px) {
        .navbar {
            height: 30px;
        }

        .nav-icon {
            width: 30px;
            height: 30px;
            margin: 0 7px;
        }
    }
  `;

    render() {
        // Update the paths to your images as necessary
        return html`
      <nav class="navbar">
        <a href="https://music.mariolopez.org/lit" rel="alternate"><img src=${litLogo} alt="Lit" class="nav-icon lit-icon" /></a>
        <a href="https://music.mariolopez.org/qwik" rel="alternate"><img src=${qwikLogo} alt="Qwik" class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/react" rel="alternate"><img src=${reactLogo} alt="React" class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/solid" rel="alternate"><img src=${solidLogo} alt="Solid" class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/svelte" rel="alternate"><img src=${svelteLogo} alt="Svelte" class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/vanilla" rel="alternate"><img src=${tsLogo} alt="TypeScript" class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/vue" rel="alternate"><img src=${vueLogo} alt="Vue" class="nav-icon" /></a>
      </nav>
    `;
    }
}

customElements.define('my-navbar', Navbar);
