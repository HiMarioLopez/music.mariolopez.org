'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
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

    // Function to modify the src based on the environment
    const getSrc = (src: string) => {
        return process.env.NODE_ENV === 'production' ? `${src}/next` : src;
    };

    return (
        <nav className={styles.navbarComponent} ref={navbarRef}>
            <a href="https://music.mariolopez.org/vanilla" target="_self" rel="alternate">
                <Image src={getSrc("/images/typescript.svg")} alt="TypeScript" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/lit" target="_self" rel="alternate">
                <Image src={getSrc("/images/lit.svg")} alt="Lit" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/qwik" target="_self" rel="alternate">
                <Image src={getSrc("/images/qwik.svg")} alt="Qwik" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/react" target="_self" rel="alternate">
                <Image src={getSrc("/images/react.svg")} alt="React" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/solid" target="_self" rel="alternate">
                <Image src={getSrc("/images/solid.svg")} alt="Solid" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/svelte" target="_self" rel="alternate">
                <Image src={getSrc("/images/svelte.svg")} alt="Svelte" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/vue" target="_self" rel="alternate">
                <Image src={getSrc("/images/vue.svg")} alt="Vue" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/preact" target="_self" rel="alternate">
                <Image src={getSrc("/images/preact.svg")} alt="Preact" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/angular" target="_self" rel="alternate">
                <Image src={getSrc("/images/angular.svg")} alt="Angular" width={40} height={40} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/next" target="_self" rel="alternate">
                <Image src={getSrc("/images/next.svg")} alt="Next" width={40} height={40} className={styles.focusedIcon} unoptimized />
            </a>
            <a href="https://music.mariolopez.org/blazor" target="_self" rel="alternate">
                <Image src={getSrc("/images/blazor.svg")} alt="Blazor" width={40} height={40} unoptimized />
            </a>
        </nav>
    );
};

export default Navbar;
