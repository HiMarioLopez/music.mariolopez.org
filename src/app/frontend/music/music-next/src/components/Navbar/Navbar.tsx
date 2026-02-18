import { memo, type FC } from "react";
import styles from "./Navbar.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const angularLogo = `${BASE_PATH}/assets/angular.webp`;
const litLogo = `${BASE_PATH}/assets/lit.svg`;
const nextLogo = `${BASE_PATH}/assets/next.svg`;
const preactLogo = `${BASE_PATH}/assets/preact.svg`;
const qwikLogo = `${BASE_PATH}/assets/qwik.svg`;
const randomLogo = `${BASE_PATH}/assets/random.svg`;
const reactLogo = `${BASE_PATH}/assets/react.svg`;
const solidLogo = `${BASE_PATH}/assets/solid.svg`;
const svelteLogo = `${BASE_PATH}/assets/svelte.svg`;
const tsLogo = `${BASE_PATH}/assets/typescript.svg`;
const vueLogo = `${BASE_PATH}/assets/vue.svg`;

const Navbar: FC = () => {
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
        <img src={reactLogo} alt="React" />
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
        title="Vue implementation of the Music site"
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
        title="Angular implementation of the Music site"
      >
        <img src={angularLogo} alt="Angular" />
      </a>
      <a
        href="https://music.mariolopez.org/next"
        target="_self"
        rel="alternate"
        title="Next implementation of the Music site"
      >
        <img src={nextLogo} alt="Next" className={styles.focusedIcon} />
      </a>
    </nav>
  );
};

export default memo(Navbar);
