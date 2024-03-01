import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { styledContainer } from '../styles/SharedStyles';
import placeholderAlbumCover from '../assets/300.png';

export class NowPlaying extends LitElement {
    static styles = [
        styledContainer,
        css`
            .now-playing-component {
                display: flex;
                align-items: center;
                justify-content: flex-start;
            }
            
            .now-playing-component img {
                width: var(--album-art-size-large);
                height: var(--album-art-size-large);
                border-radius: 10px;
                margin-right: var(--margin-large);
            }
            
            .now-playing-component-text-container {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            
                height: var(--album-art-size-large);
                /* Matching the size of the album art */
            }
            
            .now-playing-component h1 {
                margin: 0;
            }
            
            .now-playing-component-text {
                text-align: left;
            }
            
            .now-playing-component-text h2,
            .now-playing-component-text p {
                margin: 0;
            }
            
            @media (max-width: 680px) {
            
                .now-playing-component,
                .now-playing-component h1,
                .now-playing-component img,
                .now-playing-component-text {
                    width: var(--width-mobile);
                }
            
                .now-playing-component {
                    flex-direction: column-reverse;
                    max-width: none;
                }
            
                .now-playing-component img {
                    height: auto;
                    margin: var(--margin-medium) 0;
                }
            
                .now-playing-component h1 {
                    margin-bottom: var(--margin-medium);
                }
            
                .now-playing-component-text-container {
                    height: auto;
                }
            }
        `
    ];

    @property({ type: Object })
    currentSong = {
        songTitle: 'Example Song',
        artist: 'Example Artist',
        album: 'Example Album',
        albumArt: placeholderAlbumCover,

    };

    render() {
        return html`
        <div class="now-playing-component styled-container">
            <img src=${this.currentSong.albumArt} alt="Album Art" />
            <div class="now-playing-component-text-container">
            <h1>Mario's Now Playing</h1>
            <div class="now-playing-component-text">
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
