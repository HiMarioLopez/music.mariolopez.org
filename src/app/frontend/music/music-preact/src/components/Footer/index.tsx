import { formatBuildTime } from "../../utils/formatters";
import "./index.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-component-link-container">
        <a
          href="https://github.com/HiMarioLopez/music.mariolopez.org/tree/main/src/app/frontend/music/music-preact"
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
        <a href="https://preactjs.com/" target="_blank" rel="noopener noreferrer">
          Preact
        </a>
      </div>
      <div className="footer-component-copyright-container">
        <a href="https://mariolopez.org" target="_blank" rel="noopener noreferrer">
          © {new Date().getFullYear()} Mario Lopez
        </a>
      </div>
      <div className="footer-build-info">Build: {formatBuildTime(__BUILD_TIME__)}</div>
    </footer>
  );
};

export default Footer;