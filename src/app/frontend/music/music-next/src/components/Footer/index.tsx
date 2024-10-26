import React from 'react';
import styles from './style.module.css';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footerComponent}>
            <div className={styles.footerComponentLinkContainer}>
                <a href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-next"
                    target="_blank" rel="noopener noreferrer">
                    Site Source
                </a>
                <a href="https://music.mariolopez.org/" target="_blank" rel="noopener noreferrer">
                    Randomize
                </a>
                <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer">
                    Next.js
                </a>
            </div>
            <div className={styles.footerComponentCopyrightContainer}>© 2024 Mario Lopez</div>
        </footer>
    );
};

export default Footer;