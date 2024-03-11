import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { styledContainer } from '../styles/SharedStyles';
import placeholderAlbumCover from '../assets/50.png';

export class RecentlyPlayedList extends LitElement {
    static styles = [
        styledContainer,
        css`
            .recently-played-list-component {
                align-items: normal;
                flex-direction: column;
                overflow: hidden;
                position: relative;
            }
            
            .recently-played-list-component h1 {
                width: 100%;
                text-align: left;
                margin: 0 0 var(--margin-medium);
            }
            
            .recently-played-list-component-list-container {
                display: flex;
                align-items: center;
                overflow-x: auto;
                white-space: nowrap;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            
            .recently-played-list-component-list-container::-webkit-scrollbar {
                display: none;
            }
            
            .recently-played-list-component-track {
                display: inline-flex;
                align-items: center;
                padding: var(--padding-medium);
                margin-right: var(--margin-medium);
                border-radius: var(--border-radius-medium);
                background: var(--track-bg-color);
                height: 60px;
            }
            
            .recently-played-list-component-track:hover {
                background: var(--track-bg-color-hover);
            }
            
            .recently-played-list-component-track:last-child {
                margin-right: 0;
            }
            
            .recently-played-list-component-track img {
                width: var(--album-art-size-small);
                height: var(--album-art-size-small);
                margin-right: var(--margin-medium);
                border-radius: var(--border-radius-small);
            }
            
            .recently-played-list-component-track-text-container {
                display: flex;
                flex-direction: column;
                margin-right: var(--margin-small);
            }
            
            .recently-played-list-component-track-text-container h3,
            .recently-played-list-component-track-text-container p {
                margin: 0;
                color: var(--font-color);
            }
            
            @media (max-width: 680px) {
                .recently-played-list-component {
                    width: var(--width-mobile);
                }
            }
        `
    ];

    @property({ type: Array })
    recentlyPlayed = [
        {
            songTitle: 'Song One',
            artistName: 'Artist One',
            albumName: 'Album One',
            albumCoverUrl: placeholderAlbumCover
        },
        {
            songTitle: 'Song Two',
            artistName: 'Artist Two',
            albumName: 'Album Two',
            albumCoverUrl: placeholderAlbumCover
        },
        {
            songTitle: 'Song Three',
            artistName: 'Artist Three',
            albumName: 'Album Three',
            albumCoverUrl: placeholderAlbumCover
        },
        {
            songTitle: 'Song Four',
            artistName: 'Artist Four',
            albumName: 'Album Four',
            albumCoverUrl: placeholderAlbumCover
        },
        {
            songTitle: 'Song Five',
            artistName: 'Artist Five',
            albumName: 'Album Five',
            albumCoverUrl: placeholderAlbumCover
        }
    ];

    firstUpdated() {
        const scrollContainer = this.shadowRoot?.querySelector('.recently-played-list-component-list-container');
        if (scrollContainer) {
            let startLeft = 0;
            const step = () => {
                if (scrollContainer.scrollWidth - scrollContainer.clientWidth <= startLeft) {
                    startLeft = 0; // Reset to start if end reached
                    scrollContainer.scrollLeft = startLeft;
                } else {
                    startLeft += 0.25; // Increment the scroll position
                    scrollContainer.scrollLeft = startLeft;
                }
                requestAnimationFrame(step);
            };

            requestAnimationFrame(step);
        }
    }

    render() {
        return html`
            <div class="recently-played-list-component styled-container">
                <h1>Recently Played</h1>
                <div class="recently-played-list-component-list-container">
                ${this.recentlyPlayed.map((play) => html`
                    <div class="recently-played-list-component-track">
                    <img src=${play.albumCoverUrl} alt="Album Cover" />
                    <div class="recently-played-list-component-track-text-container">
                        <h3>${play.songTitle}</h3>
                        <p>${play.artistName} - ${play.albumName}</p>
                    </div>
                    </div>
                `)}
                </div>
            </div>
        `;
    }
}

customElements.define('recently-played-list', RecentlyPlayedList);
