import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { styledContainer } from '../styles/SharedStyles';

interface Recommendation {
    songTitle: string;
    albumName: string;
    artistName: string;
    albumCoverUrl: string;
}

export class RecommendationList extends LitElement {
    static styles = [
        styledContainer,
        css`
            .recommendation-list-component::-webkit-scrollbar {
                width: 12px;
            }
            
            .recommendation-list-component::-webkit-scrollbar-track {
                background: var(--scrollbar-end-color);
            }
            
            .recommendation-list-component::-webkit-scrollbar-thumb {
                background-color: var(--scrollbar-start-color);
                border-radius: var(--border-radius-medium);
                border: 3px solid var(--scrollbar-end-color);
            }
            
            .recommendation-list-component h1 {
                width: 100%;
                text-align: left;
                margin-top: 0;
                margin-bottom: var(--margin-medium);
            }
            
            .recommendation-list-component ul {
                list-style-type: none;
                padding-left: 0;
                width: 100%;
                max-height: calc(5 * var(--track-card-size));
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--scrollbar-start-color) var(--scrollbar-end-color);
                margin: 0;
            }
            
            .recommendation-list-component li {
                background: var(--track-bg-color);
                padding: var(--padding-medium);
                display: flex;
                align-items: center;
                padding: var(--padding-medium);
                border-radius: var(--border-radius-medium);
                margin-bottom: var(--margin-medium);
                height: var(--track-card-size);
            
                margin-right: 7px;
                /* margin for the scrollbar */
            }
            
            .recommendation-list-component li:last-child {
                margin-bottom: 0;
            }
            
            .recommendation-list-component li:hover {
                background: var(--track-bg-color-hover);
            }
            
            .recommendation-list-component img {
                width: var(--album-art-size-small);
                height: var(--album-art-size-small);
                margin-right: var(--margin-medium);
                border-radius: var(--border-radius-small);
            }
            
            .recommendation-list-component-track-text-container {
                display: flex;
                flex-direction: column;
            }
            
            .recommendation-list-component-track-text-container h3,
            .recommendation-list-component-track-text-container p {
                margin: 0;
                color: var(--font-color);
            }
            
            @media (max-width: 680px) {
                .recommendation-list-component {
                    width: var(--width-mobile);
                    max-width: none;
                }
            }
        `
    ];

    @property({ type: Array })
    recommendations: Recommendation[] = [];

    render() {
        return html`
            <div class="recommendation-list-component styled-container">
                <h1>Recommendation Backlog</h1>
                <ul>
                ${this.recommendations.map(recommendation => html`
                    <li>
                    <img src=${recommendation.albumCoverUrl} alt="Album Cover" />
                    <div class="recommendation-list-component-track-text-container">
                        <h3>${recommendation.songTitle}</h3>
                        <p>${recommendation.artistName} - ${recommendation.albumName}</p>
                    </div>
                    </li>
                `)}
                </ul>
            </div>
        `;
    }
}

customElements.define('recommendation-list', RecommendationList);