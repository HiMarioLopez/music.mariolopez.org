import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { styledContainer } from '../styles/SharedStyles';

export class RecommendationForm extends LitElement {
    static styles = [
        styledContainer,
        css`
            .recommendation-form-component h1 {
                width: 100%;
                text-align: left;
                margin: 0 0 var(--margin-medium);
            }
            
            .recommendation-form-component form {
                width: 100%;
                display: flex;
            }
            
            .recommendation-form-component input[type="text"] {
                padding: var(--padding-medium) 15px;
                width: calc(100% - 32px);
                border: var(--input-border);
                border-radius: var(--border-radius-medium);
                background-color: var(--input-bg-color);
                color: var(--font-color);
                margin-right: var(--margin-medium);
                outline: none;
                transition: border-color var(--transition-speed), box-shadow var(--transition-speed);
            }
            
            .recommendation-form-component input[type="text"]:focus,
            .recommendation-form-component input[type="text"]:hover {
                border-color: var(--focus-border-color);
                box-shadow: 0 0 8px rgba(252, 60, 68, 0.4);
            }
            
            .recommendation-form-component button {
                padding: var(--padding-medium) 15px;
                border: 2px solid transparent;
                border-radius: var(--border-radius-medium);
                background-color: var(--button-bg-color);
                color: white;
                cursor: pointer;
                transition: background-color var(--transition-speed), color var(--transition-speed), box-shadow var(--transition-speed), border-color var(--transition-speed);
            }
            
            .recommendation-form-component button:focus,
            .recommendation-form-component button:hover {
                background-color: var(--button-hover-bg-color);
                color: white;
                box-shadow: 0 0 8px rgba(252, 60, 68, 0.6);
                border-color: var(--focus-border-color);
            }
            
            .recommendation-form-component button:focus {
                outline: 4px auto -webkit-focus-ring-color;
            }
            
            @media (max-width: 680px) {
                .recommendation-form-component {
                    width: var(--width-mobile);
                }
            
                .recommendation-form-component form {
                    flex-direction: column;
                }
            
                .recommendation-form-component input[type="text"] {
                    margin-right: 0;
                    margin-bottom: var(--margin-medium);
                }
            }
        `
    ];

    @state()
    private songTitle: string = '';

    private handleSubmit(e: Event) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('recommend', { detail: { songTitle: this.songTitle }, bubbles: true, composed: true }));
        this.songTitle = '';
    }

    render() {
        return html`
            <div class="recommendation-form-component styled-container">
                <h1>Recommend a Song</h1>
                <form @submit=${this.handleSubmit}>
                <input
                    type="text"
                    .value=${this.songTitle}
                    @input=${(e: Event) => this.songTitle = (e.target as HTMLInputElement).value}
                    placeholder="Find a song on Apple Music..."
                    required
                />
                <button type="submit">Recommend</button>
                </form>
            </div>
        `;
    }
}

customElements.define('recommendation-form', RecommendationForm);
