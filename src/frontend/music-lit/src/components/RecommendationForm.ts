import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';

export class RecommendationForm extends LitElement {
    static styles = css`
    .recommendation-form-modal {
        background: rgba(50, 50, 50, 0.6);
        color: aliceblue;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .recommendation-form-modal h1 {
        width: 100%;
        text-align: left;
        margin-top: 0;
        margin-bottom: 10px;
    }
    
    .recommendation-form-modal form {
        width: 100%;
        display: flex;
    }
    
    .recommendation-form-modal input[type="text"] {
        padding: 10px 15px;
        width: calc(100% - 32px);
        border: 2px solid #fc3c44;
        border-radius: 7px;
        background-color: rgba(32, 35, 42, 0.7);
        color: aliceblue;
        margin-right: 10px;
        outline: none;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    .recommendation-form-modal input[type="text"]:focus {
        border-color: #f94c57;
        box-shadow: 0 0 8px rgba(252, 60, 68, 0.4);
    }
    
    .recommendation-form-modal input[type="text"]:hover {
        border-color: #f94c57;
    }
    
    .recommendation-form-modal button {
        padding: 10px 15px;
        border: 2px solid transparent;
        border-radius: 7px;
        background-color: #fc3c44;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    
    .recommendation-form-modal button:focus,
    .recommendation-form-modal button:hover {
        background-color: #f94c57;
        color: #ffffff;
        box-shadow: 0 0 8px rgba(252, 60, 68, 0.6);
        border-color: #f94c57;
    }
    
    .recommendation-form-modal button:focus {
        outline: 4px auto -webkit-focus-ring-color;
    }
    
    @media (max-width: 680px) {
        .recommendation-form-modal {
            width: 80vw;
            max-width: none;
        }
    
        .recommendation-form-modal form {
            flex-direction: column;
        }
    
        .recommendation-form-modal input[type="text"] {
            margin-right: 0;
            margin-bottom: 10px;
        }
    }
  `;

    @state()
    private songTitle: string = '';

    private handleSubmit(e: Event) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('recommend', { detail: { songTitle: this.songTitle }, bubbles: true, composed: true }));
        this.songTitle = '';
    }

    render() {
        return html`
      <div class="recommendation-form-modal">
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
