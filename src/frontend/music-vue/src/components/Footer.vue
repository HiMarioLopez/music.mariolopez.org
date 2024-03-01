<template>
    <footer>
        <div class="footer-component-link-container">
            <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/frontend/music-vue" target="_blank"
                rel="noopener noreferrer">
                Site Source
            </a>
            <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">
                Randomize
            </a>
            <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">
                Vue
            </a>
        </div>
        <div class="footer-component-copyright-container">© 2024 Mario Lopez</div>
    </footer>
</template>
  
<script lang="ts">
export default {
    name: 'Footer'
};
</script>
  
<style>
footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: var(--footer-height-desktop);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--padding-medium) 0;
    background-color: var(--navbar-bg-color);
    color: var(--font-color);
}

footer a {
    margin: 0 var(--margin-medium);
    color: var(--font-color);
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}

footer .footer-component-copyright-container {
    margin: 0 var(--margin-medium);
}

@media (max-height: 1000px) and (max-width: 680px),
(max-width: 1299px) and (max-height: 1080px),
(max-width: 680px) {
    footer {
        flex-direction: column;
        height: auto;
        position: relative;
        font-size: small;
    }

    footer .footer-component-link-container {
        margin: var(--margin-small) 0;
    }

    footer .footer-component-copyright-container {
        margin: var(--margin-small) 0;
    }
}
</style>
  