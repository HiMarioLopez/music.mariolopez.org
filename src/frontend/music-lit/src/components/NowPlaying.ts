import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class NowPlaying extends LitElement {
    static styles = css`
    .now-playing-modal {
        background: rgba(50, 50, 50, 0.6);
        color: aliceblue;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 4px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        max-width: 600px;
    }

    .album-art {
        width: 250px;
        height: 250px;
        border-radius: 10px;
        margin-right: 20px;
    }

    .content-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 250px;
    }

    .header-title {
        margin: 0;
    }

    .music-info {
        text-align: left;
    }

    .music-info h2,
    .music-info p {
        margin: 0;
    }

    @media (max-width: 680px) {
        .now-playing-modal {
            flex-direction: column-reverse;
            width: 80vw;
            max-width: none;
        }

        .album-art {
            width: 80vw;
            height: auto;
            margin: 10px 0;
        }

        .header-title,
        .music-info {
            width: 80vw;
        }

        .header-title {
            margin-bottom: 10px;
        }

        .content-container {
            height: auto;
        }
    }
  `;

    @property({ type: Object })
    currentSong = {
        albumArt: 'https://via.placeholder.com/300',
        songTitle: 'Example Song',
        artist: 'Example Artist',
        album: 'Example Album',
    };

    render() {
        return html`
      <div class="now-playing-modal">
        <img src=${this.currentSong.albumArt} alt="Album Art" class="album-art" />
        <div class="content-container">
          <h1 class="header-title">Mario's Now Playing</h1>
          <div class="music-info">
            <h2>${this.currentSong.songTitle}</h2>
            <p>${this.currentSong.artist}</p>
            <p>${this.currentSong.album}</p>
          </div>
        </div>
      </div>
    `;
    }
}

customElements.define('now-playing', NowPlaying);
