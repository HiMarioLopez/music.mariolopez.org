import { Component } from 'solid-js';
import './index.css';

const Footer: Component = () => {
    return (
        <footer>
            <div class="footer-component-link-container">
                <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-solid"
                    target="_blank" rel="noopener noreferrer">
                    Site Source
                </a>
                <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">
                    Randomize
                </a>
                <a href="https://www.solidjs.com/" target="_blank" rel="noopener noreferrer">
                    Solid
                </a>
            </div>
            <div class="footer-component-copyright-container">© 2024 Mario Lopez</div>
        </footer>
    );
};

export default Footer;
