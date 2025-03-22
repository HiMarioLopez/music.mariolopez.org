import React from 'react';
import './index.css';

const Footer: React.FC = () => {
    return (
        <footer>
            <div className="footer-component-link-container">
                <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-react"
                    target="_blank" rel="noopener noreferrer">
                    Site Source
                </a>
                <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">
                    Randomize
                </a>
                <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
                    React
                </a>
            </div>
            <div className="footer-component-copyright-container">
                <a href="https://mariolopez.org" target="_blank" rel="noopener noreferrer">© {new Date().getFullYear()} Mario Lopez</a>
            </div>
        </footer>
    );
};

export default Footer;
