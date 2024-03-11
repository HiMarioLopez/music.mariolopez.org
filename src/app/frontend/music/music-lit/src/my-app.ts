import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import './components/Navbar';
import './components/NowPlaying';
import './components/RecentlyPlayedList';
import './components/RecommendationForm';
import './components/RecommendationList';
import './components/Footer';
import placeholderAlbumCover from './assets/50.png'

class MyApp extends LitElement {
  static styles = css`  
  .app {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes gradient {
      0% {
          background-position: 0% 50%;
      }

      50% {
          background-position: 100% 50%;
      }

      100% {
          background-position: 0% 50%;
      }
  }

  .app-bg {
      position: fixed;
      animation: gradient 5s ease infinite;
      background: linear-gradient(-45deg, #091540, #0078D4, #61DAFB, #FA573C, #DB3E7F);
      background-attachment: fixed;
      background-repeat: no-repeat;
      background-position: center;
      background-size: 400% 400%;
      height: 100vh;
      width: 100vw;
      z-index: -1;
  }

  my-navbar,
  my-footer {
      width: 100%;
  }

  @media (min-width: 1300px) {
      .main-content {
          max-width: 1200px;
          display: flex;
      }

      .left-column,
      .right-column {
          width: 50%;
      }

      .left-column {
          margin-right: var(--margin-large);
      }

      .now-playing-container,
      .recommendation-form-container,
      .recommendations-list-container {
          margin-bottom: var(--margin-large);
      }

      .recommendations-list-container:last-child {
          margin-bottom: 0;
      }
  }

  @media (max-height: 1000px) {
      .app {
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
      }
  }

  @media (min-width: 1300px) and (max-height: 1000px),
  (max-width: 1299px) and (max-height: 1000px) {
      .main-content {
          padding-top: calc(var(--navbar-height-desktop) + 40px);
          padding-bottom: 0;
      }
  }

  @media (max-width: 1299px) {
      .app {
          flex-direction: column;
      }

      .now-playing-container,
      .recommendation-form-container,
      .recommendations-list-container {
          width: 100%;
          margin: var(--margin-large) 0;
      }

      .main-content {
          padding-top: calc(var(--navbar-height-desktop) + var(--padding-large));
          padding-bottom: 0;
      }
  }

  @media (max-width: 680px) {
      .app {
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
      }

      .main-content {
          padding-top: calc(var(--navbar-height-mobile) + var(--padding-large));
          padding-bottom: 0;
      }
  }
`;

  @property({ type: Array })
  recommendations = [
    {
      songTitle: 'Song One',
      artistName: 'Artist One',
      albumName: 'Album One',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
    {
      songTitle: 'Song Two',
      artistName: 'Artist Two',
      albumName: 'Album Two',
      albumCoverUrl: 'https://via.placeholder.com/50',
    },
  ];

  handleNewRecommendation(e: CustomEvent) {
    const newRecommendation = {
      songTitle: e.detail.songTitle,
      artistName: 'New Artist',
      albumName: 'New Album',
      albumCoverUrl: placeholderAlbumCover
    };

    this.recommendations = [...this.recommendations, newRecommendation];
  }

  render() {
    return html`
      <div class="app-bg"></div>
      <div class="app">
        <my-navbar></my-navbar>
        <div class="main-content">
          <div class="left-column">
            <div class="now-playing-container">
              <now-playing></now-playing>
            </div>
            <recently-played-list></recently-played-list>
          </div>
          <div class="right-column">
            <div class="recommendation-form-container">
              <recommendation-form @recommend=${this.handleNewRecommendation}></recommendation-form>
            </div>
            <div class="recommendations-list-container">
              <recommendation-list .recommendations=${this.recommendations}></recommendation-list>
            </div>
          </div>
        </div>
        <my-footer></my-footer>
      </div>
    `;
  }
}

customElements.define('my-app', MyApp);
