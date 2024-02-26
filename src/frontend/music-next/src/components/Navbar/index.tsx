import React from 'react';
import Image from 'next/image';
import styles from './style.module.css';

const Navbar: React.FC = () => {
    return (
        <nav className={styles.navbar}>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
                <Image src="/images/lit.svg" alt="Lit" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
                <Image src="/images/qwik.svg" alt="Qwik" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
                <Image src="/images/react.svg" alt="React" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
                <Image src="/images/solid.svg" alt="Solid" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate">
                <Image src="/images/svelte.svg" alt="Svelte" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate">
                <Image src="/images/typescript.svg" alt="TypeScript" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
                <Image src="/images/vue.svg" alt="Vue" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate">
                <Image src="/images/preact.svg" alt="Preact" width={40} height={40} className={styles.navIcon} />
            </a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
                <Image src="/images/next.svg" alt="Next" width={40} height={40} className={`${styles.navIcon} ${styles.nextIcon}`} />
            </a>
        </nav>
    );
};

export default Navbar;
