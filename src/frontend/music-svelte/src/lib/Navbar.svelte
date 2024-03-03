<script lang="ts">
    import angularLogo from "../assets/angular.svg";
    import blazorLogo from "../assets/blazor.svg";
    import litLogo from "../assets/lit.svg";
    import nextLogo from "../assets/next.svg";
    import preactLogo from "../assets/preact.svg";
    import qwikLogo from "../assets/qwik.svg";
    import reactLogo from "../assets/react.svg";
    import solidLogo from "../assets/solid.svg";
    import svelteLogo from "../assets/svelte.svg";
    import tsLogo from "../assets/typescript.svg";
    import vueLogo from "../assets/vue.svg";
    import leptosLogo from "../assets/leptos.svg";
</script>

<nav class="navbar">
    <a
        href="https://music.mariolopez.org/vanilla"
        target="_self"
        rel="alternate"
    >
        <img src={tsLogo} alt="TypeScript" />
    </a>
    <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
        <img src={litLogo} alt="Lit" />
    </a>
    <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
        <img src={qwikLogo} alt="Qwik" />
    </a>
    <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
        <img src={reactLogo} alt="React" />
    </a>
    <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
        <img src={solidLogo} alt="Solid" />
    </a>
    <a
        href="https://music.mariolopez.org/svelte"
        target="_self"
        rel="alternate"
    >
        <img src={svelteLogo} alt="Svelte" class="focused-icon" />
    </a>
    <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
        <img src={vueLogo} alt="Vue" />
    </a>
    <a
        href="https://music.mariolopez.org/preact"
        target="_self"
        rel="alternate"
    >
        <img src={preactLogo} alt="Preact" />
    </a>
    <a
        href="https://music.mariolopez.org/angular"
        target="_self"
        rel="alternate"
    >
        <img src={angularLogo} alt="Angular" />
    </a>
    <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
        <img src={nextLogo} alt="Next" />
    </a>
    <a
        href="https://music.mariolopez.org/blazor"
        target="_self"
        rel="alternate"
    >
        <img src={blazorLogo} alt="Blazor" />
    </a>
    <a
        href="https://music.mariolopez.org/leptos"
        target="_self"
        rel="alternate"
    >
        <img src={leptosLogo} alt="Leptos" />
    </a>
</nav>

<style>
    nav {
        display: flex;
        justify-content: center;
        padding: var(--padding-medium);
        background: var(--navbar-bg-color);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: var(--navbar-height-desktop);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 1000;

        /* make navbar scrollable */
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    nav img {
        /* Navbar Icons should match the height of the Navbar */
        width: var(--navbar-height-desktop);
        height: var(--navbar-height-desktop);
        margin: 0 var(--margin-medium);
    }

    .focused-icon {
        opacity: 1;
    }

    nav img:not(.focused-icon) {
        opacity: 0.25;
    }

    nav img:hover {
        filter: drop-shadow(0 0 0.5em rgba(255, 255, 255, 0.3));
        transition: filter 0.3s ease;
        opacity: 1;
    }

    @media (max-width: 680px) {
        nav {
            height: var(--navbar-height-mobile);
        }

        nav img {
            width: var(--navbar-height-mobile);
            height: var(--navbar-height-mobile);
            margin: 0 7px;
        }

        nav a:last-child img {
            margin-right: var(--margin-large);
        }
    }

    @media (max-width: 510px) {
        nav {
            justify-content: flex-start;
        }
    }
</style>
