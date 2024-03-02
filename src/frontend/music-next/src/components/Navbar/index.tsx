'use client';

import Image from 'next/image';
import React, { useEffect, useRef } from 'react';
import angularLogo from '../../../public/images/angular.svg';
import blazorLogo from '../../../public/images/blazor.svg';
import litLogo from '../../../public/images/lit.svg';
import nextLogo from '../../../public/images/next.svg';
import preactLogo from '../../../public/images/preact.svg';
import qwikLogo from '../../../public/images/qwik.svg';
import reactLogo from '../../../public/images/react.svg';
import solidLogo from '../../../public/images/solid.svg';
import svelteLogo from '../../../public/images/svelte.svg';
import tsLogo from '../../../public/images/typescript.svg';
import vueLogo from '../../../public/images/vue.svg';
import styles from './style.module.css';

const Navbar: React.FC = () => {
    // Create a ref for the navbar
    const navbarRef = useRef<HTMLDivElement>(null);

    // TODO: Why is this so slow? It's not even that many icons
    useEffect(() => {
        // Check if the navbar ref is not null
        if (navbarRef.current) {
            // Scroll to the right
            const element = navbarRef.current as HTMLDivElement;
            // For horizontal scrolling, set scrollLeft to the maximum scrollable width
            element.scrollLeft = element.scrollWidth - element.clientWidth;
        }
    }, []); // Empty array means this effect runs once on mount

    return (
        <nav className={styles.navbarComponent} ref={navbarRef}>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate">
                <Image src={tsLogo.src} alt="TypeScript" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
                <Image src={litLogo.src} alt="Lit" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
                <Image src={qwikLogo.src} alt="Qwik" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
                <Image src={reactLogo.src} alt="React" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
                <Image src={solidLogo.src} alt="Solid" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate">
                <Image src={svelteLogo.src} alt="Svelte" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
                <Image src={vueLogo.src} alt="Vue" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate">
                <Image src={preactLogo.src} alt="Preact" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate">
                <Image src={angularLogo.src} alt="Angular" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
                <Image src={nextLogo.src} alt="Next" width={40} height={40} className={styles.focusedIcon} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate">
                <Image src={blazorLogo.src} alt="Blazor" width={40} height={40} unoptimized />
            </a>
        </nav>
    );
};

export default Navbar;
