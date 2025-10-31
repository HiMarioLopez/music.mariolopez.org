import React from "react";
import { formatBuildTime } from "../../utils/formatters";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer>
      <div className={styles.footerComponentLinkContainer}>
        <a
          href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-react"
          target="_blank"
          rel="noopener noreferrer"
        >
          Site Source
        </a>
        <a
          href="https://music.mariolopez.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Randomize
        </a>
        <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
          React
        </a>
      </div>
      <div className={styles.footerComponentCopyrightContainer}>
        <a
          href="https://mariolopez.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          © {new Date().getFullYear()} Mario Lopez
        </a>
      </div>
      <div className={styles.footerBuildInfo}>
        Build: {formatBuildTime(__BUILD_TIME__)}
      </div>
    </footer>
  );
};

export default Footer;
