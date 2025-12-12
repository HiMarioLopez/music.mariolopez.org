import React from "react";
import { formatBuildTime } from "../../utils/formatters";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerComponentLinkContainer}>
        <a
          href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-next"
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
        <a
          href="https://nextjs.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js
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
        Build: {formatBuildTime(process.env.NEXT_PUBLIC_BUILD_TIME ?? "")}
      </div>
    </footer>
  );
};

export default Footer;
