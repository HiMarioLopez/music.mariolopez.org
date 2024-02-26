<template>
    <nav class="navbar">
        <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate"><img :src="litIcon" alt="Lit"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate"><img :src="qwikIcon" alt="Qwik"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/react" target="_self" rel="alternate"><img :src="reactIcon" alt="React"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate"><img :src="solidIcon" alt="Solid"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate"><img :src="svelteIcon" alt="Svelte"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate"><img :src="tsIcon" alt="TypeScript"
                class="nav-icon" /></a>
        <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate"><img :src="vueIcon" alt="Vue"
                class="nav-icon vue-icon" /></a>
        <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate"><img :src="preactIcon" alt="Preact"
                class="nav-icon" /></a>
    </nav>
</template>
  
<script lang="ts">
import litIcon from '../assets/lit.svg';
import qwikIcon from '../assets/qwik.svg';
import reactIcon from '../assets/react.svg';
import solidIcon from '../assets/solid.svg';
import svelteIcon from '../assets/svelte.svg';
import tsIcon from '../assets/typescript.svg';
import vueIcon from '../assets/vue.svg';
import preactIcon from '../assets/preact.svg';

export default {
    name: 'Navbar',
    data() {
        return {
            litIcon: litIcon,
            qwikIcon: qwikIcon,
            reactIcon: reactIcon,
            solidIcon: solidIcon,
            svelteIcon: svelteIcon,
            tsIcon: tsIcon,
            vueIcon: vueIcon,
            preactIcon: preactIcon,
        };
    },
};
</script>
  
<style>
.navbar {
    display: flex;
    justify-content: center;
    padding: 10px;
    background: rgba(35, 35, 35, 0.9);
    color: white;
    position: fixed;
    top: 0;
    width: 100%;
    height: 40px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-icon {
    width: 40px;
    height: 40px;
    margin: 0 10px;
}

.vue-icon {
    opacity: 1;
}

.nav-icon:not(.vue-icon) {
    opacity: 0.25;
}

.nav-icon:hover {
    filter: drop-shadow(0 0 0.5em rgba(255, 255, 255, 0.3));
    transition: filter 0.3s ease;
    opacity: 1;
    transition: opacity 0.3s ease;
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
</style>
  