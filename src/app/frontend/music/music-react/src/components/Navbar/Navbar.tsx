import React from "react";
import angularLogo from "../../assets/angular.svg";
import litLogo from "../../assets/lit.svg";
import nextLogo from "../../assets/next.svg";
import preactLogo from "../../assets/preact.svg";
import qwikLogo from "../../assets/qwik.svg";
import randomLogo from "../../assets/random.svg";
import reactLogo from "../../assets/react.svg";
import solidLogo from "../../assets/solid.svg";
import svelteLogo from "../../assets/svelte.svg";
import tsLogo from "../../assets/typescript.svg";
import vueLogo from "../../assets/vue.svg";
import styles from "./Navbar.module.css";

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <a href="https://music.mariolopez.org" target="_self" rel="alternate">
        <img
          src={randomLogo}
          alt="Random"
          title="View a random framework implementation"
        />
      </a>
      <a
        href="https://music.mariolopez.org/react"
        target="_self"
        rel="alternate"
        title="React implementation of the Music site"
      >
        <img src={reactLogo} alt="React" className={styles.focusedIcon} />
      </a>
      <a
        href="https://music.mariolopez.org/vanilla"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={tsLogo} alt="TypeScript" />
      </a>
      <a
        href="https://music.mariolopez.org/lit"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={litLogo} alt="Lit" />
      </a>
      <a
        href="https://music.mariolopez.org/qwik"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={qwikLogo} alt="Qwik" />
      </a>
      <a
        href="https://music.mariolopez.org/solid"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={solidLogo} alt="Solid" />
      </a>
      <a
        href="https://music.mariolopez.org/svelte"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={svelteLogo} alt="Svelte" />
      </a>
      <a
        href="https://music.mariolopez.org/vue"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={vueLogo} alt="Vue" />
      </a>
      <a
        href="https://music.mariolopez.org/preact"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={preactLogo} alt="Preact" />
      </a>
      <a
        href="https://music.mariolopez.org/angular"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={angularLogo} alt="Angular" />
      </a>
      <a
        href="https://music.mariolopez.org/next"
        target="_self"
        rel="alternate"
        className={styles.underConstruction}
        tabIndex={-1}
        aria-disabled="true"
      >
        <img src={nextLogo} alt="Next" />
      </a>
    </nav>
  );
};

export default Navbar;
