import { component$ } from '@builder.io/qwik';
import './index.css';

export default component$(() => {
    return (
        <footer>
            <div class="footer-component-link-container">
                <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/frontend/music-qwik"
                    target="_blank" rel="noopener noreferrer">
                    Site Source
                </a>
                <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">
                    Randomize
                </a>
                <a href="https://qwik.dev/" target="_blank" rel="noopener noreferrer">
                    Qwik
                </a>
            </div>
            <div class="footer-component-copyright-container">© 2024 Mario Lopez</div>
        </footer>
    );
});
